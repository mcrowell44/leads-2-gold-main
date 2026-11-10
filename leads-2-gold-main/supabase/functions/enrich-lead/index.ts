import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');

interface LeadData {
  companyName: string;
  industryName: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  place_id?: string;
}

interface GooglePlaceDetails {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text?: string[];
    periods?: Array<{ open: { day: number; time: string }; close?: { day: number; time: string } }>;
  };
  url?: string;
  business_status?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    relative_time_description: string;
  }>;
}

// Fetch Google Place Details including reviews
async function fetchGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_API_KEY || !placeId) return null;

  try {
    const fields = [
      'name', 'formatted_address', 'formatted_phone_number', 'website',
      'rating', 'user_ratings_total', 'opening_hours', 'url', 'business_status',
      'reviews'
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
    console.log('Fetching Google Place details + reviews for:', placeId);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      console.log('Google Place details retrieved, reviews:', data.result.reviews?.length || 0);
      return data.result;
    }
    console.warn('Google Place details status:', data.status);
    return null;
  } catch (error) {
    console.error('Error fetching Google Place details:', error);
    return null;
  }
}

// Search for Google Business Profile by name and location
async function searchGoogleBusiness(companyName: string, location: string): Promise<GooglePlaceDetails | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const query = encodeURIComponent(`${companyName} ${location}`);
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}`;
    console.log('Searching Google for business:', companyName);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]) {
      const placeId = data.results[0].place_id;
      return await fetchGooglePlaceDetails(placeId);
    }
    return null;
  } catch (error) {
    console.error('Error searching Google business:', error);
    return null;
  }
}

// Scrape Google Business reviews page via Firecrawl for deeper review data
async function scrapeGoogleReviews(googleMapsUrl: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY || !googleMapsUrl) return null;

  try {
    console.log('Scraping Google reviews page:', googleMapsUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: googleMapsUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    if (data.success && data.data?.markdown) {
      console.log('Google reviews page scraped successfully');
      return data.data.markdown;
    }
    return null;
  } catch (error) {
    console.error('Error scraping Google reviews:', error);
    return null;
  }
}

// Scrape website content using Firecrawl
async function scrapeWebsite(url: string): Promise<{ markdown?: string; links?: string[] } | null> {
  if (!FIRECRAWL_API_KEY || !url) return null;

  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping website:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();
    if (data.success && data.data) {
      console.log('Website scraped successfully');
      return { markdown: data.data.markdown, links: data.data.links };
    }
    return null;
  } catch (error) {
    console.error('Error scraping website:', error);
    return null;
  }
}

// Search and scrape social media profiles using Firecrawl
async function searchAndScrapeSocials(companyName: string, location: string): Promise<{ profiles: Record<string, any>; content: string }> {
  if (!FIRECRAWL_API_KEY) return { profiles: {}, content: '' };

  const profiles: Record<string, any> = {};
  const socialContentParts: string[] = [];

  try {
    console.log('Searching & scraping social profiles for:', companyName);

    const platforms = [
      { name: 'linkedin', query: `"${companyName}" ${location} site:linkedin.com/company` },
      { name: 'instagram', query: `"${companyName}" ${location} site:instagram.com` },
      { name: 'facebook', query: `"${companyName}" ${location} site:facebook.com` },
      { name: 'twitter', query: `"${companyName}" ${location} site:x.com OR site:twitter.com` },
    ];

    const searchPromises = platforms.map(async (platform) => {
      try {
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: platform.query, limit: 3 }),
        });

        const searchData = await searchResponse.json();
        if (searchData.success && searchData.data?.[0]) {
          const profileUrl = searchData.data[0].url;
          profiles[`${platform.name}_url`] = profileUrl;
          profiles[`${platform.name}_name`] = searchData.data[0].title;

          // Scrape the social profile page for content analysis
          try {
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url: profileUrl,
                formats: ['markdown'],
                onlyMainContent: true,
              }),
            });

            const scrapeData = await scrapeResponse.json();
            if (scrapeData.success && scrapeData.data?.markdown) {
              const snippet = scrapeData.data.markdown.substring(0, 1000);
              socialContentParts.push(`=== ${platform.name.toUpperCase()} CONTENT ===\n${snippet}`);
            }
          } catch {
            // Scraping social page failed, continue
          }

          return { platform: platform.name, url: profileUrl };
        }
        return null;
      } catch {
        return null;
      }
    });

    await Promise.all(searchPromises);

    console.log('Social profiles found:', Object.keys(profiles).filter(k => k.endsWith('_url')).length);
    return { profiles, content: socialContentParts.join('\n\n') };
  } catch (error) {
    console.error('Error searching social profiles:', error);
    return { profiles, content: '' };
  }
}

// Extract contact info from content
function extractContactInfo(content: string): { emails: string[]; phones: string[] } {
  const emails: string[] = [];
  const phones: string[] = [];

  const emailMatches = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  if (emailMatches) {
    emails.push(...emailMatches.filter(e => !e.includes('example') && !e.includes('test')));
  }

  const phoneMatches = content.match(/(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g);
  if (phoneMatches) {
    phones.push(...phoneMatches);
  }

  return { emails: [...new Set(emails)], phones: [...new Set(phones)] };
}

// Calculate best call times based on Google hours and industry patterns
function calculateBestCallTimes(
  openingHours: GooglePlaceDetails['opening_hours'] | undefined,
  industryName: string
): { best_times: string[]; reasoning: string } {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const industryPatterns: Record<string, { quietHours: string; reasoning: string }> = {
    'restaurant': { quietHours: '2:00 PM - 4:00 PM', reasoning: 'Between lunch and dinner service' },
    'fitness': { quietHours: '1:00 PM - 3:00 PM', reasoning: 'Mid-afternoon lull between workout sessions' },
    'salon': { quietHours: '10:00 AM - 11:00 AM', reasoning: 'After morning rush, before lunch appointments' },
    'retail': { quietHours: '10:00 AM - 11:00 AM', reasoning: 'After opening, before lunch shoppers' },
    'medical': { quietHours: '11:00 AM - 12:00 PM', reasoning: 'Between morning and afternoon appointments' },
    'default': { quietHours: '10:00 AM - 11:00 AM', reasoning: 'Standard business quiet hours' },
  };

  let pattern = industryPatterns.default;
  for (const [key, value] of Object.entries(industryPatterns)) {
    if (industryName.toLowerCase().includes(key)) {
      pattern = value;
      break;
    }
  }

  const bestTimes: string[] = [];

  if (openingHours?.periods) {
    for (const period of openingHours.periods) {
      if (period.open && period.close) {
        const dayName = dayNames[period.open.day];
        const openTime = parseInt(period.open.time);
        const closeTime = parseInt(period.close.time);
        const suggestedTime = openTime + 200;
        if (suggestedTime < closeTime - 100) {
          const formattedTime = `${Math.floor(suggestedTime / 100)}:${String(suggestedTime % 100).padStart(2, '0')}`;
          bestTimes.push(`${dayName} ${formattedTime}`);
        }
      }
    }
  }

  if (bestTimes.length === 0) {
    bestTimes.push(`Tuesday ${pattern.quietHours}`);
    bestTimes.push(`Wednesday ${pattern.quietHours}`);
    bestTimes.push(`Thursday ${pattern.quietHours}`);
  }

  return {
    best_times: bestTimes.slice(0, 5),
    reasoning: pattern.reasoning
  };
}

// Updated Product/Service Catalog with cdmweb.store, aibizpro, energychoice & sales leadership
const PRODUCT_CATALOG = `
AVAILABLE PRODUCTS & SERVICES (Marcus Crowell / CDMWeb / AIBizPro):

1. **CDMWeb.store (cdmweb.store)** - Custom Software Development, IT Staffing & Digital Hub
   - URL: https://cdmweb.store
   - Core Capabilities:
     a. **Custom Software Development**: Full-stack web applications, mobile apps, enterprise portals, API integrations, and scalable cloud solutions.
     b. **IT Staffing & Remote Developer Placement**: Vetted remote software engineers, full-stack developers, frontend/backend specialists to scale engineering teams quickly and cost-effectively.
     c. **Dedicated AI Developers & Automation Engineers**: Specialized AI engineers building custom LLM apps, workflow automations, RAG pipelines, and intelligent agents.
     d. **Modern Web Development & E-Commerce**: High-converting responsive websites, custom e-commerce stores, SEO optimization, and digital branding.
   - Best for: Businesses needing custom software, companies looking to scale tech teams with remote or AI developers, businesses with outdated websites needing real lead conversion.
   - Pitch angle: "Are your current software and website actively driving qualified revenue, or are you held back by outdated tech and hiring bottlenecks?"

2. **AIBizPro (aibizpro.cdmweb.store)** - AI-Powered Business, CRM & Communication Solutions
   - URL: https://aibizpro.cdmweb.store
   - Services include:
     a. **GoHighLevel (GHL) CRM Plans & Setups**: Complete marketing automation, multi-stage sales pipelines, 2-way SMS/email campaigns, booking calendars, and customer retention systems.
     b. **Smart Websites & Automation for Small to Medium Businesses**: High-converting websites with built-in marketing automation, social engagement, and 24/7 lead capture.
     c. **24/7 AI Phone Conversation Agents**: Natural voice AI answering inbound calls, handling after-hours inquiries, qualifying leads, booking appointments, and conducting outbound follow-up calls.
     d. **24/7 AI Text & Chat Conversation Agents**: Instant intelligent responses across SMS, webchat, and social channels—never letting a prospect go cold.
     e. **Social Media Management**: Automated social content creation, multi-platform publishing, and brand audience growth.
     f. **AI Reputation Management**: Automated 5-star Google review outreach to past customer databases and professional AI review responses to boost local ranking.
   - Best for: Service businesses missing calls, companies needing GoHighLevel CRM setup, businesses needing 24/7 automated lead response and appointment booking.
   - Pitch angle: "How many customer calls and website leads slip through the cracks after 5 PM and on weekends?"

3. **EnergyChoice.us (energychoice.us)** - Commercial Energy Procurement & Utility Cost Reduction
   - URL: https://energychoice.us
   - Value: Commercial electricity & gas comparison and switching across deregulated energy markets (Texas, Ohio, Pennsylvania, Illinois, New York, New Jersey, Maryland, etc.).
   - Savings: 10-30% reduction in commercial electric/gas bills, locked fixed-rate protection, zero switching fees or downtime.
   - Best for: High-energy commercial operations (restaurants, commercial kitchens, manufacturing plants, warehouses, auto shops, laundromats, retail stores, gyms).
   - Pitch angle: "When was the last time your commercial utility rates were benchmarked against wholesale market pricing? We typically save businesses 10-30% on energy."

4. **Fractional VP of Sales, B2B Prospecting & Team Management (Marcus Crowell / CDM)**
   - Services:
     a. **Fractional VP of Sales**: Strategic executive sales leadership, compensation modeling, pipeline velocity optimization, and closing support.
     b. **B2B Outbound Prospecting & Lead Generation**: Multi-channel cold outreach, targeted verified decision-maker lists, and appointment setting.
     c. **Sales Team Management & CRM Accountability**: Daily/weekly sales rep tracking, pipeline stage enforcement, and conversion coaching.
   - Best for: B2B companies, contractors, agencies, and growing businesses needing a predictable outbound sales engine without the $250k executive overhead.
   - Pitch angle: "Do you have a predictable outbound prospecting system bringing in qualified appointments every week?"

5. **Microsoft Power Platform & Azure Services** - Microsoft Preferred Partner
   - URL: https://enterprise.crowell-randolph.com
   - Services: Power BI dashboards & analytics, Azure cloud infrastructure, Microsoft Copilot deployment & prompt training, Azure Data Lakes, custom Power Apps & Power Automate workflows.
   - Best for: Mid-market/enterprise clients, spreadsheet-heavy operations, Microsoft 365 shops modernizing legacy workflows.

6. **UniScan (uniscan.crowell-randolph.com)** - Uniform Ordering & Employee Onboarding
   - URL: https://uniscan.crowell-randolph.com
   - Best for: Restaurants, hospitality, healthcare, construction, retail, franchises—any business with uniformed staff or high turnover.

7. **AI Courses via MyCityMySchool (aicourses.mycitymyschool.tech)** - Employee AI Training & Certification
   - URL: https://aicourses.mycitymyschool.tech
   - Best for: Employers wanting to upskill staff in AI & automation—eligible for **TWC (Texas Workforce Commission) reimbursement**: up to **$1,000 per current employee** and **$2,000 per new hire**.

8. **AgentDunn (agentdunn.cdmweb.store)** - Commercial Insurance & Risk Management
   - URL: https://agentdunn.cdmweb.store
   - Best for: Businesses needing general liability, commercial property, and risk mitigation.
`;

// Generate AI-powered sales intelligence using Gemini
async function generateSalesIntelligence(
  lead: LeadData,
  googleData: GooglePlaceDetails | null,
  websiteContent: string | null,
  socialContent: string,
  socialProfiles: Record<string, any>,
  googleReviewsContent: string | null
): Promise<any> {
  if (!GOOGLE_GEMINI_API_KEY) {
    console.log('GOOGLE_GEMINI_API_KEY not configured, using fallback');
    return generateFallbackIntelligence(lead);
  }

  try {
    // Build review analysis section
    let reviewSection = '';
    if (googleData?.reviews && googleData.reviews.length > 0) {
      const negativeReviews = googleData.reviews
        .filter(r => r.rating <= 3)
        .map(r => `★${r.rating}: "${r.text}"`)
        .join('\n');
      const positiveReviews = googleData.reviews
        .filter(r => r.rating >= 4)
        .slice(0, 3)
        .map(r => `★${r.rating}: "${r.text}"`)
        .join('\n');

      reviewSection = `
GOOGLE REVIEWS (from API):
Rating: ${googleData.rating}/5 (${googleData.user_ratings_total} total reviews)

NEGATIVE/CRITICAL REVIEWS (pain points!):
${negativeReviews || 'No negative reviews found in API data'}

TOP POSITIVE REVIEWS:
${positiveReviews || 'No reviews available'}`;
    }

    if (googleReviewsContent) {
      reviewSection += `\n\nADDITIONAL SCRAPED REVIEW DATA:\n${googleReviewsContent.substring(0, 2000)}`;
    }

    const socialInfo = Object.entries(socialProfiles)
      .filter(([k]) => k.endsWith('_url'))
      .map(([k, v]) => `${k.replace('_url', '').toUpperCase()}: ${v}`)
      .join('\n');

    const prompt = `You are Marcus Crowell's elite B2B sales strategist and business analyst. Your job is to deeply analyze this business using ALL available data—Google reviews, website, social media—to find REAL pain points and recommend the BEST solutions from Marcus's catalog.

${PRODUCT_CATALOG}

═══ BUSINESS DATA ═══

Company: ${lead.companyName}
Industry: ${lead.industryName}
Location: ${lead.location || 'Unknown'}
Website: ${lead.website || 'NO WEBSITE - this is a pain point!'}
${googleData?.business_status ? `Status: ${googleData.business_status}` : ''}

${reviewSection}

═══ SOCIAL MEDIA PRESENCE ═══
${socialInfo || 'NO social profiles found - this is a major pain point!'}

${socialContent ? `SOCIAL MEDIA CONTENT ANALYSIS:\n${socialContent.substring(0, 2000)}` : 'No social content scraped - likely low social presence'}

${websiteContent ? `═══ WEBSITE CONTENT ═══\n${websiteContent.substring(0, 2000)}` : '═══ NO WEBSITE CONTENT ═══\nBusiness may not have a website or it could not be scraped - MAJOR opportunity for Smart Websites!'}

═══ ANALYSIS INSTRUCTIONS ═══

1. REVIEW ANALYSIS: Look at negative Google reviews to identify operational pain points (slow service, poor communication, missed appointments, bad customer experience). These are REAL problems the business has.

2. SOCIAL MEDIA GAPS: If they have no IG/FB/X presence, or low engagement, that's a pain point. If their social content is poor quality or infrequent, note that.

3. WEBSITE GAPS: No website = huge opportunity. Outdated website = opportunity. No lead capture = opportunity. No online booking = opportunity.

4. MATCH SOLUTIONS: For each pain point found, recommend the SPECIFIC product from Marcus's catalog that solves it.

   TIER THE RECOMMENDATIONS BY COMPANY SIZE (use industry, review volume, website sophistication, staff count signals to judge):
   - **ENTERPRISE / MID-MARKET** (manufacturing, healthcare systems, logistics, finance, multi-location retail, franchises, professional services with 50+ staff, hospitals, schools, municipalities, distributors, warehouses, construction firms, energy, oil & gas, insurance groups):
     PRIMARY (MANDATORY, MUST BE FIRST): Microsoft **Power BI, Azure, Microsoft Copilot, and Power Apps** from enterprise.crowell-randolph.com (Microsoft Preferred Partner) — also include Azure Data Lakes, Power Automate, and Power Pages where relevant. Name these products explicitly. Lead with data/analytics/legacy-system pain.
     PAIR WITH (MANDATORY for every enterprise/mid-market prospect): Staff AI/Copilot/Power Platform training via aicourses.mycitymyschool.tech — Texas Workforce Commission reimburses up to $1,000/current employee and $2,000/new hire for staff certifications. This training offer is REQUIRED as the relationship-building door-opener before the larger Power Platform engagement.
     SECONDARY: UniScan for onboarding/uniforms if they have high headcount turnover; AIBizPro voice agents for inbound call volume.
   - **SMB / LOCAL** (single-location restaurants, salons, contractors, small retail, solo professionals):
     PRIMARY: AIBizPro (GoHighLevel, Smart Websites, Virtual Agents, AI Phone, Reputation Management), cdmweb.store for web needs.

5. STAFF TRAINING AS RELATIONSHIP BUILDER: For every enterprise/mid-market recommendation, explicitly include AI Courses staff training with the TWC reimbursement angle as a low-friction opener — it costs the client little, funds their team, and earns trust before larger Power Platform/Azure engagements.

6. ACTION PLAN: Create a concrete step-by-step sales action plan.

Return ONLY valid JSON:

{
  "lead_score": <0-100>,
  "score_reasoning": "<1-2 sentences on why this score>",
  "review_pain_points": [
    {"issue": "<specific problem from reviews>", "review_quote": "<actual quote if available>", "solution_product": "<product name>", "solution_url": "<product url>"}
  ],
  "operational_pain_points": [
    {"area": "operations|sales|management|customer_relations|marketing|technology", "pain": "<specific pain point>", "evidence": "<how you identified this>", "solution_product": "<product name>", "solution_url": "<product url>"}
  ],
  "social_media_analysis": {
    "presence_score": <0-10>,
    "platforms_found": ["<list>"],
    "gaps": ["<missing platforms or weak areas>"],
    "recommendations": ["<specific actions>"]
  },
  "recommended_products": [
    {
      "product_name": "<from catalog>",
      "product_url": "<url>",
      "pitch": "<tailored one-liner for THIS business>",
      "pain_point_addressed": "<which pain point>",
      "priority": "high|medium|low",
      "estimated_impact": "<what improvement they'd see>"
    }
  ],
  "sales_action_plan": [
    {"step": 1, "action": "<specific action>", "talking_point": "<what to say>", "product_to_pitch": "<product name>"},
    {"step": 2, "action": "<next step>", "talking_point": "<what to say>", "product_to_pitch": "<product name>"}
  ],
  "sales_tactics": [
    "<opening approach referencing their reviews/social/website>",
    "<conversation starter using specific data you found>",
    "<objection handler>"
  ],
  "owner_research": {
    "likely_decision_maker": "<title/role>",
    "approach_angle": "<personalized approach based on findings>",
    "linkedin_search_tip": "<how to find them>"
  },
  "personalized_email": "<200-word cold email from Marcus that references SPECIFIC findings from their reviews, social media gaps, or website issues, and pitches the top 2 AIBizPro solutions>",
  "call_script_opener": "<40-word phone opener mentioning a specific review issue or social gap>"
}

CRITICAL: Reference REAL data from their reviews, social media, and website. Do NOT make generic recommendations. Every product recommendation must tie to a SPECIFIC finding.`;

    console.log('Generating deep AI sales intelligence via Gemini for:', lead.companyName);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return generateFallbackIntelligence(lead);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Deep AI sales intelligence generated successfully');
      return parsed;
    }

    return generateFallbackIntelligence(lead);
  } catch (error) {
    console.error('Error generating AI intelligence:', error);
    return generateFallbackIntelligence(lead);
  }
}

function generateFallbackIntelligence(lead: LeadData): any {
  return {
    lead_score: 50,
    score_reasoning: 'Baseline business profile analyzed - tailored to Marcus Crowell solutions catalog',
    review_pain_points: [],
    operational_pain_points: [
      { area: 'marketing', pain: 'Digital presence, automated lead capture & SEO needs assessment', evidence: 'Standard market analysis', solution_product: 'CDMWeb.store & AIBizPro Smart Websites', solution_url: 'https://cdmweb.store' },
      { area: 'customer_relations', pain: 'Inbound response speed & 24/7 call handling', evidence: 'Missed after-hours inquiries', solution_product: 'AIBizPro AI Voice & Text Conversation Agents', solution_url: 'https://aibizpro.cdmweb.store' },
      { area: 'operations', pain: 'Commercial utility overhead & software workflow optimization', evidence: 'Commercial operating expenses', solution_product: 'EnergyChoice.us & CDMWeb Custom Software', solution_url: 'https://energychoice.us' },
      { area: 'sales', pain: 'Consistent outbound lead generation & pipeline predictability', evidence: 'Sales pipeline acceleration', solution_product: 'Fractional VP of Sales & GoHighLevel CRM', solution_url: 'https://aibizpro.cdmweb.store' }
    ],
    social_media_analysis: { presence_score: 0, platforms_found: [], gaps: ['Multi-platform automated presence'], recommendations: ['Automate social posting and review outreach via AIBizPro'] },
    recommended_products: [
      { product_name: 'AIBizPro GoHighLevel CRM', product_url: 'https://aibizpro.cdmweb.store', pitch: 'All-in-one CRM, sales pipelines, marketing automation & 2-way SMS', pain_point_addressed: 'Customer acquisition & retention', priority: 'high', estimated_impact: 'Streamline all marketing and client follow-ups in one system' },
      { product_name: 'AIBizPro 24/7 AI Phone & Text Agents', product_url: 'https://aibizpro.cdmweb.store', pitch: 'Conversational voice and text AI answering calls and qualifying leads 24/7', pain_point_addressed: 'Missed calls & slow response times', priority: 'high', estimated_impact: 'Capture 100% of inbound and after-hours leads' },
      { product_name: 'CDMWeb.store Software & IT Staffing', product_url: 'https://cdmweb.store', pitch: 'Custom software development, IT staffing & dedicated remote/AI developers', pain_point_addressed: 'Technical development & engineering capacity', priority: 'high', estimated_impact: 'Scale engineering and software capabilities with vetted talent' },
      { product_name: 'EnergyChoice.us Commercial Energy', product_url: 'https://energychoice.us', pitch: '10-30% commercial electricity and natural gas cost reduction in deregulated areas', pain_point_addressed: 'Commercial utility overhead', priority: 'medium', estimated_impact: 'Immediate 10-30% monthly utility savings with zero downtime' },
      { product_name: 'Fractional VP of Sales & Prospecting', product_url: 'https://cdmweb.store', pitch: 'Outbound B2B prospecting systems, sales team management & pipeline strategy', pain_point_addressed: 'Predictable sales revenue', priority: 'medium', estimated_impact: 'Accelerate deal closing with proven sales executive leadership' }
    ],
    sales_action_plan: [
      { step: 1, action: 'Initial Discovery & Audit', talking_point: 'Review current website, CRM, energy bills, and phone response workflows', product_to_pitch: 'AIBizPro & EnergyChoice.us' },
      { step: 2, action: 'High-Impact Quick Win Pitch', talking_point: 'Deploy 24/7 AI Phone Agent or benchmark commercial electric rate for immediate savings', product_to_pitch: 'AI Voice Agent & EnergyChoice.us' },
      { step: 3, action: 'Scale & Retain', talking_point: 'Implement GoHighLevel CRM automation, custom software, and dedicated developer staffing', product_to_pitch: 'GoHighLevel CRM & CDMWeb.store' }
    ],
    sales_tactics: [
      'Lead with immediate cost reduction: Benchmark commercial utility rates with EnergyChoice.us',
      'Demonstrate the 24/7 AI voice phone agent live—let them experience zero missed calls',
      'Offer full tech expansion via CDMWeb.store: Custom software development and remote/AI developer staffing'
    ],
    owner_research: {
      likely_decision_maker: 'Owner / Managing Partner / General Manager',
      approach_angle: 'Focus on eliminating missed revenue, reducing utility overhead, and scaling engineering/sales capacity',
      linkedin_search_tip: `Search "${lead.companyName}" + "${lead.location || 'owner'}"`
    },
    personalized_email: `Hi,\n\nI came across ${lead.companyName} and wanted to reach out regarding your operations in ${lead.location || 'your area'}.\n\nAt Crowell Digital Marketplace (CDMWeb.store) and AIBizPro (aibizpro.cdmweb.store), we help businesses scale operations and eliminate overhead across three key pillars:\n1. 24/7 AI Voice & Text Conversation Agents + GoHighLevel CRM automation so you never miss an inquiry or referral\n2. Commercial Energy Rate Reduction via EnergyChoice.us (typically cutting electric and gas costs 10-30% in deregulated markets)\n3. Custom Software Development & IT Staffing (providing vetted remote and dedicated AI developers to scale your technology)\n\nWould you have 10-15 minutes this week for a brief call to see how we could support ${lead.companyName}?\n\nBest regards,\nMarcus Crowell\nCDMWeb.store | aibizpro.cdmweb.store | energychoice.us`,
    call_script_opener: `Hi, this is Marcus Crowell with CDMWeb and AIBizPro. I help businesses like ${lead.companyName} eliminate missed customer calls with 24/7 AI phone agents and reduce commercial overhead—do you have a quick moment?`
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json() as { lead: LeadData };

    if (!lead?.companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== Starting deep enrichment for:', lead.companyName, '===');

    // Phase 1: Gather all real-world data in parallel
    const [googleData, websiteData, socialData] = await Promise.all([
      lead.place_id
        ? fetchGooglePlaceDetails(lead.place_id)
        : searchGoogleBusiness(lead.companyName, lead.location || ''),
      lead.website ? scrapeWebsite(lead.website) : Promise.resolve(null),
      searchAndScrapeSocials(lead.companyName, lead.location || '')
    ]);

    // Phase 1.5: Scrape Google reviews page for deeper analysis if we have the maps URL
    let googleReviewsContent: string | null = null;
    if (googleData?.url) {
      googleReviewsContent = await scrapeGoogleReviews(googleData.url);
    }

    // Phase 2: Extract contact info from website
    let extractedContacts = { emails: [] as string[], phones: [] as string[] };
    if (websiteData?.markdown) {
      extractedContacts = extractContactInfo(websiteData.markdown);
    }

    // Phase 3: Calculate optimal call times
    const callTimes = calculateBestCallTimes(googleData?.opening_hours, lead.industryName);

    // Phase 4: Generate AI-powered sales intelligence with all scraped data
    const salesIntelligence = await generateSalesIntelligence(
      lead,
      googleData,
      websiteData?.markdown || null,
      socialData.content,
      socialData.profiles,
      googleReviewsContent
    );

    // Build enriched lead response
    const enrichedLead = {
      company_name: lead.companyName,
      industry_name: lead.industryName,
      location: googleData?.formatted_address || lead.location,
      address: googleData?.formatted_address || lead.address,

      phone: googleData?.formatted_phone_number || extractedContacts.phones[0] || lead.phone,
      email: extractedContacts.emails[0] || lead.email,
      website: googleData?.website || lead.website,
      google_maps_url: googleData?.url,

      google_rating: googleData?.rating,
      google_reviews_count: googleData?.user_ratings_total,
      google_business_status: googleData?.business_status,
      google_hours: googleData?.opening_hours?.weekday_text,
      google_reviews_summary: googleData?.reviews?.map(r => ({ rating: r.rating, text: r.text.substring(0, 200), author: r.author_name })),

      ...socialData.profiles,

      best_call_times: callTimes.best_times,
      call_timing_reasoning: callTimes.reasoning,

      lead_score: salesIntelligence.lead_score,
      score_reasoning: salesIntelligence.score_reasoning,
      review_pain_points: salesIntelligence.review_pain_points,
      pain_points: salesIntelligence.operational_pain_points || salesIntelligence.specific_pain_points,
      social_media_analysis: salesIntelligence.social_media_analysis,
      suggested_products: salesIntelligence.recommended_products,
      sales_action_plan: salesIntelligence.sales_action_plan,
      sales_tactics: salesIntelligence.sales_tactics,
      owner_research: salesIntelligence.owner_research,
      personalized_email: salesIntelligence.personalized_email,
      call_script_opener: salesIntelligence.call_script_opener,

      enriched_at: new Date().toISOString(),
      data_sources: {
        google_places: !!googleData,
        google_reviews_scraped: !!googleReviewsContent,
        google_reviews_api: (googleData?.reviews?.length || 0) > 0,
        website_scraped: !!websiteData,
        social_profiles_found: Object.keys(socialData.profiles).filter(k => k.endsWith('_url')).length,
        social_content_scraped: socialData.content.length > 0
      }
    };

    console.log('=== Deep enrichment complete for:', lead.companyName, '===');

    return new Response(
      JSON.stringify({ success: true, data: enrichedLead }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enrich-lead function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to enrich lead' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

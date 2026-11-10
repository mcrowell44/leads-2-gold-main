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

// Updated Product/Service Catalog with cdmweb.store & aibizpro services
const PRODUCT_CATALOG = `
AVAILABLE PRODUCTS & SERVICES (Marcus Crowell):

1. **CDMWeb.store** - Professional Web Development & Digital Services Hub
   - URL: https://cdmweb.store
   - Best for: Businesses needing modern websites, e-commerce, digital transformation
   - Value: Custom responsive websites, e-commerce stores, SEO optimization, digital branding
   - Pitch angle: "Is your current website actually generating leads, or just sitting there?"

2. **AIBizPro (aibizpro.cdmweb.store)** - AI-Powered Business Solutions
   - URL: https://aibizpro.cdmweb.store
   - Services include:
     a. **GoHighLevel (GHL) CRM** - All-in-one marketing, CRM, booking, reputation management
        - Best for: Service businesses juggling multiple tools, needing automated follow-ups
        - Value: Replace 5+ tools with one platform, automated lead nurturing, SMS/email campaigns
     b. **Smart Automated Websites** - AI-powered websites with built-in marketing
        - Best for: Businesses without a website OR with outdated sites with low Google activity
        - Value: Automated marketing, social engagement, lead capture, nurturing, CRM integration
        - Includes: Web design, automated advertising, social media management
     c. **Virtual AI Agents** - 24/7 AI-powered customer service agents
        - Best for: Businesses missing calls, slow to respond to inquiries, need 24/7 coverage
        - Value: Never miss a lead, instant response to inquiries, appointment booking
     d. **AI Phone Agents** - AI-powered phone answering and outbound calling
        - Best for: Businesses with high call volume, after-hours calls, appointment scheduling
        - Value: AI answers calls naturally, books appointments, qualifies leads, follows up
     e. **Reputation Management** - AI-powered Google review management
        - Best for: Businesses with low/bad reviews, not responding to reviews
        - Value: AI-powered review responses, automated outreach to past customers for reviews
        - Focus: Increase Google rating, respond to negative reviews professionally
     f. **Voice & Conversation Agents** - AI-powered voice and chat agents through GoHighLevel
        - Best for: Businesses missing calls, needing 24/7 engagement, lead qualification
        - Value: AI voice agents answer calls, qualify leads, book appointments, follow up via text/chat

3. **EnergyChoice.us** - Energy Comparison & Switching
   - URL: https://energychoice.us
   - Best for: Businesses with high utility costs (restaurants, retail, manufacturing, gyms)
   - Value: 10-30% energy savings, green energy options, zero switching fees

4. **AIBizPro Sales Automation** - Built into aibizpro.cdmweb.store
   - URL: https://aibizpro.cdmweb.store
   - Best for: Sales teams, B2B companies, lead-heavy businesses
   - Value: Pipeline management via GoHighLevel, lead tracking, automated follow-ups, AI phone agents for outbound

6. **AgentDunn (agentdunn.cdmweb.store)** - Insurance & Financial Services
   - URL: https://agentdunn.cdmweb.store
   - Best for: Businesses needing liability coverage, business insurance
   - Value: Competitive rates, comprehensive coverage, financial planning

7. **Play44Sports.com** - Youth Sports Management
   - URL: https://play44sports.com
   - Best for: Sports organizations, gyms, athletic facilities, coaches, travel teams

8. **Microsoft Power Platform & Azure Services** - Microsoft Preferred Partner
   - URL: https://enterprise.crowell-randolph.com
   - Services: Power BI dashboards & analytics, Azure cloud infrastructure, Microsoft Copilot deployment & prompt training, Azure Data Lakes & data warehousing, Power Apps (custom internal apps), Power Pages (external portals), Power Automate workflows
   - Best for: Mid-market/enterprise clients, businesses drowning in spreadsheets, teams needing BI dashboards, companies modernizing legacy systems, Microsoft 365 shops
   - Value: Microsoft Preferred Partner training & implementation, unified data lake, AI copilots inside Excel/Teams/Outlook, custom Power Apps replacing manual processes
   - Pitch angle: "Are your teams still living in Excel while your competitors have Power BI dashboards and Copilot answering questions in seconds?"

9. **UniScan (uniscan.crowell-randolph.com)** - Uniform Ordering & Employee Onboarding
   - URL: https://uniscan.crowell-randolph.com
   - Best for: Restaurants, retail, hospitality, healthcare, construction, franchises - any business with uniformed staff or high turnover
   - Value: Streamlined uniform ordering, sizing/inventory tracking, digital company onboarding, new-hire paperwork automation
   - Pitch angle: "How much time does your manager waste ordering uniforms and onboarding each new hire?"

10. **AI Courses via MyCityMySchool (aicourses.mycitymyschool.tech)** - Employee AI Training & Certification
    - URL: https://aicourses.mycitymyschool.tech
    - Best for: Texas employers wanting to upskill staff in AI, Copilot, automation, and Power Platform
    - Value: Certification programs + **TWC (Texas Workforce Commission) reimbursement**: up to **$1,000 per current employee** and **$2,000 per newly hired employee** who completes certification
    - Pitch angle: "You can train your entire team on AI and get reimbursed up to $2,000 per new hire by Texas Workforce Commission - here's how."

8. **Play44Recruiting.site** - Athletic Recruiting Services
   - URL: https://play44recruiting.site
   - Best for: High schools, travel teams, athletes seeking college exposure
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
    score_reasoning: 'Limited data available - needs manual research',
    review_pain_points: [],
    operational_pain_points: [
      { area: 'marketing', pain: 'Digital presence needs assessment', evidence: 'Unable to scrape data', solution_product: 'AIBizPro Smart Websites', solution_url: 'https://aibizpro.cdmweb.store' },
      { area: 'customer_relations', pain: 'Review management unknown', evidence: 'No review data available', solution_product: 'AIBizPro Reputation Management', solution_url: 'https://aibizpro.cdmweb.store' },
      { area: 'operations', pain: 'Workflow automation opportunities', evidence: 'Industry typical', solution_product: 'AIBizPro Voice & Conversation Agents', solution_url: 'https://aibizpro.cdmweb.store' }
    ],
    social_media_analysis: { presence_score: 0, platforms_found: [], gaps: ['All platforms'], recommendations: ['Build social presence'] },
    recommended_products: [
      { product_name: 'AIBizPro GoHighLevel CRM', product_url: 'https://aibizpro.cdmweb.store', pitch: 'All-in-one CRM and marketing automation', pain_point_addressed: 'Customer acquisition', priority: 'high', estimated_impact: 'Streamline all marketing in one platform' },
      { product_name: 'AIBizPro Smart Websites', product_url: 'https://aibizpro.cdmweb.store', pitch: 'AI-powered website with built-in lead capture', pain_point_addressed: 'Digital presence', priority: 'high', estimated_impact: 'Start generating leads online 24/7' },
      { product_name: 'AIBizPro Virtual AI Agents', product_url: 'https://aibizpro.cdmweb.store', pitch: 'Never miss a customer inquiry again', pain_point_addressed: 'Missed leads', priority: 'medium', estimated_impact: '24/7 customer response' }
    ],
    sales_action_plan: [
      { step: 1, action: 'Research business online', talking_point: 'Understand their current setup', product_to_pitch: 'AIBizPro' },
      { step: 2, action: 'Cold call with value offer', talking_point: 'Free business audit', product_to_pitch: 'GoHighLevel CRM' }
    ],
    sales_tactics: [
      'Lead with value - offer a free digital audit of their business',
      'Reference local competitors succeeding with similar solutions',
      'Ask about their biggest challenge this quarter'
    ],
    owner_research: {
      likely_decision_maker: 'Owner/General Manager',
      approach_angle: 'Focus on time-saving and ROI with AI automation',
      linkedin_search_tip: `Search "${lead.companyName}" + "${lead.location || 'owner'}"`
    },
    personalized_email: `Hi,\n\nI came across ${lead.companyName} and was impressed by your presence in the ${lead.industryName} space in ${lead.location || 'your area'}.\n\nI help businesses like yours leverage AI-powered tools to automate customer engagement, manage reputation, and capture more leads. Our AIBizPro platform at aibizpro.cdmweb.store includes smart websites, virtual agents, and GoHighLevel CRM - all designed to save you time and grow revenue.\n\nWould you have 15 minutes this week for a quick call? I'd love to share how similar ${lead.industryName} businesses have doubled their lead flow.\n\nBest regards,\nMarcus Crowell\nhttps://aibizpro.cdmweb.store`,
    call_script_opener: `Hi, this is Marcus Crowell. I help ${lead.industryName} businesses like ${lead.companyName} automate their marketing and never miss a lead with AI - do you have a quick moment?`
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

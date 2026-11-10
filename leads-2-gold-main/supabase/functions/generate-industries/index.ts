import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let searchTerm = '';
    let location = '';
    let count = 30;
    
    try {
      const body = await req.json();
      searchTerm = body?.searchTerm || '';
      location = body?.location || 'Your Area';
      count = body?.count || 30;
    } catch (_) {
      searchTerm = '';
      location = 'Your Area';
      count = 30;
    }
    
    const randomSeed = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    
    console.log('Processing request for searchTerm:', searchTerm, 'location:', location, 'count:', count, 'seed:', randomSeed);
    
    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!geminiApiKey) {
      console.log('GOOGLE_GEMINI_API_KEY not configured, returning fallback industries')
      return new Response(
        JSON.stringify({ industries: generateFallbackIndustries(searchTerm, location, count) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `You are a business intelligence specialist. Generate EXACTLY ${count} diverse industry suggestions for the area within 100 miles of ${location} (include surrounding cities)${searchTerm ? ` related to "${searchTerm}"` : ''}.

Use random seed "${randomSeed}" and timestamp ${timestamp} to ensure unique results.

CRITICAL: 
- NO duplicate or similar industries back-to-back
- Alternate between different business categories (healthcare, retail, services, tech, food, etc.)
- Each industry must be distinctly different from the previous one
- Include a MIX of business sizes: large (100+ employees), medium (10-100), and small (1-10)

For EACH industry provide COMPLETE data:
- name: Specific industry name (be creative and diverse)
- businessCount: Realistic count for 100-mile radius including surrounding cities (50-800 range)
- rating: Average rating (3.5-4.9)
- location: "${location} Area (100mi)"
- businessSize: "large", "medium", or "small"
- challenges: Array of 3-4 specific industry challenges they face
- strategicRecommendations: Array of 3-4 specific sales/approach recommendations

RECOMMENDATION TIERING (critical — match products to industry scale):
- If businessSize is "large" or "medium" (enterprise / mid-market — manufacturing, healthcare, logistics, finance, insurance, franchises, professional services, distributors, construction, energy, hospitals, schools, municipalities):
  * MANDATORY: The FIRST recommendation MUST explicitly name **Microsoft Power BI dashboards, Azure cloud, Microsoft Copilot, and Power Apps** (from enterprise.crowell-randolph.com — Microsoft Preferred Partner). Also weave in Azure Data Lakes, Power Automate, and Power Pages where relevant.
  * MANDATORY: One recommendation MUST be a **staff AI / Copilot / Power Platform training offer via aicourses.mycitymyschool.tech** citing TWC reimbursement ($1,000/current employee, $2,000/new hire). This training offer is REQUIRED for EVERY enterprise/mid-market industry — it is the relationship-building door-opener before the larger Power Platform engagement.
  * Do NOT lead with AIBizPro/GoHighLevel for enterprise/mid — those are SMB-only.
- If businessSize is "small" (SMB / local):
  * Lead with AIBizPro (GoHighLevel, Smart Websites, Virtual Agents, AI Phone, Reputation Management) and cdmweb.store web services.

Return as JSON array:
[{
  "name": "Industry Name",
  "businessCount": 150,
  "rating": 4.3,
  "location": "${location} Area (100mi)",
  "businessSize": "medium",
  "challenges": ["Specific challenge 1", "Specific challenge 2", "Specific challenge 3"],
  "strategicRecommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"]
}]

RANDOMIZE the order and selection. Ensure no two consecutive industries are similar.`;

    console.log('Calling Gemini API with Google Search Grounding for diverse industries');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search_retrieval: {} }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 12000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status}`, errorText);
      return new Response(
        JSON.stringify({ industries: generateFallbackIndustries(searchTerm, location, count), message: 'Using fallback data due to API error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json();
    const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let industries: any[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        industries = JSON.parse(jsonMatch[0]);
      } else {
        industries = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text?.substring(0, 500));
      industries = generateFallbackIndustries(searchTerm, location, count);
    }

    if (!Array.isArray(industries)) {
      industries = generateFallbackIndustries(searchTerm, location, count);
    }

    // Process and validate - ensure no duplicates
    const seenNames = new Set<string>();
    industries = industries
      .filter((industry: any) => {
        const name = (industry.name || '').toLowerCase();
        if (seenNames.has(name)) return false;
        seenNames.add(name);
        return true;
      })
      .slice(0, count)
      .map((industry: any) => ({
        name: industry.name || 'Unknown Industry',
        businessCount: industry.businessCount || Math.floor(Math.random() * 300) + 50,
        rating: industry.rating || (3.5 + Math.random() * 1.4),
        location: industry.location || `${location} Area (100mi)`,
        businessSize: industry.businessSize || ['large', 'medium', 'small'][Math.floor(Math.random() * 3)],
        challenges: industry.challenges || generateDefaultChallenges(),
        strategicRecommendations: (industry.strategicRecommendations && industry.strategicRecommendations.length > 0)
          ? industry.strategicRecommendations
          : generateDefaultRecommendations(industry.name)
      }));

    // Shuffle to break up similar consecutive industries
    industries = shuffleWithDiversity(industries);

    // Enrich with Firecrawl if available
    if (firecrawlApiKey && industries.length > 0) {
      console.log('Attempting to enrich business counts with Firecrawl search...');
      industries = await enrichWithFirecrawlCounts(industries.slice(0, 10), location, firecrawlApiKey)
        .then(enriched => [...enriched, ...industries.slice(10)])
        .catch(err => {
          console.error('Firecrawl enrichment failed:', err);
          return industries;
        });
    }

    console.log(`Generated ${industries.length} diverse industries with Gemini + Grounding`);

    return new Response(
      JSON.stringify({ industries }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-industries function:', error)
    const fallbackIndustries = generateFallbackIndustries('', 'Your Area', 30)
    return new Response(
      JSON.stringify({ industries: fallbackIndustries, message: 'Using fallback data due to error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function shuffleWithDiversity<T extends { businessSize?: string }>(array: T[]): T[] {
  const large = array.filter(i => i.businessSize === 'large');
  const medium = array.filter(i => i.businessSize === 'medium');
  const small = array.filter(i => i.businessSize === 'small');
  
  shuffleArray(large);
  shuffleArray(medium);
  shuffleArray(small);
  
  const result: T[] = [];
  const maxLen = Math.max(large.length, medium.length, small.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (i < large.length) result.push(large[i]);
    if (i < medium.length) result.push(medium[i]);
    if (i < small.length) result.push(small[i]);
  }
  
  return result;
}

async function enrichWithFirecrawlCounts(
  industries: any[], 
  location: string, 
  apiKey: string
): Promise<any[]> {
  const enrichedIndustries = [...industries];
  
  for (let i = 0; i < Math.min(5, industries.length); i++) {
    try {
      const industry = industries[i];
      const searchQuery = `${industry.name} businesses near ${location} 100 mile radius`;
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        const resultCount = data.data?.length || 0;
        
        if (resultCount > 0) {
          const estimatedCount = resultCount * (30 + Math.floor(Math.random() * 20));
          enrichedIndustries[i] = {
            ...industry,
            businessCount: Math.max(estimatedCount, industry.businessCount),
          };
          console.log(`Enriched ${industry.name}: estimated ${estimatedCount} businesses`);
        }
      }
    } catch (e) {
      console.error(`Failed to enrich industry ${i}:`, e);
    }
  }
  
  return enrichedIndustries;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateDefaultChallenges(): string[] {
  const allChallenges = [
    "Rising operational costs impacting margins",
    "Difficulty finding qualified staff",
    "Increasing competition from online services",
    "Customer acquisition costs rising",
    "Supply chain disruptions",
    "Adapting to changing consumer preferences",
    "Technology adoption and integration",
    "Maintaining consistent quality standards",
    "Managing seasonal demand fluctuations",
    "Building brand awareness locally"
  ];
  return shuffleArray(allChallenges).slice(0, 3);
}

function generateDefaultRecommendations(industryName: string = ''): string[] {
  const lower = industryName.toLowerCase();

  if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('roof') || lower.includes('electric') || lower.includes('contract') || lower.includes('construction') || lower.includes('handyman') || lower.includes('pest') || lower.includes('landscap') || lower.includes('tree') || lower.includes('clean')) {
    return [
      "Step 1: Deploy AIBizPro 24/7 AI Phone Agent to capture 100% of emergency and after-hours job calls",
      "Step 2: Connect GoHighLevel CRM for instant 60-second 2-way SMS quote follow-ups and dispatch",
      "Step 3: Run EnergyChoice utility bill audit to cut shop/yard electric rates 10-30% in deregulated areas",
      "Step 4: Launch high-converting contractor website & Google Map Pack SEO from CDMWeb.store"
    ];
  }

  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('bar') || lower.includes('cafe') || lower.includes('diner') || lower.includes('bakery') || lower.includes('catering') || lower.includes('hospitality') || lower.includes('hotel')) {
    return [
      "Step 1: Free EnergyChoice utility audit to slash commercial kitchen electric & gas costs by 10-30%",
      "Step 2: Deploy AIBizPro 24/7 AI Phone & Text Agent for hands-free phone orders & reservation bookings",
      "Step 3: Launch automated 5-star Google review collection to dominate local neighborhood searches",
      "Step 4: Implement GoHighLevel VIP diner loyalty & automated slow-night SMS flash promos"
    ];
  }

  if (lower.includes('software') || lower.includes('tech') || lower.includes('it ') || lower.includes('saas') || lower.includes('developer') || lower.includes('semiconductor') || lower.includes('electronic')) {
    return [
      "Step 1: Fractional VP of Sales B2B prospecting architecture & outbound pipeline acceleration",
      "Step 2: Scale engineering capacity with CDMWeb dedicated remote developers & AI engineers",
      "Step 3: Automate inbound B2B qualification & demo booking in AIBizPro GoHighLevel CRM",
      "Step 4: Deploy Microsoft Power BI analytics & Azure infrastructure from enterprise.crowell-randolph.com"
    ];
  }

  if (lower.includes('auto') || lower.includes('car') || lower.includes('mechanic') || lower.includes('tire') || lower.includes('body shop')) {
    return [
      "Step 1: Deploy AIBizPro AI phone receptionist to take estimate calls and book bay drop-offs 24/7",
      "Step 2: Automate recurring maintenance recall SMS (oil/brakes/tires) in GoHighLevel CRM",
      "Step 3: Launch automated review outreach to turn completed repairs into 5-star Google ratings",
      "Step 4: Reduce commercial garage & shop electricity overhead via EnergyChoice.us"
    ];
  }

  if (lower.includes('real estate') || lower.includes('realty') || lower.includes('mortgage') || lower.includes('property') || lower.includes('broker')) {
    return [
      "Step 1: Implement AIBizPro AI Voice/Text agents for sub-30-second inbound speed-to-lead qualification",
      "Step 2: Automate 12-month buyer/seller drip nurturing & pipeline tracking in GoHighLevel CRM",
      "Step 3: Fractional VP of Sales outbound prospecting campaigns & agent team management",
      "Step 4: Launch high-converting IDX property showcase website from CDMWeb.store"
    ];
  }

  if (lower.includes('health') || lower.includes('medical') || lower.includes('dental') || lower.includes('clinic') || lower.includes('doctor') || lower.includes('wellness') || lower.includes('spa') || lower.includes('salon')) {
    return [
      "Step 1: Deploy AIBizPro 24/7 AI phone receptionist for appointment booking, rebooking & patient intake",
      "Step 2: Reduce no-shows by 40% with GoHighLevel automated 2-way SMS reminders & digital intake",
      "Step 3: Automated HIPAA-compliant Google review collection to elevate clinic reputation",
      "Step 4: Modern patient portal & high-speed healthcare web architecture from CDMWeb.store"
    ];
  }

  if (lower.includes('manufactur') || lower.includes('warehous') || lower.includes('industr') || lower.includes('logistics') || lower.includes('machin') || lower.includes('distribut')) {
    return [
      "Step 1: EnergyChoice high-volume commercial energy procurement (10-30% rate reduction)",
      "Step 2: Custom ERP/inventory software development & dedicated IT staffing via CDMWeb.store",
      "Step 3: Fractional VP of Sales outbound industrial B2B prospecting & contract acquisition",
      "Step 4: Staff AI training via MyCityMySchool with Texas Workforce Commission reimbursement"
    ];
  }

  if (lower.includes('legal') || lower.includes('law') || lower.includes('attorney') || lower.includes('accounting') || lower.includes('cpa') || lower.includes('consult') || lower.includes('financ')) {
    return [
      "Step 1: AIBizPro AI Voice & Text agent for 24/7 prospective client intake & consultation pre-screening",
      "Step 2: Fractional VP of Sales high-ticket B2B retainer prospecting systems & outbound campaigns",
      "Step 3: Automated secure document intake workflows & retention in GoHighLevel CRM",
      "Step 4: High-end corporate brand authority & modern web architecture from CDMWeb.store"
    ];
  }

  return [
    "Step 1: Deploy AIBizPro 24/7 AI Voice Agent to eliminate missed customer calls & book appointments",
    "Step 2: Streamline lead follow-up & pipeline management with AIBizPro GoHighLevel CRM",
    "Step 3: Benchmark commercial utility rates with EnergyChoice.us for 10-30% overhead savings",
    "Step 4: Scale technology with custom software development & IT staffing from CDMWeb.store"
  ];
}

function generateFallbackIndustries(searchTerm: string, location: string, count: number = 10) {
  const allIndustries = [
    { name: "Hospital Systems", businessSize: "large", baseCount: 450 },
    { name: "Commercial Real Estate", businessSize: "large", baseCount: 380 },
    { name: "Manufacturing Plants", businessSize: "large", baseCount: 290 },
    { name: "Regional Banks", businessSize: "large", baseCount: 150 },
    { name: "Distribution Centers", businessSize: "large", baseCount: 180 },
    { name: "Corporate Law Firms", businessSize: "large", baseCount: 120 },
    { name: "Insurance Agencies", businessSize: "large", baseCount: 340 },
    { name: "Franchise Operations", businessSize: "large", baseCount: 520 },
    { name: "HVAC Contractors", businessSize: "medium", baseCount: 185 },
    { name: "Dental Practices", businessSize: "medium", baseCount: 220 },
    { name: "Veterinary Clinics", businessSize: "medium", baseCount: 145 },
    { name: "Physical Therapy Centers", businessSize: "medium", baseCount: 130 },
    { name: "Event Planning Companies", businessSize: "medium", baseCount: 95 },
    { name: "Commercial Cleaning Services", businessSize: "medium", baseCount: 175 },
    { name: "IT Support Companies", businessSize: "medium", baseCount: 110 },
    { name: "Plumbing Companies", businessSize: "medium", baseCount: 165 },
    { name: "Electrical Contractors", businessSize: "medium", baseCount: 155 },
    { name: "Marketing Agencies", businessSize: "medium", baseCount: 125 },
    { name: "Staffing Agencies", businessSize: "medium", baseCount: 90 },
    { name: "Printing & Signage", businessSize: "medium", baseCount: 85 },
    { name: "Mobile Pet Grooming", businessSize: "small", baseCount: 45 },
    { name: "Personal Training Studios", businessSize: "small", baseCount: 78 },
    { name: "Food Trucks", businessSize: "small", baseCount: 62 },
    { name: "Photography Studios", businessSize: "small", baseCount: 95 },
    { name: "Tattoo Parlors", businessSize: "small", baseCount: 55 },
    { name: "Florists", businessSize: "small", baseCount: 68 },
    { name: "Barbershops", businessSize: "small", baseCount: 120 },
    { name: "Nail Salons", businessSize: "small", baseCount: 145 },
    { name: "Yoga Studios", businessSize: "small", baseCount: 72 },
    { name: "Coffee Roasters", businessSize: "small", baseCount: 35 },
    { name: "Escape Room Venues", businessSize: "small", baseCount: 28 },
    { name: "Custom Cake Bakeries", businessSize: "small", baseCount: 52 },
    { name: "Drone Photography Services", businessSize: "small", baseCount: 25 },
    { name: "Mobile Car Detailing", businessSize: "small", baseCount: 48 },
    { name: "Home Organizing Services", businessSize: "small", baseCount: 32 },
    { name: "Pet Sitting Services", businessSize: "small", baseCount: 88 },
    { name: "Tutoring Services", businessSize: "small", baseCount: 75 },
    { name: "Notary Services", businessSize: "small", baseCount: 42 },
    { name: "Craft Breweries", businessSize: "small", baseCount: 38 },
    { name: "Solar Installation", businessSize: "small", baseCount: 55 },
    { name: "EV Charging Stations", businessSize: "small", baseCount: 22 },
    { name: "Coworking Spaces", businessSize: "small", baseCount: 35 },
    { name: "Meal Prep Services", businessSize: "small", baseCount: 28 }
  ];

  const shuffled = shuffleArray(allIndustries);
  
  let selected;
  if (searchTerm && searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    const matching = shuffled.filter(i => i.name.toLowerCase().includes(searchLower));
    const nonMatching = shuffled.filter(i => !i.name.toLowerCase().includes(searchLower));
    selected = [...matching, ...nonMatching].slice(0, count);
  } else {
    selected = shuffled.slice(0, count);
  }

  return selected.map(industry => ({
    name: industry.name,
    businessCount: industry.baseCount + Math.floor(Math.random() * 50) - 25,
    rating: Math.round((3.5 + Math.random() * 1.4) * 10) / 10,
    location: `${location} Area (100mi)`,
    businessSize: industry.businessSize,
    challenges: generateDefaultChallenges(),
    strategicRecommendations: generateDefaultRecommendations(industry.name)
  }));
}

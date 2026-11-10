import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRODUCT_CATALOG = {
  cdmweb: {
    name: "CDMWeb.store (cdmweb.store)",
    description: "Custom software development, IT staffing & dedicated remote/AI developers, web applications, e-commerce, and digital branding",
    bestFor: ["custom software development", "IT staffing", "remote developers", "AI developers", "web development", "e-commerce", "SEO", "digital branding", "client portals"]
  },
  aibizpro: {
    name: "AIBizPro (aibizpro.cdmweb.store)",
    description: "GoHighLevel CRM plans, websites & automation for SMBs, 24/7 AI agent text and phone conversation, social media management, automated review collection",
    bestFor: ["GoHighLevel CRM", "SMB automation", "AI phone agents", "AI text agents", "social media management", "reputation management", "lead capture", "automated follow-ups"]
  },
  energy: {
    name: "EnergyChoice.us (energychoice.us)",
    description: "Commercial energy procurement and rate reduction (10-30% utility cost savings in deregulated energy markets)",
    bestFor: ["high energy costs", "commercial electricity", "commercial natural gas", "utility management", "cost reduction"]
  },
  fractionalSales: {
    name: "Fractional VP of Sales & Prospecting (CDM)",
    description: "Executive sales leadership, outbound B2B prospecting campaigns, sales team management, and pipeline revenue acceleration",
    bestFor: ["B2B prospecting", "sales leadership", "outbound sales", "sales team management", "closing deals", "pipeline growth"]
  },
  voiceAgents: {
    name: "AIBizPro 24/7 AI Voice & Phone Agents",
    description: "Conversational voice AI answering inbound customer calls, handling after-hours inquiries, qualifying leads, and booking appointments",
    bestFor: ["missed calls", "after-hours engagement", "lead qualification", "appointment booking", "customer follow-up", "dispatch"]
  },
  reputation: {
    name: "AIBizPro Reputation & Review Automation",
    description: "Automated Google review requests sent to past customer databases, plus AI-powered review responses to boost local Google rank",
    bestFor: ["active Google reviews", "review response automation", "customer feedback management", "reputation building", "past customer outreach"]
  },
  smartWebsites: {
    name: "AIBizPro Smart Websites",
    description: "Automated websites with built-in marketing, social engagement, lead capture, nurturing, and GoHighLevel CRM integration",
    bestFor: ["no website", "low Google activity", "lead capture", "marketing automation", "social engagement", "web design", "advertising"]
  },
  insurance: {
    name: "agentdunn.cdmweb.store",
    description: "Commercial insurance solutions, liability coverage, and business risk management",
    bestFor: ["liability coverage", "business insurance", "risk mitigation"]
  },
  powerPlatform: {
    name: "Microsoft Power Platform & Azure (enterprise.crowell-randolph.com)",
    description: "Microsoft Preferred Partner delivering Power BI dashboards, Azure cloud, Copilot rollout, Power Apps, and Power Automate workflows",
    bestFor: ["business intelligence", "data analytics", "Microsoft 365 shops", "legacy system modernization", "internal apps", "Copilot rollout"]
  },
  uniscan: {
    name: "UniScan (uniscan.crowell-randolph.com)",
    description: "Uniform ordering platform and digital company onboarding for uniformed workforces and high-turnover businesses",
    bestFor: ["uniform ordering", "employee onboarding", "restaurants", "hospitality", "healthcare", "construction", "franchises"]
  },
  aiCourses: {
    name: "AI Courses via MyCityMySchool (aicourses.mycitymyschool.tech)",
    description: "Employee AI training and certifications eligible for Texas Workforce Commission reimbursement up to $2,000 per hire",
    bestFor: ["employee training", "AI upskilling", "Texas employers", "TWC reimbursement", "workforce development"]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leads, industryName, location } = await req.json()
    console.log(`Generating AI insights for ${leads.length} leads in ${industryName} industry`)

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      console.log('GOOGLE_GEMINI_API_KEY not configured, returning leads without enhanced insights')
      return new Response(
        JSON.stringify({ enhancedLeads: addFallbackInsights(leads, industryName) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const productCatalogInfo = Object.entries(PRODUCT_CATALOG)
      .map(([key, product]) => `- ${product.name}: ${product.description}. Best for: ${product.bestFor.join(', ')}`)
      .join('\n');

    const batchSize = 10
    const enhancedLeads: any[] = []
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)
      const batchPrompt = `Analyze these ${industryName} businesses in ${location} and provide strategic sales intelligence for each:

${batch.map((lead: any, index: number) => `
Lead ${index + 1}:
- Company: ${lead.company_name}
- Industry: ${lead.industry_name || industryName}
- Location: ${lead.city || ''}, ${lead.state || ''}
- Rating: ${lead.rating || 'N/A'} (${lead.user_ratings_total || 0} reviews)
- Website: ${lead.website || 'N/A'}
`).join('\n')}

AVAILABLE PRODUCTS/SERVICES TO RECOMMEND:
${productCatalogInfo}

For each lead, provide strategic analysis:

1. Industry Challenges (specific to this business type):
   - Operations: Internal process inefficiencies
   - Sales: Revenue generation challenges  
   - Management: Leadership and strategic gaps
   - Customer Relations: Service and retention issues

2. Product Recommendations: Match 2-3 products from our catalog above to their specific pain points. Explain WHY each product fits.

   TIER RULES (judge size from industry, review volume, website sophistication):
   - **ENTERPRISE / MID-MARKET** industries (manufacturing, healthcare systems, logistics/warehousing, finance, insurance, professional services 50+ staff, franchises, multi-location retail, hospitals, schools, municipalities, distributors, construction firms, energy, oil & gas): The FIRST product recommendation MUST explicitly name **Power BI, Azure, Microsoft Copilot, and Power Apps** from **enterprise.crowell-randolph.com** (Microsoft Preferred Partner), also including Azure Data Lakes, Power Automate, and Power Pages where relevant. A SECOND MANDATORY recommendation MUST be **staff AI/Copilot/Power Platform training via aicourses.mycitymyschool.tech** with the TWC reimbursement angle ($1K per current employee / $2K per new hire) — this training offer is REQUIRED for every enterprise/mid-market prospect as the low-friction relationship-builder. Do NOT lead enterprise with AIBizPro.
   - **SMB / LOCAL** businesses: LEAD with AIBizPro (GoHighLevel, Smart Websites, Virtual Agents, AI Phone, Reputation Management) and cdmweb.store.

3. Sales Approach Strategy:
   - Best time to contact (based on industry patterns)
   - Opening pitch angle (for enterprise: open with staff training + TWC reimbursement, then expand to Power BI/Azure)
   - Key value proposition to lead with
   - Potential objections and responses

Return as JSON array:
[{
  "ai_insights": "2-3 sentence strategic overview",
  "pain_points": {
    "operations": ["specific challenge 1", "challenge 2"],
    "sales": ["specific challenge 1", "challenge 2"],
    "management": ["specific challenge 1", "challenge 2"],
    "customer_relations": ["specific challenge 1", "challenge 2"]
  },
  "suggested_products": [
    {"name": "Product Name", "reason": "Why this fits their needs"}
  ],
  "sales_strategy": {
    "best_contact_time": "Tuesday-Thursday 10am-11:30am (before lunch rush)",
    "opening_angle": "Lead with cost reduction data",
    "value_proposition": "Specific value statement",
    "handle_objections": ["Objection 1: Response", "Objection 2: Response"]
  }
}]`

      try {
        console.log(`Processing batch ${i / batchSize + 1} with Gemini + Grounding`)
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: 'You are an expert B2B sales strategist with deep knowledge of local business operations across all industries. Provide actionable, specific sales intelligence that helps close deals. Always recommend from the provided product catalog.' }]
              },
              contents: [{ parts: [{ text: batchPrompt }] }],
              tools: [{ google_search_retrieval: {} }],
              generationConfig: {
                maxOutputTokens: 6000,
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        if (response.ok) {
          const aiResponse = await response.json()
          const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || ''

          try {
            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              const enhancements = JSON.parse(jsonMatch[0])
              if (Array.isArray(enhancements)) {
                batch.forEach((lead: any, index: number) => {
                  const enhancement = enhancements[index]
                  if (enhancement) {
                    lead.ai_insights = enhancement.ai_insights || lead.ai_insights
                    lead.pain_points = enhancement.pain_points || {
                      operations: [],
                      sales: [],
                      management: [],
                      customer_relations: []
                    }
                    lead.suggested_products = enhancement.suggested_products?.map((p: any) => 
                      typeof p === 'string' ? p : `${p.name}: ${p.reason}`
                    ) || lead.suggested_products
                    lead.sales_strategy = enhancement.sales_strategy
                    lead.best_contact_time = enhancement.sales_strategy?.best_contact_time || lead.best_contact_time
                  }
                })
              }
            } else {
              console.warn('No valid JSON found in Gemini response')
            }
          } catch (parseError) {
            console.warn('Could not parse AI enhancements for batch:', parseError)
          }
        } else {
          const errorText = await response.text()
          console.warn('Gemini API request failed:', response.status, errorText)
        }
      } catch (batchError) {
        console.warn('AI enhancement failed for batch:', batchError)
      }

      enhancedLeads.push(...batch)
    }

    console.log(`Enhanced ${enhancedLeads.length} leads successfully with Gemini + Grounding`)

    return new Response(
      JSON.stringify({ enhancedLeads }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-insights function:', error)
    return new Response(
      JSON.stringify({ enhancedLeads: [], error: 'Failed to generate insights' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function addFallbackInsights(leads: any[], industryName: string): any[] {
  const lower = (industryName || '').toLowerCase();

  let products = [
    "AIBizPro GoHighLevel CRM: All-in-one CRM, sales pipelines, marketing automation & 2-way SMS (aibizpro.cdmweb.store)",
    "AIBizPro 24/7 AI Voice & Phone Agents: Conversational AI answering inbound calls & booking appointments 24/7 (aibizpro.cdmweb.store)",
    "CDMWeb.store: Custom software development, IT staffing & dedicated remote/AI developers (cdmweb.store)",
    "EnergyChoice.us: Commercial energy reduction (10-30% electric/gas savings in deregulated areas)",
    "Fractional VP of Sales: Outbound B2B prospecting, team management & sales pipeline strategy"
  ];

  if (lower.includes('software') || lower.includes('tech') || lower.includes('it ') || lower.includes('saas') || lower.includes('developer')) {
    products = [
      "CDMWeb.store: Custom software development & enterprise application engineering (cdmweb.store)",
      "CDMWeb.store: IT staffing, remote development teams & dedicated AI developers (cdmweb.store)",
      "AIBizPro GoHighLevel CRM: Automated B2B sales pipelines & inbound qualification (aibizpro.cdmweb.store)",
      "Fractional VP of Sales: Outbound B2B prospecting campaigns & sales team architecture"
    ];
  } else if (lower.includes('restaurant') || lower.includes('food') || lower.includes('hospitality') || lower.includes('hotel') || lower.includes('bar')) {
    products = [
      "EnergyChoice.us: Reduce commercial kitchen electric & gas costs 10-30% in deregulated markets (energychoice.us)",
      "AIBizPro 24/7 AI Phone & Text Agents: Phone ordering, table reservations & catering inquiries (aibizpro.cdmweb.store)",
      "AIBizPro Reputation & Social Media Management: Automated Google review growth & social posting (aibizpro.cdmweb.store)",
      "CDMWeb.store: Online ordering websites, mobile apps & digital branding (cdmweb.store)"
    ];
  } else if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('roof') || lower.includes('electric') || lower.includes('contract') || lower.includes('construction') || lower.includes('auto')) {
    products = [
      "AIBizPro 24/7 AI Phone Agents: Inbound emergency call answering & after-hours dispatch (aibizpro.cdmweb.store)",
      "AIBizPro GoHighLevel CRM: Instant SMS follow-ups, quote reminders & dispatch automation (aibizpro.cdmweb.store)",
      "CDMWeb.store: High-converting contractor website, landing pages & local SEO (cdmweb.store)",
      "EnergyChoice.us: Commercial utility cost reduction for shops & yards (10-30% savings)"
    ];
  }

  return leads.map(lead => ({
    ...lead,
    ai_insights: `${lead.company_name} is a ${industryName} business with strong potential for growth through AI communication automation, energy cost reduction, and modern software scaling.`,
    pain_points: {
      operations: ["Manual administrative tasks & missed customer inquiries", "Commercial utility & software operating costs"],
      sales: ["Inconsistent outbound lead generation", "Slow speed-to-lead on inbound prospects"],
      management: ["Sales pipeline tracking & team accountability", "Engineering or IT staffing capacity constraints"],
      customer_relations: ["After-hours customer inquiries going to voicemail", "Google review acquisition and reputation management"]
    },
    suggested_products: products,
    sales_strategy: {
      best_contact_time: "Tuesday-Thursday 10am-2pm",
      opening_angle: "Lead with eliminating missed customer calls with 24/7 AI voice agents and commercial energy savings",
      value_proposition: "Automate lead capture, cut operating overhead by 10-30%, and scale software capabilities",
      handle_objections: ["Budget concerns: Offer commercial energy audit savings to fund AI tools", "Timing: Deploy quick-win 24/7 phone agent in under 48 hours"]
    },
    best_contact_time: "Tuesday-Thursday 10am-2pm"
  }));
}

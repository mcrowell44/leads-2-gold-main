import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRODUCT_CATALOG = {
  reputation: {
    name: "Reputation Management",
    description: "AI-powered Google review response system for present and past reviews, plus outreach to database for past customer reviews",
    bestFor: ["active Google reviews", "review response automation", "customer feedback management", "reputation building", "past customer outreach"],
    priority: "High priority for businesses with active Google reviews"
  },
  smartWebsites: {
    name: "Smart Websites",
    description: "Automated websites with marketing, social engagement, lead capture, nurturing, web design, CRM, and advertising - all automated",
    bestFor: ["no website", "low Google activity", "lead capture", "marketing automation", "social engagement", "web design", "CRM integration", "advertising"],
    priority: "High priority for businesses without website or low activity on Google page"
  },
  energy: {
    name: "EnergyChoice.us",
    description: "Energy procurement and cost reduction solutions",
    bestFor: ["high energy costs", "utility management", "sustainability goals"]
  },
  cdmweb: {
    name: "CDMWeb.store",
    description: "Professional web development, e-commerce, SEO optimization, and digital branding hub",
    bestFor: ["web development", "e-commerce", "SEO", "digital branding", "online storefront"]
  },
  aibizpro: {
    name: "AIBizPro (aibizpro.cdmweb.store)",
    description: "AI-powered business solutions: GoHighLevel CRM, Smart Websites, Virtual AI Agents, AI Phone Agents, Reputation Management, Voice & Conversation Agents",
    bestFor: ["lead generation", "online visibility", "social media", "CRM", "marketing automation", "reputation management", "AI agents", "voice agents", "conversation agents"]
  },
  insurance: {
    name: "agentdunn.cdmweb.store",
    description: "Insurance solutions and risk management",
    bestFor: ["liability coverage", "business insurance", "risk mitigation"]
  },
  sports: {
    name: "play44sports.com",
    description: "Sports equipment and athletic supplies",
    bestFor: ["fitness centers", "sports facilities", "athletic programs"]
  },
  recruiting: {
    name: "play44recruiting.site",
    description: "Recruiting and talent acquisition platform",
    bestFor: ["hiring challenges", "staffing needs", "talent pipeline"]
  },
  voiceAgents: {
    name: "AIBizPro Voice & Conversation Agents",
    description: "AI-powered voice and conversation agents through GoHighLevel for 24/7 customer engagement, lead qualification, and appointment booking",
    bestFor: ["missed calls", "after-hours engagement", "lead qualification", "appointment booking", "customer follow-up"]
  },
  crm: {
    name: "GoHighLevel",
    description: "All-in-one CRM and marketing automation platform",
    bestFor: ["customer retention", "marketing automation", "appointment scheduling", "reputation management"]
  },
  powerPlatform: {
    name: "Microsoft Power Platform & Azure (enterprise.crowell-randolph.com)",
    description: "Microsoft Preferred Partner delivering Power BI, Azure cloud, Microsoft Copilot, Azure Data Lakes, Power Apps, Power Pages, and Power Automate with hands-on training and implementation",
    bestFor: ["business intelligence", "data analytics", "Microsoft 365 shops", "legacy system modernization", "spreadsheet chaos", "internal apps", "external portals", "Copilot rollout", "data lakes"]
  },
  uniscan: {
    name: "UniScan (uniscan.crowell-randolph.com)",
    description: "Uniform ordering platform and digital company onboarding for uniformed workforces and high-turnover businesses",
    bestFor: ["uniform ordering", "employee onboarding", "restaurants", "retail", "hospitality", "healthcare", "construction", "franchises", "high turnover"]
  },
  aiCourses: {
    name: "AI Courses via MyCityMySchool (aicourses.mycitymyschool.tech)",
    description: "Employee AI, Copilot, and automation training with certifications - eligible for Texas Workforce Commission reimbursement up to $1,000 per current employee and $2,000 per new hire that completes certification",
    bestFor: ["employee training", "AI upskilling", "Texas employers", "TWC reimbursement", "workforce development", "new hire training", "certification programs"]
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
  return leads.map(lead => ({
    ...lead,
    ai_insights: `${lead.company_name} is a ${industryName} business with potential for growth through digital transformation and operational efficiency improvements.`,
    pain_points: {
      operations: ["Manual processes slowing productivity", "Outdated systems needing upgrade"],
      sales: ["Inconsistent lead flow", "Low online visibility"],
      management: ["Difficulty tracking performance metrics", "Staff coordination challenges"],
      customer_relations: ["Review management needs improvement", "Customer follow-up gaps"]
    },
    suggested_products: [
      "AIBizPro GoHighLevel CRM: All-in-one CRM, marketing automation, and reputation management (aibizpro.cdmweb.store)",
      "AIBizPro Voice & Conversation Agents: 24/7 AI-powered customer engagement & lead qualification (aibizpro.cdmweb.store)",
      "CDMWeb.store: Professional web development, SEO, and digital branding"
    ],
    sales_strategy: {
      best_contact_time: "Tuesday-Thursday 10am-2pm",
      opening_angle: "Lead with efficiency gains and ROI",
      value_proposition: "Help them save time and grow revenue",
      handle_objections: ["Budget concerns: Offer ROI calculator", "Timing: Start with quick wins"]
    },
    best_contact_time: "Tuesday-Thursday 10am-2pm"
  }));
}

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
    const { industryName, location, count } = await req.json()
    console.log(`Generating ${count} leads for ${industryName} in ${location}`)

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ leads: [], error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const prompt = `Generate ${count} real business leads for the ${industryName} industry in ${location}.

Use Google Search grounding to find REAL businesses that actually exist in this area.

Return as JSON array with exactly ${count} items. Each item must include:
- company_name
- contact_name (owner or manager name)
- website (if known)
- email (if known)
- phone (if known)
- address
- city
- state
- zip_code
- rating (Google rating 1-5)
- user_ratings_total (number of reviews)

Return valid JSON array only.`

    console.log('Calling Gemini API with Google Search Grounding for leads generation')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search_retrieval: {} }],
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status}`, errorText)
      return new Response(
        JSON.stringify({ leads: [], error: 'Gemini lead generation failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const aiResponse = await response.json()
    const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || ''

    let leads
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        leads = JSON.parse(jsonMatch[0])
      } else {
        leads = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text?.substring(0, 500))
      return new Response(
        JSON.stringify({ leads: [], error: 'Failed to parse Gemini response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(leads)) {
      return new Response(
        JSON.stringify({ leads: [], error: 'Invalid Gemini response format' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const processedLeads = leads.map((lead: any) => ({
      ...lead,
      industry_name: industryName,
      lead_source: 'gemini_grounded'
    }))

    console.log(`Generated ${processedLeads.length} leads successfully with Gemini + Grounding`)

    return new Response(
      JSON.stringify({ leads: processedLeads }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-leads function:', error)
    return new Response(
      JSON.stringify({ leads: [], error: 'Failed to generate leads' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

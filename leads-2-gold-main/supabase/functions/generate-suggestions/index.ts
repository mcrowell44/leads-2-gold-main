import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Digital agency CRM-focused product suggestions (fallback)
const digitalAgencyProducts = [
  "Lead Generation Tools - Multi-channel prospect identification and capture",
  "CRM Management Platform - Lead tracking and customer relationship management",
  "Sales Analytics Dashboard - Performance tracking and conversion optimization",
  "Customer Support Software - Helpdesk and ticket management system",
];

const digitalAgencyServices = [
  "Customer Journey Mapping - Touchpoint analysis and optimization",
  "Training & Support - Team onboarding and ongoing assistance",
  "Marketing Campaign Management - Multi-channel campaign execution",
  "Integration Services - Connect CRM with existing business tools",
];

async function callXAIWithRetry(xaiApiKey: string, industryName: string, maxRetries = 2): Promise<Response> {
  const systemPrompt = `You are a digital agency consultant specializing in CRM management and lead generation. Always return valid JSON only. Focus on digital marketing, CRM solutions, and sales optimization services.`;
  
  const userPrompt = `Generate 4-5 specific product and service suggestions for businesses in the "${industryName}" industry, focusing on digital agency services with CRM management.\n\nFocus on:\n- CRM and sales management tools they need\n- Digital marketing and lead generation services\n- Customer relationship optimization solutions\n- Make suggestions practical and specific to the industry\n\nReturn as JSON with this exact structure:\n{"products": ["product1", "product2", "product3"], "services": ["service1", "service2", "service3"]}`;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2048,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industryName } = await req.json();

    const xaiApiKey = Deno.env.get('XAI_API_KEY');

    if (!xaiApiKey) {
      console.log('XAI_API_KEY not configured, returning fallback suggestions');
      return new Response(JSON.stringify({ products: digitalAgencyProducts, services: digitalAgencyServices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling xAI API for suggestions:', industryName);

    let response: Response;
    try {
      response = await callXAIWithRetry(xaiApiKey, industryName);
    } catch (fetchError) {
      console.error('All retry attempts failed:', fetchError);
      // Return fallback instead of 500
      return new Response(JSON.stringify({ products: digitalAgencyProducts, services: digitalAgencyServices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`xAI API error: ${response.status} ${response.statusText}`, errorText);
      return new Response(JSON.stringify({ products: digitalAgencyProducts, services: digitalAgencyServices }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    let suggestions;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(text);
      }
    } catch (_) {
      console.log('Failed to parse AI response, using fallback');
      suggestions = { products: digitalAgencyProducts, services: digitalAgencyServices };
    }

    if (!suggestions.products || suggestions.products.length === 0) {
      suggestions.products = digitalAgencyProducts;
    }
    if (!suggestions.services || suggestions.services.length === 0) {
      suggestions.services = digitalAgencyServices;
    }

    console.log('Suggestions generated successfully');

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-suggestions function:', error);
    // Return fallback instead of 500 error
    return new Response(JSON.stringify({ products: digitalAgencyProducts, services: digitalAgencyServices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

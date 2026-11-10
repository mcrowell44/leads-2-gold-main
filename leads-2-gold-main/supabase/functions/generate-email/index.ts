import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XAI_API_KEY = Deno.env.get('XAI_API_KEY');

interface EmailRequest {
  companyName: string;
  industryName: string;
  location?: string;
  painPoints?: string[];
  suggestedProducts?: string[];
  senderName?: string;
  senderCompany?: string;
  emailTone?: 'professional' | 'friendly' | 'casual';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json() as EmailRequest;

    if (!data.companyName || !data.industryName) {
      return new Response(
        JSON.stringify({ error: 'Company name and industry are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!XAI_API_KEY) {
      console.log('XAI_API_KEY not configured, using fallback email');
      const fallbackEmail = generateFallbackEmail(data);
      return new Response(
        JSON.stringify({ success: true, email: fallbackEmail }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tone = data.emailTone || 'professional';
    const painPointsText = data.painPoints?.join(', ') || 'business challenges';
    const productsText = data.suggestedProducts?.join(', ') || 'business solutions';

    const prompt = `Generate a personalized cold outreach email for B2B sales.

Target Company: ${data.companyName}
Industry: ${data.industryName}
Location: ${data.location || 'Not specified'}
Their Likely Pain Points: ${painPointsText}
Solutions We Offer: ${productsText}
Sender Name: ${data.senderName || '[Your Name]'}
Sender Company: ${data.senderCompany || '[Your Company]'}
Email Tone: ${tone}

Requirements:
1. Keep it under 150 words
2. Personalize based on their industry and location
3. Reference a specific pain point
4. Include a clear call-to-action
5. Make it feel genuine, not templated
6. Suggest a specific meeting time (e.g., "15 minutes this week")

Generate ONLY the email body, no subject line. Start directly with the greeting.`;

    console.log('Generating email for:', data.companyName);

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert B2B sales copywriter who writes personalized, high-converting cold emails. Be concise and genuine.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('xAI API error:', response.status, errorText);
      const fallbackEmail = generateFallbackEmail(data);
      return new Response(
        JSON.stringify({ success: true, email: fallbackEmail }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const email = result.choices?.[0]?.message?.content || generateFallbackEmail(data);

    console.log('Email generated successfully');

    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating email:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackEmail(data: EmailRequest): string {
  return `Hi there,

I came across ${data.companyName} while researching ${data.industryName} businesses in ${data.location || 'your area'}, and I wanted to reach out.

Many companies in your industry are dealing with challenges around ${data.painPoints?.[0] || 'customer acquisition and operational efficiency'}. We've helped similar businesses address these issues with solutions like ${data.suggestedProducts?.[0] || 'CRM management and marketing automation'}.

I'd love to share some insights that might be valuable for your team. Would you have 15 minutes this week for a quick call?

Looking forward to connecting.

Best regards,
${data.senderName || '[Your Name]'}
${data.senderCompany || '[Your Company]'}`;
}

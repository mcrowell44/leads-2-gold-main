import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  recipientName?: string;
  companyName?: string;
  industry?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('N8N_EMAIL_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.error('N8N_EMAIL_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Email webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending email via n8n to: ${payload.to}`);

    const n8nPayload = {
      type: 'email_send',
      timestamp: new Date().toISOString(),
      source: 'lead-prospector',
      email: {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        html: payload.body.replace(/\n/g, '<br>'),
        recipientName: payload.recipientName || '',
        companyName: payload.companyName || '',
        industry: payload.industry || ''
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    const responseText = await response.text();
    console.log(`n8n response status: ${response.status}`);
    console.log(`n8n response: ${responseText.substring(0, 200)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: response.status,
        message: 'Email sent via n8n successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email via n8n:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

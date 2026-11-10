import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  webhookUrl: string;
  webhookType: 'crm_export' | 'email_campaign' | 'notification' | 'lead_enrichment';
  data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { webhookUrl, webhookType, data } = await req.json() as WebhookPayload;

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Triggering ${webhookType} webhook:`, webhookUrl);

    const payload = {
      type: webhookType,
      timestamp: new Date().toISOString(),
      source: 'lead-prospector',
      data: data
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // n8n webhooks may return various status codes
    const responseText = await response.text();
    
    console.log(`Webhook response status: ${response.status}`);
    console.log(`Webhook response: ${responseText.substring(0, 200)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: response.status,
        message: 'Webhook triggered successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error triggering webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to trigger webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

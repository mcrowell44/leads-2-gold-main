import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipients: string[];
  subject: string;
  content: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, content }: EmailRequest = await req.json();

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients provided");
    }

    if (!subject || !content) {
      throw new Error("Subject and content are required");
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    const results = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const emailResponse = await resend.emails.send({
        from: "Leads 2 Gold <marcus@play44sports.com>",
        to: batch,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Leads 2 Gold</h1>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #666; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Leads 2 Gold. All rights reserved.</p>
              <p>You received this email because you signed up for our service.</p>
            </div>
          </div>
        `,
      });

      results.push(emailResponse);
    }

    console.log(`Successfully sent ${recipients.length} emails`);

    return new Response(
      JSON.stringify({ success: true, sent: recipients.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending admin email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

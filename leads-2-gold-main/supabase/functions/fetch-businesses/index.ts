import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Business {
  place_id: string;
  name: string;
  formatted_address?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  phone?: string;
  website?: string;
  email?: string;
  google_maps_url?: string;
  opening_hours?: { open_now?: boolean };
  operating_hours?: Record<string, string>;
  geometry?: { location?: { lat: number; lng: number } };
  owner_name?: string;
  owner_linkedin_url?: string;
  owner_email?: string;
  busy_times?: Record<string, any>;
  linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { industryName, location, limit = 20 } = await req.json();

    const queryIndustry = String(industryName || "").trim();
    const queryLocation = String(location || "").trim();
    const requestedLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

    if (!queryIndustry) {
      return new Response(JSON.stringify({ businesses: [], error: "industryName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return new Response(JSON.stringify({ businesses: [], error: "Gemini API is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching ${requestedLimit} ${queryIndustry} businesses in ${queryLocation || 'the area'} using Gemini with Google Search Grounding`);

    const prompt = `Find ${requestedLimit} real ${queryIndustry} businesses${queryLocation ? ` in ${queryLocation}` : ''}.

CRITICAL REQUIREMENTS - USE GOOGLE SEARCH GROUNDING TO FIND ALL OF THIS:
1. Return ONLY REAL businesses that actually exist - verify via Google Search
2. PHONE NUMBER IS CRITICAL - get the REAL phone number from their Google Business Profile page or their website. Every business listing on Google has a phone number - find it.
3. EMAIL - find real contact email from their website contact page, Google Business Profile, or business directories
4. GOOGLE BUSINESS PROFILE - provide the actual Google Maps/Business URL for each business
5. GOOGLE RATING & REVIEWS - get the REAL Google star rating (1-5) and EXACT number of Google reviews from their Google Business Profile
6. REAL ADDRESS - get the actual street address from Google Business Profile
7. WEBSITE - get their real website URL from Google Business Profile
8. SOCIAL MEDIA - search for the business's REAL social media profiles:
   - Instagram: search for their Instagram handle/page
   - Facebook: search for their Facebook business page
   - LinkedIn: search for their LinkedIn company page
   - X/Twitter: search for their Twitter/X handle
9. OWNER/CONTACT NAME - find the owner or manager name from LinkedIn, their website "About" page, or Google Business Profile
10. BUSY TIMES - Get the REAL "Popular Times" / busy hours data from their Google Business Profile. This shows when customers actually visit throughout their REAL operating hours (not generic 9-5). Include data for each day they're open, covering their actual hours of operation. The values should represent relative busyness (1-10 scale) for each hour they are open.

Return ONLY a valid JSON array with no additional text. Each object must have:
{
  "name": "Actual Business Name",
  "owner_name": "Real Owner Name from LinkedIn or Website",
  "owner_linkedin_url": "https://linkedin.com/in/real-owner-profile",
  "owner_email": "owner@realbusiness.com",
  "formatted_address": "123 Real Street, City, ST 12345",
  "phone": "(555) 123-4567 from Google Business Profile",
  "website": "https://www.realbusiness.com",
  "email": "info@realbusiness.com",
  "rating": 4.5,
  "user_ratings_total": 127,
  "google_maps_url": "https://www.google.com/maps/place/...",
  "operating_hours": {
    "Monday": "8:00 AM - 6:00 PM",
    "Tuesday": "8:00 AM - 6:00 PM",
    "Wednesday": "8:00 AM - 6:00 PM",
    "Thursday": "8:00 AM - 6:00 PM",
    "Friday": "8:00 AM - 5:00 PM",
    "Saturday": "9:00 AM - 2:00 PM",
    "Sunday": "Closed"
  },
  "busy_times": {
    "Monday": {"hours": ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"], "values": [2,4,6,8,9,7,8,9,6,4,2]},
    "Tuesday": {"hours": ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"], "values": [3,5,7,8,9,6,7,8,5,3,2]},
    "Wednesday": {"hours": ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"], "values": [2,4,6,7,8,6,7,8,5,3,2]},
    "Thursday": {"hours": ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"], "values": [3,5,7,8,9,7,8,9,6,4,2]},
    "Friday": {"hours": ["8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM"], "values": [4,6,8,9,8,6,5,4,3,2]},
    "Saturday": {"hours": ["9AM","10AM","11AM","12PM","1PM","2PM"], "values": [3,5,7,8,6,3]}
  },
  "linkedin_url": "https://linkedin.com/company/realbusiness",
  "instagram_url": "https://instagram.com/realbusiness",
  "facebook_url": "https://facebook.com/realbusiness",
  "twitter_url": "https://x.com/realbusiness"
}

IMPORTANT:
- The busy_times should reflect REAL Google Popular Times data matching their ACTUAL operating hours, NOT a generic 9-5 pattern
- Low busy_times values = IDEAL time to call (the business is less busy with customers)
- High busy_times values = business is slammed, worst time to call
- Phone number MUST come from their actual Google Business listing or website - do NOT leave blank
- Social media URLs should be REAL verified profiles, not guesses. Leave null if not found.
Return exactly ${requestedLimit} businesses from ${queryLocation || 'the specified area'}.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search_retrieval: {} }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ businesses: [], error: `Business search failed (${response.status}).` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("Gemini API response received, parsing businesses...");

    let businesses: Business[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        businesses = parsed.map((b: any, index: number) => ({
          place_id: `gemini_${Date.now()}_${index}`,
          name: b.name || `${queryIndustry} Business ${index + 1}`,
          owner_name: b.owner_name || null,
          owner_linkedin_url: b.owner_linkedin_url || null,
          owner_email: b.owner_email || null,
          formatted_address: b.formatted_address || b.address,
          address: b.formatted_address || b.address,
          phone: b.phone,
          website: b.website,
          email: b.email,
          rating: typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 4.0,
          user_ratings_total: typeof b.user_ratings_total === 'number' ? b.user_ratings_total : parseInt(b.user_ratings_total) || 50,
          google_maps_url: b.google_maps_url || (b.formatted_address ? `https://www.google.com/maps/search/${encodeURIComponent(b.name + ' ' + b.formatted_address)}` : undefined),
          opening_hours: { open_now: b.open_now ?? true },
          operating_hours: b.operating_hours || null,
          geometry: { location: { lat: 0, lng: 0 } },
          busy_times: b.busy_times || null,
          linkedin_url: b.linkedin_url || null,
          instagram_url: b.instagram_url || null,
          facebook_url: b.facebook_url || null,
          twitter_url: b.twitter_url || null
        }));
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw content:", content.substring(0, 500));
    }

    if (businesses.length === 0) {
      console.log("Gemini parsing failed, returning empty result");
      return new Response(
        JSON.stringify({ businesses: [], error: "Business search returned no parsable results." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Returning ${businesses.length} businesses from Gemini with Google Search Grounding`);

    return new Response(JSON.stringify({ businesses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-businesses function:", error);
    return new Response(JSON.stringify({ businesses: [], error: "Failed to fetch business data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

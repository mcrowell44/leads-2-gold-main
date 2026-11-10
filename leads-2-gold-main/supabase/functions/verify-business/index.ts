import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { businessName, website, googleMapsUrl, location } = await req.json();

    if (!businessName) {
      return new Response(JSON.stringify({ success: false, error: "businessName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Verifying business: ${businessName}`);

    const verified: Record<string, any> = {};

    // Helper to call Firecrawl scrape
    const scrapeUrl = async (url: string, opts?: Record<string, any>) => {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "links"], onlyMainContent: false, waitFor: 3000, ...opts }),
      });
      if (!res.ok) return null;
      const d = await res.json();
      return {
        markdown: d.data?.markdown || d.markdown || "",
        links: d.data?.links || d.links || [],
        metadata: d.data?.metadata || d.metadata || {},
      };
    };

    // Helper to extract data from text
    const extractFromText = (text: string, links: string[] = []) => {
      const result: Record<string, any> = {};
      const allText = text + " " + links.join(" ");

      // Phone numbers
      const phoneMatches = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
      if (phoneMatches) {
        for (const pm of phoneMatches) {
          const digits = pm.replace(/\D/g, "");
          if (digits.length === 10) {
            result.phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            break;
          }
        }
      }

      // Emails
      const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatches) {
        const contactEmails = emailMatches.filter(
          (e: string) => !/sentry|example|noreply|webpack|wixpress|placeholder|test@/i.test(e)
        );
        if (contactEmails.length > 0) result.email = contactEmails[0];
      }

      // Social media
      const igMatch = allText.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/);
      const fbMatch = allText.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+/);
      const liMatch = allText.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/);
      const twMatch = allText.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/);

      if (igMatch) result.instagram_url = igMatch[0];
      if (fbMatch) result.facebook_url = fbMatch[0];
      if (liMatch) result.linkedin_url = liMatch[0];
      if (twMatch) result.twitter_url = twMatch[0];

      // Website link from links array (look for business's own domain in links)
      for (const link of links) {
        if (/^https?:\/\/(?!www\.google|www\.facebook|www\.instagram|www\.linkedin|twitter\.com|x\.com|www\.yelp|maps\.google)/.test(link)) {
          if (!result.website) result.website = link;
        }
      }

      // Google Maps URL
      const mapsMatch = allText.match(/https?:\/\/(?:www\.)?google\.com\/maps\/place\/[^\s"')]+/);
      if (mapsMatch) result.google_maps_url = mapsMatch[0];

      // Also check for maps.google.com format
      const mapsMatch2 = allText.match(/https?:\/\/maps\.google\.com\/[^\s"')]+/);
      if (!result.google_maps_url && mapsMatch2) result.google_maps_url = mapsMatch2[0];

      // Rating patterns
      const ratingMatch = text.match(
        /(?:rating|rated|stars?)[\s:]*(\d+\.?\d?)\s*(?:\/\s*5)?(?:\s*\(?\s*(\d[\d,]*)\s*(?:reviews?|ratings?)\s*\)?)?/i
      );
      if (ratingMatch) {
        const r = parseFloat(ratingMatch[1]);
        if (r >= 1 && r <= 5) result.rating = r;
        if (ratingMatch[2]) result.user_ratings_total = parseInt(ratingMatch[2].replace(/,/g, ""), 10);
      }
      if (!result.rating) {
        const altMatch = text.match(/(\d\.\d)\s*(?:·|•|\|)\s*(\d[\d,]*)\s*(?:reviews?|ratings?)/i);
        if (altMatch) {
          result.rating = parseFloat(altMatch[1]);
          result.user_ratings_total = parseInt(altMatch[2].replace(/,/g, ""), 10);
        }
      }

      return result;
    };

    // 1) Scrape the business website for phone/email/social/links
    if (website) {
      try {
        console.log("Scraping website:", website);
        const data = await scrapeUrl(website);
        if (data) {
          const extracted = extractFromText(data.markdown, data.links);
          if (extracted.phone) { verified.phone = extracted.phone; verified.phone_source = "website"; }
          if (extracted.email) { verified.email = extracted.email; verified.email_source = "website"; }
          if (extracted.instagram_url) verified.instagram_url = extracted.instagram_url;
          if (extracted.facebook_url) verified.facebook_url = extracted.facebook_url;
          if (extracted.linkedin_url) verified.linkedin_url = extracted.linkedin_url;
          if (extracted.twitter_url) verified.twitter_url = extracted.twitter_url;
          
          // Also try scraping the /contact page for more info
          try {
            let baseUrl = website.trim();
            if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
            const contactUrl = new URL("/contact", baseUrl).href;
            console.log("Scraping contact page:", contactUrl);
            const contactData = await scrapeUrl(contactUrl);
            if (contactData) {
              const contactExtracted = extractFromText(contactData.markdown, contactData.links);
              if (!verified.phone && contactExtracted.phone) { verified.phone = contactExtracted.phone; verified.phone_source = "website_contact"; }
              if (!verified.email && contactExtracted.email) { verified.email = contactExtracted.email; verified.email_source = "website_contact"; }
              if (!verified.instagram_url && contactExtracted.instagram_url) verified.instagram_url = contactExtracted.instagram_url;
              if (!verified.facebook_url && contactExtracted.facebook_url) verified.facebook_url = contactExtracted.facebook_url;
              if (!verified.linkedin_url && contactExtracted.linkedin_url) verified.linkedin_url = contactExtracted.linkedin_url;
              if (!verified.twitter_url && contactExtracted.twitter_url) verified.twitter_url = contactExtracted.twitter_url;
            }
          } catch (_) { /* contact page may not exist */ }

          console.log("Website scrape extracted:", Object.keys(verified).join(", "));
        }
      } catch (e) {
        console.error("Website scrape failed:", e);
      }
    }

    // 2) Scrape Google Maps/Business Profile page directly
    if (googleMapsUrl) {
      try {
        console.log("Scraping Google Maps URL:", googleMapsUrl);
        const gbpData = await scrapeUrl(googleMapsUrl, { waitFor: 5000 });
        if (gbpData) {
          const gbpExtracted = extractFromText(gbpData.markdown, gbpData.links);
          if (!verified.phone && gbpExtracted.phone) { verified.phone = gbpExtracted.phone; verified.phone_source = "google_business"; }
          if (!verified.email && gbpExtracted.email) { verified.email = gbpExtracted.email; verified.email_source = "google_business"; }
          if (!verified.website && gbpExtracted.website) { verified.website = gbpExtracted.website; verified.website_source = "google_business"; }
          if (!verified.rating && gbpExtracted.rating) { verified.rating = gbpExtracted.rating; verified.rating_source = "google_business"; }
          if (!verified.user_ratings_total && gbpExtracted.user_ratings_total) { verified.user_ratings_total = gbpExtracted.user_ratings_total; verified.reviews_source = "google_business"; }
          if (!verified.instagram_url && gbpExtracted.instagram_url) verified.instagram_url = gbpExtracted.instagram_url;
          if (!verified.facebook_url && gbpExtracted.facebook_url) verified.facebook_url = gbpExtracted.facebook_url;
          if (!verified.linkedin_url && gbpExtracted.linkedin_url) verified.linkedin_url = gbpExtracted.linkedin_url;
          verified.google_maps_url = googleMapsUrl;
          console.log("GBP scrape extracted:", Object.keys(gbpExtracted).join(", "));
        }
      } catch (e) {
        console.error("Google Maps scrape failed:", e);
      }
    }

    // 3) Firecrawl search to fill remaining gaps (website, email, GBP link, rating)
    const missingFields = [];
    if (!verified.website) missingFields.push("website");
    if (!verified.email) missingFields.push("email");
    if (!verified.google_maps_url) missingFields.push("google business profile");
    if (!verified.rating) missingFields.push("google rating reviews");
    if (!verified.phone) missingFields.push("phone number");

    if (missingFields.length > 0) {
      try {
        const searchQuery = `"${businessName}" ${location || ""} ${missingFields.join(" ")}`;
        console.log("Searching for missing info:", searchQuery);

        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            limit: 5,
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData.data || [];

          for (const result of results) {
            const text = (result.markdown || "") + " " + (result.description || "") + " " + (result.url || "");

            // Extract website - check if a search result URL is the business's own site
            if (!verified.website && result.url) {
              const url = result.url as string;
              const isBizSite = !/google\.com|yelp\.com|facebook\.com|instagram\.com|linkedin\.com|yellowpages|bbb\.org|mapquest|tripadvisor/i.test(url);
              if (isBizSite && (result.title || "").toLowerCase().includes(businessName.toLowerCase().split(" ")[0])) {
                verified.website = url;
                verified.website_source = "firecrawl_search";
              }
            }

            // Extract Google Maps URL
            if (!verified.google_maps_url) {
              const mapsMatch = text.match(/https?:\/\/(?:www\.)?google\.com\/maps\/place\/[^\s"')]+/);
              if (mapsMatch) { verified.google_maps_url = mapsMatch[0]; verified.google_maps_source = "firecrawl_search"; }
            }

            // Extract email from search results
            if (!verified.email) {
              const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
              if (emailMatches) {
                const good = emailMatches.filter((e: string) => !/sentry|example|noreply|webpack|wixpress|placeholder|test@/i.test(e));
                if (good.length > 0) { verified.email = good[0]; verified.email_source = "firecrawl_search"; }
              }
            }

            // Rating & reviews
            if (!verified.rating) {
              const ratingMatch = text.match(/(?:rating|rated|stars?)[\s:]*(\d+\.?\d?)\s*(?:\/\s*5)?(?:\s*\(?\s*(\d[\d,]*)\s*(?:reviews?|ratings?)\s*\)?)?/i);
              if (ratingMatch) {
                const r = parseFloat(ratingMatch[1]);
                if (r >= 1 && r <= 5) { verified.rating = r; verified.rating_source = "firecrawl_search"; }
                if (ratingMatch[2]) { verified.user_ratings_total = parseInt(ratingMatch[2].replace(/,/g, ""), 10); verified.reviews_source = "firecrawl_search"; }
              }
            }
            if (!verified.rating) {
              const altMatch = text.match(/(\d\.\d)\s*(?:·|•|\|)\s*(\d[\d,]*)\s*(?:reviews?|ratings?)/i);
              if (altMatch) {
                verified.rating = parseFloat(altMatch[1]);
                verified.user_ratings_total = parseInt(altMatch[2].replace(/,/g, ""), 10);
                verified.rating_source = "firecrawl_search";
                verified.reviews_source = "firecrawl_search";
              }
            }

            // Phone
            if (!verified.phone) {
              const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
              if (phoneMatch) {
                const digits = phoneMatch[0].replace(/\D/g, "");
                if (digits.length === 10) {
                  verified.phone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                  verified.phone_source = "firecrawl_search";
                }
              }
            }
          }
        }
        console.log("Search extracted:", Object.keys(verified).filter(k => !k.includes("source")).join(", "));
      } catch (e) {
        console.error("Firecrawl search failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, verified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-business:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  user_ratings_total?: number;
  google_maps_url?: string;
  opening_hours?: { open_now?: boolean };
  description?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { industryName, location, limit = 20 } = await req.json();

    if (!industryName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Industry name is required', businesses: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured', businesses: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query for local businesses - exclude directories
    const searchQuery = `${industryName} ${location ? `in ${location}` : ''} -site:yelp.com -site:yellowpages.com -site:angi.com -site:thumbtack.com -site:bbb.org -site:mapquest.com -site:tripadvisor.com -site:homeadvisor.com`;
    console.log('Firecrawl searching for:', searchQuery);

    // Use Firecrawl Search API to find businesses
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: Math.min(limit * 2, 50), // Request more to filter later
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}`, businesses: [] }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Firecrawl search returned', data.data?.length || 0, 'results');

    // Parse search results into business format
    const businesses: BusinessResult[] = [];
    const results = data.data || [];

    for (let i = 0; i < results.length && businesses.length < limit; i++) {
      const result = results[i];
      
      // Extract business info from search result
      const business = extractBusinessFromResult(result, i, industryName, location);
      if (business && business.name) {
        businesses.push(business);
      }
    }

    // If Firecrawl didn't return enough results, try to extract more from scraped content
    if (businesses.length < limit && results.length > 0) {
      console.log('Attempting to extract more businesses from scraped content...');
      
      for (const result of results) {
        if (businesses.length >= limit) break;
        
        const extracted = extractBusinessesFromMarkdown(result.markdown, industryName, location, businesses.length);
        for (const biz of extracted) {
          if (businesses.length >= limit) break;
          if (!businesses.some(b => b.name.toLowerCase() === biz.name.toLowerCase())) {
            businesses.push(biz);
          }
        }
      }
    }

    console.log(`Returning ${businesses.length} businesses from Firecrawl search`);

    return new Response(
      JSON.stringify({ success: true, businesses }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in firecrawl-business-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, businesses: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractBusinessFromResult(result: any, index: number, industry: string, location: string): BusinessResult | null {
  try {
    const title = result.title || '';
    const url = result.url || '';
    const description = result.description || '';
    const markdown = result.markdown || '';
    
    // Skip directory, listing, and platform sites - only keep actual business sites
    const skipPatterns = [
      /yelp\.com/i,
      /yellowpages\.com/i,
      /indeed\.com/i,
      /glassdoor\.com/i,
      /linkedin\.com/i,
      /wikipedia\.org/i,
      /facebook\.com/i,
      /instagram\.com/i,
      /twitter\.com/i,
      /x\.com/i,
      /angi\.com/i,
      /angieslist\.com/i,
      /homeadvisor\.com/i,
      /thumbtack\.com/i,
      /bbb\.org/i,
      /mapquest\.com/i,
      /tripadvisor\.com/i,
      /nextdoor\.com/i,
      /manta\.com/i,
      /chamberofcommerce\.com/i,
      /foursquare\.com/i,
      /superpages\.com/i,
      /citysearch\.com/i,
      /merchantcircle\.com/i,
      /hotfrog\.com/i,
      /brownbook\.net/i,
      /expertise\.com/i,
      /bark\.com/i,
      /houzz\.com/i,
      /porch\.com/i,
      /buildzoom\.com/i,
      /google\.com\/maps/i,
      /maps\.google\.com/i,
      /crunchbase\.com/i,
      /bloomberg\.com/i,
      /zoominfo\.com/i,
      /dnb\.com/i,
      /buzzfile\.com/i,
    ];
    
    if (skipPatterns.some(pattern => pattern.test(url))) {
      return null;
    }
    
    // Try to extract business name from title
    let name = title
      .replace(/\s*[-|–]\s*.*$/, '') // Remove " - Website Name" suffix
      .replace(/\s*\|.*$/, '')
      .trim();
    
    // Skip if name is too generic or empty
    if (!name || name.length < 3 || name.toLowerCase().includes('search')) {
      return null;
    }
    
    const allText = markdown + ' ' + description;
    const allLinks = (result.links || []) as string[];
    const allContent = allText + ' ' + allLinks.join(' ');
    
    // Extract phone from markdown or description
    const phoneMatch = allText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? formatPhone(phoneMatch[0]) : undefined;
    
    // Extract address patterns
    const addressMatch = allText.match(
      /\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Lane|Ln|Ct|Court|Pkwy|Parkway)[,.\s]+[A-Za-z\s]+,?\s*(?:TX|CA|NY|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|UT|IA|NV|AR|MS|KS|NM|NE|WV|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY|DC)?\s*\d{5}/i
    );
    
    // Extract email
    const emailMatches = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    let email: string | undefined;
    if (emailMatches) {
      const good = emailMatches.filter((e: string) => !/sentry|example|noreply|webpack|wixpress|placeholder|test@/i.test(e));
      if (good.length > 0) email = good[0];
    }

    // Extract Google Maps URL from content
    let googleMapsUrl: string | undefined;
    const mapsMatch = allContent.match(/https?:\/\/(?:www\.)?google\.com\/maps\/place\/[^\s"')]+/);
    if (mapsMatch) {
      googleMapsUrl = mapsMatch[0];
    }
    
    // Extract social media links
    let instagram_url: string | undefined;
    let facebook_url: string | undefined;
    let linkedin_url: string | undefined;
    let twitter_url: string | undefined;
    
    const igMatch = allContent.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/);
    const fbMatch = allContent.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+/);
    const liMatch = allContent.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/);
    const twMatch = allContent.match(/https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/);
    
    if (igMatch) instagram_url = igMatch[0];
    if (fbMatch) facebook_url = fbMatch[0];
    if (liMatch) linkedin_url = liMatch[0];
    if (twMatch) twitter_url = twMatch[0];

    // Extract rating from content (e.g., "4.5 stars", "Rating: 4.7", "4.8 (123 reviews)")
    let rating: number | undefined;
    let user_ratings_total: number | undefined;
    const ratingMatch = allText.match(/(\d\.\d)\s*(?:·|•|\||stars?|\/\s*5)?\s*\(?\s*(\d[\d,]*)\s*(?:reviews?|ratings?)\s*\)?/i);
    if (ratingMatch) {
      const r = parseFloat(ratingMatch[1]);
      if (r >= 1 && r <= 5) rating = r;
      if (ratingMatch[2]) user_ratings_total = parseInt(ratingMatch[2].replace(/,/g, ""), 10);
    }

    // Determine website - use the result URL if it looks like a business site
    let website = url;
    const isDirectory = /yelp\.com|yellowpages|bbb\.org|mapquest|tripadvisor|angi\.com|thumbtack/i.test(url);
    if (isDirectory) website = undefined;
    
    // Fallback: construct Google Maps URL from name + location
    if (!googleMapsUrl) {
      const mapsQuery = addressMatch ? `${name} ${addressMatch[0]}` : `${name} ${location}`;
      googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;
    }
    
    return {
      place_id: `firecrawl_${Date.now()}_${index}`,
      name,
      formatted_address: addressMatch ? addressMatch[0].trim() : undefined,
      address: addressMatch ? addressMatch[0].trim() : undefined,
      phone,
      website,
      email,
      rating,
      user_ratings_total,
      google_maps_url: googleMapsUrl,
      opening_hours: undefined,
      description: description.substring(0, 200),
      instagram_url,
      facebook_url,
      linkedin_url,
      twitter_url,
    };
  } catch (e) {
    console.error('Error extracting business:', e);
    return null;
  }
}

function extractBusinessesFromMarkdown(markdown: string, industry: string, location: string, startIndex: number): BusinessResult[] {
  const businesses: BusinessResult[] = [];
  
  if (!markdown) return businesses;
  
  // Look for business name + phone patterns in markdown
  const lines = markdown.split('\n');
  let currentBusiness: Partial<BusinessResult> = {};
  
  for (const line of lines) {
    // Check for phone number
    const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      currentBusiness.phone = formatPhone(phoneMatch[0]);
    }
    
    // Check for address
    const addressMatch = line.match(
      /\d+\s+[A-Za-z0-9\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Lane|Ln)[,.\s]+[A-Za-z\s]+/i
    );
    if (addressMatch) {
      currentBusiness.formatted_address = addressMatch[0].trim();
      currentBusiness.address = addressMatch[0].trim();
    }
    
    // If we have enough info, create a business entry
    if (currentBusiness.phone && !currentBusiness.name) {
      // Try to get name from previous context or generate one
      const nameMatch = line.match(/^#+\s*(.+)$/) || line.match(/^\*\*(.+?)\*\*/);
      if (nameMatch) {
        currentBusiness.name = nameMatch[1].trim();
      }
    }
    
    // If we have a complete business, add it
    if (currentBusiness.name && currentBusiness.phone) {
      businesses.push({
        place_id: `firecrawl_md_${Date.now()}_${startIndex + businesses.length}`,
        name: currentBusiness.name,
        formatted_address: currentBusiness.formatted_address,
        address: currentBusiness.address,
        phone: currentBusiness.phone,
        google_maps_url: `https://www.google.com/maps/search/${encodeURIComponent(currentBusiness.name + ' ' + location)}`,
      });
      currentBusiness = {};
    }
  }
  
  return businesses;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

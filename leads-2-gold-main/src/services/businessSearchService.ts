import { supabase } from '@/integrations/supabase/client';

export interface Business {
  place_id: string;
  name: string;
  address?: string;
  formatted_address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  user_ratings_total?: number;
  open_now?: boolean;
  types?: string[];
  business_status?: string;
  price_level?: number;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  opening_hours?: {
    open_now: boolean;
  };
  google_maps_url?: string;
  description?: string;
}

export async function fetchLiveBusinesses(
  industryName: string,
  location: string,
  minRating?: number,
  maxResults?: number,
  limit: number = 20
): Promise<Business[]> {
  try {
    console.log(`Fetching businesses for ${industryName} in ${location} using Firecrawl`);
    
    // Try Firecrawl first for real business data
    const firecrawlResult = await fetchWithFirecrawl(industryName, location, limit);
    
    if (firecrawlResult.length > 0) {
      console.log(`Firecrawl returned ${firecrawlResult.length} real businesses`);
      let businesses = firecrawlResult;
      
      // Apply rating filter if specified
      if (minRating) {
        businesses = businesses.filter((business: Business) => 
          !business.rating || business.rating >= minRating
        );
      }

      // Apply max results limit
      if (maxResults) {
        businesses = businesses.slice(0, maxResults);
      }
      
      return businesses;
    }
    
    // Fallback to Grok-based generation if Firecrawl fails
    console.log('Firecrawl returned no results, falling back to Grok API');
    return await fetchWithGrok(industryName, location, limit, minRating, maxResults);

  } catch (error) {
    console.error('Error fetching businesses:', error);
    // Try Grok as fallback
    try {
      return await fetchWithGrok(industryName, location, limit, minRating, maxResults);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw error;
    }
  }
}

async function fetchWithFirecrawl(
  industryName: string,
  location: string,
  limit: number
): Promise<Business[]> {
  try {
    const { data, error } = await supabase.functions.invoke('firecrawl-business-search', {
      body: { industryName, location, limit }
    });

    if (error) {
      console.error('Firecrawl search error:', error);
      return [];
    }

    return data?.businesses || [];
  } catch (e) {
    console.error('Firecrawl fetch failed:', e);
    return [];
  }
}

async function fetchWithGrok(
  industryName: string,
  location: string,
  limit: number,
  minRating?: number,
  maxResults?: number
): Promise<Business[]> {
  const { data, error } = await supabase.functions.invoke('fetch-businesses', {
    body: { 
      industryName, 
      location, 
      limit: Math.min(limit, maxResults || 20)
    }
  });

  if (error) {
    console.error('Grok fetch error:', error);
    throw error;
  }

  let businesses = data?.businesses || [];

  // Apply rating filter if specified
  if (minRating) {
    businesses = businesses.filter((business: Business) => 
      !business.rating || business.rating >= minRating
    );
  }

  // Apply max results limit
  if (maxResults) {
    businesses = businesses.slice(0, maxResults);
  }

  console.log(`Successfully fetched ${businesses.length} businesses from Grok`);
  return businesses;
}

export function formatBusinessForDisplay(business: Business) {
  return {
    id: business.place_id,
    name: business.name,
    address: business.formatted_address || business.address || business.vicinity,
    phone: business.phone,
    website: business.website,
    rating: business.rating,
    reviewCount: business.user_ratings_total,
    isOpen: business.opening_hours?.open_now ?? business.open_now,
    priceLevel: business.price_level,
    businessStatus: business.business_status || 'OPERATIONAL',
    types: business.types || [],
    google_maps_url: business.google_maps_url
  };
}

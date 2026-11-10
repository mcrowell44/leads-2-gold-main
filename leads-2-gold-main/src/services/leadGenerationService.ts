import { supabase } from "@/integrations/supabase/client";
import { fetchLiveBusinesses } from "./businessSearchService";

export interface BusinessPainPoints {
  operations: string[];
  sales: string[];
  management: string[];
  customer_relations: string[];
}

export interface Lead {
  id?: string;
  industry_name?: string;
  company_name?: string;
  contact_name?: string;
  email?: string;
  owner_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  rating?: number;
  business_type?: string;
  pain_points?: string[] | BusinessPainPoints;
  suggested_products?: string[];
  best_contact_time?: string;
  google_activity_score?: number;
  ai_insights?: string;
  notes?: string;
  lead_source?: string;
  created_at?: string;
  updated_at?: string;
  place_id?: string;
  open_now?: boolean;
  user_ratings_total?: number;
  busy_times?: Record<string, number[] | { hours: string[]; values: number[] }>;
  operating_hours?: Record<string, string>;
  linkedin_url?: string;
  owner_linkedin_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  google_maps_url?: string;
}

export interface LeadCampaign {
  id?: string;
  user_id?: string;
  industry_name: string;
  location: string;
  requested_count: number;
  generated_count?: number;
  status: 'generating' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

// Convert Google Places business data to lead format
const convertBusinessToLead = (business: any, industryName: string): Lead => {
  const businessName = business.name;

  const fullAddress = business.formatted_address || business.address || '';
  const addressParts = fullAddress.split(', ');
  const streetAddress = addressParts[0] || '';
  const city = addressParts[1] || '';
  const stateZip = addressParts[2] || '';
  const stateParts = stateZip.split(' ');
  const state = stateParts[0] || '';
  const zipCode = stateParts[1] || '';

  return {
    industry_name: industryName,
    company_name: businessName,
    contact_name: business.owner_name || undefined,
    email: business.email || undefined,
    owner_email: business.owner_email || undefined,
    phone: business.phone || undefined,
    address: streetAddress,
    city,
    state,
    zip_code: zipCode,
    website: business.website || undefined,
    rating: business.rating || undefined,
    business_type: "Local Business",
    place_id: business.place_id,
    open_now: business.opening_hours?.open_now ?? business.open_now,
    user_ratings_total: business.user_ratings_total,
    google_activity_score: business.user_ratings_total ? Math.min(100, business.user_ratings_total * 5) : undefined,
    ai_insights: `Real business listing from Google Places. ${business.user_ratings_total ? `Has ${business.user_ratings_total} customer reviews.` : ''}`.trim(),
    notes: `Google Places result for ${industryName}`,
    lead_source: "google_places",
    pain_points: getIndustryPainPoints(industryName),
    suggested_products: getIndustrySolutions(industryName),
    best_contact_time: getBusinessHours(business.opening_hours?.open_now ?? business.open_now),
    busy_times: business.busy_times || undefined,
    operating_hours: business.operating_hours || undefined,
    linkedin_url: business.linkedin_url || undefined,
    owner_linkedin_url: business.owner_linkedin_url || undefined,
    instagram_url: business.instagram_url || undefined,
    facebook_url: business.facebook_url || undefined,
    twitter_url: business.twitter_url || undefined,
    google_maps_url: business.google_maps_url || undefined
  };
};

const getIndustryPainPoints = (industry: string): BusinessPainPoints => {
  const painPointsMap: Record<string, BusinessPainPoints> = {
    "restaurants": {
      operations: ["Food cost management", "Kitchen workflow optimization", "Inventory spoilage"],
      sales: ["Peak hour staffing", "Menu pricing strategy", "Online ordering systems"],
      management: ["Staff turnover", "Shift scheduling", "Quality control"],
      customer_relations: ["Wait time management", "Customer feedback handling", "Loyalty programs"]
    },
    "auto repair": {
      operations: ["Parts inventory management", "Equipment maintenance", "Shop efficiency"],
      sales: ["Customer trust building", "Service upselling", "Pricing transparency"],
      management: ["Technician certification", "Workflow scheduling", "Quality assurance"],
      customer_relations: ["Service communication", "Warranty handling", "Follow-up services"]
    },
    "real estate": {
      operations: ["Property management", "Market analysis", "Documentation processing"],
      sales: ["Lead generation", "Market competition", "Deal closing"],
      management: ["Agent coordination", "Market positioning", "Technology adoption"],
      customer_relations: ["Client communication", "Expectation management", "Post-sale support"]
    },
    "healthcare": {
      operations: ["Patient scheduling", "Equipment management", "Compliance tracking"],
      sales: ["Patient acquisition", "Insurance processing", "Service promotion"],
      management: ["Staff coordination", "Regulatory compliance", "Technology integration"],
      customer_relations: ["Patient communication", "Care continuity", "Satisfaction tracking"]
    },
    "retail": {
      operations: ["Inventory management", "Supply chain efficiency", "Store layout"],
      sales: ["Online competition", "Customer conversion", "Seasonal planning"],
      management: ["Staff training", "Performance tracking", "Cost control"],
      customer_relations: ["Customer experience", "Return policies", "Loyalty programs"]
    },
    "construction": {
      operations: ["Project scheduling", "Material management", "Equipment coordination"],
      sales: ["Bid preparation", "Client acquisition", "Project scoping"],
      management: ["Safety compliance", "Team coordination", "Quality control"],
      customer_relations: ["Client communication", "Progress updates", "Change management"]
    },
    "beauty & wellness": {
      operations: ["Appointment scheduling", "Product inventory", "Service workflow"],
      sales: ["Client acquisition", "Service upselling", "Package promotions"],
      management: ["Staff scheduling", "Training programs", "Performance tracking"],
      customer_relations: ["Client retention", "Satisfaction tracking", "Personalized service"]
    }
  };
  
  return painPointsMap[industry.toLowerCase()] || {
    operations: ["Operational efficiency", "Resource management", "Process optimization"],
    sales: ["Customer acquisition", "Sales conversion", "Market positioning"],
    management: ["Team coordination", "Strategic planning", "Performance management"],
    customer_relations: ["Customer satisfaction", "Communication", "Service delivery"]
  };
};

const getIndustrySolutions = (industry: string): string[] => {
  const lower = industry.toLowerCase();

  // Tech, Software, SaaS, IT, Digital Startups, Semiconductors
  if (lower.includes('software') || lower.includes('tech') || lower.includes('it ') || lower.includes('saas') || lower.includes('developer') || lower.includes('semiconductor') || lower.includes('electronic')) {
    return [
      "CDMWeb.store - Custom Software Development & Enterprise Full-Stack Engineering (cdmweb.store)",
      "CDMWeb.store - IT Staffing, Remote Dev Teams & Dedicated AI Developers (cdmweb.store)",
      "AIBizPro GoHighLevel CRM - Automated B2B Lead Pipelines, Inbound Qualification & Drip Sequences (aibizpro.cdmweb.store)",
      "Fractional VP of Sales - Outbound B2B Prospecting, Sales Team Architecture & Management"
    ];
  }

  // Contractors & Trades (Plumbing, HVAC, Roofing, Electrical, Construction, Landscaping)
  if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('roof') || lower.includes('electric') || lower.includes('contract') || lower.includes('construction') || lower.includes('handyman') || lower.includes('pest') || lower.includes('landscap') || lower.includes('tree') || lower.includes('clean')) {
    return [
      "AIBizPro 24/7 AI Phone Agents - Never miss an emergency call or after-hours job inquiry (aibizpro.cdmweb.store)",
      "AIBizPro GoHighLevel CRM - Instant 2-way SMS follow-ups, quote reminders & dispatch automation (aibizpro.cdmweb.store)",
      "CDMWeb.store - High-converting contractor website, landing pages & local SEO (cdmweb.store)",
      "EnergyChoice.us - Commercial utility & electric bill reduction (10-30% savings for commercial shops & yards)",
      "Fractional VP of Sales - Commercial bidding strategy, estimator training & sales management"
    ];
  }

  // Restaurants, Bars, Cafes, Hospitality, Hotels
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('bar') || lower.includes('cafe') || lower.includes('diner') || lower.includes('bakery') || lower.includes('catering') || lower.includes('hospitality') || lower.includes('hotel')) {
    return [
      "EnergyChoice.us - Cut commercial kitchen electric & gas costs by 10-30% in deregulated markets (energychoice.us)",
      "AIBizPro AI Phone & Text Agents - 24/7 phone order taking, reservation booking & catering inquiries (aibizpro.cdmweb.store)",
      "AIBizPro Reputation & Social Media Management - Automated Google review growth & social media posting (aibizpro.cdmweb.store)",
      "CDMWeb.store - Modern mobile-friendly online ordering website & digital branding (cdmweb.store)",
      "AIBizPro GoHighLevel CRM - VIP diner loyalty programs, birthday promotions & SMS retention campaigns"
    ];
  }

  // Auto Repair, Dealerships, Mechanics, Body Shops
  if (lower.includes('auto') || lower.includes('car') || lower.includes('mechanic') || lower.includes('tire') || lower.includes('body shop') || lower.includes('transmission')) {
    return [
      "AIBizPro GoHighLevel CRM - Vehicle service history tracking & automated maintenance recall SMS (aibizpro.cdmweb.store)",
      "AIBizPro AI Phone Agents - 24/7 phone receptionist for estimate scheduling & appointment intake (aibizpro.cdmweb.store)",
      "AIBizPro Reputation Management - Automated review requests to past repair customers (aibizpro.cdmweb.store)",
      "EnergyChoice.us - Commercial shop electricity & utility cost reduction (10-30% savings)",
      "CDMWeb.store - Professional auto repair website with local Google Map Pack SEO"
    ];
  }

  // Real Estate, Mortgages, Brokers, Property Management
  if (lower.includes('real estate') || lower.includes('realty') || lower.includes('mortgage') || lower.includes('property') || lower.includes('broker') || lower.includes('title')) {
    return [
      "AIBizPro GoHighLevel CRM - Real estate pipeline CRM with automated buyer/seller drip nurturing (aibizpro.cdmweb.store)",
      "AIBizPro AI Voice & Text Agents - Instant 24/7 inbound lead qualification, speed-to-lead & calendar booking (aibizpro.cdmweb.store)",
      "Fractional VP of Sales - Outbound agent prospecting, lead generation campaigns & sales team management",
      "CDMWeb.store - Custom real estate websites with MLS/IDX integration & high-converting landing pages (cdmweb.store)"
    ];
  }

  // Healthcare, Dental, Medical Clinics, Wellness, Spas
  if (lower.includes('health') || lower.includes('medical') || lower.includes('dental') || lower.includes('clinic') || lower.includes('doctor') || lower.includes('wellness') || lower.includes('spa') || lower.includes('salon') || lower.includes('therapy')) {
    return [
      "AIBizPro AI Phone Agents - 24/7 patient appointment scheduling, cancellation rebooking & FAQs (aibizpro.cdmweb.store)",
      "AIBizPro GoHighLevel CRM - Automated patient recall, appointment reminder SMS & intake workflows (aibizpro.cdmweb.store)",
      "AIBizPro Reputation Management - Boost Google ratings with automated post-visit review outreach (aibizpro.cdmweb.store)",
      "CDMWeb.store - HIPAA-compliant medical practice websites, patient portals & local SEO (cdmweb.store)"
    ];
  }

  // Retail, Boutiques, E-Commerce, Local Stores
  if (lower.includes('retail') || lower.includes('store') || lower.includes('shop') || lower.includes('ecommerce') || lower.includes('e-commerce') || lower.includes('boutique') || lower.includes('apparel')) {
    return [
      "CDMWeb.store - Full e-commerce store development, Shopify/WooCommerce optimization & custom inventory sync (cdmweb.store)",
      "AIBizPro GoHighLevel CRM - Customer retention, SMS VIP flash sales & abandoned checkout recovery (aibizpro.cdmweb.store)",
      "EnergyChoice.us - Commercial retail electricity & utility cost reduction (10-30% savings)",
      "AIBizPro Social Media Management - Automated product showcases & social engagement (aibizpro.cdmweb.store)"
    ];
  }

  // Manufacturing, Warehousing, Industrial, Supply Chain, Logistics
  if (lower.includes('manufactur') || lower.includes('warehous') || lower.includes('industr') || lower.includes('logistics') || lower.includes('machin') || lower.includes('distribut') || lower.includes('freight')) {
    return [
      "EnergyChoice.us - High-volume commercial energy procurement in deregulated markets (10-30% utility cost reduction)",
      "CDMWeb.store - Custom enterprise software, ERP/inventory portals & IT staffing (cdmweb.store)",
      "Fractional VP of Sales - B2B industrial prospecting, territory sales management & pipeline strategy",
      "AIBizPro GoHighLevel CRM - Commercial account tracking, B2B deal pipelines & contract renewals (aibizpro.cdmweb.store)"
    ];
  }

  // Legal, Accounting, Consulting, Financial, B2B Professional Services
  if (lower.includes('legal') || lower.includes('law') || lower.includes('attorney') || lower.includes('accounting') || lower.includes('cpa') || lower.includes('consult') || lower.includes('financ') || lower.includes('advisory')) {
    return [
      "AIBizPro AI Voice & Text Agents - 24/7 prospective client screening & consultation booking (aibizpro.cdmweb.store)",
      "Fractional VP of Sales - B2B outbound prospecting systems & sales team management for high-ticket retainers",
      "AIBizPro GoHighLevel CRM - Client onboarding automation, secure document capture & retention tracking (aibizpro.cdmweb.store)",
      "CDMWeb.store - High-end corporate web development, digital branding & SEO authority building (cdmweb.store)"
    ];
  }

  // Default solutions covering the full CDMWeb + AIBizPro + EnergyChoice portfolio
  return [
    "AIBizPro GoHighLevel CRM - All-in-one CRM, sales pipelines, marketing automation & 2-way SMS (aibizpro.cdmweb.store)",
    "AIBizPro 24/7 AI Voice & Phone Agents - Real conversational AI answering calls, booking appointments & qualifying leads (aibizpro.cdmweb.store)",
    "CDMWeb.store - Custom Software Development, IT Staffing, Remote Dev Teams & Dedicated AI Developers (cdmweb.store)",
    "EnergyChoice.us - Commercial utility & electricity cost reduction (10-30% savings in deregulated areas)",
    "Fractional VP of Sales - Outbound B2B prospecting, team management & sales pipeline architecture"
  ];
};

const getBusinessHours = (openNow?: boolean): string => {
  if (openNow === true) return "9:00 AM - 6:00 PM";
  if (openNow === false) return "Currently Closed - Try 9:00 AM - 5:00 PM";
  return "9:00 AM - 5:00 PM";
};

// Lead generation: ONLY real-world businesses (no mock fallback)
// AI insights are fetched separately via the "AI Enhance" button for speed
export async function generateLeads(industryName: string, location: string, count: number): Promise<Lead[]> {
  console.log(`Generating ${count} leads for ${industryName} in ${location} using live business search`);

  const businesses = await fetchLiveBusinesses(industryName, location, undefined, undefined, Math.min(count, 20));

  if (!businesses.length) return [];

  const leads = businesses.slice(0, count).map((b) => convertBusinessToLead(b, industryName));
  console.log(`Successfully generated ${leads.length} real leads`);
  return leads;
}

// AI-powered lead generation using Supabase edge function
async function generateAILeads(industryName: string, location: string, count: number): Promise<Lead[]> {
  const { data, error } = await supabase.functions.invoke('generate-leads', {
    body: { industryName, location, count }
  });

  if (error) {
    console.error('AI lead generation error:', error);
    throw new Error('AI lead generation failed');
  }

  return data?.leads || [];
}

// Add AI insights to leads
async function addAIInsights(leads: Lead[], industryName: string, location: string): Promise<Lead[]> {
  // Never block lead display on slow AI enrichment.
  // If insights take too long, return the real businesses immediately.
  const INSIGHTS_TIMEOUT_MS = 25000;

  try {
    const insightsRequest = supabase.functions.invoke('generate-insights', {
      body: { leads, industryName, location }
    });

    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), INSIGHTS_TIMEOUT_MS);
    });

    const result = (await Promise.race([insightsRequest, timeout])) as
      | Awaited<typeof insightsRequest>
      | null;

    if (!result) {
      console.warn(`AI insights timed out after ${INSIGHTS_TIMEOUT_MS}ms; returning leads without insights.`);
      return leads;
    }

    const { data, error } = result;

    if (error) {
      console.warn('AI insights generation failed:', error);
      return leads;
    }

    return data?.enhancedLeads || leads;
  } catch (error) {
    console.warn('AI insights error:', error);
    return leads;
  }
}

// Fallback lead generation
function generateFallbackLeads(industryName: string, location: string, count: number): Lead[] {
  const fallbackLeads: Lead[] = [];
  const locationParts = location.split(',');
  const city = locationParts[0]?.trim() || 'Local City';
  const state = locationParts[1]?.trim() || 'State';

  const businessTemplates: Record<string, string[]> = {
    'restaurants': ['Grill', 'Bistro', 'Kitchen', 'Cafe', 'Eatery', 'Diner'],
    'auto repair': ['Auto', 'Motors', 'Garage', 'Service', 'Automotive', 'Shop'],
    'real estate': ['Realty', 'Properties', 'Homes', 'Real Estate', 'Group'],
    'healthcare': ['Medical', 'Health', 'Clinic', 'Care', 'Center'],
    'retail': ['Store', 'Shop', 'Market', 'Outlet', 'Emporium'],
    'construction': ['Builders', 'Contractors', 'Construction', 'Renovations', 'Development'],
    'beauty & wellness': ['Salon', 'Spa', 'Wellness', 'Beauty', 'Studio'],
    'default': ['Solutions', 'Services', 'Company', 'Group', 'Associates']
  };

  const getBusinessTemplate = (industry: string) => {
    const lowerIndustry = industry.toLowerCase();
    for (const [key, templates] of Object.entries(businessTemplates)) {
      if (lowerIndustry.includes(key)) return templates;
    }
    return businessTemplates.default;
  };

  const templates = getBusinessTemplate(industryName);
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const streets = ['Main St', 'Oak Ave', 'Pine St', 'Maple Dr', 'Cedar Ln', 'Elm St', 'Park Ave', 'First St'];

  for (let i = 1; i <= count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const streetNumber = Math.floor(Math.random() * 9999) + 1;

    const companyName = Math.random() > 0.5 ? `${city} ${template}` : `${lastName} ${template}`;
    const zipCode = Math.floor(Math.random() * 90000) + 10000;

    fallbackLeads.push({
      industry_name: industryName,
      company_name: companyName,
      contact_name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${streetNumber} ${street}`,
      city: city,
      state: state,
      zip_code: zipCode.toString(),
      website: `www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
      business_type: 'Local Business',
      pain_points: getIndustryPainPoints(industryName),
      suggested_products: getIndustrySolutions(industryName),
      best_contact_time: '9:00 AM - 5:00 PM',
      google_activity_score: Math.floor(Math.random() * 40) + 60,
      ai_insights: `Fallback lead for ${industryName} industry with standard business profile.`,
      notes: `Generated fallback lead for ${industryName} industry in ${location}`,
      lead_source: 'fallback_generation'
    });
  }

  return fallbackLeads;
}

// Admin emails that bypass subscription checks for CRM autosave
const ADMIN_EMAILS = ['marcuscrowell44@gmail.com', 'marcus@play44sports.com', 'marcus@cdmweb.store', 'marcus_crowell@yahoo.com', 'marcus@zapai.io'];

async function checkCanSaveToCRM(user: { id: string; email?: string }): Promise<boolean> {
  if (!user.email) return false;
  
  const userEmail = user.email.toLowerCase();
  
  // Check admin emails first
  if (ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail)) {
    console.log('Admin user detected, CRM save allowed');
    return true;
  }
  
  // Check admin_users table
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('is_active')
    .eq('email', user.email)
    .eq('is_active', true)
    .maybeSingle();
  
  if (adminData) {
    console.log('Admin user from database, CRM save allowed');
    return true;
  }
  
  // Check subscription status
  const { data: subData } = await supabase
    .from('subscribers')
    .select('subscribed, subscription_end')
    .eq('email', user.email)
    .maybeSingle();
  
  if (subData?.subscribed) {
    const isActive = !subData.subscription_end || 
      new Date(subData.subscription_end) > new Date();
    if (isActive) {
      console.log('Subscribed user, CRM save allowed');
      return true;
    }
  }
  
  console.log('User not authorized for CRM autosave');
  return false;
}

export async function saveLeads(leads: Lead[]): Promise<Lead[]> {
  try {
    console.log('Attempting to save leads to database...');
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not authenticated, returning leads for display only');
      return leads.map((lead, index) => ({
        ...lead,
        id: `temp-${index}`,
        created_at: new Date().toISOString()
      }));
    }

    // Check if user is admin or subscribed before saving to CRM
    const canSave = await checkCanSaveToCRM(user);
    
    if (!canSave) {
      console.log('User not authorized for CRM autosave, returning leads for display only');
      return leads.map((lead, index) => ({
        ...lead,
        id: `temp-${index}`,
        created_at: new Date().toISOString()
      }));
    }

    // Ensure required fields are present and properly typed for database insertion
    const leadsForDatabase = leads.map(lead => ({
      user_id: user.id,
      company_name: lead.company_name || 'Unknown Company',
      industry_name: lead.industry_name || 'General',
      contact_name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      website: lead.website,
      rating: lead.rating,
      business_type: lead.business_type,
      notes: lead.notes,
      lead_source: lead.lead_source
    }));
    
    // Autosave to CRM database
    const { data, error } = await supabase
      .from('leads')
      .insert(leadsForDatabase)
      .select();

    if (error) {
      console.log('CRM autosave failed:', error.message);
      return leads.map((lead, index) => ({
        ...lead,
        id: `temp-${index}`,
        created_at: new Date().toISOString()
      }));
    }

    console.log('Successfully autosaved leads to CRM');
    return data || leads;
  } catch (error) {
    console.error('Error in CRM autosave:', error);
    return leads.map((lead, index) => ({
      ...lead,
      id: `temp-${index}`,
      created_at: new Date().toISOString()
    }));
  }
}

export async function getUserLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Could not fetch user leads (user not authenticated)');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user leads:', error);
    return [];
  }
}

export function exportLeadsToCSV(leads: Lead[]): void {
  if (leads.length === 0) {
    throw new Error('No leads to export');
  }

  const headers = [
    'Company Name',
    'Contact Name', 
    'Email',
    'Phone',
    'Address',
    'City',
    'State',
    'Zip Code',
    'Website',
    'Industry',
    'Rating',
    'Google Reviews',
    'Business Type',
    'Lead Source',
    'Notes'
  ];

  const csvContent = [
    headers.join(','),
    ...leads.map(lead => [
      `"${lead.company_name || ''}"`,
      `"${lead.contact_name || ''}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.address || ''}"`,
      `"${lead.city || ''}"`,
      `"${lead.state || ''}"`,
      `"${lead.zip_code || ''}"`,
      `"${lead.website || ''}"`,
      `"${lead.industry_name || ''}"`,
      `"${lead.rating || ''}"`,
      `"${lead.user_ratings_total || ''}"`,
      `"${lead.business_type || ''}"`,
      `"${lead.lead_source || ''}"`,
      `"${lead.notes || ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function createLeadCampaign(campaign: Omit<LeadCampaign, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<LeadCampaign | null> {
  try {
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('User not authenticated, cannot create campaign');
      return null;
    }

    const { data, error } = await supabase
      .from('lead_campaigns')
      .insert({
        ...campaign,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.log('Could not create campaign:', error.message);
      return null;
    }

    // Type assertion to handle the database return type
    return data as LeadCampaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    return null;
  }
}

export async function updateLeadCampaign(id: string, updates: Partial<LeadCampaign>): Promise<void> {
  try {
    const { error } = await supabase
      .from('lead_campaigns')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.log('Could not update campaign (user not authenticated)');
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
  }
}

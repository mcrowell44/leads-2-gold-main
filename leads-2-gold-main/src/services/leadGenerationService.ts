import { supabase } from "@/integrations/supabase/client";
import { fetchLiveBusinesses } from "./businessSearchService";

export interface BusinessPainPoints {
  operations: string[];
  sales: string[];
  management: string[];
  customer_relations: string[];
}

export interface SalesStrategy {
  best_contact_time?: string;
  opening_hook: string;
  plan_of_action: string[];
  value_proposition: string;
  objection_handling: string[];
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
  sales_strategy?: SalesStrategy;
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
    sales_strategy: getIndustrySalesStrategy(industryName),
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

export const getIndustrySalesStrategy = (industry: string): SalesStrategy => {
  const lower = industry.toLowerCase();

  // Contractors & Trades
  if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('roof') || lower.includes('electric') || lower.includes('contract') || lower.includes('construction') || lower.includes('handyman') || lower.includes('pest') || lower.includes('landscap') || lower.includes('tree') || lower.includes('clean')) {
    return {
      best_contact_time: "Tuesday - Thursday, 6:30 AM - 8:30 AM or 4:30 PM - 6:30 PM (before/after field dispatches)",
      opening_hook: "Most contractors lose 30-40% of emergency revenue to missed after-hours calls and delayed quote follow-ups.",
      plan_of_action: [
        "Step 1: Deploy AIBizPro 24/7 AI Phone Agent to capture 100% of emergency and after-hours job calls with instant booking and dispatch.",
        "Step 2: Connect GoHighLevel CRM for instant 60-second 2-way SMS quote follow-up and appointment confirmation.",
        "Step 3: Run EnergyChoice commercial energy bill audit to cut shop, warehouse, and yard electric/gas bills by 10-30%.",
        "Step 4: Upgrade to high-converting contractor website & Google Map Pack SEO engineered by CDMWeb.store."
      ],
      value_proposition: "Never miss an emergency job again, automate quote follow-ups within 60 seconds, and fund the upgrades with 10-30% commercial utility savings.",
      objection_handling: [
        "Objection: 'We already have an answering service' -> Rebuttal: Traditional call centers put customers on hold and can't book directly into dispatch software; our AI schedules jobs live 24/7 at a fraction of the cost.",
        "Objection: 'Too busy in the field' -> Rebuttal: That is exactly why our 24/7 voice agent takes phone tags and dispatch off your hands in under 48 hours."
      ]
    };
  }

  // Restaurants, Hospitality & Food
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('bar') || lower.includes('cafe') || lower.includes('diner') || lower.includes('bakery') || lower.includes('catering') || lower.includes('hospitality') || lower.includes('hotel')) {
    return {
      best_contact_time: "Tuesday - Thursday, 2:00 PM - 4:00 PM (between lunch and dinner rushes)",
      opening_hook: "Commercial kitchen utility rates have jumped 25%—our utility audit benchmarks your meters against wholesale pricing with zero switching downtime.",
      plan_of_action: [
        "Step 1: Free EnergyChoice utility rate audit to slash commercial kitchen electricity and natural gas bills by 10-30%.",
        "Step 2: Deploy AIBizPro 24/7 AI Phone & Text Agent for hands-free phone orders, catering inquiries, and table reservations.",
        "Step 3: Launch automated 5-star Google review collection to dominate local 'food near me' searches.",
        "Step 4: Implement GoHighLevel VIP diner loyalty, birthday clubs, and slow-night SMS flash promos."
      ],
      value_proposition: "Slash kitchen electric and gas bills by 10-30% while automating takeout phone orders and building an owned diner SMS database.",
      objection_handling: [
        "Objection: 'Margins are too tight for new software' -> Rebuttal: EnergyChoice requires zero upfront investment and produces immediate monthly utility savings that fund your AI tools.",
        "Objection: 'We rely on DoorDash/UberEats' -> Rebuttal: Third-party delivery takes 25-30% commissions; our AI direct phone ordering keeps 100% of the margin in your pocket."
      ]
    };
  }

  // Tech, Software, SaaS & IT
  if (lower.includes('software') || lower.includes('tech') || lower.includes('it ') || lower.includes('saas') || lower.includes('developer') || lower.includes('semiconductor') || lower.includes('electronic')) {
    return {
      best_contact_time: "Tuesday - Thursday, 9:30 AM - 11:30 AM or 1:30 PM - 3:30 PM",
      opening_hook: "Are your account executives bogged down in manual prospecting instead of demoing and closing qualified opportunities?",
      plan_of_action: [
        "Step 1: Fractional VP of Sales B2B outbound prospecting architecture and sales cadence deployment.",
        "Step 2: Scale engineering sprint capacity with CDMWeb dedicated remote developers and AI engineers.",
        "Step 3: Automate inbound lead qualification, speed-to-lead, and calendar booking in AIBizPro GoHighLevel CRM.",
        "Step 4: Deploy enterprise Power BI executive dashboards and Azure cloud infrastructure from enterprise.crowell-randolph.com."
      ],
      value_proposition: "Accelerate pipeline velocity with turnkey B2B outbound prospecting and scale engineering bandwidth on demand without full-time overhead.",
      objection_handling: [
        "Objection: 'We do sales in-house' -> Rebuttal: Our Fractional VP of Sales leadership augments your team with proven outbound frameworks and pipeline acceleration without executive headcount overhead.",
        "Objection: 'We have enough engineers' -> Rebuttal: We also supply flexible specialized AI and full-stack talent for surge capacity during critical product releases."
      ]
    };
  }

  // Auto Repair & Mechanics
  if (lower.includes('auto') || lower.includes('car') || lower.includes('mechanic') || lower.includes('tire') || lower.includes('body shop') || lower.includes('transmission')) {
    return {
      best_contact_time: "Tuesday - Thursday, 8:30 AM - 10:00 AM or 1:30 PM - 3:00 PM",
      opening_hook: "Over 65% of drivers who call an auto repair shop for an estimate will immediately call the next shop if they reach voicemail.",
      plan_of_action: [
        "Step 1: Deploy AIBizPro AI phone receptionist to take estimate calls and book bay drop-offs 24/7.",
        "Step 2: Automate recurring maintenance recall SMS (oil changes, brake inspections, tire rotations) in GoHighLevel CRM.",
        "Step 3: Launch automated review outreach upon vehicle pickup to accumulate 5-star Google reviews.",
        "Step 4: Benchmark commercial bay lighting, compressor power, and heating costs for 10-30% savings via EnergyChoice.us."
      ],
      value_proposition: "Keep repair bays booked weeks in advance with automated customer recalls and 24/7 estimate intake.",
      objection_handling: [
        "Objection: 'Service writers answer our phones' -> Rebuttal: When writers are helping a customer at the counter, the phone goes unanswered; AI picks up instantly so you never lose a big repair job.",
        "Objection: 'Customers only want to talk to mechanics' -> Rebuttal: AI handles routine scheduling, hours, and intake—freeing your mechanics to turn wrenches."
      ]
    };
  }

  // Real Estate & Mortgage
  if (lower.includes('real estate') || lower.includes('realty') || lower.includes('mortgage') || lower.includes('property') || lower.includes('broker') || lower.includes('title')) {
    return {
      best_contact_time: "Monday - Thursday, 8:30 AM - 11:00 AM",
      opening_hook: "Buyer and seller leads contacted within 60 seconds are 391% more likely to convert than leads contacted after 30 minutes.",
      plan_of_action: [
        "Step 1: Implement AIBizPro AI Voice/Text agents for sub-30-second inbound speed-to-lead qualification.",
        "Step 2: Automate 12-month buyer/seller drip nurturing and pipeline stage tracking in GoHighLevel CRM.",
        "Step 3: Fractional VP of Sales outbound prospecting campaigns, expired listing cadence, and team management.",
        "Step 4: Launch high-converting IDX property showcase website from CDMWeb.store."
      ],
      value_proposition: "Dominate speed-to-lead with instantaneous AI qualification and keep every buyer and seller engaged for up to 12 months on autopilot.",
      objection_handling: [
        "Objection: 'Real estate is relationship-based' -> Rebuttal: The AI does not replace you; it engages and qualifies leads in seconds so you spend 100% of your time with ready-to-transact clients."
      ]
    };
  }

  // Healthcare, Dental & Wellness
  if (lower.includes('health') || lower.includes('medical') || lower.includes('dental') || lower.includes('clinic') || lower.includes('doctor') || lower.includes('wellness') || lower.includes('spa') || lower.includes('salon')) {
    return {
      best_contact_time: "Tuesday - Thursday, 11:30 AM - 1:00 PM (lunch transition)",
      opening_hook: "Unanswered patient calls and no-shows cost the average clinic between $100,000 to $150,000 in missed billings every year.",
      plan_of_action: [
        "Step 1: Deploy AIBizPro 24/7 AI phone receptionist for appointment booking, rebooking & patient intake.",
        "Step 2: Reduce clinic no-shows by 40% with GoHighLevel automated 2-way SMS reminders & digital intake.",
        "Step 3: Automated HIPAA-compliant Google review collection to elevate clinic search visibility.",
        "Step 4: Modern patient portal & high-speed healthcare web architecture engineered by CDMWeb.store."
      ],
      value_proposition: "Eliminate missed patient bookings, reduce no-shows by up to 40%, and streamline front-desk operations 24/7.",
      objection_handling: [
        "Objection: 'We have front desk staff' -> Rebuttal: Front desk staff gets overwhelmed during morning check-ins; AI manages overflow calls and books patients after-hours when staff is off."
      ]
    };
  }

  // Manufacturing & Logistics
  if (lower.includes('manufactur') || lower.includes('warehous') || lower.includes('industr') || lower.includes('logistics') || lower.includes('machin') || lower.includes('distribut')) {
    return {
      best_contact_time: "Tuesday - Thursday, 7:00 AM - 9:00 AM",
      opening_hook: "Commercial power and gas procurement represents the fastest immediate 10-30% margin improvement for high-volume facilities.",
      plan_of_action: [
        "Step 1: EnergyChoice high-volume commercial energy procurement (10-30% utility rate reduction in deregulated markets).",
        "Step 2: Custom ERP/inventory software development & dedicated IT staffing via CDMWeb.store.",
        "Step 3: Fractional VP of Sales outbound industrial B2B prospecting & distributor contract acquisition.",
        "Step 4: Staff AI training via MyCityMySchool with Texas Workforce Commission reimbursement ($1k-$2k/worker)."
      ],
      value_proposition: "Cut commercial utility bills by 10-30% and modernise legacy supply chain software with dedicated engineering talent.",
      objection_handling: [
        "Objection: 'We are under existing energy contracts' -> Rebuttal: We analyze your contract expiration dates to lock in wholesale forward rates before market rate hikes occur."
      ]
    };
  }

  // Legal & Financial
  if (lower.includes('legal') || lower.includes('law') || lower.includes('attorney') || lower.includes('accounting') || lower.includes('cpa') || lower.includes('consult') || lower.includes('financ')) {
    return {
      best_contact_time: "Monday - Thursday, 8:00 AM - 9:30 AM or 4:30 PM - 6:00 PM",
      opening_hook: "High-value prospective clients expect immediate responses; after 5 PM, prospective clients simply call your competitors.",
      plan_of_action: [
        "Step 1: AIBizPro AI Voice & Text agent for 24/7 prospective client intake & consultation pre-screening.",
        "Step 2: Fractional VP of Sales high-ticket B2B retainer prospecting systems & outbound campaigns.",
        "Step 3: Automated secure document intake workflows & retention in GoHighLevel CRM.",
        "Step 4: High-end corporate brand authority & modern web architecture from CDMWeb.store."
      ],
      value_proposition: "Pre-screen high-value client consultations 24/7 and build a predictable outbound pipeline for premium retainers.",
      objection_handling: [
        "Objection: 'We rely exclusively on referrals' -> Rebuttal: Referrals are great, but proactive outbound prospecting and 24/7 intake turn unpredictable referrals into dependable monthly revenue."
      ]
    };
  }

  // Default Sales Strategy
  return {
    best_contact_time: "Tuesday - Thursday, 10:00 AM - 2:00 PM",
    opening_hook: "Most businesses lose qualified leads to delayed follow-ups and overpay 10-30% on commercial electricity and operating overhead.",
    plan_of_action: [
      "Step 1: Deploy AIBizPro 24/7 AI Voice Agent to eliminate missed customer calls and book appointments around the clock.",
      "Step 2: Streamline lead follow-up, pipelines, and 2-way SMS in AIBizPro GoHighLevel CRM.",
      "Step 3: Benchmark commercial utility rates with EnergyChoice.us for 10-30% overhead savings in deregulated areas.",
      "Step 4: Scale technology with custom software development and IT staffing from CDMWeb.store."
    ],
    value_proposition: "Eliminate missed revenue with 24/7 AI communication, cut commercial overhead by 10-30%, and scale engineering on demand.",
    objection_handling: [
      "Objection: 'Budget constraints' -> Rebuttal: EnergyChoice commercial utility rate savings typically save enough to fully fund your CRM and AI phone agents.",
      "Objection: 'Too complicated to set up' -> Rebuttal: Our team handles turnkey setup in under 48 hours with zero disruption to your daily operations."
    ]
  };
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
      sales_strategy: getIndustrySalesStrategy(industryName),
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

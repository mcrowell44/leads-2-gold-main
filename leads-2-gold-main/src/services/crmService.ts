import { supabase } from "@/integrations/supabase/client";

export interface CRMProspect {
  id: string;
  user_id: string;
  company_name: string;
  industry_name?: string;
  business_type?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  google_rating?: number;
  google_reviews_count?: number;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  ai_insights?: unknown;
  pain_points?: unknown;
  suggested_products?: string[];
  best_call_times?: unknown;
  google_busy_hours?: unknown;
  personalized_email?: string;
  contact_history?: unknown;
  stage: string;
  last_contacted_at?: string;
  next_callback_at?: string;
  callback_notes?: string;
  notes?: string;
  lead_source?: string;
  search_query?: string;
  lead_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ContactHistoryEntry {
  id: string;
  type: 'email' | 'phone' | 'note' | 'callback_scheduled' | 'stage_change';
  content: string;
  timestamp: string;
  from_stage?: string;
  to_stage?: string;
}

export const PIPELINE_STAGES = [
  { id: 'new_lead', label: 'New Lead', color: 'bg-blue-500' },
  { id: 'first_contact', label: 'First Contact', color: 'bg-purple-500' },
  { id: 'callback_scheduled', label: 'Callback Scheduled', color: 'bg-yellow-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-orange-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-indigo-500' },
  { id: 'won', label: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export const getStageLabel = (stageId: string): string => {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId);
  return stage?.label || stageId;
};

export const getStageColor = (stageId: string): string => {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId);
  return stage?.color || 'bg-gray-500';
};

// Fetch all CRM prospects
export const getCRMProspects = async (): Promise<CRMProspect[]> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching CRM prospects:', error);
    throw error;
  }

  return (data || []) as unknown as CRMProspect[];
};

// Fetch prospects by stage
export const getProspectsByStage = async (stage: string): Promise<CRMProspect[]> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .select('*')
    .eq('stage', stage)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching prospects by stage:', error);
    throw error;
  }

  return (data || []) as unknown as CRMProspect[];
};

// Get upcoming callbacks
export const getUpcomingCallbacks = async (): Promise<CRMProspect[]> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .select('*')
    .not('next_callback_at', 'is', null)
    .gte('next_callback_at', new Date().toISOString())
    .order('next_callback_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching upcoming callbacks:', error);
    throw error;
  }

  return (data || []) as unknown as CRMProspect[];
};

// Add a new prospect to CRM
export const addProspectToCRM = async (prospect: Record<string, unknown>): Promise<CRMProspect> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .insert(prospect as any)
    .select()
    .single();

  if (error) {
    console.error('Error adding prospect to CRM:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Bulk add prospects from search results
export const bulkAddProspectsToCRM = async (
  prospects: Array<{
    company_name: string;
    industry_name?: string;
    business_type?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    google_rating?: number;
    google_reviews_count?: number;
    ai_insights?: Record<string, unknown>;
    pain_points?: Record<string, unknown>;
    suggested_products?: string[];
    lead_score?: number;
  }>,
  userId: string,
  searchQuery: string
): Promise<number> => {
  const prospectsToInsert = prospects.map(p => ({
    company_name: p.company_name,
    industry_name: p.industry_name,
    business_type: p.business_type,
    contact_name: p.contact_name,
    email: p.email,
    phone: p.phone,
    website: p.website,
    address: p.address,
    city: p.city,
    state: p.state,
    google_rating: p.google_rating,
    google_reviews_count: p.google_reviews_count,
    ai_insights: p.ai_insights ? JSON.parse(JSON.stringify(p.ai_insights)) : null,
    pain_points: p.pain_points ? JSON.parse(JSON.stringify(p.pain_points)) : null,
    suggested_products: p.suggested_products,
    lead_score: p.lead_score,
    user_id: userId,
    stage: 'new_lead',
    lead_source: 'search',
    search_query: searchQuery,
    contact_history: [] as unknown[],
  }));

  const { data, error } = await supabase
    .from('crm_prospects')
    .insert(prospectsToInsert as any)
    .select();

  if (error) {
    console.error('Error bulk adding prospects:', error);
    throw error;
  }

  return data?.length || 0;
};

// Update prospect stage
export const updateProspectStage = async (
  prospectId: string, 
  newStage: string, 
  previousStage: string
): Promise<CRMProspect> => {
  // First get the current prospect to update contact history
  const { data: current } = await supabase
    .from('crm_prospects')
    .select('contact_history')
    .eq('id', prospectId)
    .single();

  const history = (Array.isArray(current?.contact_history) ? current.contact_history : []) as unknown as ContactHistoryEntry[];
  const newEntry = {
    id: crypto.randomUUID(),
    type: 'stage_change',
    content: `Stage changed from ${getStageLabel(previousStage)} to ${getStageLabel(newStage)}`,
    timestamp: new Date().toISOString(),
    from_stage: previousStage,
    to_stage: newStage,
  };

  const { data, error } = await supabase
    .from('crm_prospects')
    .update({ 
      stage: newStage,
      contact_history: [...history, newEntry] as unknown as Record<string, unknown>,
    } as any)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect stage:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Schedule a callback
export const scheduleCallback = async (
  prospectId: string, 
  callbackDate: string, 
  notes: string
): Promise<CRMProspect> => {
  const { data: current } = await supabase
    .from('crm_prospects')
    .select('contact_history, stage')
    .eq('id', prospectId)
    .single();

  const history = (Array.isArray(current?.contact_history) ? current.contact_history : []) as unknown as ContactHistoryEntry[];
  const newEntry = {
    id: crypto.randomUUID(),
    type: 'callback_scheduled',
    content: `Callback scheduled for ${new Date(callbackDate).toLocaleString()}: ${notes}`,
    timestamp: new Date().toISOString(),
  };

  const updates: Record<string, unknown> = {
    next_callback_at: callbackDate,
    callback_notes: notes,
    contact_history: [...history, newEntry],
  };

  // Auto-update stage if currently new_lead or first_contact
  if (current?.stage === 'new_lead' || current?.stage === 'first_contact') {
    updates.stage = 'callback_scheduled';
  }

  const { data, error } = await supabase
    .from('crm_prospects')
    .update(updates as any)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    console.error('Error scheduling callback:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Log a contact (email or phone)
export const logContact = async (
  prospectId: string, 
  contactType: 'email' | 'phone', 
  content: string
): Promise<CRMProspect> => {
  const { data: current } = await supabase
    .from('crm_prospects')
    .select('contact_history, stage')
    .eq('id', prospectId)
    .single();

  const history = (Array.isArray(current?.contact_history) ? current.contact_history : []) as unknown as ContactHistoryEntry[];
  const newEntry = {
    id: crypto.randomUUID(),
    type: contactType,
    content,
    timestamp: new Date().toISOString(),
  };

  const updates: Record<string, unknown> = {
    last_contacted_at: new Date().toISOString(),
    contact_history: [...history, newEntry],
  };

  // Auto-update stage if currently new_lead
  if (current?.stage === 'new_lead') {
    updates.stage = 'first_contact';
  }

  const { data, error } = await supabase
    .from('crm_prospects')
    .update(updates as any)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    console.error('Error logging contact:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Add a note
export const addNote = async (prospectId: string, content: string): Promise<CRMProspect> => {
  const { data: current } = await supabase
    .from('crm_prospects')
    .select('contact_history, notes')
    .eq('id', prospectId)
    .single();

  const history = (Array.isArray(current?.contact_history) ? current.contact_history : []) as unknown as ContactHistoryEntry[];
  const newEntry = {
    id: crypto.randomUUID(),
    type: 'note',
    content,
    timestamp: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('crm_prospects')
    .update({
      notes: content,
      contact_history: [...history, newEntry],
    } as any)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    console.error('Error adding note:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Update prospect details
export const updateProspect = async (
  prospectId: string, 
  updates: Partial<CRMProspect>
): Promise<CRMProspect> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .update(updates as any)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prospect:', error);
    throw error;
  }

  return data as unknown as CRMProspect;
};

// Delete a prospect
export const deleteProspect = async (prospectId: string): Promise<void> => {
  const { error } = await supabase
    .from('crm_prospects')
    .delete()
    .eq('id', prospectId);

  if (error) {
    console.error('Error deleting prospect:', error);
    throw error;
  }
};

// Get CRM stats
export const getCRMStats = async (): Promise<{
  total: number;
  byStage: Record<string, number>;
  upcomingCallbacks: number;
  contactedToday: number;
}> => {
  const { data, error } = await supabase
    .from('crm_prospects')
    .select('stage, last_contacted_at, next_callback_at');

  if (error) {
    console.error('Error fetching CRM stats:', error);
    throw error;
  }

  const prospects = data || [];
  const today = new Date().toDateString();

  const byStage: Record<string, number> = {};
  PIPELINE_STAGES.forEach(s => { byStage[s.id] = 0; });

  let contactedToday = 0;
  let upcomingCallbacks = 0;

  prospects.forEach(p => {
    byStage[p.stage] = (byStage[p.stage] || 0) + 1;
    
    if (p.last_contacted_at && new Date(p.last_contacted_at).toDateString() === today) {
      contactedToday++;
    }
    
    if (p.next_callback_at && new Date(p.next_callback_at) >= new Date()) {
      upcomingCallbacks++;
    }
  });

  return {
    total: prospects.length,
    byStage,
    upcomingCallbacks,
    contactedToday,
  };
};

// Save a search
export const saveAdminSearch = async (
  userId: string,
  searchQuery: string,
  industryName: string,
  location: string,
  leadCount: number
): Promise<void> => {
  const { error } = await supabase
    .from('admin_saved_searches')
    .insert({
      user_id: userId,
      search_query: searchQuery,
      industry_name: industryName,
      location: location,
      lead_count: leadCount,
      results_saved: true,
    });

  if (error) {
    console.error('Error saving search:', error);
    throw error;
  }
};

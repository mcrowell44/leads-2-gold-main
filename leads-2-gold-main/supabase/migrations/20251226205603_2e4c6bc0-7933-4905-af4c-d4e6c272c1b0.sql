-- Create CRM prospects table with full sales pipeline
CREATE TABLE public.crm_prospects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    
    -- Business Information
    company_name TEXT NOT NULL,
    industry_name TEXT,
    business_type TEXT,
    
    -- Contact Information
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    
    -- Google/Social Data
    google_rating NUMERIC,
    google_reviews_count INTEGER,
    facebook_url TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    
    -- AI Insights & Enrichment
    ai_insights JSONB,
    pain_points JSONB,
    suggested_products TEXT[],
    best_call_times JSONB,
    google_busy_hours JSONB,
    personalized_email TEXT,
    
    -- Sales Pipeline
    stage TEXT NOT NULL DEFAULT 'new_lead',
    -- Stages: new_lead, first_contact, callback_scheduled, qualified, proposal, won, lost
    
    -- Activity Tracking
    last_contacted_at TIMESTAMPTZ,
    next_callback_at TIMESTAMPTZ,
    callback_notes TEXT,
    
    -- Notes & History
    notes TEXT,
    contact_history JSONB DEFAULT '[]'::jsonb,
    
    -- Lead Source
    lead_source TEXT DEFAULT 'search',
    search_query TEXT,
    
    -- Metadata
    lead_score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can access CRM prospects
CREATE POLICY "Admins can view all CRM prospects"
ON public.crm_prospects
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert CRM prospects"
ON public.crm_prospects
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update CRM prospects"
ON public.crm_prospects
FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete CRM prospects"
ON public.crm_prospects
FOR DELETE
USING (is_admin());

-- Create indexes for common queries
CREATE INDEX idx_crm_prospects_stage ON public.crm_prospects(stage);
CREATE INDEX idx_crm_prospects_user_id ON public.crm_prospects(user_id);
CREATE INDEX idx_crm_prospects_next_callback ON public.crm_prospects(next_callback_at) WHERE next_callback_at IS NOT NULL;
CREATE INDEX idx_crm_prospects_created_at ON public.crm_prospects(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_crm_prospects_updated_at
BEFORE UPDATE ON public.crm_prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create saved searches table for admin
CREATE TABLE public.admin_saved_searches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    search_query TEXT NOT NULL,
    industry_name TEXT,
    location TEXT,
    lead_count INTEGER DEFAULT 0,
    results_saved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved searches
CREATE POLICY "Admins can manage saved searches"
ON public.admin_saved_searches
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create leads table for storing generated leads
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  industry_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  website TEXT,
  rating NUMERIC(2,1),
  business_type TEXT,
  notes TEXT,
  lead_source TEXT DEFAULT 'ai_generated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
CREATE POLICY "Users can view their own leads" 
  ON public.leads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
  ON public.leads 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
  ON public.leads 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create lead campaigns table for tracking generation requests
CREATE TABLE public.lead_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  industry_name TEXT NOT NULL,
  location TEXT,
  requested_count INTEGER NOT NULL,
  generated_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for lead campaigns
ALTER TABLE public.lead_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lead campaigns" 
  ON public.lead_campaigns 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

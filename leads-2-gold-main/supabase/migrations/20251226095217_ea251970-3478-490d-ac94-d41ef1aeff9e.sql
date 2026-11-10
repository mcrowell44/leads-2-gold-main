-- Create table to store free trial leads (users who provided email/name)
CREATE TABLE public.free_trial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  searches_used INTEGER DEFAULT 0,
  converted_to_paid BOOLEAN DEFAULT false,
  last_search_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.free_trial_leads ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage free trial leads
CREATE POLICY "Admins can manage free trial leads"
ON public.free_trial_leads
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Allow insert from edge functions (service role) or authenticated users for self-registration
CREATE POLICY "Anyone can register as free trial lead"
ON public.free_trial_leads
FOR INSERT
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER set_free_trial_leads_updated_at
BEFORE UPDATE ON public.free_trial_leads
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
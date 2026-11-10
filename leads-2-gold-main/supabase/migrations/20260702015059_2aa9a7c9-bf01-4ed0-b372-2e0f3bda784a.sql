
CREATE TABLE public.monthly_lead_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  leads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

GRANT SELECT, INSERT, UPDATE ON public.monthly_lead_usage TO authenticated;
GRANT ALL ON public.monthly_lead_usage TO service_role;

ALTER TABLE public.monthly_lead_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly usage"
  ON public.monthly_lead_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly usage"
  ON public.monthly_lead_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly usage"
  ON public.monthly_lead_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_monthly_lead_usage_updated_at
  BEFORE UPDATE ON public.monthly_lead_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();

CREATE INDEX idx_monthly_lead_usage_user_period ON public.monthly_lead_usage(user_id, period_start);

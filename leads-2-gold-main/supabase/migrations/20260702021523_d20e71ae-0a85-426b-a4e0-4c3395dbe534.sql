
-- Revoke EXECUTE from anon on security-definer helpers (authenticated still needed for RLS)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_subscription_status(text) FROM anon, PUBLIC;

-- Replace WITH CHECK (true) INSERT policies with sanity constraints
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.chat_appointments;
CREATE POLICY "Anyone can create appointments" ON public.chat_appointments
  FOR INSERT
  WITH CHECK (
    name IS NOT NULL AND length(trim(name)) > 0
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND phone IS NOT NULL AND length(trim(phone)) > 0
    AND topic IS NOT NULL AND length(trim(topic)) > 0
  );

DROP POLICY IF EXISTS "Anyone can register as free trial lead" ON public.free_trial_leads;
CREATE POLICY "Anyone can register as free trial lead" ON public.free_trial_leads
  FOR INSERT
  WITH CHECK (
    name IS NOT NULL AND length(trim(name)) > 0
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );


-- ==========================================
-- applicant_registrations
-- ==========================================
DROP POLICY IF EXISTS "Applicants are viewable by everyone" ON public.applicant_registrations;
CREATE POLICY "Applicants viewable by owner or admin"
  ON public.applicant_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- employer_registrations
-- ==========================================
DROP POLICY IF EXISTS "Employer registrations viewable by everyone" ON public.employer_registrations;
CREATE POLICY "Employer registrations viewable by owner or admin"
  ON public.employer_registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- parent_profiles
-- ==========================================
DROP POLICY IF EXISTS "Everyone can view parent profiles" ON public.parent_profiles;
CREATE POLICY "Parents can view their own profile"
  ON public.parent_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================
-- players
-- ==========================================
DROP POLICY IF EXISTS "Everyone can view all player profiles" ON public.players;
CREATE POLICY "Authenticated users can view player profiles"
  ON public.players FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- organizations
-- ==========================================
DROP POLICY IF EXISTS "Allow public read access to organizations" ON public.organizations;
CREATE POLICY "Authenticated users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

-- ==========================================
-- general_invites
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view valid invites by code" ON public.general_invites;
CREATE POLICY "Authenticated can view valid invites"
  ON public.general_invites FOR SELECT
  TO authenticated
  USING ((NOT is_used) AND (expires_at > now()));

-- ==========================================
-- registration_codes
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view unused registration codes" ON public.registration_codes;
CREATE POLICY "Authenticated can view unused registration codes"
  ON public.registration_codes FOR SELECT
  TO authenticated
  USING ((NOT is_used) AND (expires_at > now()));

-- ==========================================
-- subscribers - remove permissive insert
-- ==========================================
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
CREATE POLICY "Users can insert own subscription"
  ON public.subscribers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- ==========================================
-- storage.objects - resumes bucket cleanup
-- ==========================================
DROP POLICY IF EXISTS "Allow public resume reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume deletions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume uploads" ON storage.objects;

-- Ensure authenticated-upload policy exists (owner-scoped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can upload their own resumes'
  ) THEN
    CREATE POLICY "Users can upload their own resumes"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'resumes'
        AND (auth.uid())::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ==========================================
-- Revoke EXECUTE on internal trigger/definer functions from public roles
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_coach() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_new_player() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_profile_rating_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_subscription_status(text) FROM PUBLIC, anon;
-- has_role and is_admin are intentionally left EXECUTABLE by anon/authenticated because they are called
-- inside RLS policy expressions and must be evaluable in every request context.

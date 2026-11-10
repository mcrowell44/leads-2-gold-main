
-- organization_profiles: restrict SELECT to authenticated (owner or admin)
DROP POLICY IF EXISTS "Anyone can view organization profiles" ON public.organization_profiles;
DROP POLICY IF EXISTS "Public can view organization profiles" ON public.organization_profiles;
DROP POLICY IF EXISTS "Organization profiles are viewable by everyone" ON public.organization_profiles;
CREATE POLICY "Authenticated users view organization profiles"
  ON public.organization_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- registration_invites: restrict SELECT to authenticated only
DROP POLICY IF EXISTS "Anyone can view unused invites by code" ON public.registration_invites;
CREATE POLICY "Authenticated can view unused invites by code"
  ON public.registration_invites FOR SELECT TO authenticated
  USING (NOT is_used AND expires_at > now());

-- admin_users: remove bootstrap public insert
DROP POLICY IF EXISTS "Allow first admin bootstrap" ON public.admin_users;
DROP POLICY IF EXISTS "Bootstrap first admin" ON public.admin_users;
DROP POLICY IF EXISTS "Anyone can insert first admin" ON public.admin_users;

-- general_invites: restrict UPDATE to authenticated
DROP POLICY IF EXISTS "Anyone can update invite usage" ON public.general_invites;
CREATE POLICY "Authenticated can update invite usage"
  ON public.general_invites FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- nil_players: enforce ownership on insert
DROP POLICY IF EXISTS "Authenticated users can create NIL players" ON public.nil_players;
CREATE POLICY "Users can create their own NIL players"
  ON public.nil_players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- player_profiles: enforce strict ownership on insert
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.player_profiles;
CREATE POLICY "Users can create their own player profile"
  ON public.player_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- registration_codes: restrict UPDATE to authenticated
DROP POLICY IF EXISTS "Anyone can update registration code usage" ON public.registration_codes;
CREATE POLICY "Authenticated can update registration code usage"
  ON public.registration_codes FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

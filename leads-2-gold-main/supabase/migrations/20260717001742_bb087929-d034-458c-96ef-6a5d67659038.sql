
-- nil_players: restrict SELECT
DROP POLICY IF EXISTS "Everyone can view all NIL players" ON public.nil_players;
DROP POLICY IF EXISTS "Public can view NIL players" ON public.nil_players;
CREATE POLICY "Owners and admins can view NIL players"
  ON public.nil_players FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- players: restrict SELECT
DROP POLICY IF EXISTS "Authenticated users can view player profiles" ON public.players;
CREATE POLICY "Owners and admins can view players"
  ON public.players FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- player_profiles: restrict broad authenticated SELECT
DROP POLICY IF EXISTS "Authenticated users can view all athlete profiles" ON public.player_profiles;
CREATE POLICY "Owners and admins can view player profiles"
  ON public.player_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- registration_invites: remove public/broad SELECT; only creator or admin
DROP POLICY IF EXISTS "Anyone can view unused invites by code" ON public.registration_invites;
DROP POLICY IF EXISTS "Authenticated can view unused invites by code" ON public.registration_invites;
CREATE POLICY "Creators and admins can view registration invites"
  ON public.registration_invites FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR public.is_admin());

-- general_invites: restrict SELECT to creator/admin
DROP POLICY IF EXISTS "Authenticated can view valid invites" ON public.general_invites;
DROP POLICY IF EXISTS "Anyone can view valid invites" ON public.general_invites;
CREATE POLICY "Creators and admins can view general invites"
  ON public.general_invites FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR public.is_admin());

-- registration_codes: restrict SELECT to admins only
DROP POLICY IF EXISTS "Authenticated can view unused registration codes" ON public.registration_codes;
DROP POLICY IF EXISTS "Anyone can view unused registration codes" ON public.registration_codes;
CREATE POLICY "Admins can view registration codes"
  ON public.registration_codes FOR SELECT TO authenticated
  USING (public.is_admin());

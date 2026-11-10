
DROP POLICY IF EXISTS "Allow public resume reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume deletions" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume inserts" ON storage.objects;

DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

DROP POLICY IF EXISTS "Public can view prospects" ON public.prospects;
CREATE POLICY "Admins can view prospects" ON public.prospects
  FOR SELECT USING (public.is_admin(NULL));

DROP POLICY IF EXISTS "Authenticated users can view team messages" ON public.team_messages;
CREATE POLICY "Team members can view team messages" ON public.team_messages
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id::text = team_messages.team_id AND t.created_by = auth.uid())
    OR public.is_admin(NULL)
  );


-- chat_mutes
DROP POLICY IF EXISTS "staff manage mutes" ON public.chat_mutes;
CREATE POLICY "staff manage mutes" ON public.chat_mutes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')));

DROP POLICY IF EXISTS "own or staff mutes readable" ON public.chat_mutes;
CREATE POLICY "own or staff mutes readable" ON public.chat_mutes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')));

-- chat_warnings
DROP POLICY IF EXISTS "own warnings readable" ON public.chat_warnings;
CREATE POLICY "own warnings readable" ON public.chat_warnings FOR SELECT TO authenticated
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')));

DROP POLICY IF EXISTS "staff issue warnings" ON public.chat_warnings;
CREATE POLICY "staff issue warnings" ON public.chat_warnings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')));

-- community_messages
DROP POLICY IF EXISTS "staff moderate chat" ON public.community_messages;
CREATE POLICY "staff moderate chat" ON public.community_messages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('founder','admin','staff','moderator')));

DROP POLICY IF EXISTS "members post chat" ON public.community_messages;
CREATE POLICY "members post chat" ON public.community_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_mutes cm
    WHERE cm.user_id = auth.uid() AND (cm.expires_at IS NULL OR cm.expires_at > now())
  )
);

-- founder-managed tables
DROP POLICY IF EXISTS "founder manages ranks" ON public.ranks;
CREATE POLICY "founder manages ranks" ON public.ranks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

DROP POLICY IF EXISTS "founder manages user ranks" ON public.user_ranks;
CREATE POLICY "founder manages user ranks" ON public.user_ranks FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

DROP POLICY IF EXISTS "founder manages cosmetics" ON public.cosmetics;
CREATE POLICY "founder manages cosmetics" ON public.cosmetics FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

DROP POLICY IF EXISTS "founder manages missions" ON public.mission_templates;
CREATE POLICY "founder manages missions" ON public.mission_templates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

DROP POLICY IF EXISTS "founder manages achievements" ON public.achievements;
CREATE POLICY "founder manages achievements" ON public.achievements FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

DROP POLICY IF EXISTS "founder manages shop" ON public.shop_rotation;
CREATE POLICY "founder manages shop" ON public.shop_rotation FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'founder'));

-- user_roles: role changes are handled server-side with elevated privileges only
DROP POLICY IF EXISTS "founder manages roles" ON public.user_roles;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_muted(uuid) FROM PUBLIC, anon, authenticated;

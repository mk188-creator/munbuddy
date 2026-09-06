
DROP POLICY IF EXISTS "mutes readable" ON public.chat_mutes;
CREATE POLICY "own or staff mutes readable" ON public.chat_mutes FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "reads readable" ON public.chat_reads;
CREATE POLICY "own reads readable" ON public.chat_reads FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can view friend links" ON public.friends;
CREATE POLICY "Members can view own friend links" ON public.friends FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "profiles publicly readable to members" ON public.profiles;
CREATE POLICY "public profiles readable to members" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public_profile = true);

DROP POLICY IF EXISTS "achievements progress readable" ON public.user_achievements;
CREATE POLICY "own achievements progress readable" ON public.user_achievements FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "inventory readable" ON public.user_cosmetics;
CREATE POLICY "own inventory readable" ON public.user_cosmetics FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user ranks readable" ON public.user_ranks;
CREATE POLICY "own user ranks readable" ON public.user_ranks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "stats readable" ON public.user_stats;
CREATE POLICY "own stats readable" ON public.user_stats FOR SELECT TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_gamification() FROM PUBLIC, anon, authenticated;

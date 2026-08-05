-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('founder','admin','staff','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('founder','admin','staff','moderator')
  )
$$;

CREATE POLICY "roles readable by authenticated" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "founder manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'founder'))
  WITH CHECK (public.has_role(auth.uid(), 'founder'));

INSERT INTO public.user_roles (user_id, role)
VALUES ('546171a1-5f9b-4b3a-8384-51e30de761d9','founder')
ON CONFLICT DO NOTHING;

-- ============ PROFILE EXTENSIONS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS equipped_frame uuid,
  ADD COLUMN IF NOT EXISTS equipped_background uuid,
  ADD COLUMN IF NOT EXISTS equipped_title uuid,
  ADD COLUMN IF NOT EXISTS equipped_chat_effect uuid,
  ADD COLUMN IF NOT EXISTS equipped_rank uuid,
  ADD COLUMN IF NOT EXISTS showcase jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.profiles SET username = 'user_' || replace(id::text,'-','') WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username));

CREATE POLICY "profiles publicly readable to members" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- ============ RANKS ============
CREATE TABLE public.ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#34d399',
  icon text NOT NULL DEFAULT 'shield',
  animation text NOT NULL DEFAULT 'none',
  priority integer NOT NULL DEFAULT 0,
  min_level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ranks TO authenticated, anon;
GRANT ALL ON public.ranks TO service_role;
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranks readable" ON public.ranks FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "founder manages ranks" ON public.ranks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder')) WITH CHECK (public.has_role(auth.uid(),'founder'));
CREATE TRIGGER ranks_updated BEFORE UPDATE ON public.ranks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank_id uuid NOT NULL REFERENCES public.ranks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rank_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_ranks TO authenticated;
GRANT ALL ON public.user_ranks TO service_role;
ALTER TABLE public.user_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user ranks readable" ON public.user_ranks FOR SELECT TO authenticated USING (true);
CREATE POLICY "own user ranks insert" ON public.user_ranks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "founder manages user ranks" ON public.user_ranks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'founder'));

INSERT INTO public.ranks (key,label,color,icon,animation,priority,min_level) VALUES
  ('founder','Founder','#f59e0b','crown','rainbow',1000,0),
  ('admin','Administrator','#ef4444','shield-check','glow',900,0),
  ('staff','Staff','#8b5cf6','shield','glow',800,0),
  ('moderator','Moderator','#3b82f6','gavel','none',700,0),
  ('delegate','Delegate','#34d399','user','none',10,1),
  ('diplomat','Diplomat','#22d3ee','handshake','none',20,10),
  ('ambassador','Ambassador','#a78bfa','globe','none',30,25),
  ('secretary-general','Secretary-General','#fbbf24','sparkles','glow',40,50),
  ('legend','MUN Legend','#f472b6','flame','rainbow',50,100)
ON CONFLICT DO NOTHING;

-- ============ STATS ============
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  lifetime_xp bigint NOT NULL DEFAULT 0,
  coins bigint NOT NULL DEFAULT 0,
  crate_keys integer NOT NULL DEFAULT 0,
  login_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0,
  last_login_date date,
  conference_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats readable" ON public.user_stats FOR SELECT TO authenticated USING (true);
CREATE TRIGGER user_stats_updated BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.xp_events TO authenticated;
GRANT ALL ON public.xp_events TO service_role;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp events" ON public.xp_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX xp_events_user_idx ON public.xp_events (user_id, created_at DESC);

INSERT INTO public.user_stats (user_id, level, xp, lifetime_xp, coins, crate_keys)
SELECT id, 1, 0, 0, 250, 1 FROM auth.users
ON CONFLICT DO NOTHING;

-- ============ COSMETICS ============
CREATE TABLE public.cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  price integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  seasonal boolean NOT NULL DEFAULT false,
  founder_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cosmetics TO authenticated, anon;
GRANT ALL ON public.cosmetics TO service_role;
ALTER TABLE public.cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cosmetics readable" ON public.cosmetics FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "founder manages cosmetics" ON public.cosmetics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder')) WITH CHECK (public.has_role(auth.uid(),'founder'));

CREATE TABLE public.user_cosmetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id uuid NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  acquired_from text NOT NULL DEFAULT 'shop',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, cosmetic_id)
);
GRANT SELECT ON public.user_cosmetics TO authenticated;
GRANT ALL ON public.user_cosmetics TO service_role;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory readable" ON public.user_cosmetics FOR SELECT TO authenticated USING (true);

-- ============ CRATES ============
CREATE TABLE public.user_crates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rarity text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rarity)
);
GRANT SELECT ON public.user_crates TO authenticated;
GRANT ALL ON public.user_crates TO service_role;
ALTER TABLE public.user_crates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own crates readable" ON public.user_crates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER user_crates_updated BEFORE UPDATE ON public.user_crates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.crate_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rarity text NOT NULL,
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crate_openings TO authenticated;
GRANT ALL ON public.crate_openings TO service_role;
ALTER TABLE public.crate_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own openings readable" ON public.crate_openings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ MISSIONS ============
CREATE TABLE public.mission_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cadence text NOT NULL DEFAULT 'daily',
  goal integer NOT NULL DEFAULT 1,
  metric text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 50,
  coin_reward integer NOT NULL DEFAULT 25,
  crate_reward text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mission_templates TO authenticated;
GRANT ALL ON public.mission_templates TO service_role;
ALTER TABLE public.mission_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions readable" ON public.mission_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "founder manages missions" ON public.mission_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder')) WITH CHECK (public.has_role(auth.uid(),'founder'));

CREATE TABLE public.user_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.mission_templates(id) ON DELETE CASCADE,
  cadence text NOT NULL DEFAULT 'daily',
  period_start date NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id, period_start)
);
GRANT SELECT ON public.user_missions TO authenticated;
GRANT ALL ON public.user_missions TO service_role;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own missions readable" ON public.user_missions FOR SELECT TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.mission_templates (key,title,description,cadence,goal,metric,xp_reward,coin_reward,crate_reward) VALUES
  ('daily_login','Daily Check-In','Sign in to MUN Hub today.','daily',1,'login',50,25,NULL),
  ('daily_tool','Tool Operator','Run 3 AI tools.','daily',3,'tool_run',120,60,'common'),
  ('daily_chat','Diplomatic Voice','Send 5 messages in community chat.','daily',5,'chat_message',80,40,NULL),
  ('daily_doc','Draft Something','Create or edit 1 document.','daily',1,'document',70,35,NULL),
  ('daily_research','Deep Research','Use a research tool twice.','daily',2,'research',100,50,NULL),
  ('weekly_tools','Committee Grind','Run 20 AI tools this week.','weekly',20,'tool_run',600,300,'rare'),
  ('weekly_speech','Speech Marathon','Generate 5 speeches this week.','weekly',5,'speech',450,220,NULL),
  ('weekly_streak','Consistency','Log in 5 days this week.','weekly',5,'login',500,250,'epic'),
  ('weekly_resolution','Resolution Author','Draft 3 resolutions this week.','weekly',3,'resolution',400,200,NULL),
  ('weekly_community','Community Pillar','Send 40 chat messages this week.','weekly',40,'chat_message',350,180,'rare')
ON CONFLICT DO NOTHING;

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'trophy',
  rarity text NOT NULL DEFAULT 'common',
  metric text NOT NULL DEFAULT 'manual',
  goal integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 100,
  coin_reward integer NOT NULL DEFAULT 50,
  crate_reward text,
  cosmetic_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO authenticated, anon;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements readable" ON public.achievements FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "founder manages achievements" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder')) WITH CHECK (public.has_role(auth.uid(),'founder'));

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements progress readable" ON public.user_achievements FOR SELECT TO authenticated USING (true);

-- ============ SHOP ============
CREATE TABLE public.shop_rotation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_date date NOT NULL,
  cosmetic_id uuid NOT NULL REFERENCES public.cosmetics(id) ON DELETE CASCADE,
  featured boolean NOT NULL DEFAULT false,
  discount_pct integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rotation_date, cosmetic_id)
);
GRANT SELECT ON public.shop_rotation TO authenticated;
GRANT ALL ON public.shop_rotation TO service_role;
ALTER TABLE public.shop_rotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop readable" ON public.shop_rotation FOR SELECT TO authenticated USING (true);
CREATE POLICY "founder manages shop" ON public.shop_rotation FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'founder')) WITH CHECK (public.has_role(auth.uid(),'founder'));

-- ============ COMMUNITY CHAT ============
CREATE TABLE public.community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_url text,
  reply_to uuid REFERENCES public.community_messages(id) ON DELETE SET NULL,
  mentions jsonb NOT NULL DEFAULT '[]'::jsonb,
  pinned boolean NOT NULL DEFAULT false,
  announcement boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX community_messages_created_idx ON public.community_messages (created_at DESC);
CREATE TRIGGER community_messages_updated BEFORE UPDATE ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  muted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_mutes TO authenticated;
GRANT ALL ON public.chat_mutes TO service_role;
ALTER TABLE public.chat_mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mutes readable" ON public.chat_mutes FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff manage mutes" ON public.chat_mutes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_muted(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_mutes
    WHERE user_id = _user_id AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE POLICY "chat readable" ON public.community_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "members post chat" ON public.community_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_muted(auth.uid()));
CREATE POLICY "own message edit" ON public.community_messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff moderate chat" ON public.community_messages FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions readable" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "own reactions write" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reactions delete" ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_reads (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.chat_reads TO authenticated;
GRANT ALL ON public.chat_reads TO service_role;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reads readable" ON public.chat_reads FOR SELECT TO authenticated USING (true);
CREATE POLICY "own read write" ON public.chat_reads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own read update" ON public.chat_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chat_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_warnings TO authenticated;
GRANT ALL ON public.chat_warnings TO service_role;
ALTER TABLE public.chat_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own warnings readable" ON public.chat_warnings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "staff issue warnings" ON public.chat_warnings FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- ============ COSMETIC + ACHIEVEMENT SEEDS ============
INSERT INTO public.cosmetics (key,name,kind,rarity,price,payload,founder_only) VALUES
  ('frame_emerald','Emerald Ring','frame','common',300,'{"ring":"#34d399"}',false),
  ('frame_sapphire','Sapphire Ring','frame','common',300,'{"ring":"#38bdf8"}',false),
  ('frame_gilded','Gilded Laurel','frame','rare',900,'{"ring":"#fbbf24"}',false),
  ('frame_aurora','Aurora Pulse','frame','epic',2200,'{"ring":"aurora","animated":true}',false),
  ('frame_nebula','Nebula Drift','frame','legendary',5000,'{"ring":"nebula","animated":true}',false),
  ('frame_founder_crown','Founder Crown','frame','mythic',0,'{"ring":"rainbow","animated":true,"crown":true}',true),
  ('theme_midnight','Midnight Chamber','theme','common',400,'{"accent":"#34d399"}',false),
  ('theme_crimson','Crimson Assembly','theme','rare',1100,'{"accent":"#f87171"}',false),
  ('theme_royal','Royal Session','theme','epic',2400,'{"accent":"#a78bfa"}',false),
  ('theme_founder','Founder Theme','theme','mythic',0,'{"accent":"rainbow"}',true),
  ('badge_first_speech','First Speech','badge','common',0,'{"icon":"mic"}',false),
  ('badge_verified','Verified Delegate','badge','rare',0,'{"icon":"badge-check"}',false),
  ('badge_founder','Founder Verification','badge','mythic',0,'{"icon":"crown","rainbow":true}',true),
  ('title_delegate','Delegate','title','common',200,'{}',false),
  ('title_negotiator','Master Negotiator','title','rare',800,'{}',false),
  ('title_peacemaker','Peacemaker','title','epic',1800,'{}',false),
  ('title_founder','The Founder','title','mythic',0,'{"rainbow":true}',true),
  ('bg_assembly','General Assembly','background','common',350,'{}',false),
  ('bg_geneva','Geneva Nights','background','rare',950,'{}',false),
  ('bg_cosmos','Diplomatic Cosmos','background','legendary',4200,'{}',false),
  ('chat_glow','Emerald Glow','chat_effect','rare',700,'{"glow":"#34d399"}',false),
  ('chat_rainbow','Rainbow Username','chat_effect','mythic',0,'{"rainbow":true}',true),
  ('sticker_gavel','Gavel Slam','sticker','common',150,'{}',false),
  ('sticker_veto','Veto!','sticker','rare',600,'{}',false),
  ('sticker_unanimous','Unanimous','sticker','epic',1500,'{}',false)
ON CONFLICT DO NOTHING;

INSERT INTO public.achievements (key,title,description,icon,rarity,metric,goal,xp_reward,coin_reward,crate_reward,cosmetic_key) VALUES
  ('first_login','Welcome, Delegate','Sign in for the first time.','door-open','common','login',1,50,50,'common',NULL),
  ('streak_7','Seven-Day Session','Maintain a 7-day login streak.','flame','rare','streak',7,400,200,'rare',NULL),
  ('streak_30','Permanent Delegation','Maintain a 30-day login streak.','flame','legendary','streak',30,2000,1000,'legendary',NULL),
  ('tools_10','Tool Apprentice','Run 10 AI tools.','wrench','common','tool_run',10,150,75,NULL,NULL),
  ('tools_100','Tool Master','Run 100 AI tools.','wrench','epic','tool_run',100,1200,600,'epic',NULL),
  ('speech_1','First Speech','Generate your first speech.','mic','common','speech',1,80,40,NULL,'badge_first_speech'),
  ('resolution_10','Resolution Machine','Draft 10 resolutions.','scroll','rare','resolution',10,500,250,'rare',NULL),
  ('chat_100','Voice of the Floor','Send 100 community messages.','message-circle','rare','chat_message',100,450,220,NULL,NULL),
  ('level_25','Ambassador','Reach level 25.','globe','epic','level',25,900,450,'epic',NULL),
  ('level_50','Secretary-General','Reach level 50.','sparkles','legendary','level',50,2500,1200,'legendary',NULL),
  ('level_100','MUN Legend','Reach level 100.','crown','mythic','level',100,10000,5000,'mythic',NULL),
  ('conference_1','On the Floor','Attend a verified MUN conference.','flag','common','conference',1,300,150,NULL,'badge_verified'),
  ('crates_25','Crate Connoisseur','Open 25 mystery crates.','box','rare','crate_open',25,400,200,'rare',NULL),
  ('founder_ultimate','Ultimate Founder','Build MUN Hub.','crown','mythic','manual',1,0,0,NULL,'badge_founder')
ON CONFLICT DO NOTHING;

-- ============ FOUNDER GRANTS ============
INSERT INTO public.user_ranks (user_id, rank_id)
SELECT '546171a1-5f9b-4b3a-8384-51e30de761d9', id FROM public.ranks
ON CONFLICT DO NOTHING;

INSERT INTO public.user_cosmetics (user_id, cosmetic_id, acquired_from)
SELECT '546171a1-5f9b-4b3a-8384-51e30de761d9', id, 'founder' FROM public.cosmetics
ON CONFLICT DO NOTHING;

INSERT INTO public.user_achievements (user_id, achievement_id, progress, unlocked_at)
SELECT '546171a1-5f9b-4b3a-8384-51e30de761d9', id, goal, now() FROM public.achievements
ON CONFLICT DO NOTHING;

INSERT INTO public.user_crates (user_id, rarity, quantity)
SELECT '546171a1-5f9b-4b3a-8384-51e30de761d9', r, 9999
FROM unnest(ARRAY['common','rare','epic','legendary','mythic']) AS r
ON CONFLICT (user_id, rarity) DO UPDATE SET quantity = 9999;

UPDATE public.user_stats
SET level = 100, xp = 0, lifetime_xp = 9999999, coins = 9999999, crate_keys = 9999
WHERE user_id = '546171a1-5f9b-4b3a-8384-51e30de761d9';

UPDATE public.profiles
SET display_name = COALESCE(NULLIF(full_name,''),'M_Mustafa_khan'),
    username = 'M_Mustafa_khan',
    equipped_rank = (SELECT id FROM public.ranks WHERE key = 'founder')
WHERE id = '546171a1-5f9b-4b3a-8384-51e30de761d9';

-- ============ NEW USER BOOTSTRAP ============
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, coins, crate_keys)
  VALUES (NEW.id, 250, 1) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_ranks (user_id, rank_id)
  SELECT NEW.id, id FROM public.ranks WHERE key = 'delegate' ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_gamification
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_gamification();

REVOKE EXECUTE ON FUNCTION public.handle_new_user_gamification() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.is_muted(uuid) FROM public, anon;
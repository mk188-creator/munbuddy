CREATE TABLE public.conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  logo_url text,
  banner_url text,
  start_date date,
  end_date date,
  venue text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  mode text NOT NULL DEFAULT 'offline',
  registration_url text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  linkedin_url text NOT NULL DEFAULT '',
  twitter_url text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  committees jsonb NOT NULL DEFAULT '[]'::jsonb,
  delegate_fee text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conferences TO authenticated;
GRANT ALL ON public.conferences TO service_role;

ALTER TABLE public.conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published conferences are public" ON public.conferences
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "organizers read own conferences" ON public.conferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "organizers create conferences" ON public.conferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "organizers update own conferences" ON public.conferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "organizers delete own conferences" ON public.conferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER conferences_set_updated_at BEFORE UPDATE ON public.conferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX conferences_start_date_idx ON public.conferences (start_date);

CREATE TABLE public.conference_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conference_id uuid NOT NULL REFERENCES public.conferences(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, conference_id)
);

GRANT SELECT, INSERT, DELETE ON public.conference_bookmarks TO authenticated;
GRANT ALL ON public.conference_bookmarks TO service_role;

ALTER TABLE public.conference_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own bookmarks" ON public.conference_bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
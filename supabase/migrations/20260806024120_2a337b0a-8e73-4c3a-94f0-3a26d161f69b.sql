CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

GRANT SELECT, INSERT, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view friend links"
ON public.friends FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Members can add their own friends"
ON public.friends FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can remove their own friends"
ON public.friends FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX friends_user_idx ON public.friends (user_id);
CREATE INDEX friends_friend_idx ON public.friends (friend_id);
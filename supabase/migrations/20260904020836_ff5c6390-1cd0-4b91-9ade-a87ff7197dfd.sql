CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_name text;
  candidate text;
  suffix int := 0;
  full_name_val text;
BEGIN
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');

  base_name := lower(regexp_replace(
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1), 'delegate'),
    '[^a-zA-Z0-9_]', '', 'g'
  ));
  IF base_name IS NULL OR length(base_name) < 3 THEN
    base_name := 'delegate' || substr(replace(NEW.id::text, '-', ''), 1, 6);
  END IF;
  base_name := substr(base_name, 1, 24);

  candidate := base_name;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
    suffix := suffix + 1;
    candidate := substr(base_name, 1, 20) || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, full_name, avatar_url, username, display_name)
  VALUES (
    NEW.id,
    full_name_val,
    NEW.raw_user_meta_data->>'avatar_url',
    candidate,
    COALESCE(NULLIF(full_name_val, ''), candidate)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $function$;
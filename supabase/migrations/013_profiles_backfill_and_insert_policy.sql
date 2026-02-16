-- Ensure legacy users (created before profile trigger/migrations) get profile rows.
INSERT INTO public.profiles (id, avatar_url)
SELECT
  u.id,
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Allow authenticated users to create their own profile if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = id);
  END IF;
END $$;

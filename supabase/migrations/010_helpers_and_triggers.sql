-- Function to generate a random 6-char invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rank based on missions completed
CREATE OR REPLACE FUNCTION public.calculate_rank(missions_count int)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN missions_count >= 201 THEN 'LENDA'
    WHEN missions_count >= 101 THEN 'VETERANO'
    WHEN missions_count >= 61 THEN 'OPERADOR'
    WHEN missions_count >= 31 THEN 'SÊNIOR'
    WHEN missions_count >= 11 THEN 'AGENTE'
    ELSE 'RECRUTA'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update rank when missions completed changes
CREATE OR REPLACE FUNCTION public.update_rank_on_missions()
RETURNS trigger AS $$
BEGIN
  NEW.rank := public.calculate_rank(NEW.total_missions_completed);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profile_rank
  BEFORE UPDATE OF total_missions_completed ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_rank_on_missions();

-- Function to check vote result for an assigned mission
CREATE OR REPLACE FUNCTION public.check_vote_result(mission_id uuid)
RETURNS text AS $$
DECLARE
  total_members int;
  approve_count int;
  reject_count int;
  majority int;
BEGIN
  -- Get total members in the operation
  SELECT COUNT(*) INTO total_members
  FROM public.operation_members om
  JOIN public.assigned_missions am ON am.operation_id = om.operation_id
  WHERE am.id = mission_id;
  
  -- Get vote counts
  SELECT 
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*) FILTER (WHERE vote = 'reject')
  INTO approve_count, reject_count
  FROM public.votes
  WHERE assigned_mission_id = mission_id;
  
  majority := CEIL(total_members::float / 2);
  
  IF approve_count >= majority THEN RETURN 'approved';
  ELSIF reject_count >= majority THEN RETURN 'rejected';
  ELSE RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Push subscriptions table for notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Favorite photos table
CREATE TABLE IF NOT EXISTS public.favorite_photos (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, assigned_mission_id)
);

ALTER TABLE public.favorite_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.favorite_photos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC helper to atomically add points to an operation member
CREATE OR REPLACE FUNCTION public.add_points_to_member(
  p_operation_id uuid,
  p_user_id uuid,
  p_points int
)
RETURNS void AS $$
BEGIN
  UPDATE public.operation_members
  SET total_points = total_points + COALESCE(p_points, 0)
  WHERE operation_id = p_operation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.add_points_to_member(uuid, uuid, int) TO authenticated;

-- RPC helper to increment profile counters used by API routes
CREATE OR REPLACE FUNCTION public.increment_profile_stat(uid uuid, stat text)
RETURNS void AS $$
BEGIN
  IF stat = 'total_operations' THEN
    UPDATE public.profiles
    SET total_operations = total_operations + 1
    WHERE id = uid;
  ELSIF stat = 'total_missions_completed' THEN
    UPDATE public.profiles
    SET total_missions_completed = total_missions_completed + 1
    WHERE id = uid;
  ELSE
    RAISE EXCEPTION 'Unsupported profile stat: %', stat;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_profile_stat(uuid, text) TO authenticated;

-- Storage bucket used by mission submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-photos',
  'mission-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mission photos are publicly readable'
  ) THEN
    CREATE POLICY "Mission photos are publicly readable"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'mission-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload own mission photos'
  ) THEN
    CREATE POLICY "Users can upload own mission photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can update own mission photos'
  ) THEN
    CREATE POLICY "Users can update own mission photos"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can delete own mission photos'
  ) THEN
    CREATE POLICY "Users can delete own mission photos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'mission-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

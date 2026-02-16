CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES public.profiles(id),
  duration_days int NOT NULL CHECK (duration_days IN (7, 14, 30)),
  daily_reset_hour int NOT NULL DEFAULT 0 CHECK (daily_reset_hour BETWEEN 0 AND 23),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'completed')),
  invite_code text UNIQUE NOT NULL,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator can update their operations"
  ON public.operations FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Authenticated users can create operations"
  ON public.operations FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

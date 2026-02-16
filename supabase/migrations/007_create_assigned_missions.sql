CREATE TABLE public.assigned_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES public.missions(id),
  day_number int NOT NULL,
  category_assigned text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'selected', 'completed', 'failed', 'rejected')),
  photo_url text,
  caption text,
  selected_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.assigned_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view assigned missions in their operations"
  ON public.assigned_missions FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own assigned missions"
  ON public.assigned_missions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assigned missions"
  ON public.assigned_missions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.daily_mission_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  mission_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE (operation_id, day_number)
);

ALTER TABLE public.daily_mission_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pools of their operations"
  ON public.daily_mission_pools FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

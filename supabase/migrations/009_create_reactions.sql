CREATE TABLE public.reactions (
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('funny', 'creative', 'precise', 'bold', 'gross')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (assigned_mission_id, user_id, reaction_type)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions in their operations"
  ON public.reactions FOR SELECT
  TO authenticated
  USING (
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can react to missions in their operations"
  ON public.reactions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reactions"
  ON public.reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

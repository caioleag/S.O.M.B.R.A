CREATE TABLE public.votes (
  assigned_mission_id uuid NOT NULL REFERENCES public.assigned_missions(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (assigned_mission_id, voter_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes in their operations"
  ON public.votes FOR SELECT
  TO authenticated
  USING (
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can vote on missions in their operations"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = auth.uid() AND
    assigned_mission_id IN (
      SELECT am.id FROM public.assigned_missions am
      JOIN public.operation_members om ON om.operation_id = am.operation_id
      WHERE om.user_id = auth.uid()
    )
  );

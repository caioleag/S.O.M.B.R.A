CREATE TABLE public.operation_members (
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  total_points int DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (operation_id, user_id)
);

ALTER TABLE public.operation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members of same operation can view members"
  ON public.operation_members FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT operation_id FROM public.operation_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own membership"
  ON public.operation_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can join operations"
  ON public.operation_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

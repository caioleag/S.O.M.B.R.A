-- Allow operation creators to read their own operation row immediately after insert
-- (before membership insert), preventing RLS failure on INSERT ... RETURNING.
DROP POLICY IF EXISTS "Members can view their operations" ON public.operations;

CREATE POLICY "Members can view their operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (
    creator_id = (select auth.uid())
    OR public.is_operation_member(id)
  );

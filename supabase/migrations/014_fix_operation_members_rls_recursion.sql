-- Avoid recursive RLS evaluation between operation_members and operations.
CREATE OR REPLACE FUNCTION public.is_operation_member(
  p_operation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.operation_members om
    WHERE om.operation_id = p_operation_id
      AND om.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_operation_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_operation_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Members of same operation can view members" ON public.operation_members;
CREATE POLICY "Members of same operation can view members"
  ON public.operation_members FOR SELECT
  TO authenticated
  USING (public.is_operation_member(operation_id));

DROP POLICY IF EXISTS "Members can view their operations" ON public.operations;
CREATE POLICY "Members can view their operations"
  ON public.operations FOR SELECT
  TO authenticated
  USING (public.is_operation_member(id));

-- Secure join workflow that bypasses recursive RLS constraints safely.
CREATE OR REPLACE FUNCTION public.join_operation_by_code(
  p_code text,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text;
  target_operation public.operations%ROWTYPE;
  members_count int;
BEGIN
  normalized_code := upper(trim(coalesce(p_code, '')));

  SELECT *
  INTO target_operation
  FROM public.operations o
  WHERE o.invite_code = normalized_code
  LIMIT 1;

  IF target_operation.id IS NULL THEN
    RAISE EXCEPTION 'OP_NOT_FOUND';
  END IF;

  IF target_operation.status = 'completed' THEN
    RAISE EXCEPTION 'OP_COMPLETED';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.operation_members om
    JOIN public.operations o ON o.id = om.operation_id
    WHERE om.user_id = p_user_id
      AND o.status IN ('inactive', 'active')
      AND om.operation_id <> target_operation.id
  ) THEN
    RAISE EXCEPTION 'ALREADY_IN_ACTIVE_OPERATION';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.operation_members om
    WHERE om.operation_id = target_operation.id
      AND om.user_id = p_user_id
  ) THEN
    RETURN target_operation.id;
  END IF;

  SELECT COUNT(*) INTO members_count
  FROM public.operation_members om
  WHERE om.operation_id = target_operation.id;

  IF members_count >= 5 THEN
    RAISE EXCEPTION 'OP_FULL';
  END IF;

  INSERT INTO public.operation_members (operation_id, user_id, role)
  VALUES (target_operation.id, p_user_id, 'member');

  RETURN target_operation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_operation_by_code(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_operation_by_code(text, uuid) TO authenticated;

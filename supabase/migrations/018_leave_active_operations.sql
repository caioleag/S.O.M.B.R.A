-- Função para transferir a liderança de uma operação para outro membro aleatório
CREATE OR REPLACE FUNCTION public.transfer_operation_leadership(
  p_operation_id uuid,
  p_current_creator_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_creator_id uuid;
BEGIN
  -- Seleciona um membro aleatório que não seja o criador atual
  SELECT user_id INTO new_creator_id
  FROM public.operation_members
  WHERE operation_id = p_operation_id
    AND user_id <> p_current_creator_id
  ORDER BY random()
  LIMIT 1;

  -- Se não houver outros membros, retorna null
  IF new_creator_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Atualiza o criador da operação
  UPDATE public.operations
  SET creator_id = new_creator_id
  WHERE id = p_operation_id;

  -- Atualiza o papel do novo criador em operation_members
  UPDATE public.operation_members
  SET role = 'creator'
  WHERE operation_id = p_operation_id
    AND user_id = new_creator_id;

  RETURN new_creator_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_operation_leadership(uuid, uuid) TO authenticated;

-- Função melhorada para sair de uma operação (permite sair de operações ativas)
CREATE OR REPLACE FUNCTION public.leave_operation(
  p_operation_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  operation_data public.operations%ROWTYPE;
  is_creator boolean;
  new_creator_id uuid;
  members_count int;
BEGIN
  -- Busca informações da operação
  SELECT * INTO operation_data
  FROM public.operations
  WHERE id = p_operation_id;

  IF operation_data.id IS NULL THEN
    RAISE EXCEPTION 'OPERATION_NOT_FOUND';
  END IF;

  -- Verifica se é o criador
  is_creator := (operation_data.creator_id = p_user_id);

  -- Conta quantos membros existem
  SELECT COUNT(*) INTO members_count
  FROM public.operation_members
  WHERE operation_id = p_operation_id;

  -- Se é o criador e há outros membros, transfere a liderança
  IF is_creator AND members_count > 1 THEN
    new_creator_id := public.transfer_operation_leadership(p_operation_id, p_user_id);
    
    IF new_creator_id IS NULL THEN
      RAISE EXCEPTION 'FAILED_TO_TRANSFER_LEADERSHIP';
    END IF;
  END IF;

  -- Remove o membro da operação
  DELETE FROM public.operation_members
  WHERE operation_id = p_operation_id
    AND user_id = p_user_id;

  -- Se era o último membro, marca a operação como cancelada
  IF members_count = 1 THEN
    UPDATE public.operations
    SET status = 'cancelled'
    WHERE id = p_operation_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'operation_cancelled', true,
      'leadership_transferred', false
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'operation_cancelled', false,
    'leadership_transferred', is_creator,
    'new_creator_id', new_creator_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_operation(uuid, uuid) TO authenticated;

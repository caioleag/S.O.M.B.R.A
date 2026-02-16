-- Função para garantir que existe um pool de missões para o dia atual de uma operação
-- Esta função é chamada quando um usuário entra em uma operação ativa para que
-- ele tenha acesso imediato às missões, sem precisar esperar a próxima virada
CREATE OR REPLACE FUNCTION public.ensure_daily_mission_pool(
  p_operation_id uuid,
  p_day_number int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_pool_id uuid;
  selected_missions uuid[];
  all_missions_data record[];
  category_chosen text;
  categories text[] := ARRAY['vigilancia', 'coleta', 'infiltracao', 'disfarce', 'reconhecimento'];
  category_missions uuid[];
  easy_missions uuid[];
  medium_missions uuid[];
  hard_missions uuid[];
  remaining_missions uuid[];
  new_pool_id uuid;
BEGIN
  -- Verifica se já existe um pool para esta operação e dia
  SELECT id INTO existing_pool_id
  FROM public.daily_mission_pools
  WHERE operation_id = p_operation_id
    AND day_number = p_day_number
  LIMIT 1;

  -- Se já existe, retorna o ID existente
  IF existing_pool_id IS NOT NULL THEN
    RETURN existing_pool_id;
  END IF;

  -- Busca todas as missões disponíveis
  SELECT ARRAY_AGG(ROW(id, category, difficulty)::record)
  INTO all_missions_data
  FROM public.missions;

  IF all_missions_data IS NULL OR array_length(all_missions_data, 1) = 0 THEN
    RAISE EXCEPTION 'NO_MISSIONS_AVAILABLE';
  END IF;

  -- Sorteia uma categoria aleatória
  category_chosen := categories[1 + floor(random() * array_length(categories, 1))::int];

  -- Filtra missões da categoria escolhida e seleciona por dificuldade
  -- 3 fáceis, 3 médias, 3 difíceis
  
  SELECT ARRAY_AGG(m.id ORDER BY random())
  INTO easy_missions
  FROM public.missions m
  WHERE m.category = category_chosen
    AND m.difficulty = 'easy'
  LIMIT 3;

  SELECT ARRAY_AGG(m.id ORDER BY random())
  INTO medium_missions
  FROM public.missions m
  WHERE m.category = category_chosen
    AND m.difficulty = 'medium'
  LIMIT 3;

  SELECT ARRAY_AGG(m.id ORDER BY random())
  INTO hard_missions
  FROM public.missions m
  WHERE m.category = category_chosen
    AND m.difficulty = 'hard'
  LIMIT 3;

  -- Combina as missões selecionadas
  selected_missions := COALESCE(easy_missions, '{}') || 
                       COALESCE(medium_missions, '{}') || 
                       COALESCE(hard_missions, '{}');

  -- Se não temos 9 missões, completa com missões aleatórias de qualquer categoria
  IF array_length(selected_missions, 1) < 9 THEN
    SELECT ARRAY_AGG(m.id ORDER BY random())
    INTO remaining_missions
    FROM public.missions m
    WHERE NOT (m.id = ANY(selected_missions))
    LIMIT (9 - COALESCE(array_length(selected_missions, 1), 0));

    selected_missions := selected_missions || COALESCE(remaining_missions, '{}');
  END IF;

  -- Garante que temos ao menos algumas missões
  IF array_length(selected_missions, 1) = 0 THEN
    RAISE EXCEPTION 'FAILED_TO_SELECT_MISSIONS';
  END IF;

  -- Cria o pool de missões do dia
  INSERT INTO public.daily_mission_pools (
    operation_id,
    day_number,
    mission_ids
  )
  VALUES (
    p_operation_id,
    p_day_number,
    selected_missions
  )
  RETURNING id INTO new_pool_id;

  RETURN new_pool_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_daily_mission_pool(uuid, int) TO authenticated;

-- Atualiza a função join_operation_by_code para garantir que o pool de missões
-- seja criado quando um usuário entra em uma operação ativa
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
  current_day int;
  pool_id uuid;
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

  -- Se a operação está ativa, garante que existe um pool de missões para o dia atual
  -- para que o novo membro tenha acesso imediato às missões
  IF target_operation.status = 'active' AND target_operation.started_at IS NOT NULL THEN
    current_day := public.calculate_operation_day(
      target_operation.started_at,
      target_operation.daily_reset_hour,
      now()
    );
    
    -- Cria o pool se não existir (função retorna ID existente se já existe)
    pool_id := public.ensure_daily_mission_pool(target_operation.id, current_day);
  END IF;

  RETURN target_operation.id;
END;
$$;

-- Recria as permissões
REVOKE ALL ON FUNCTION public.join_operation_by_code(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_operation_by_code(text, uuid) TO authenticated;

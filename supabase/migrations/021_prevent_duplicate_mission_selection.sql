-- Previne race condition ao selecionar missões
-- Garante que usuário só pode ter 1 missão 'selected' por dia na mesma operação

-- Cria índice único parcial (só valida quando status = 'selected')
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_selected_mission_per_user_day
  ON public.assigned_missions (operation_id, user_id, day_number)
  WHERE status = 'selected';

-- Agora se duas requisições simultâneas tentarem inserir, apenas 1 funcionará
-- A segunda receberá erro "duplicate key value violates unique constraint"

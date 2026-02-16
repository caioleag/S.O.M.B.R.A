-- Track mission vote outcomes to avoid duplicated score attribution
ALTER TABLE public.assigned_missions
  ADD COLUMN IF NOT EXISTS scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision text CHECK (decision IN ('approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_assigned_missions_operation_status
  ON public.assigned_missions (operation_id, status, scored_at);

-- Tracks daily push dispatch by operation/day/type to avoid duplicate sends
CREATE TABLE IF NOT EXISTS public.operation_notification_log (
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  notification_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (operation_id, day_number, notification_type)
);

ALTER TABLE public.operation_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view operation notification log"
  ON public.operation_notification_log FOR SELECT
  TO authenticated
  USING (
    operation_id IN (
      SELECT om.operation_id
      FROM public.operation_members om
      WHERE om.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.badge_name_for_reaction(p_reaction_type text)
RETURNS text AS $$
BEGIN
  RETURN CASE p_reaction_type
    WHEN 'funny' THEN 'Arquivo Comico'
    WHEN 'creative' THEN 'Mente Criativa'
    WHEN 'precise' THEN 'Mira Cirurgica'
    WHEN 'bold' THEN 'Audacia Tatica'
    WHEN 'gross' THEN 'Resistencia Extrema'
    ELSE 'Condecoracao Especial'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.award_operation_badges(p_operation_id uuid)
RETURNS jsonb AS $$
DECLARE
  winner record;
  awarded jsonb := '[]'::jsonb;
BEGIN
  FOR winner IN
    WITH reaction_counts AS (
      SELECT
        r.user_id,
        r.reaction_type,
        COUNT(*)::int AS reaction_count
      FROM public.reactions r
      JOIN public.assigned_missions am ON am.id = r.assigned_mission_id
      WHERE am.operation_id = p_operation_id
      GROUP BY r.user_id, r.reaction_type
    ),
    max_counts AS (
      SELECT reaction_type, MAX(reaction_count) AS max_count
      FROM reaction_counts
      GROUP BY reaction_type
    )
    SELECT
      rc.user_id,
      rc.reaction_type,
      rc.reaction_count
    FROM reaction_counts rc
    JOIN max_counts mc
      ON mc.reaction_type = rc.reaction_type
     AND mc.max_count = rc.reaction_count
    WHERE rc.reaction_count > 0
  LOOP
    UPDATE public.profiles p
    SET badges_earned = COALESCE(p.badges_earned, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'type', winner.reaction_type,
        'name', public.badge_name_for_reaction(winner.reaction_type),
        'operation_id', p_operation_id::text,
        'earned_at', now()
      )
    )
    WHERE p.id = winner.user_id
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(p.badges_earned, '[]'::jsonb)) badge
        WHERE badge->>'type' = winner.reaction_type
          AND badge->>'operation_id' = p_operation_id::text
      );

    awarded := awarded || jsonb_build_array(
      jsonb_build_object(
        'user_id', winner.user_id,
        'type', winner.reaction_type,
        'count', winner.reaction_count
      )
    );
  END LOOP;

  RETURN awarded;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.award_operation_badges(uuid) TO authenticated;

-- Utility to calculate current operation day respecting reset hour
CREATE OR REPLACE FUNCTION public.calculate_operation_day(
  p_started_at timestamptz,
  p_reset_hour int,
  p_now timestamptz DEFAULT now()
)
RETURNS int AS $$
DECLARE
  start_day timestamptz;
BEGIN
  start_day := date_trunc('day', p_started_at) + make_interval(hours => p_reset_hour);
  RETURN GREATEST(1, FLOOR(EXTRACT(EPOCH FROM (p_now - start_day)) / 86400)::int + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

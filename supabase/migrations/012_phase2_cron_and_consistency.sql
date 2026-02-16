-- Install required extensions for scheduled HTTP invocation from Postgres.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Keep rank naming normalized to ASCII to avoid encoding drift across environments.
CREATE OR REPLACE FUNCTION public.calculate_rank(missions_count int)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN missions_count >= 201 THEN 'LENDA'
    WHEN missions_count >= 101 THEN 'VETERANO'
    WHEN missions_count >= 61 THEN 'OPERADOR'
    WHEN missions_count >= 31 THEN 'SENIOR'
    WHEN missions_count >= 11 THEN 'AGENTE'
    ELSE 'RECRUTA'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE public.profiles
SET rank = 'SENIOR'
WHERE UPPER(COALESCE(rank, '')) LIKE '%NIOR%'
  AND UPPER(COALESCE(rank, '')) <> 'SENIOR';

-- Preserve vote-majority behavior by using explicit voter majority (excluding submitter).
CREATE OR REPLACE FUNCTION public.check_vote_result(mission_id uuid)
RETURNS text AS $$
DECLARE
  total_members int;
  approve_count int;
  reject_count int;
  majority int;
BEGIN
  SELECT COUNT(*) INTO total_members
  FROM public.operation_members om
  JOIN public.assigned_missions am ON am.operation_id = om.operation_id
  WHERE am.id = mission_id;

  SELECT
    COUNT(*) FILTER (WHERE vote = 'approve'),
    COUNT(*) FILTER (WHERE vote = 'reject')
  INTO approve_count, reject_count
  FROM public.votes
  WHERE assigned_mission_id = mission_id;

  majority := FLOOR(GREATEST(total_members - 1, 1)::numeric / 2)::int + 1;

  IF approve_count >= majority THEN
    RETURN 'approved';
  ELSIF reject_count >= majority THEN
    RETURN 'rejected';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate cron jobs idempotently.
DO $$
DECLARE
  job_record record;
BEGIN
  FOR job_record IN
    SELECT jobid
    FROM cron.job
    WHERE jobname IN (
      'sombra_complete_operations',
      'sombra_cleanup_completed_operations',
      'sombra_notify_daily_missions'
    )
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'sombra_complete_operations',
    '*/10 * * * *',
    $job$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/complete-operations-cron',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$
  );

  PERFORM cron.schedule(
    'sombra_cleanup_completed_operations',
    '30 3 * * *',
    $job$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/cleanup-completed-operations',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$
  );

  PERFORM cron.schedule(
    'sombra_notify_daily_missions',
    '2 * * * *',
    $job$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-daily-missions',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$
  );
END $$;

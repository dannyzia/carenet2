-- Schedule marketplace-expire-bids Edge Function via pg_cron + pg_net.
-- Runs every 30 minutes and is safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname = 'marketplace-expire-bids' LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'marketplace-expire-bids',
    '*/30 * * * *',
    $job$
      SELECT net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/marketplace-expire-bids',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
    $job$
  );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'marketplace-expire-bids: cron.job not found (pg_cron disabled?)';
  WHEN undefined_function THEN
    RAISE NOTICE 'marketplace-expire-bids: cron.schedule or net.http_post unavailable';
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'marketplace-expire-bids: insufficient privileges to schedule cron job';
END $$;


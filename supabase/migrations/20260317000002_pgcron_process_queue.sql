-- ───────────────────────────────────────────────────────
-- CareNet: pg_cron job to process queued notifications
-- Runs every minute and calls the process-queued-notifications
-- Edge Function via pg_net (Supabase's HTTP extension).
--
-- Prerequisites:
--   1. Enable pg_cron and pg_net extensions in Supabase dashboard
--   2. Replace <YOUR_SUPABASE_URL> and <YOUR_SERVICE_ROLE_KEY> below
--
-- To disable:
--   SELECT cron.unschedule('process-queued-notifications');
-- ───────────────────────────────────────────────────────

-- Enable required extensions (may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the job to run every minute
SELECT cron.schedule(
  'process-queued-notifications',   -- job name
  '* * * * *',                      -- every minute
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/process-queued-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- NOTE: If current_setting('app.settings.supabase_url') is not available
-- in your Supabase project, replace the schedule above with hardcoded values:
--
-- SELECT cron.schedule(
--   'process-queued-notifications',
--   '* * * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-queued-notifications',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
--         'Content-Type', 'application/json'
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );

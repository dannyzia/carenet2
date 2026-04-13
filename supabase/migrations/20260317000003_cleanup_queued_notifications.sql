-- ───────────────────────────────────────────────────────
-- CareNet: pg_cron job to purge processed queued_notifications
-- older than 7 days. Runs daily at 03:00 UTC.
-- ───────────────────────────────────────────────────────

SELECT cron.schedule(
  'cleanup-queued-notifications',   -- job name
  '0 3 * * *',                      -- daily at 03:00 UTC
  $$
    DELETE FROM queued_notifications
    WHERE processed = true
      AND created_at < NOW() - INTERVAL '7 days';
  $$
);

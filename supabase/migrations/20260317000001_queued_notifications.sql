-- ───────────────────────────────────────────────────────
-- CareNet: queued_notifications for quiet hours deferral
-- Notifications that arrived during quiet hours are queued
-- here and delivered (native push only) when quiet hours end.
-- A pg_cron job or scheduled Edge Function processes this table.
-- ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS queued_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deliver_at      TIMESTAMPTZ NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queued_pending
  ON queued_notifications (deliver_at)
  WHERE processed = FALSE;

ALTER TABLE queued_notifications ENABLE ROW LEVEL SECURITY;

-- Service role (Edge Functions / cron) can read and update
CREATE POLICY "Service role manages queued notifications"
  ON queued_notifications FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

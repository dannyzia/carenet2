-- ───────────────────────────────────────────────────────
-- CareNet: notifications + user_preferences + device_tokens
-- Run in Supabase SQL Editor or via `supabase db push`
-- ───────────────────────────────────────────────────────

-- ── 1. notifications table ──
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL,          -- e.g. 'billing_proof_submitted'
  channel       TEXT NOT NULL,          -- e.g. 'billing', 'shift-reminders'
  title_en      TEXT NOT NULL,
  title_bn      TEXT NOT NULL DEFAULT '',
  message_en    TEXT NOT NULL,
  message_bn    TEXT NOT NULL DEFAULT '',
  sender_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_url    TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the Realtime filter: type ILIKE 'billing_%'
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications (receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (receiver_id) WHERE read = FALSE;

-- RLS: users can only read their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Service role (Edge Function) can insert
CREATE POLICY "Service role inserts notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);  -- Edge Function uses service_role key

-- Enable Realtime on notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── 2. user_preferences table ──
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_channels  JSONB NOT NULL DEFAULT '{}',
  -- Example: { "billing": { "enabled": false, "push": true, "sms": false, "inapp": true } }
  quiet_hours_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start      TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end        TIME NOT NULL DEFAULT '07:00',
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 3. device_tokens table (for FCM/APNs push) ──
CREATE TABLE IF NOT EXISTS device_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('fcm', 'apns')),
  token       TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens (user_id) WHERE active = TRUE;

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own device tokens"
  ON device_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read for push delivery
CREATE POLICY "Service role reads device tokens"
  ON device_tokens FOR SELECT
  USING (TRUE);

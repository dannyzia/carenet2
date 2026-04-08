-- ═══════════════════════════════════════════════════════════════════════
-- CareNet Migration 03: Moderation Tables
-- ═══════════════════════════════════════════════════════════════════════
-- Run AFTER 02_views_and_rpcs.sql in Supabase SQL Editor.
--
-- Creates tables for the moderator role:
--   • moderation_queue       — items flagged for review
--   • flagged_content        — specific content flagged by users
--   • moderator_sanctions    — warnings, mutes, suspensions, bans
--   • moderator_escalations  — items escalated to admin/senior mods
--   • contract_disputes      — disputes between parties on contracts
--   • dispute_messages       — conversation thread within a dispute
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Drop existing tables (safe re-run) ───
DROP TABLE IF EXISTS dispute_messages CASCADE;
DROP TABLE IF EXISTS contract_disputes CASCADE;
DROP TABLE IF EXISTS moderator_escalations CASCADE;
DROP TABLE IF EXISTS moderator_sanctions CASCADE;
DROP TABLE IF EXISTS flagged_content CASCADE;
DROP TABLE IF EXISTS moderation_queue CASCADE;

-- ─── 1. Moderation Queue ───
CREATE TABLE moderation_queue (
  id            bigserial PRIMARY KEY,
  type          text NOT NULL CHECK (type IN ('review', 'content', 'profile', 'message', 'incident', 'document')),
  content       text NOT NULL DEFAULT '',
  reporter_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name text,
  target_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_name   text,
  reference_id  text,              -- ID of the source entity (review id, message id, etc.)
  reference_type text,             -- Type of source entity
  priority      text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed', 'escalated')),
  assigned_to   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at   timestamptz,
  resolution    text,
  auto_flagged  boolean NOT NULL DEFAULT false,   -- true if flagged by system rules
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modqueue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_modqueue_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_modqueue_target ON moderation_queue(target_id);
CREATE INDEX IF NOT EXISTS idx_modqueue_assigned ON moderation_queue(assigned_to);


-- ─── 2. Flagged Content ───
CREATE TABLE flagged_content (
  id              bigserial PRIMARY KEY,
  content_type    text NOT NULL CHECK (content_type IN ('review', 'message', 'care_note', 'blog_post', 'profile_bio', 'incident_report')),
  content_id      text NOT NULL,             -- UUID or ID of the flagged entity
  content_snippet text NOT NULL DEFAULT '',  -- Preview of the content
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_name text,
  reporter_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name   text,
  reason          text NOT NULL CHECK (reason IN (
    'inappropriate', 'spam', 'harassment', 'misinformation',
    'privacy_violation', 'fraudulent', 'offensive_language', 'other'
  )),
  severity        text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details         text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed', 'action_taken')),
  action_taken    text,   -- What was done (e.g., "content removed", "warning issued")
  reviewed_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  queue_item_id   bigint REFERENCES moderation_queue(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flagged_status ON flagged_content(status);
CREATE INDEX IF NOT EXISTS idx_flagged_target ON flagged_content(target_user_id);
CREATE INDEX IF NOT EXISTS idx_flagged_type ON flagged_content(content_type);


-- ─── 3. Moderator Sanctions ───
CREATE TABLE moderator_sanctions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name    text NOT NULL,
  user_role    text NOT NULL,
  type         text NOT NULL CHECK (type IN ('warning', 'mute', 'suspension', 'ban')),
  reason       text NOT NULL,
  evidence_ids text[] DEFAULT '{}',       -- IDs of related flagged_content or queue items
  issued_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text NOT NULL,
  issued_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,               -- NULL = permanent (for bans)
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'appealed')),
  revoked_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at   timestamptz,
  revoke_reason text,
  appeal_text  text,
  appeal_at    timestamptz,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sanction_user ON moderator_sanctions(user_id);
CREATE INDEX IF NOT EXISTS idx_sanction_status ON moderator_sanctions(status);
CREATE INDEX IF NOT EXISTS idx_sanction_type ON moderator_sanctions(type);
CREATE INDEX IF NOT EXISTS idx_sanction_expires ON moderator_sanctions(expires_at) WHERE expires_at IS NOT NULL;


-- ─── 4. Moderator Escalations ───
CREATE TABLE moderator_escalations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     text NOT NULL CHECK (source_type IN ('report', 'review', 'content', 'sanction', 'dispute')),
  source_id       text NOT NULL,             -- ID of the source entity
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  priority        text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  escalated_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  escalated_by_name text NOT NULL,
  escalated_at    timestamptz NOT NULL DEFAULT now(),
  assigned_to     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name text,
  resolved_at     timestamptz,
  resolved_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalation_status ON moderator_escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalation_priority ON moderator_escalations(priority);
CREATE INDEX IF NOT EXISTS idx_escalation_assigned ON moderator_escalations(assigned_to);


-- ─── 5. Contract Disputes ───
CREATE TABLE contract_disputes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     text NOT NULL,               -- care_contract ID
  filed_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  filed_by_name   text NOT NULL,
  filed_by_role   text NOT NULL,
  against_party   text NOT NULL,               -- name of the opposing party
  against_party_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason          text NOT NULL CHECK (reason IN (
    'billing', 'service_quality', 'no_show', 'breach_of_contract',
    'safety_concern', 'communication', 'cancellation', 'other'
  )),
  description     text NOT NULL DEFAULT '',
  evidence        text[] DEFAULT '{}',         -- URLs to uploaded evidence
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'mediation', 'resolved', 'closed')),
  priority        text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_mediator uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mediator_name   text,
  filed_at        timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  resolution      text,
  resolution_type text CHECK (resolution_type IN ('refund', 'partial_refund', 'warning', 'contract_cancelled', 'dismissed', 'mutual_agreement')),
  refund_amount   numeric,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_status ON contract_disputes(status);
CREATE INDEX IF NOT EXISTS idx_dispute_filed_by ON contract_disputes(filed_by);
CREATE INDEX IF NOT EXISTS idx_dispute_contract ON contract_disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_dispute_mediator ON contract_disputes(assigned_mediator);


-- ─── 6. Dispute Messages ───
CREATE TABLE dispute_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id       uuid NOT NULL REFERENCES contract_disputes(id) ON DELETE CASCADE,
  sender_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name      text NOT NULL,
  sender_role      text NOT NULL,
  message          text NOT NULL,
  is_system_message boolean NOT NULL DEFAULT false,
  attachments      text[] DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispmsg_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispmsg_created ON dispute_messages(created_at);


-- ─── 7. Auto-updated_at triggers ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'moderation_queue', 'flagged_content', 'moderator_sanctions',
    'moderator_escalations', 'contract_disputes'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_updated_at ON %I; CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END;
$$;


-- ─── 8. Auto-expire sanctions ───
-- Cron job (via pg_cron or Supabase scheduled function) to expire sanctions:
-- Run daily: SELECT expire_sanctions();
CREATE OR REPLACE FUNCTION expire_sanctions()
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  expired_count int;
BEGIN
  UPDATE moderator_sanctions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;


-- ─── 9. Auto-create queue item when content is flagged ───
CREATE OR REPLACE FUNCTION auto_queue_flagged_content()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  queue_id bigint;
BEGIN
  INSERT INTO moderation_queue (
    type, content, reporter_id, reporter_name,
    target_id, target_name, reference_id, reference_type,
    priority, status, auto_flagged
  ) VALUES (
    'content',
    left(NEW.content_snippet, 200),
    NEW.reporter_id,
    NEW.reporter_name,
    NEW.target_user_id,
    NEW.target_user_name,
    NEW.content_id,
    NEW.content_type,
    NEW.severity,
    'pending',
    false
  )
  RETURNING id INTO queue_id;

  -- Link back to queue
  UPDATE flagged_content SET queue_item_id = queue_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_queue_flagged ON flagged_content;
CREATE TRIGGER trigger_auto_queue_flagged
  AFTER INSERT ON flagged_content
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_flagged_content();


-- ─── 10. Moderation Views ───

-- Moderator dashboard queue (enriched)
CREATE OR REPLACE VIEW moderation_dashboard_queue AS
SELECT
  mq.id,
  mq.type,
  mq.content,
  mq.reporter_name,
  mq.target_name,
  mq.priority,
  mq.status,
  mq.auto_flagged,
  mq.created_at,
  mq.assigned_to,
  -- Count of related flags
  (SELECT count(*) FROM flagged_content fc WHERE fc.queue_item_id = mq.id)::int AS flag_count,
  -- Time since created
  extract(epoch FROM (now() - mq.created_at)) / 3600 AS hours_pending
FROM moderation_queue mq
WHERE mq.status IN ('pending', 'in_review')
ORDER BY
  CASE mq.priority
    WHEN 'critical' THEN 0
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  mq.created_at;

-- Moderation stats
CREATE OR REPLACE VIEW moderation_stats AS
SELECT
  (SELECT count(*) FROM moderation_queue WHERE status = 'pending')::int        AS pending_queue,
  (SELECT count(*) FROM moderation_queue WHERE status = 'in_review')::int      AS in_review,
  (SELECT count(*) FROM moderation_queue WHERE status = 'resolved'
    AND resolved_at >= current_date)::int                                       AS resolved_today,
  (SELECT count(*) FROM flagged_content WHERE status = 'pending')::int         AS pending_flags,
  (SELECT count(*) FROM moderator_sanctions WHERE status = 'active')::int      AS active_sanctions,
  (SELECT count(*) FROM moderator_escalations WHERE status = 'pending')::int   AS pending_escalations,
  (SELECT count(*) FROM contract_disputes WHERE status IN ('open', 'under_review', 'mediation'))::int AS open_disputes;


-- ─── 11. Seed moderation demo data ───

-- Queue items
INSERT INTO moderation_queue (type, content, reporter_name, target_name, priority, status, auto_flagged, created_at) VALUES
('review', 'Suspicious 5-star review with generic text and no specifics. Possible fake review.', 'System', 'Unknown Reviewer', 'medium', 'pending', true, '2026-03-17T14:00:00Z'),
('content', 'Profile bio contains promotional links to external services.', 'Mock_Rashed Hossain', 'John Doe', 'low', 'pending', false, '2026-03-17T10:30:00Z'),
('message', 'Reported message contains threatening language toward a caregiver.', 'Karim Uddin', 'Anonymous User', 'high', 'in_review', false, '2026-03-16T22:00:00Z'),
('profile', 'Profile photo appears to be stolen from stock photo site.', 'System', 'Fake Caregiver', 'critical', 'pending', true, '2026-03-18T06:00:00Z'),
('incident', 'Incident report flagged for inconsistencies between description and GPS data.', 'System', 'Karim Uddin', 'medium', 'pending', true, '2026-03-17T09:00:00Z')
ON CONFLICT DO NOTHING;

-- Flagged content
INSERT INTO flagged_content (content_type, content_id, content_snippet, target_user_name, reporter_name, reason, severity, status, created_at) VALUES
('review', 'CA000000-0000-0000-0000-000000000001', 'Amazing perfect best caregiver ever nothing bad to say...', 'Unknown', 'System', 'spam', 'medium', 'pending', '2026-03-17T14:00:00Z'),
('message', '81000000-0000-0000-0000-000000000008', 'Threatening message content...', 'Anonymous User', 'Karim Uddin', 'harassment', 'high', 'pending', '2026-03-16T22:00:00Z'),
('profile_bio', '00000000-0000-0000-0000-000000000001', 'Visit mysite.com for better rates! Use code SAVE20...', 'John Doe', 'Mock_Rashed Hossain', 'spam', 'low', 'pending', '2026-03-17T10:30:00Z')
ON CONFLICT DO NOTHING;

-- Sanctions
INSERT INTO moderator_sanctions (user_id, user_name, user_role, type, reason, issued_by, issued_by_name, expires_at, status, notes) VALUES
('00000000-0000-0000-0000-000000000008', 'Multi-Role Demo', 'guardian', 'warning', 'First violation: posted inappropriate review content', '00000000-0000-0000-0000-000000000006', 'Mod User', NULL, 'active', 'Verbal warning — content removed and user notified.')
ON CONFLICT DO NOTHING;

-- Escalations
INSERT INTO moderator_escalations (source_type, source_id, title, description, priority, status, escalated_by, escalated_by_name, created_at) VALUES
('content', '2', 'Threatening message requires admin review', 'High-severity harassment flag. User sent threatening messages to caregiver. May require account suspension or police involvement.', 'high', 'pending', '00000000-0000-0000-0000-000000000006', 'Mod User', '2026-03-17T08:00:00Z')
ON CONFLICT DO NOTHING;

-- Contract disputes
INSERT INTO contract_disputes (contract_id, filed_by, filed_by_name, filed_by_role, against_party, reason, description, status, priority, filed_at) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Mock_Rashed Hossain', 'guardian', 'Mock_CareFirst Agency', 'billing', 'Agency charged for 26 days but caregiver only worked 24 days in February. Requesting adjustment of ৳1,600.', 'open', 'medium', '2026-03-10T00:00:00Z')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════
-- DONE! Verify:
--   SELECT * FROM moderation_dashboard_queue;
--   SELECT * FROM moderation_stats;
--   SELECT count(*) FROM moderation_queue;
--   SELECT count(*) FROM flagged_content;
--   SELECT count(*) FROM moderator_sanctions;
--   SELECT count(*) FROM contract_disputes;
-- ═══════════════════════════════════════════════════════════════════════
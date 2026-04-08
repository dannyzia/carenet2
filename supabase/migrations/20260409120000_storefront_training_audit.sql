-- Storefront staff curation, training catalog/progress, agency reviews, audit/security logs

-- ─── caregiver_profiles: optional featured ordering for agency storefront ───
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS storefront_featured_rank SMALLINT;

COMMENT ON COLUMN public.caregiver_profiles.storefront_featured_rank IS 'NULL = not on storefront; 1-N = display order (lower first)';

-- Agency may update featured rank for caregivers linked to them
DROP POLICY IF EXISTS "Agency updates storefront rank on linked caregivers" ON public.caregiver_profiles;
CREATE POLICY "Agency updates storefront rank on linked caregivers" ON public.caregiver_profiles
  FOR UPDATE TO public
  USING (agency_id = (SELECT auth.uid()))
  WITH CHECK (agency_id = (SELECT auth.uid()));

-- ─── audit_logs (admin read; inserts typically via service role / triggers) ───
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action      TEXT NOT NULL DEFAULT '',
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address  TEXT,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  source      TEXT NOT NULL DEFAULT 'api',
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs (severity);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

-- ─── training catalog + per-caregiver progress ───
CREATE TABLE IF NOT EXISTS public.training_courses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  description      TEXT NOT NULL DEFAULT '',
  xp_reward        INTEGER NOT NULL DEFAULT 25,
  thumbnail_url    TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_courses_active_sort ON public.training_courses (is_active, sort_order);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_courses_select_authenticated" ON public.training_courses;
CREATE POLICY "training_courses_select_authenticated" ON public.training_courses
  FOR SELECT TO public
  USING (
    is_active = TRUE
    AND (SELECT auth.uid()) IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS public.caregiver_training_progress (
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status       TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (caregiver_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_caregiver_training_progress_caregiver ON public.caregiver_training_progress (caregiver_id);

ALTER TABLE public.caregiver_training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "caregiver_training_progress_own_select" ON public.caregiver_training_progress;
CREATE POLICY "caregiver_training_progress_own_select" ON public.caregiver_training_progress
  FOR SELECT TO public
  USING (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "caregiver_training_progress_own_insert" ON public.caregiver_training_progress;
CREATE POLICY "caregiver_training_progress_own_insert" ON public.caregiver_training_progress
  FOR INSERT TO public
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "caregiver_training_progress_own_update" ON public.caregiver_training_progress;
CREATE POLICY "caregiver_training_progress_own_update" ON public.caregiver_training_progress
  FOR UPDATE TO public
  USING (caregiver_id = (SELECT auth.uid()))
  WITH CHECK (caregiver_id = (SELECT auth.uid()));

-- ─── agency reviews (public read; guardians insert own) ───
CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  reviewer_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_name  TEXT NOT NULL,
  reviewer_role  TEXT NOT NULL DEFAULT 'guardian',
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text           TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_reviews_agency ON public.agency_reviews (agency_id, created_at DESC);

ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agency_reviews_public_select" ON public.agency_reviews;
CREATE POLICY "agency_reviews_public_select" ON public.agency_reviews
  FOR SELECT TO public
  USING (TRUE);

DROP POLICY IF EXISTS "agency_reviews_guardian_insert" ON public.agency_reviews;
CREATE POLICY "agency_reviews_guardian_insert" ON public.agency_reviews
  FOR INSERT TO public
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'guardian'
    )
  );

DROP POLICY IF EXISTS "agency_reviews_admin_all" ON public.agency_reviews;
CREATE POLICY "agency_reviews_admin_all" ON public.agency_reviews
  FOR ALL TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'moderator')
    )
  );

-- ─── Seed: training courses (idempotent) ───
INSERT INTO public.training_courses (title, category, duration_minutes, description, xp_reward, sort_order)
SELECT v.title, v.category, v.duration_minutes, v.description, v.xp_reward, v.sort_order
FROM (
  VALUES
    ('Advanced Wound Care', 'Clinical', 240, 'Clinical skills for wound assessment and dressing.', 50, 10),
    ('Diabetes Management', 'Clinical', 180, 'Blood sugar monitoring and caregiver protocols.', 40, 20),
    ('Emergency First Response', 'Safety', 360, 'CPR basics and escalation procedures.', 60, 30),
    ('Patient Communication', 'Soft Skills', 120, 'Clear communication with patients and families.', 30, 40),
    ('Geriatric Nutrition', 'Clinical', 180, 'Diet planning and feeding assistance.', 40, 50),
    ('Infection Control 2026', 'Safety', 240, 'Hand hygiene, PPE, and isolation precautions.', 50, 5)
) AS v(title, category, duration_minutes, description, xp_reward, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.training_courses LIMIT 1);

-- ─── Seed: sample audit / security rows (idempotent) ───
INSERT INTO public.audit_logs (action, ip_address, severity, source, metadata)
SELECT v.action, v.ip_address, v.severity, v.source, v.metadata::jsonb
FROM (
  VALUES
    ('Failed login attempt threshold exceeded', '45.12.0.0'::text, 'warning'::text, 'auth'::text, '{"region":"unknown"}'::text),
    ('API rate limit applied', NULL::text, 'info'::text, 'api'::text, '{}'::text),
    ('Suspicious session from new device', '103.120.0.1'::text, 'critical'::text, 'auth'::text, '{"device":"mobile"}'::text)
) AS v(action, ip_address, severity, source, metadata)
WHERE NOT EXISTS (SELECT 1 FROM public.audit_logs LIMIT 1);

-- Note: agency_reviews seed skipped (requires real agency + reviewer UUIDs). Populate via app or manual SQL.

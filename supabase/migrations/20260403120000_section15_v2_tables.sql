-- ═══════════════════════════════════════════════════════════════════════
-- Section 15 / v2.0 — care visibility & journals (patient-scoped)
-- Run AFTER seed/04_rls_policies.sql (requires public.is_admin()).
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.v2_can_access_patient(patient_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_uuid AND p.guardian_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.placements pl
      WHERE pl.patient_id = patient_uuid
        AND (pl.caregiver_id = auth.uid() OR pl.agency_id = auth.uid())
    )
    OR patient_uuid = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.v2_can_access_patient(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.v2_can_access_patient(uuid) TO authenticated;

-- ─── v2_care_diary_entries ───
CREATE TABLE IF NOT EXISTS public.v2_care_diary_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  entry_date  date NOT NULL DEFAULT (CURRENT_DATE),
  body        text NOT NULL DEFAULT '',
  mood        text,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_care_diary_patient ON public.v2_care_diary_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_v2_care_diary_date ON public.v2_care_diary_entries(entry_date DESC);
ALTER TABLE public.v2_care_diary_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_care_diary_select ON public.v2_care_diary_entries;
CREATE POLICY v2_care_diary_select ON public.v2_care_diary_entries
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_care_diary_insert ON public.v2_care_diary_entries;
CREATE POLICY v2_care_diary_insert ON public.v2_care_diary_entries
  FOR INSERT WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS v2_care_diary_update ON public.v2_care_diary_entries;
CREATE POLICY v2_care_diary_update ON public.v2_care_diary_entries
  FOR UPDATE USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_patient_care_plans ───
CREATE TABLE IF NOT EXISTS public.v2_patient_care_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title       text NOT NULL DEFAULT 'Care plan',
  body        text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_care_plans_patient ON public.v2_patient_care_plans(patient_id);
ALTER TABLE public.v2_patient_care_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_care_plans_select ON public.v2_patient_care_plans;
CREATE POLICY v2_care_plans_select ON public.v2_patient_care_plans
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_care_plans_all_guardian ON public.v2_patient_care_plans;
CREATE POLICY v2_care_plans_all_guardian ON public.v2_patient_care_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.guardian_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients p WHERE p.id = patient_id AND p.guardian_id = auth.uid())
    OR public.is_admin()
  );

-- ─── v2_health_alert_rules ───
CREATE TABLE IF NOT EXISTS public.v2_health_alert_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  metric_type     text NOT NULL,
  operator        text NOT NULL,
  threshold_value numeric,
  enabled         boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_alert_rules_patient ON public.v2_health_alert_rules(patient_id);
ALTER TABLE public.v2_health_alert_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_alert_rules_select ON public.v2_health_alert_rules;
CREATE POLICY v2_alert_rules_select ON public.v2_health_alert_rules
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_alert_rules_write ON public.v2_health_alert_rules;
CREATE POLICY v2_alert_rules_write ON public.v2_health_alert_rules
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_caregiver_location_pings ───
CREATE TABLE IF NOT EXISTS public.v2_caregiver_location_pings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_id     uuid,
  lat          numeric NOT NULL,
  lng          numeric NOT NULL,
  recorded_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_loc_pings_patient ON public.v2_caregiver_location_pings(patient_id);
CREATE INDEX IF NOT EXISTS idx_v2_loc_pings_time ON public.v2_caregiver_location_pings(recorded_at DESC);
ALTER TABLE public.v2_caregiver_location_pings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_loc_select ON public.v2_caregiver_location_pings;
CREATE POLICY v2_loc_select ON public.v2_caregiver_location_pings
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_loc_insert ON public.v2_caregiver_location_pings;
CREATE POLICY v2_loc_insert ON public.v2_caregiver_location_pings
  FOR INSERT WITH CHECK (
    caregiver_id = auth.uid()
    AND public.v2_can_access_patient(patient_id)
  );

-- ─── v2_symptom_journal_entries ───
CREATE TABLE IF NOT EXISTS public.v2_symptom_journal_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  severity    int NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 10),
  notes       text NOT NULL DEFAULT '',
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_symptom_patient ON public.v2_symptom_journal_entries(patient_id);
ALTER TABLE public.v2_symptom_journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_symptom_select ON public.v2_symptom_journal_entries;
CREATE POLICY v2_symptom_select ON public.v2_symptom_journal_entries
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_symptom_write ON public.v2_symptom_journal_entries;
CREATE POLICY v2_symptom_write ON public.v2_symptom_journal_entries
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_photo_journal_entries ───
CREATE TABLE IF NOT EXISTS public.v2_photo_journal_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  caption     text NOT NULL DEFAULT '',
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_photo_patient ON public.v2_photo_journal_entries(patient_id);
ALTER TABLE public.v2_photo_journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_photo_select ON public.v2_photo_journal_entries;
CREATE POLICY v2_photo_select ON public.v2_photo_journal_entries
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_photo_write ON public.v2_photo_journal_entries;
CREATE POLICY v2_photo_write ON public.v2_photo_journal_entries
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_nutrition_logs ───
CREATE TABLE IF NOT EXISTS public.v2_nutrition_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  meal_type   text NOT NULL DEFAULT 'meal',
  description text NOT NULL DEFAULT '',
  calories    int,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_nutrition_patient ON public.v2_nutrition_logs(patient_id);
ALTER TABLE public.v2_nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_nutrition_select ON public.v2_nutrition_logs;
CREATE POLICY v2_nutrition_select ON public.v2_nutrition_logs
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_nutrition_write ON public.v2_nutrition_logs;
CREATE POLICY v2_nutrition_write ON public.v2_nutrition_logs
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_rehab_logs ───
CREATE TABLE IF NOT EXISTS public.v2_rehab_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  logged_at     timestamptz NOT NULL DEFAULT now(),
  activity      text NOT NULL DEFAULT '',
  duration_mins int NOT NULL DEFAULT 0,
  notes         text NOT NULL DEFAULT '',
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_v2_rehab_patient ON public.v2_rehab_logs(patient_id);
ALTER TABLE public.v2_rehab_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_rehab_select ON public.v2_rehab_logs;
CREATE POLICY v2_rehab_select ON public.v2_rehab_logs
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_rehab_write ON public.v2_rehab_logs;
CREATE POLICY v2_rehab_write ON public.v2_rehab_logs
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_family_board_posts ───
CREATE TABLE IF NOT EXISTS public.v2_family_board_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_family_board_patient ON public.v2_family_board_posts(patient_id);
ALTER TABLE public.v2_family_board_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_family_select ON public.v2_family_board_posts;
CREATE POLICY v2_family_select ON public.v2_family_board_posts
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_family_insert ON public.v2_family_board_posts;
CREATE POLICY v2_family_insert ON public.v2_family_board_posts
  FOR INSERT WITH CHECK (public.v2_can_access_patient(patient_id) AND author_id = auth.uid());

-- ─── v2_insurance_policies ───
CREATE TABLE IF NOT EXISTS public.v2_insurance_policies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_name    text NOT NULL DEFAULT '',
  policy_number    text NOT NULL DEFAULT '',
  coverage_summary text NOT NULL DEFAULT '',
  valid_until      date,
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_insurance_patient ON public.v2_insurance_policies(patient_id);
ALTER TABLE public.v2_insurance_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_insurance_select ON public.v2_insurance_policies;
CREATE POLICY v2_insurance_select ON public.v2_insurance_policies
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_insurance_write ON public.v2_insurance_policies;
CREATE POLICY v2_insurance_write ON public.v2_insurance_policies
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_telehealth_sessions ───
CREATE TABLE IF NOT EXISTS public.v2_telehealth_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scheduled_at  timestamptz NOT NULL,
  provider_name text NOT NULL DEFAULT '',
  meeting_url   text,
  status        text NOT NULL DEFAULT 'scheduled',
  created_by    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v2_telehealth_patient ON public.v2_telehealth_sessions(patient_id);
ALTER TABLE public.v2_telehealth_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_telehealth_select ON public.v2_telehealth_sessions;
CREATE POLICY v2_telehealth_select ON public.v2_telehealth_sessions
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_telehealth_write ON public.v2_telehealth_sessions;
CREATE POLICY v2_telehealth_write ON public.v2_telehealth_sessions
  FOR ALL USING (public.v2_can_access_patient(patient_id) AND created_by = auth.uid())
  WITH CHECK (public.v2_can_access_patient(patient_id) AND created_by = auth.uid());

-- ─── v2_care_scorecards ───
CREATE TABLE IF NOT EXISTS public.v2_care_scorecards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  scope        text NOT NULL CHECK (scope IN ('guardian', 'agency')),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  metrics      jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_v2_scorecards_patient ON public.v2_care_scorecards(patient_id);
ALTER TABLE public.v2_care_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS v2_scorecards_select ON public.v2_care_scorecards;
CREATE POLICY v2_scorecards_select ON public.v2_care_scorecards
  FOR SELECT USING (public.v2_can_access_patient(patient_id));
DROP POLICY IF EXISTS v2_scorecards_insert ON public.v2_care_scorecards;
CREATE POLICY v2_scorecards_insert ON public.v2_care_scorecards
  FOR INSERT WITH CHECK (
    public.v2_can_access_patient(patient_id)
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════════════
-- CareNet: Full Domain Schema Migration
-- ═══════════════════════════════════════════════════════════════════════
-- Adds all core domain tables missing from the initial monetization schema.
-- Prerequisites: supabase-schema.sql + 20260317 notification migrations
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT,
  phone       TEXT NOT NULL DEFAULT '',
  avatar      TEXT,
  role        TEXT NOT NULL DEFAULT 'guardian'
              CHECK (role IN ('caregiver','guardian','patient','agency','admin','moderator','shop')),
  active_role TEXT NOT NULL DEFAULT 'guardian'
              CHECK (active_role IN ('caregiver','guardian','patient','agency','admin','moderator','shop')),
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, phone, role, active_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public profiles readable" ON profiles;
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 2. PATIENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  age         INTEGER,
  gender      TEXT CHECK (gender IN ('Male','Female','Other')),
  relation    TEXT,
  blood_group TEXT,
  dob         DATE,
  location    TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  conditions  TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','discharged')),
  avatar      TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_guardian ON patients(guardian_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guardian reads own patients" ON patients;
CREATE POLICY "Guardian reads own patients" ON patients FOR SELECT
  USING (auth.uid() = guardian_id);
DROP POLICY IF EXISTS "Guardian manages own patients" ON patients;
CREATE POLICY "Guardian manages own patients" ON patients FOR ALL
  USING (auth.uid() = guardian_id);
DROP POLICY IF EXISTS "Admins read all patients" ON patients;
CREATE POLICY "Admins read all patients" ON patients FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────
-- 3. PATIENT VITALS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_vitals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by UUID REFERENCES auth.users(id),
  bp          TEXT,
  glucose     TEXT,
  pulse       TEXT,
  weight      TEXT,
  temperature TEXT,
  heart_rate  INTEGER,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON patient_vitals(patient_id, recorded_at DESC);

ALTER TABLE patient_vitals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vitals readable by care team" ON patient_vitals;
CREATE POLICY "Vitals readable by care team" ON patient_vitals FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Caregivers insert vitals" ON patient_vitals;
CREATE POLICY "Caregivers insert vitals" ON patient_vitals FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────
-- 4. PRESCRIPTIONS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name    TEXT NOT NULL,
  medicine_name   TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  timing          TEXT[] NOT NULL DEFAULT '{}',
  duration        TEXT,
  prescribed_by   TEXT,
  start_date      DATE,
  end_date        DATE,
  instructions    TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','discontinued')),
  refill_date     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Prescriptions care team access" ON prescriptions;
CREATE POLICY "Prescriptions care team access" ON prescriptions FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 5. MEDICAL RECORDS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  date        DATE NOT NULL,
  doctor      TEXT,
  facility    TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  file_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Medical records care team access" ON medical_records;
CREATE POLICY "Medical records care team access" ON medical_records FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 6. CAREGIVER PROFILES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregiver_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT '',
  title           TEXT,
  bio             TEXT,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews         INTEGER NOT NULL DEFAULT 0,
  location        TEXT NOT NULL DEFAULT '',
  experience      TEXT,
  rate            TEXT,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  specialties     TEXT[] NOT NULL DEFAULT '{}',
  skills          TEXT[] NOT NULL DEFAULT '{}',
  languages       TEXT[] NOT NULL DEFAULT '{}',
  agency_id       UUID REFERENCES auth.users(id),
  image           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Caregiver profiles public read" ON caregiver_profiles;
CREATE POLICY "Caregiver profiles public read" ON caregiver_profiles FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Caregivers update own" ON caregiver_profiles;
CREATE POLICY "Caregivers update own" ON caregiver_profiles FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────
-- 7. CAREGIVER DOCUMENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregiver_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  category        TEXT CHECK (category IN ('nid','education','training','police_verification','medical_license','profile_selfie','medical_document','incident_photo','other')),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','resubmit_requested')),
  uploaded        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry          DATE,
  file_url        TEXT,
  file_size       TEXT,
  thumbnail_url   TEXT,
  capture_method  TEXT CHECK (capture_method IN ('camera','file','drag_drop')),
  review_note     TEXT,
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cg_docs_caregiver ON caregiver_documents(caregiver_id);

ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Caregivers read own docs" ON caregiver_documents;
CREATE POLICY "Caregivers read own docs" ON caregiver_documents FOR SELECT
  USING (auth.uid() = caregiver_id);
DROP POLICY IF EXISTS "Caregivers manage own docs" ON caregiver_documents;
CREATE POLICY "Caregivers manage own docs" ON caregiver_documents FOR ALL
  USING (auth.uid() = caregiver_id);
DROP POLICY IF EXISTS "Agencies read caregiver docs" ON caregiver_documents;
CREATE POLICY "Agencies read caregiver docs" ON caregiver_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agency','admin')));

-- ─────────────────────────────────────
-- 8. AGENCIES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencies (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  tagline         TEXT,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews         INTEGER NOT NULL DEFAULT 0,
  location        TEXT NOT NULL DEFAULT '',
  service_areas   TEXT[] NOT NULL DEFAULT '{}',
  specialties     TEXT[] NOT NULL DEFAULT '{}',
  caregiver_count INTEGER NOT NULL DEFAULT 0,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  response_time   TEXT,
  image           TEXT,
  license         TEXT,
  established     INTEGER,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 25.0,
  payout_schedule TEXT DEFAULT 'monthly' CHECK (payout_schedule IN ('weekly','biweekly','monthly')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agencies public read" ON agencies;
CREATE POLICY "Agencies public read" ON agencies FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Agency updates own" ON agencies;
CREATE POLICY "Agency updates own" ON agencies FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────
-- 9. SHIFTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id        UUID NOT NULL REFERENCES auth.users(id),
  patient_id          UUID NOT NULL REFERENCES patients(id),
  placement_id        UUID,
  date                DATE NOT NULL,
  start_time          TEXT NOT NULL,
  end_time            TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','checked-in','in-progress','checked-out','completed','cancelled')),
  location            TEXT,
  check_in_time       TIMESTAMPTZ,
  check_out_time      TIMESTAMPTZ,
  check_in_gps_lat    DOUBLE PRECISION,
  check_in_gps_lng    DOUBLE PRECISION,
  check_in_selfie_url TEXT,
  check_out_gps_lat   DOUBLE PRECISION,
  check_out_gps_lng   DOUBLE PRECISION,
  check_out_selfie_url TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_caregiver ON shifts(caregiver_id, date);
CREATE INDEX IF NOT EXISTS idx_shifts_patient ON shifts(patient_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shift parties read" ON shifts;
CREATE POLICY "Shift parties read" ON shifts FOR SELECT
  USING (
    auth.uid() = caregiver_id
    OR auth.uid() IN (SELECT guardian_id FROM patients WHERE id = patient_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agency','admin'))
  );
DROP POLICY IF EXISTS "Caregivers update own shifts" ON shifts;
CREATE POLICY "Caregivers update own shifts" ON shifts FOR UPDATE
  USING (auth.uid() = caregiver_id);

-- ─────────────────────────────────────
-- 10. SHIFT RATINGS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  rated_by    UUID NOT NULL REFERENCES auth.users(id),
  rated_by_role TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_ratings_shift ON shift_ratings(shift_id);

ALTER TABLE shift_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shift ratings readable" ON shift_ratings;
CREATE POLICY "Shift ratings readable" ON shift_ratings FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 11. INCIDENT REPORTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by     UUID NOT NULL REFERENCES auth.users(id),
  reporter_role   TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('fall','medication_error','behavioral','equipment','skin_integrity','other')),
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  shift_id        UUID REFERENCES shifts(id),
  description     TEXT NOT NULL,
  immediate_action TEXT NOT NULL DEFAULT '',
  photos          TEXT[] NOT NULL DEFAULT '{}',
  gps_lat         DOUBLE PRECISION,
  gps_lng         DOUBLE PRECISION,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','under_review','resolved','escalated','closed')),
  escalated_to    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_patient ON incident_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Incidents readable by care team" ON incident_reports;
CREATE POLICY "Incidents readable by care team" ON incident_reports FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Incidents insertable" ON incident_reports;
CREATE POLICY "Incidents insertable" ON incident_reports FOR INSERT WITH CHECK (TRUE);

-- ─────────────────────────────────────
-- 12. HANDOFF NOTES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS handoff_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_caregiver_id     UUID NOT NULL REFERENCES auth.users(id),
  from_caregiver_name   TEXT NOT NULL,
  to_caregiver_id       UUID NOT NULL REFERENCES auth.users(id),
  to_caregiver_name     TEXT NOT NULL,
  shift_id              UUID NOT NULL REFERENCES shifts(id),
  patient_id            UUID NOT NULL REFERENCES patients(id),
  notes                 TEXT NOT NULL,
  flagged_items         TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoffs_shift ON handoff_notes(shift_id);

ALTER TABLE handoff_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Handoff notes care team" ON handoff_notes;
CREATE POLICY "Handoff notes care team" ON handoff_notes FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 13. JOBS (postings by guardians/agencies)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by       UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  patient_name    TEXT,
  patient_age     INTEGER,
  patient_gender  TEXT,
  location        TEXT NOT NULL,
  description     TEXT,
  salary          TEXT,
  type            TEXT,
  budget          TEXT,
  budget_breakdown TEXT,
  duration        TEXT,
  experience      TEXT NOT NULL DEFAULT '',
  skills          TEXT[] NOT NULL DEFAULT '{}',
  requirements    TEXT[] NOT NULL DEFAULT '{}',
  care_type       TEXT,
  shift_type      TEXT,
  agency_name     TEXT,
  agency_rating   NUMERIC(3,2),
  agency_verified BOOLEAN DEFAULT FALSE,
  posted          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  urgent          BOOLEAN NOT NULL DEFAULT FALSE,
  applicants      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','applications','interview','offer','filled','closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Jobs public read" ON jobs;
CREATE POLICY "Jobs public read" ON jobs FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Posters manage own jobs" ON jobs;
CREATE POLICY "Posters manage own jobs" ON jobs FOR ALL USING (auth.uid() = posted_by);

-- ─────────────────────────────────────
-- 14. JOB APPLICATIONS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id    UUID NOT NULL REFERENCES auth.users(id),
  name            TEXT NOT NULL,
  rating          NUMERIC(3,2),
  experience      TEXT,
  specialties     TEXT[] NOT NULL DEFAULT '{}',
  skills          TEXT[] NOT NULL DEFAULT '{}',
  gender          TEXT,
  location        TEXT,
  match_score     INTEGER,
  applied_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity   TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','screening','interview','offer','rejected','withdrawn')),
  certifications  TEXT[] NOT NULL DEFAULT '{}',
  previous_jobs   INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_applicant ON job_applications(applicant_id);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Applicants read own apps" ON job_applications;
CREATE POLICY "Applicants read own apps" ON job_applications FOR SELECT
  USING (auth.uid() = applicant_id);
DROP POLICY IF EXISTS "Job posters read apps" ON job_applications;
CREATE POLICY "Job posters read apps" ON job_applications FOR SELECT
  USING (job_id IN (SELECT id FROM jobs WHERE posted_by = auth.uid()));

-- ─────────────────────────────────────
-- 15. PLACEMENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS placements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id         UUID REFERENCES auth.users(id),
  agency_id           UUID REFERENCES auth.users(id),
  caregiver_id        UUID REFERENCES auth.users(id),
  patient_id          UUID REFERENCES patients(id),
  patient_name        TEXT,
  agency_name         TEXT,
  guardian_name       TEXT,
  caregiver_name      TEXT,
  care_type           TEXT NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE,
  duration            TEXT,
  schedule            TEXT,
  shifts_completed    INTEGER NOT NULL DEFAULT 0,
  shifts_total        INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','paused','completed','cancelled')),
  compliance          NUMERIC(5,2) DEFAULT 100,
  rating              NUMERIC(3,2) DEFAULT 0,
  missed_shifts       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placements_guardian ON placements(guardian_id);
CREATE INDEX IF NOT EXISTS idx_placements_agency ON placements(agency_id);
CREATE INDEX IF NOT EXISTS idx_placements_caregiver ON placements(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON placements(status);

ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Placement parties read" ON placements;
CREATE POLICY "Placement parties read" ON placements FOR SELECT
  USING (
    auth.uid() IN (guardian_id, agency_id, caregiver_id)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────
-- 16. CONVERSATIONS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES auth.users(id),
  participant_b UUID NOT NULL REFERENCES auth.users(id),
  last_message  TEXT,
  last_time     TIMESTAMPTZ,
  pinned_by_a   BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_by_b   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_a ON conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_b ON conversations(participant_b);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants read own conversations" ON conversations;
CREATE POLICY "Participants read own conversations" ON conversations FOR SELECT
  USING (auth.uid() IN (participant_a, participant_b));

-- ─────────────────────────────────────
-- 17. CHAT MESSAGES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id),
  sender_name     TEXT,
  text            TEXT NOT NULL,
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_type TEXT CHECK (attachment_type IN ('image','file')),
  attachment_url  TEXT,
  attachment_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msgs_convo ON chat_messages(conversation_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat participants read messages" ON chat_messages;
CREATE POLICY "Chat participants read messages" ON chat_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE auth.uid() IN (participant_a, participant_b)
    )
  );
DROP POLICY IF EXISTS "Chat participants send messages" ON chat_messages;
CREATE POLICY "Chat participants send messages" ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Enable Realtime on chat_messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────
-- 18. CARE NOTES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id  UUID NOT NULL REFERENCES auth.users(id),
  patient_id    UUID REFERENCES patients(id),
  patient_name  TEXT NOT NULL,
  date          DATE NOT NULL,
  time          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('observation','medication','activity','incident','vitals')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  mood          TEXT,
  pinned        BOOLEAN NOT NULL DEFAULT FALSE,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  attachments   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_notes_caregiver ON care_notes(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_care_notes_patient ON care_notes(patient_id);

ALTER TABLE care_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Caregivers manage own notes" ON care_notes;
CREATE POLICY "Caregivers manage own notes" ON care_notes FOR ALL
  USING (auth.uid() = caregiver_id);

-- ─────────────────────────────────────
-- 19. GUARDIAN PROFILES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS guardian_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT,
  email             TEXT,
  location          TEXT,
  relation          TEXT,
  bio               TEXT,
  emergency_contact TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guardian_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guardians read own" ON guardian_profiles;
CREATE POLICY "Guardians read own" ON guardian_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Guardians update own" ON guardian_profiles;
CREATE POLICY "Guardians update own" ON guardian_profiles FOR UPDATE USING (auth.uid() = id);

-- ─────────────────────────────────────
-- 20. INVOICES (billing)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_party_id   UUID NOT NULL REFERENCES auth.users(id),
  from_party_name TEXT NOT NULL,
  from_party_role TEXT NOT NULL,
  to_party_id     UUID NOT NULL REFERENCES auth.users(id),
  to_party_name   TEXT NOT NULL,
  to_party_role   TEXT NOT NULL,
  placement_id    UUID REFERENCES placements(id),
  type            TEXT NOT NULL DEFAULT 'service' CHECK (type IN ('service','product','subscription')),
  description     TEXT NOT NULL DEFAULT '',
  period_from     DATE,
  period_to       DATE,
  subtotal        BIGINT NOT NULL DEFAULT 0,
  platform_fee    BIGINT NOT NULL DEFAULT 0,
  platform_fee_rate NUMERIC(5,2) DEFAULT 2.5,
  vat             BIGINT NOT NULL DEFAULT 0,
  vat_rate        NUMERIC(5,2) DEFAULT 0,
  early_discount  BIGINT NOT NULL DEFAULT 0,
  total           BIGINT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (status IN ('unpaid','proof_submitted','verified','disputed','overdue','paid','partial')),
  issued_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  paid_via        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_from ON invoices(from_party_id);
CREATE INDEX IF NOT EXISTS idx_invoices_to ON invoices(to_party_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice parties read" ON invoices;
CREATE POLICY "Invoice parties read" ON invoices FOR SELECT
  USING (auth.uid() IN (from_party_id, to_party_id));

-- ─────────────────────────────────────
-- 21. INVOICE LINE ITEMS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty         TEXT NOT NULL DEFAULT '1',
  rate        BIGINT NOT NULL DEFAULT 0,
  total       BIGINT NOT NULL DEFAULT 0
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoice line items via invoice" ON invoice_line_items;
CREATE POLICY "Invoice line items via invoice" ON invoice_line_items FOR SELECT
  USING (
    invoice_id IN (SELECT id FROM invoices WHERE auth.uid() IN (from_party_id, to_party_id))
  );

-- ─────────────────────────────────────
-- 22. PAYMENT PROOFS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_proofs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  submitted_by_id   UUID NOT NULL REFERENCES auth.users(id),
  submitted_by_name TEXT NOT NULL,
  submitted_by_role TEXT NOT NULL,
  received_by_id    UUID NOT NULL REFERENCES auth.users(id),
  received_by_name  TEXT NOT NULL,
  received_by_role  TEXT NOT NULL,
  amount            BIGINT NOT NULL,
  method            TEXT NOT NULL CHECK (method IN ('bkash','nagad','rocket','bank_transfer','cash')),
  reference_number  TEXT NOT NULL DEFAULT '',
  screenshot_url    TEXT,
  notes             TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected','expired')),
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at       TIMESTAMPTZ,
  verified_by_name  TEXT,
  rejection_reason  TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_invoice ON payment_proofs(invoice_id);

ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment proof parties read" ON payment_proofs;
CREATE POLICY "Payment proof parties read" ON payment_proofs FOR SELECT
  USING (auth.uid() IN (submitted_by_id, received_by_id));

-- ─────────────────────────────────────
-- 23. UPLOADED FILES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name       TEXT NOT NULL,
  file_size       BIGINT NOT NULL DEFAULT 0,
  mime_type       TEXT NOT NULL,
  category        TEXT CHECK (category IN ('nid','education','training','police_verification','medical_license','profile_selfie','medical_document','incident_photo','other')),
  capture_method  TEXT CHECK (capture_method IN ('camera','file','drag_drop')),
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  uploaded_by     UUID NOT NULL REFERENCES auth.users(id),
  uploaded_by_role TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('idle','uploading','processing','completed','failed')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_by ON uploaded_files(uploaded_by);

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own uploads" ON uploaded_files;
CREATE POLICY "Users read own uploads" ON uploaded_files FOR SELECT
  USING (auth.uid() = uploaded_by);
DROP POLICY IF EXISTS "Users create uploads" ON uploaded_files;
CREATE POLICY "Users create uploads" ON uploaded_files FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- ─────────────────────────────────────
-- 24. DAILY TASKS / SCHEDULE
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('event','task')),
  title             TEXT NOT NULL,
  details           TEXT NOT NULL DEFAULT '',
  time              TEXT NOT NULL,
  date              DATE NOT NULL,
  patient_id        UUID REFERENCES patients(id),
  patient_name      TEXT,
  caregiver_id      UUID REFERENCES auth.users(id),
  caregiver_name    TEXT,
  guardian_id        UUID REFERENCES auth.users(id),
  agency_id         UUID REFERENCES auth.users(id),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at      TIMESTAMPTZ,
  completion_note   TEXT,
  completion_photo_url TEXT,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_by_role   TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_caregiver ON daily_tasks(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_patient ON daily_tasks(patient_id);

ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Task participants read" ON daily_tasks;
CREATE POLICY "Task participants read" ON daily_tasks FOR SELECT
  USING (
    auth.uid() IN (caregiver_id, guardian_id, agency_id, created_by)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────
-- 25. UCCF CARE CONTRACTS (marketplace)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),
  type            TEXT NOT NULL CHECK (type IN ('request','offer')),
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','matched','bidding','locked','booked','active','completed','rated','cancelled')),

  -- Meta
  title           TEXT NOT NULL,
  categories      TEXT[] NOT NULL DEFAULT '{}',
  city            TEXT,
  area            TEXT,
  address         TEXT,
  start_date      DATE,
  duration_type   TEXT CHECK (duration_type IN ('short','monthly','long_term')),

  -- Party
  party_role      TEXT,
  party_name      TEXT,
  party_phone     TEXT,
  party_whatsapp  TEXT,
  organization    TEXT,
  service_areas   TEXT[] DEFAULT '{}',

  -- Care subject
  subject_age     INTEGER,
  subject_gender  TEXT,
  condition_summary TEXT,
  mobility        TEXT CHECK (mobility IN ('independent','assisted','bedridden')),
  cognitive       TEXT CHECK (cognitive IN ('normal','impaired','unconscious')),
  risk_level      TEXT CHECK (risk_level IN ('low','medium','high')),

  -- Medical
  diagnosis       TEXT,
  comorbidities   TEXT[] DEFAULT '{}',
  devices         TEXT[] DEFAULT '{}',
  procedures_required TEXT[] DEFAULT '{}',
  medication_complexity TEXT CHECK (medication_complexity IN ('low','medium','high')),

  -- Care needs (JSONB for nested structure)
  care_needs      JSONB DEFAULT '{}',

  -- Staffing
  caregiver_count INTEGER,
  nurse_count     INTEGER,
  required_level  TEXT CHECK (required_level IN ('L1','L2','L3','L4')),
  gender_preference TEXT CHECK (gender_preference IN ('male','female','none')),
  experience_years INTEGER,
  certifications_required TEXT[] DEFAULT '{}',

  -- Schedule
  hours_per_day   INTEGER CHECK (hours_per_day IN (8,12,24)),
  shift_type      TEXT CHECK (shift_type IN ('day','night','rotational')),
  staff_pattern   TEXT CHECK (staff_pattern IN ('single','double','rotational_team')),

  -- Services (JSONB for categorized lists)
  services        JSONB DEFAULT '{}',

  -- Logistics
  location_type   TEXT CHECK (location_type IN ('home','hospital')),
  accommodation_provided BOOLEAN,
  food_provided   BOOLEAN,
  travel_distance_km INTEGER,

  -- Equipment
  equipment_required TEXT[] DEFAULT '{}',
  equipment_provider TEXT CHECK (equipment_provider IN ('patient','agency','mixed')),

  -- Pricing (request)
  budget_min      BIGINT,
  budget_max      BIGINT,
  preferred_pricing_model TEXT CHECK (preferred_pricing_model IN ('monthly','daily','hourly')),

  -- Pricing (offer)
  base_price      BIGINT,
  pricing_model   TEXT CHECK (pricing_model IN ('monthly','daily','hourly')),
  included_hours  INTEGER,
  overtime_rate   BIGINT,
  extra_charges   TEXT[] DEFAULT '{}',

  -- SLA
  replacement_time_hours INTEGER,
  emergency_response_minutes INTEGER,
  attendance_guarantee_percent NUMERIC(5,2),
  reporting_frequency TEXT CHECK (reporting_frequency IN ('daily','weekly')),

  -- Compliance
  background_verified BOOLEAN,
  medical_fit     BOOLEAN,
  contract_required BOOLEAN,
  trial_available BOOLEAN,

  -- Misc
  exclusions      TEXT[] DEFAULT '{}',
  add_ons         TEXT[] DEFAULT '{}',

  -- Agency package fields
  agency_id       UUID REFERENCES auth.users(id),
  agency_name     TEXT,
  agency_rating   NUMERIC(3,2),
  agency_verified BOOLEAN,
  subscribers     INTEGER DEFAULT 0,
  featured        BOOLEAN DEFAULT FALSE,

  -- System
  bid_count       INTEGER NOT NULL DEFAULT 0,
  match_score     NUMERIC(5,2),
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_contracts_owner ON care_contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_care_contracts_type ON care_contracts(type);
CREATE INDEX IF NOT EXISTS idx_care_contracts_status ON care_contracts(status);
CREATE INDEX IF NOT EXISTS idx_care_contracts_city ON care_contracts(city);

ALTER TABLE care_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Care contracts public read published" ON care_contracts;
CREATE POLICY "Care contracts public read published" ON care_contracts FOR SELECT
  USING (status IN ('published','bidding','matched') OR auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners manage own contracts" ON care_contracts;
CREATE POLICY "Owners manage own contracts" ON care_contracts FOR ALL
  USING (auth.uid() = owner_id);

-- ─────────────────────────────────────
-- 26. CARE CONTRACT BIDS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS care_contract_bids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES care_contracts(id) ON DELETE CASCADE,
  agency_id       UUID NOT NULL REFERENCES auth.users(id),
  agency_name     TEXT NOT NULL,
  agency_rating   NUMERIC(3,2),
  agency_verified BOOLEAN DEFAULT FALSE,

  -- Proposed terms (JSONB for flexibility)
  proposed_pricing  JSONB NOT NULL DEFAULT '{}',
  proposed_staffing JSONB DEFAULT '{}',
  proposed_schedule JSONB DEFAULT '{}',
  proposed_services JSONB DEFAULT '{}',
  proposed_sla      JSONB DEFAULT '{}',

  -- Compliance summary
  compliance        JSONB NOT NULL DEFAULT '{}',

  -- Meta
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','rejected','countered','expired','withdrawn')),
  message           TEXT,
  remarks           TEXT,
  counter_offer     JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bids_contract ON care_contract_bids(contract_id);
CREATE INDEX IF NOT EXISTS idx_bids_agency ON care_contract_bids(agency_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON care_contract_bids(status);

ALTER TABLE care_contract_bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bid parties read" ON care_contract_bids;
CREATE POLICY "Bid parties read" ON care_contract_bids FOR SELECT
  USING (
    auth.uid() = agency_id
    OR contract_id IN (SELECT id FROM care_contracts WHERE owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "Agencies create bids" ON care_contract_bids;
CREATE POLICY "Agencies create bids" ON care_contract_bids FOR INSERT
  WITH CHECK (auth.uid() = agency_id);

-- ─────────────────────────────────────
-- 27. BACKUP ASSIGNMENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS backup_assignments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id            UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
  primary_caregiver_id    UUID NOT NULL REFERENCES auth.users(id),
  primary_caregiver_name  TEXT NOT NULL,
  backup_caregivers       JSONB NOT NULL DEFAULT '[]',
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE backup_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Backup assignments readable by involved" ON backup_assignments;
CREATE POLICY "Backup assignments readable by involved" ON backup_assignments FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 28. SHIFT REASSIGNMENTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_reassignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id              UUID NOT NULL REFERENCES shifts(id),
  from_caregiver_id     UUID NOT NULL REFERENCES auth.users(id),
  from_caregiver_name   TEXT NOT NULL,
  to_caregiver_id       UUID NOT NULL REFERENCES auth.users(id),
  to_caregiver_name     TEXT NOT NULL,
  reason                TEXT NOT NULL,
  reassigned_by         TEXT NOT NULL,
  billing_adjustment    TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','rejected','completed')),
  reassigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shift_reassignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reassignment parties read" ON shift_reassignments;
CREATE POLICY "Reassignment parties read" ON shift_reassignments FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 29. SHOP PRODUCTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  price       BIGINT NOT NULL DEFAULT 0,
  old_price   BIGINT,
  stock       INTEGER NOT NULL DEFAULT 0,
  sales       INTEGER NOT NULL DEFAULT 0,
  rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews     INTEGER NOT NULL DEFAULT 0,
  image       TEXT,
  in_stock    BOOLEAN NOT NULL DEFAULT TRUE,
  sku         TEXT,
  threshold   INTEGER DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_merchant ON shop_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON shop_products(category);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products public read" ON shop_products;
CREATE POLICY "Products public read" ON shop_products FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Merchants manage own products" ON shop_products;
CREATE POLICY "Merchants manage own products" ON shop_products FOR ALL
  USING (auth.uid() = merchant_id);

-- ─────────────────────────────────────
-- 30. SHOP ORDERS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES auth.users(id),
  customer_name TEXT,
  merchant_id   UUID NOT NULL REFERENCES auth.users(id),
  items_count   INTEGER NOT NULL DEFAULT 0,
  total         BIGINT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'placed'
                CHECK (status IN ('placed','confirmed','shipped','out_for_delivery','delivered','cancelled','returned')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  tracking      TEXT,
  courier       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON shop_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON shop_orders(merchant_id);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order parties read" ON shop_orders;
CREATE POLICY "Order parties read" ON shop_orders FOR SELECT
  USING (auth.uid() IN (customer_id, merchant_id));

-- ─────────────────────────────────────
-- 31. SHOP ORDER ITEMS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES shop_products(id),
  name        TEXT NOT NULL,
  price       BIGINT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  image       TEXT
);

ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order items via order" ON shop_order_items;
CREATE POLICY "Order items via order" ON shop_order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM shop_orders WHERE auth.uid() IN (customer_id, merchant_id))
  );

-- ─────────────────────────────────────
-- 32. WISHLIST
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlists;
CREATE POLICY "Users manage own wishlist" ON wishlists FOR ALL
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────
-- 33. PRODUCT REVIEWS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT NOT NULL DEFAULT '',
  helpful     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_reviews_product ON product_reviews(product_id);

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Product reviews public read" ON product_reviews;
CREATE POLICY "Product reviews public read" ON product_reviews FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users create reviews" ON product_reviews;
CREATE POLICY "Users create reviews" ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ─────────────────────────────────────
-- 34. CAREGIVER REVIEWS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS caregiver_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id  UUID NOT NULL REFERENCES auth.users(id),
  reviewer_id   UUID NOT NULL REFERENCES auth.users(id),
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text          TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cg_reviews_caregiver ON caregiver_reviews(caregiver_id);

ALTER TABLE caregiver_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Caregiver reviews public read" ON caregiver_reviews;
CREATE POLICY "Caregiver reviews public read" ON caregiver_reviews FOR SELECT USING (TRUE);

-- ─────────────────────────────────────
-- 35. SUPPORT TICKETS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  subject     TEXT NOT NULL,
  category    TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own tickets" ON support_tickets;
CREATE POLICY "Users read own tickets" ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users create tickets" ON support_tickets;
CREATE POLICY "Users create tickets" ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all tickets" ON support_tickets;
CREATE POLICY "Admins read all tickets" ON support_tickets FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────
-- 36. SUPPORT TICKET MESSAGES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ticket messages via ticket" ON support_ticket_messages;
CREATE POLICY "Ticket messages via ticket" ON support_ticket_messages FOR SELECT
  USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- ─────────────────────────────────────
-- 37. BLOG POSTS (community)
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID REFERENCES auth.users(id),
  title       TEXT NOT NULL,
  excerpt     TEXT NOT NULL DEFAULT '',
  content     TEXT,
  author_name TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  image       TEXT,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Blog posts public read" ON blog_posts;
CREATE POLICY "Blog posts public read" ON blog_posts FOR SELECT
  USING (published = TRUE);
DROP POLICY IF EXISTS "Admins manage blog" ON blog_posts;
CREATE POLICY "Admins manage blog" ON blog_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────
-- 38. MODERATOR SANCTIONS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderator_sanctions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  user_name   TEXT NOT NULL,
  user_role   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('warning','mute','suspension','ban')),
  reason      TEXT NOT NULL,
  issued_by   TEXT NOT NULL,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_sanctions_user ON moderator_sanctions(user_id);

ALTER TABLE moderator_sanctions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mods manage sanctions" ON moderator_sanctions;
CREATE POLICY "Mods manage sanctions" ON moderator_sanctions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────
-- 39. MODERATOR ESCALATIONS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderator_escalations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type   TEXT NOT NULL CHECK (source_type IN ('report','review','content')),
  source_id     TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  priority      TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','in_review','resolved','dismissed')),
  escalated_by  TEXT NOT NULL,
  escalated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to   TEXT,
  resolved_at   TIMESTAMPTZ,
  resolution    TEXT
);

ALTER TABLE moderator_escalations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Mods manage escalations" ON moderator_escalations;
CREATE POLICY "Mods manage escalations" ON moderator_escalations FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────
-- 40. CONTRACT DISPUTES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contract_disputes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     TEXT NOT NULL,
  filed_by        UUID NOT NULL REFERENCES auth.users(id),
  filed_by_role   TEXT NOT NULL,
  against_party   TEXT NOT NULL,
  reason          TEXT NOT NULL,
  description     TEXT NOT NULL,
  evidence        TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','under_review','mediation','resolved','closed')),
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  filed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT
);

CREATE INDEX IF NOT EXISTS idx_disputes_filed_by ON contract_disputes(filed_by);

ALTER TABLE contract_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dispute parties read" ON contract_disputes;
CREATE POLICY "Dispute parties read" ON contract_disputes FOR SELECT
  USING (auth.uid() = filed_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')));

-- ─────────────────────────────────────
-- 41. DISPUTE MESSAGES
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispute_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id      UUID NOT NULL REFERENCES contract_disputes(id) ON DELETE CASCADE,
  sender_name     TEXT NOT NULL,
  sender_role     TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Dispute messages via dispute" ON dispute_messages;
CREATE POLICY "Dispute messages via dispute" ON dispute_messages FOR SELECT
  USING (
    dispute_id IN (SELECT id FROM contract_disputes WHERE filed_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- ─────────────────────────────────────
-- 42. REFUND REQUESTS
-- ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS refund_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  type            TEXT NOT NULL CHECK (type IN ('service','product')),
  description     TEXT NOT NULL,
  amount          BIGINT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT,
  payment_account TEXT,
  method_color    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','processing','completed','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own refunds" ON refund_requests;
CREATE POLICY "Users read own refunds" ON refund_requests FOR SELECT
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────
-- ENABLE REALTIME ON KEY TABLES
-- ─────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE placements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE care_contracts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE care_contract_bids;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE payment_proofs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────
-- UPDATED_AT TRIGGERS
-- ─────────────────────────────────────
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS patients_updated_at ON patients;
CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS caregiver_profiles_updated_at ON caregiver_profiles;
CREATE TRIGGER caregiver_profiles_updated_at BEFORE UPDATE ON caregiver_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS agencies_updated_at ON agencies;
CREATE TRIGGER agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS shifts_updated_at ON shifts;
CREATE TRIGGER shifts_updated_at BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS placements_updated_at ON placements;
CREATE TRIGGER placements_updated_at BEFORE UPDATE ON placements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS care_contracts_updated_at ON care_contracts;
CREATE TRIGGER care_contracts_updated_at BEFORE UPDATE ON care_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS shop_products_updated_at ON shop_products;
CREATE TRIGGER shop_products_updated_at BEFORE UPDATE ON shop_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS shop_orders_updated_at ON shop_orders;
CREATE TRIGGER shop_orders_updated_at BEFORE UPDATE ON shop_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS guardian_profiles_updated_at ON guardian_profiles;
CREATE TRIGGER guardian_profiles_updated_at BEFORE UPDATE ON guardian_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS conversations_updated_at ON conversations;
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS incident_reports_updated_at ON incident_reports;
CREATE TRIGGER incident_reports_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

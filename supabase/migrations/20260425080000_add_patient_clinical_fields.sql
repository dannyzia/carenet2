-- ─────────────────────────────────────────────────────────────────────────────
-- Add clinical intake fields to the patients table
-- These are collected on the PatientIntakePage and read by the Care Requirement
-- Wizard so the guardian never needs to re-enter them.
-- ─────────────────────────────────────────────────────────────────────────────

-- Mobility level (plain-English equivalent of UCCF Mobility enum)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS mobility TEXT
    CHECK (mobility IN ('independent', 'assisted', 'bedridden'));

-- Cognitive status
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS cognitive TEXT
    CHECK (cognitive IN ('normal', 'impaired', 'dependent'));

-- Care location city (pre-fills wizard; guardian may override in wizard)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS care_city TEXT;

-- Care location area / neighbourhood
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS care_area TEXT;

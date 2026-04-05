-- Per-patient emergency contact (may differ from guardian)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;

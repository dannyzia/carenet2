-- Add condition_notes column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS condition_notes TEXT;

-- Also update the INSERT in seed data to include condition_notes if needed
-- The column will default to NULL if not provided

-- Fix profiles.role and profiles.active_role for existing @indigobangladesh.xyz test users.
-- These accounts were created with default 'guardian' because the signup trigger
-- had no email-to-role mapping. This migration corrects them once.

-- ═══════════════════════════════════════════════════════════════════
-- Helper: infer role from email local-part for known test patterns.
-- agent/agent* → agency  (exception: agent1 is admin)
-- caregiver*   → caregiver
-- guardian*    → guardian
-- patient*     → patient
-- shopowner*   → shop
-- ═══════════════════════════════════════════════════════════════════

-- Caregivers
UPDATE profiles
SET role = 'caregiver', active_role = 'caregiver'
WHERE email LIKE 'caregiver%@indigobangladesh.xyz'
  AND role <> 'caregiver';

-- Guardians
UPDATE profiles
SET role = 'guardian', active_role = 'guardian'
WHERE email LIKE 'guardian%@indigobangladesh.xyz'
  AND role <> 'guardian';

-- Patients
UPDATE profiles
SET role = 'patient', active_role = 'patient'
WHERE email LIKE 'patient%@indigobangladesh.xyz'
  AND role <> 'patient';

-- Shop owners
UPDATE profiles
SET role = 'shop', active_role = 'shop'
WHERE email LIKE 'shopowner%@indigobangladesh.xyz'
  AND role <> 'shop';

-- Admin (agent1 is admin, not agency)
UPDATE profiles
SET role = 'admin', active_role = 'admin'
WHERE email = 'agent1@indigobangladesh.xyz'
  AND role <> 'admin';

-- Agency (agent@ is agency)
UPDATE profiles
SET role = 'agency', active_role = 'agency'
WHERE email = 'agent@indigobangladesh.xyz'
  AND role <> 'agency';

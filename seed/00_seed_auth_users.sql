-- ═══════════════════════════════════════════════════════════════════════
-- CareNet Seed: Auth Users
-- ═══════════════════════════════════════════════════════════════════════
-- Run this FIRST in Supabase SQL Editor.
-- This inserts 8 demo users into auth.users.
-- The triggers auto-create:
--   → profiles (via create_profile_for_user)
--   → wallets  (via create_wallet_for_user)
--
-- All demo accounts: password = DemoPass123!   TOTP code = 123456
-- Email format: name@carenet.demo
--
-- ⚠ WARNING: These are demo/test users only.
--   Do NOT use in production. Delete them before going live.
-- ═══════════════════════════════════════════════════════════════════════

-- Fixed UUIDs for deterministic foreign keys across all CSV seed files.

-- ─── User UUID Reference ───
-- demo-caregiver-1  = 00000000-0000-0000-0000-000000000001  Mock_Karim Uddin
-- demo-guardian-1   = 00000000-0000-0000-0000-000000000002  Mock_Rashed Hossain
-- demo-patient-1    = 00000000-0000-0000-0000-000000000003  Mock_Amina Begum
-- demo-agency-1     = 00000000-0000-0000-0000-000000000004  Mock_CareFirst Agency
-- demo-admin-1      = 00000000-0000-0000-0000-000000000005  Mock_Admin User
-- demo-moderator-1  = 00000000-0000-0000-0000-000000000006  Mock_Mod User
-- demo-shop-1       = 00000000-0000-0000-0000-000000000007  Mock_MediMart Store
-- demo-multi-1      = 00000000-0000-0000-0000-000000000008  Mock_Multi-Role Demo

-- ─── Insert demo users into auth.users ───
-- NOTE: confirmed_at is a generated column in modern Supabase — do NOT insert into it.
-- Setting email_confirmed_at is sufficient to mark the user as confirmed.

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, phone, phone_confirmed_at,
  email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at
) VALUES
-- 1. Karim Uddin (Caregiver)
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'karim@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801712345678', NOW(),
  NOW(),
  '{"name": "Mock_Karim Uddin", "role": "caregiver", "phone": "01712345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-06-15T00:00:00Z', NOW()
),
-- 2. Rashed Hossain (Guardian)
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'rashed@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801812345678', NOW(),
  NOW(),
  '{"name": "Mock_Rashed Hossain", "role": "guardian", "phone": "01812345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-03-10T00:00:00Z', NOW()
),
-- 3. Amina Begum (Patient)
(
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'amina@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801912345678', NOW(),
  NOW(),
  '{"name": "Mock_Amina Begum", "role": "patient", "phone": "01912345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-08-22T00:00:00Z', NOW()
),
-- 4. CareFirst Agency (Agency)
(
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'carefirst@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801612345678', NOW(),
  NOW(),
  '{"name": "Mock_CareFirst Agency", "role": "agency", "phone": "01612345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-01-05T00:00:00Z', NOW()
),
-- 5. Admin User (Admin)
(
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801512345678', NOW(),
  NOW(),
  '{"name": "Mock_Admin User", "role": "admin", "phone": "01512345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-01-01T00:00:00Z', NOW()
),
-- 6. Mod User (Moderator)
(
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'mod@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801412345678', NOW(),
  NOW(),
  '{"name": "Mock_Mod User", "role": "moderator", "phone": "01412345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-05-01T00:00:00Z', NOW()
),
-- 7. MediMart Store (Shop)
(
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'medimart@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801312345678', NOW(),
  NOW(),
  '{"name": "Mock_MediMart Store", "role": "shop", "phone": "01312345678"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-04-15T00:00:00Z', NOW()
),
-- 8. Multi-Role Demo (Guardian + Caregiver + Admin)
(
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'multi@carenet.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  '+8801011111111', NOW(),
  NOW(),
  '{"name": "Mock_Multi-Role Demo", "role": "guardian", "phone": "01011111111"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '2024-01-01T00:00:00Z', NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create identities for email auth (required by Supabase Auth)
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub": "00000000-0000-0000-0000-000000000001", "email": "karim@carenet.demo"}'::jsonb, 'email', NOW(), '2024-06-15T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub": "00000000-0000-0000-0000-000000000002", "email": "rashed@carenet.demo"}'::jsonb, 'email', NOW(), '2024-03-10T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '{"sub": "00000000-0000-0000-0000-000000000003", "email": "amina@carenet.demo"}'::jsonb, 'email', NOW(), '2024-08-22T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '{"sub": "00000000-0000-0000-0000-000000000004", "email": "carefirst@carenet.demo"}'::jsonb, 'email', NOW(), '2024-01-05T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '{"sub": "00000000-0000-0000-0000-000000000005", "email": "admin@carenet.demo"}'::jsonb, 'email', NOW(), '2024-01-01T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '{"sub": "00000000-0000-0000-0000-000000000006", "email": "mod@carenet.demo"}'::jsonb, 'email', NOW(), '2024-05-01T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '{"sub": "00000000-0000-0000-0000-000000000007", "email": "medimart@carenet.demo"}'::jsonb, 'email', NOW(), '2024-04-15T00:00:00Z', NOW()),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', '{"sub": "00000000-0000-0000-0000-000000000008", "email": "multi@carenet.demo"}'::jsonb, 'email', NOW(), '2024-01-01T00:00:00Z', NOW())
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY: After running this, check these tables were auto-populated:
--   SELECT * FROM profiles;        -- 8 rows (from create_profile_for_user trigger)
--   SELECT * FROM wallets;         -- 8 rows (from create_wallet_for_user trigger)
--   SELECT * FROM wallet_transactions; -- bonus transactions for roles with bonuses
-- ═══════════════════════════════════════════════════════════════════════

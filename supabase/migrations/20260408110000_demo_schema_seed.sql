-- Copy existing Mock_/demo-user rows from public → demo (permanent: demo_expires_at = NULL).
-- Run after 20260408100000. Idempotent (ON CONFLICT DO NOTHING).
-- If public has no matching rows yet, this is a no-op; re-run after seeding public or use SQL editor.

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.patients
SELECT p.*, NULL::timestamptz
FROM public.patients p
WHERE p.guardian_id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.caregiver_profiles
SELECT c.*, NULL::timestamptz
FROM public.caregiver_profiles c
WHERE c.id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.guardian_profiles
SELECT g.*, NULL::timestamptz
FROM public.guardian_profiles g
WHERE g.id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.agencies
SELECT a.*, NULL::timestamptz
FROM public.agencies a
WHERE a.id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.placements
SELECT pl.*, NULL::timestamptz
FROM public.placements pl
WHERE pl.guardian_id IN (SELECT uid FROM demo_uid)
   OR pl.agency_id IN (SELECT uid FROM demo_uid)
   OR pl.caregiver_id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.shifts
SELECT s.*, NULL::timestamptz
FROM public.shifts s
WHERE s.caregiver_id IN (SELECT uid FROM demo_uid)
   OR s.patient_id IN (SELECT id FROM demo.patients)
   OR s.placement_id IN (SELECT id FROM demo.placements)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.care_contracts
SELECT c.*, NULL::timestamptz
FROM public.care_contracts c
WHERE c.owner_id IN (SELECT uid FROM demo_uid)
   OR c.agency_id IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO demo.care_contract_bids
SELECT b.*, NULL::timestamptz
FROM public.care_contract_bids b
WHERE b.contract_id IN (SELECT id FROM demo.care_contracts)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.jobs
SELECT j.*, NULL::timestamptz
FROM public.jobs j
WHERE j.posted_by IN (SELECT uid FROM demo_uid)
ON CONFLICT (id) DO NOTHING;

WITH demo_uid AS (
  SELECT unnest(ARRAY[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid
  ]) AS uid
)
INSERT INTO demo.invoices
SELECT i.*, NULL::timestamptz
FROM public.invoices i
WHERE i.from_party_id IN (SELECT uid FROM demo_uid)
   OR i.to_party_id IN (SELECT uid FROM demo_uid)
   OR i.placement_id IN (SELECT id FROM demo.placements)
   OR i.care_contract_id IN (SELECT id FROM demo.care_contracts)
ON CONFLICT (id) DO NOTHING;

INSERT INTO demo.invoice_line_items
SELECT li.*, NULL::timestamptz
FROM public.invoice_line_items li
WHERE li.invoice_id IN (SELECT id FROM demo.invoices)
ON CONFLICT (id) DO NOTHING;

INSERT INTO demo.payment_proofs
SELECT pp.*, NULL::timestamptz
FROM public.payment_proofs pp
WHERE pp.invoice_id IN (SELECT id FROM demo.invoices)
ON CONFLICT (id) DO NOTHING;

-- Wallets (only when demo wallet tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallets') THEN
    INSERT INTO demo.wallets
    SELECT w.*, NULL::timestamptz
    FROM public.wallets w
    WHERE w.user_id IN (
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid,
      '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid,
      '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallet_transactions') THEN
    INSERT INTO demo.wallet_transactions
    SELECT wt.*, NULL::timestamptz
    FROM public.wallet_transactions wt
    WHERE wt.wallet_id IN (SELECT id FROM demo.wallets)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

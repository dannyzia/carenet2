-- Remove seeded / demo-user rows from public.* so real Supabase users never see Mock_ data.
-- Demo accounts continue to use auth.users; app reads demo.* for those JWTs.
-- Run after demo schema is seeded (20260408110000).

CREATE TEMP TABLE _demo_uids (uid UUID PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _demo_uids (uid) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000008');

-- Dependent rows first (FK order)
DELETE FROM public.payment_proofs pp
WHERE EXISTS (
  SELECT 1 FROM public.invoices i
  WHERE i.id = pp.invoice_id
    AND (
      i.from_party_id IN (SELECT uid FROM _demo_uids)
      OR i.to_party_id IN (SELECT uid FROM _demo_uids)
    )
);

DELETE FROM public.invoice_line_items li
WHERE EXISTS (
  SELECT 1 FROM public.invoices i
  WHERE i.id = li.invoice_id
    AND (
      i.from_party_id IN (SELECT uid FROM _demo_uids)
      OR i.to_party_id IN (SELECT uid FROM _demo_uids)
    )
);

DELETE FROM public.invoices
WHERE from_party_id IN (SELECT uid FROM _demo_uids)
   OR to_party_id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.care_contract_bids
WHERE agency_id IN (SELECT uid FROM _demo_uids)
   OR contract_id IN (
     SELECT id FROM public.care_contracts
     WHERE owner_id IN (SELECT uid FROM _demo_uids)
        OR agency_id IN (SELECT uid FROM _demo_uids)
   );

DELETE FROM public.care_contracts
WHERE owner_id IN (SELECT uid FROM _demo_uids)
   OR agency_id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.shift_ratings sr
WHERE shift_id IN (
  SELECT s.id FROM public.shifts s
  WHERE s.caregiver_id IN (SELECT uid FROM _demo_uids)
     OR s.patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids))
     OR s.placement_id IN (
       SELECT id FROM public.placements
       WHERE guardian_id IN (SELECT uid FROM _demo_uids)
          OR agency_id IN (SELECT uid FROM _demo_uids)
          OR caregiver_id IN (SELECT uid FROM _demo_uids)
     )
);

-- FK to shifts(id) without ON DELETE CASCADE (see 20260318_full_domain_schema.sql)
DELETE FROM public.incident_reports ir
WHERE ir.shift_id IN (
  SELECT s.id FROM public.shifts s
  WHERE s.caregiver_id IN (SELECT uid FROM _demo_uids)
     OR s.patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids))
     OR s.placement_id IN (
       SELECT id FROM public.placements
       WHERE guardian_id IN (SELECT uid FROM _demo_uids)
          OR agency_id IN (SELECT uid FROM _demo_uids)
          OR caregiver_id IN (SELECT uid FROM _demo_uids)
     )
);

DELETE FROM public.handoff_notes hn
WHERE hn.shift_id IN (
  SELECT s.id FROM public.shifts s
  WHERE s.caregiver_id IN (SELECT uid FROM _demo_uids)
     OR s.patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids))
     OR s.placement_id IN (
       SELECT id FROM public.placements
       WHERE guardian_id IN (SELECT uid FROM _demo_uids)
          OR agency_id IN (SELECT uid FROM _demo_uids)
          OR caregiver_id IN (SELECT uid FROM _demo_uids)
     )
);

DELETE FROM public.shift_reassignments sr
WHERE sr.shift_id IN (
  SELECT s.id FROM public.shifts s
  WHERE s.caregiver_id IN (SELECT uid FROM _demo_uids)
     OR s.patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids))
     OR s.placement_id IN (
       SELECT id FROM public.placements
       WHERE guardian_id IN (SELECT uid FROM _demo_uids)
          OR agency_id IN (SELECT uid FROM _demo_uids)
          OR caregiver_id IN (SELECT uid FROM _demo_uids)
     )
);

DELETE FROM public.shifts
WHERE caregiver_id IN (SELECT uid FROM _demo_uids)
   OR patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids))
   OR placement_id IN (
     SELECT id FROM public.placements
     WHERE guardian_id IN (SELECT uid FROM _demo_uids)
        OR agency_id IN (SELECT uid FROM _demo_uids)
        OR caregiver_id IN (SELECT uid FROM _demo_uids)
   );

DELETE FROM public.daily_tasks
WHERE created_by IN (SELECT uid FROM _demo_uids)
   OR guardian_id IN (SELECT uid FROM _demo_uids)
   OR caregiver_id IN (SELECT uid FROM _demo_uids)
   OR agency_id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.placements
WHERE guardian_id IN (SELECT uid FROM _demo_uids)
   OR agency_id IN (SELECT uid FROM _demo_uids)
   OR caregiver_id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.jobs
WHERE posted_by IN (SELECT uid FROM _demo_uids);

-- FK to patients(id) without ON DELETE CASCADE (care_notes, incident_reports, handoff_notes, daily_tasks)
DELETE FROM public.care_notes
WHERE patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids));

DELETE FROM public.incident_reports
WHERE patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids));

DELETE FROM public.handoff_notes
WHERE patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids));

DELETE FROM public.daily_tasks
WHERE patient_id IN (SELECT id FROM public.patients WHERE guardian_id IN (SELECT uid FROM _demo_uids));

DELETE FROM public.patients
WHERE guardian_id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.caregiver_profiles
WHERE id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.guardian_profiles
WHERE id IN (SELECT uid FROM _demo_uids);

DELETE FROM public.agencies
WHERE id IN (SELECT uid FROM _demo_uids);

-- Wallets (optional)
DO $$
BEGIN
  IF to_regclass('public.wallet_transactions') IS NOT NULL AND to_regclass('public.wallets') IS NOT NULL THEN
    DELETE FROM public.wallet_transactions wt
    WHERE EXISTS (
      SELECT 1 FROM public.wallets w
      WHERE w.id = wt.wallet_id
        AND w.user_id IN (
          '00000000-0000-0000-0000-000000000001'::uuid,
          '00000000-0000-0000-0000-000000000002'::uuid,
          '00000000-0000-0000-0000-000000000003'::uuid,
          '00000000-0000-0000-0000-000000000004'::uuid,
          '00000000-0000-0000-0000-000000000005'::uuid,
          '00000000-0000-0000-0000-000000000006'::uuid,
          '00000000-0000-0000-0000-000000000007'::uuid,
          '00000000-0000-0000-0000-000000000008'::uuid
        )
    );
    DELETE FROM public.wallets
    WHERE user_id IN (
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid,
      '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid,
      '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid
    );
  END IF;
END $$;

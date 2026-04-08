-- ═══════════════════════════════════════════════════════════════════════════
-- Demo schema: isolated tables for @carenet.demo users (fixed auth UUIDs).
-- Real users use public.* only; demo users use demo.* via PostgREST schema=demo.
--
-- After deploy: Supabase Dashboard → Settings → API → Exposed schemas → add "demo"
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS demo;

-- Fixed demo auth user ids (see seed/00_seed_auth_users.sql)
CREATE OR REPLACE FUNCTION demo.is_demo_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND (SELECT auth.uid()) IN (
      '00000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      '00000000-0000-0000-0000-000000000004'::uuid,
      '00000000-0000-0000-0000-000000000005'::uuid,
      '00000000-0000-0000-0000-000000000006'::uuid,
      '00000000-0000-0000-0000-000000000007'::uuid,
      '00000000-0000-0000-0000-000000000008'::uuid
    );
$$;

REVOKE ALL ON SCHEMA demo FROM PUBLIC;
GRANT USAGE ON SCHEMA demo TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION demo.is_demo_user() TO authenticated, service_role;

-- ─── Mirror core tables (no FKs to public.*; internal FKs point at demo.*) ───

CREATE TABLE IF NOT EXISTS demo.patients (
  LIKE public.patients INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.patients ADD PRIMARY KEY (id);
ALTER TABLE demo.patients
  ADD CONSTRAINT demo_patients_guardian_fk FOREIGN KEY (guardian_id)
  REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE demo.patients ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.caregiver_profiles (
  LIKE public.caregiver_profiles INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.caregiver_profiles ADD PRIMARY KEY (id);
ALTER TABLE demo.caregiver_profiles
  ADD CONSTRAINT demo_cg_profiles_id_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE demo.caregiver_profiles
  ADD CONSTRAINT demo_cg_profiles_agency_fk FOREIGN KEY (agency_id) REFERENCES auth.users(id);
ALTER TABLE demo.caregiver_profiles ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.guardian_profiles (
  LIKE public.guardian_profiles INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.guardian_profiles ADD PRIMARY KEY (id);
ALTER TABLE demo.guardian_profiles
  ADD CONSTRAINT demo_gd_profiles_id_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE demo.guardian_profiles ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.agencies (
  LIKE public.agencies INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.agencies ADD PRIMARY KEY (id);
ALTER TABLE demo.agencies
  ADD CONSTRAINT demo_agencies_id_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE demo.agencies ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.placements (
  LIKE public.placements INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.placements ADD PRIMARY KEY (id);
ALTER TABLE demo.placements
  ADD CONSTRAINT demo_placements_guardian_fk FOREIGN KEY (guardian_id) REFERENCES auth.users(id);
ALTER TABLE demo.placements
  ADD CONSTRAINT demo_placements_agency_fk FOREIGN KEY (agency_id) REFERENCES auth.users(id);
ALTER TABLE demo.placements
  ADD CONSTRAINT demo_placements_caregiver_fk FOREIGN KEY (caregiver_id) REFERENCES auth.users(id);
ALTER TABLE demo.placements
  ADD CONSTRAINT demo_placements_patient_fk FOREIGN KEY (patient_id) REFERENCES demo.patients(id);
ALTER TABLE demo.placements ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.shifts (
  LIKE public.shifts INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.shifts ADD PRIMARY KEY (id);
ALTER TABLE demo.shifts
  ADD CONSTRAINT demo_shifts_caregiver_fk FOREIGN KEY (caregiver_id) REFERENCES auth.users(id);
ALTER TABLE demo.shifts
  ADD CONSTRAINT demo_shifts_patient_fk FOREIGN KEY (patient_id) REFERENCES demo.patients(id);
ALTER TABLE demo.shifts
  ADD CONSTRAINT demo_shifts_placement_fk FOREIGN KEY (placement_id) REFERENCES demo.placements(id);
ALTER TABLE demo.shifts ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.care_contracts (
  LIKE public.care_contracts INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.care_contracts ADD PRIMARY KEY (id);
ALTER TABLE demo.care_contracts
  ADD CONSTRAINT demo_cc_owner_fk FOREIGN KEY (owner_id) REFERENCES auth.users(id);
ALTER TABLE demo.care_contracts
  ADD CONSTRAINT demo_cc_agency_fk FOREIGN KEY (agency_id) REFERENCES auth.users(id);
ALTER TABLE demo.care_contracts ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_demo_care_contracts_lifecycle ON demo.care_contracts;
CREATE TRIGGER trg_demo_care_contracts_lifecycle
  BEFORE INSERT OR UPDATE OF status ON demo.care_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_care_contract_lifecycle();

CREATE TABLE IF NOT EXISTS demo.care_contract_bids (
  LIKE public.care_contract_bids INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.care_contract_bids ADD PRIMARY KEY (id);
ALTER TABLE demo.care_contract_bids
  ADD CONSTRAINT demo_ccb_contract_fk FOREIGN KEY (contract_id) REFERENCES demo.care_contracts(id) ON DELETE CASCADE;
ALTER TABLE demo.care_contract_bids
  ADD CONSTRAINT demo_ccb_agency_fk FOREIGN KEY (agency_id) REFERENCES auth.users(id);
ALTER TABLE demo.care_contract_bids ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.jobs (
  LIKE public.jobs INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.jobs ADD PRIMARY KEY (id);
ALTER TABLE demo.jobs
  ADD CONSTRAINT demo_jobs_posted_by_fk FOREIGN KEY (posted_by) REFERENCES auth.users(id);
ALTER TABLE demo.jobs ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.invoices (
  LIKE public.invoices INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.invoices ADD PRIMARY KEY (id);
ALTER TABLE demo.invoices
  ADD CONSTRAINT demo_inv_from_fk FOREIGN KEY (from_party_id) REFERENCES auth.users(id);
ALTER TABLE demo.invoices
  ADD CONSTRAINT demo_inv_to_fk FOREIGN KEY (to_party_id) REFERENCES auth.users(id);
ALTER TABLE demo.invoices
  ADD CONSTRAINT demo_inv_placement_fk FOREIGN KEY (placement_id) REFERENCES demo.placements(id);
ALTER TABLE demo.invoices
  ADD CONSTRAINT demo_inv_cc_fk FOREIGN KEY (care_contract_id) REFERENCES demo.care_contracts(id) ON DELETE SET NULL;
ALTER TABLE demo.invoices ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.invoice_line_items (
  LIKE public.invoice_line_items INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.invoice_line_items ADD PRIMARY KEY (id);
ALTER TABLE demo.invoice_line_items
  ADD CONSTRAINT demo_ili_invoice_fk FOREIGN KEY (invoice_id) REFERENCES demo.invoices(id) ON DELETE CASCADE;
ALTER TABLE demo.invoice_line_items ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS demo.payment_proofs (
  LIKE public.payment_proofs INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
    EXCLUDING CONSTRAINTS EXCLUDING INDEXES
);
ALTER TABLE demo.payment_proofs ADD PRIMARY KEY (id);
ALTER TABLE demo.payment_proofs
  ADD CONSTRAINT demo_pp_invoice_fk FOREIGN KEY (invoice_id) REFERENCES demo.invoices(id) ON DELETE CASCADE;
ALTER TABLE demo.payment_proofs
  ADD CONSTRAINT demo_pp_submitted_fk FOREIGN KEY (submitted_by_id) REFERENCES auth.users(id);
ALTER TABLE demo.payment_proofs
  ADD CONSTRAINT demo_pp_received_fk FOREIGN KEY (received_by_id) REFERENCES auth.users(id);
ALTER TABLE demo.payment_proofs ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

-- Wallets (only if public has them — created outside consolidated migration on some projects)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wallets'
  ) THEN
    EXECUTE $w$
      CREATE TABLE IF NOT EXISTS demo.wallets (
        LIKE public.wallets INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
          EXCLUDING CONSTRAINTS EXCLUDING INDEXES
      )
    $w$;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'demo_wallets_pkey'
    ) THEN
      ALTER TABLE demo.wallets ADD PRIMARY KEY (id);
    END IF;
    ALTER TABLE demo.wallets DROP CONSTRAINT IF EXISTS demo_wallets_user_fk;
    ALTER TABLE demo.wallets
      ADD CONSTRAINT demo_wallets_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE demo.wallets ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wallet_transactions'
  ) THEN
    EXECUTE $w$
      CREATE TABLE IF NOT EXISTS demo.wallet_transactions (
        LIKE public.wallet_transactions INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY
          EXCLUDING CONSTRAINTS EXCLUDING INDEXES
      )
    $w$;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'demo_wtx_pkey'
    ) THEN
      ALTER TABLE demo.wallet_transactions ADD PRIMARY KEY (id);
    END IF;
    ALTER TABLE demo.wallet_transactions DROP CONSTRAINT IF EXISTS demo_wtx_wallet_fk;
    ALTER TABLE demo.wallet_transactions
      ADD CONSTRAINT demo_wtx_wallet_fk FOREIGN KEY (wallet_id) REFERENCES demo.wallets(id) ON DELETE CASCADE;
    ALTER TABLE demo.wallet_transactions DROP CONSTRAINT IF EXISTS demo_wtx_counterparty_fk;
    ALTER TABLE demo.wallet_transactions
      ADD CONSTRAINT demo_wtx_counterparty_fk FOREIGN KEY (counterparty_id) REFERENCES auth.users(id);
    ALTER TABLE demo.wallet_transactions ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- ─── RLS: real users see nothing; demo users follow marketplace-style rules ───

ALTER TABLE demo.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_patients_all ON demo.patients;
DROP POLICY IF EXISTS demo_patients_select ON demo.patients;
DROP POLICY IF EXISTS demo_patients_insert ON demo.patients;
DROP POLICY IF EXISTS demo_patients_update ON demo.patients;
DROP POLICY IF EXISTS demo_patients_delete ON demo.patients;
CREATE POLICY demo_patients_select ON demo.patients
  FOR SELECT TO public
  USING (
    demo.is_demo_user()
    AND (
      guardian_id = (SELECT auth.uid())
      OR public.is_admin()
      OR (SELECT auth.uid()) IN (
        SELECT p.guardian_id FROM demo.placements p
        WHERE p.patient_id = demo.patients.id
          AND (SELECT auth.uid()) IN (p.agency_id, p.caregiver_id)
      )
    )
  );
CREATE POLICY demo_patients_insert ON demo.patients
  FOR INSERT TO public
  WITH CHECK (demo.is_demo_user() AND guardian_id = (SELECT auth.uid()));
CREATE POLICY demo_patients_update ON demo.patients
  FOR UPDATE TO public
  USING (demo.is_demo_user() AND (guardian_id = (SELECT auth.uid()) OR public.is_admin()))
  WITH CHECK (demo.is_demo_user() AND guardian_id = (SELECT auth.uid()));
CREATE POLICY demo_patients_delete ON demo.patients
  FOR DELETE TO public
  USING (demo.is_demo_user() AND (guardian_id = (SELECT auth.uid()) OR public.is_admin()));

ALTER TABLE demo.caregiver_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_cg_profiles_select ON demo.caregiver_profiles;
DROP POLICY IF EXISTS demo_cg_profiles_insert ON demo.caregiver_profiles;
DROP POLICY IF EXISTS demo_cg_profiles_update ON demo.caregiver_profiles;
CREATE POLICY demo_cg_profiles_select ON demo.caregiver_profiles
  FOR SELECT TO public USING (demo.is_demo_user());
CREATE POLICY demo_cg_profiles_insert ON demo.caregiver_profiles
  FOR INSERT TO public
  WITH CHECK (demo.is_demo_user() AND id = (SELECT auth.uid()));
CREATE POLICY demo_cg_profiles_update ON demo.caregiver_profiles
  FOR UPDATE TO public USING (demo.is_demo_user() AND id = (SELECT auth.uid()))
  WITH CHECK (demo.is_demo_user() AND id = (SELECT auth.uid()));

ALTER TABLE demo.guardian_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_gd_profiles_rw ON demo.guardian_profiles;
CREATE POLICY demo_gd_profiles_rw ON demo.guardian_profiles
  FOR ALL TO public
  USING (demo.is_demo_user() AND id = (SELECT auth.uid()))
  WITH CHECK (demo.is_demo_user() AND id = (SELECT auth.uid()));

ALTER TABLE demo.agencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_agencies_select ON demo.agencies;
DROP POLICY IF EXISTS demo_agencies_insert ON demo.agencies;
DROP POLICY IF EXISTS demo_agencies_update ON demo.agencies;
CREATE POLICY demo_agencies_select ON demo.agencies FOR SELECT TO public USING (demo.is_demo_user());
CREATE POLICY demo_agencies_insert ON demo.agencies
  FOR INSERT TO public
  WITH CHECK (demo.is_demo_user() AND id = (SELECT auth.uid()));
CREATE POLICY demo_agencies_update ON demo.agencies
  FOR UPDATE TO public USING (demo.is_demo_user() AND id = (SELECT auth.uid()))
  WITH CHECK (demo.is_demo_user() AND id = (SELECT auth.uid()));

ALTER TABLE demo.placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_placements_read ON demo.placements;
DROP POLICY IF EXISTS demo_placements_rw ON demo.placements;
CREATE POLICY demo_placements_rw ON demo.placements
  FOR ALL TO public
  USING (
    demo.is_demo_user()
    AND (
      (SELECT auth.uid()) IN (guardian_id, agency_id, caregiver_id)
      OR public.is_admin()
    )
  )
  WITH CHECK (
    demo.is_demo_user()
    AND (
      (SELECT auth.uid()) IN (guardian_id, agency_id, caregiver_id)
      OR public.is_admin()
    )
  );

ALTER TABLE demo.shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_shifts_rw ON demo.shifts;
CREATE POLICY demo_shifts_rw ON demo.shifts
  FOR ALL TO public
  USING (demo.is_demo_user())
  WITH CHECK (demo.is_demo_user());

ALTER TABLE demo.care_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_cc_select ON demo.care_contracts;
DROP POLICY IF EXISTS demo_cc_insert ON demo.care_contracts;
DROP POLICY IF EXISTS demo_cc_update ON demo.care_contracts;
DROP POLICY IF EXISTS demo_cc_delete ON demo.care_contracts;
CREATE POLICY demo_cc_select ON demo.care_contracts
  FOR SELECT TO public
  USING (
    demo.is_demo_user()
    AND (
      public.is_admin()
      OR owner_id = (SELECT auth.uid())
      OR agency_id = (SELECT auth.uid())
      OR (type = 'request' AND status = ANY (ARRAY['published'::text, 'bidding'::text, 'matched'::text]))
      OR (type = 'offer' AND status = 'published')
    )
  );
CREATE POLICY demo_cc_insert ON demo.care_contracts
  FOR INSERT TO public
  WITH CHECK (
    demo.is_demo_user()
    AND (
      public.is_admin()
      OR (
        owner_id = (SELECT auth.uid())
        AND (
          type = 'request'
          OR (type = 'offer' AND agency_id IS NOT DISTINCT FROM (SELECT auth.uid()))
        )
      )
    )
  );
CREATE POLICY demo_cc_update ON demo.care_contracts
  FOR UPDATE TO public
  USING (
    demo.is_demo_user()
    AND (
      public.is_admin()
      OR owner_id = (SELECT auth.uid())
      OR agency_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    demo.is_demo_user()
    AND (
      public.is_admin()
      OR owner_id = (SELECT auth.uid())
      OR agency_id = (SELECT auth.uid())
    )
  );
CREATE POLICY demo_cc_delete ON demo.care_contracts
  FOR DELETE TO public
  USING (
    demo.is_demo_user()
    AND (public.is_admin() OR owner_id = (SELECT auth.uid()))
  );

ALTER TABLE demo.care_contract_bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_ccb_select ON demo.care_contract_bids;
DROP POLICY IF EXISTS demo_ccb_insert ON demo.care_contract_bids;
DROP POLICY IF EXISTS demo_ccb_update ON demo.care_contract_bids;
DROP POLICY IF EXISTS demo_ccb_delete ON demo.care_contract_bids;
CREATE POLICY demo_ccb_select ON demo.care_contract_bids
  FOR SELECT TO public
  USING (
    demo.is_demo_user()
    AND (
      (SELECT auth.uid()) = agency_id
      OR contract_id IN (SELECT id FROM demo.care_contracts WHERE owner_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY demo_ccb_insert ON demo.care_contract_bids
  FOR INSERT TO public
  WITH CHECK (demo.is_demo_user() AND (SELECT auth.uid()) = agency_id);
CREATE POLICY demo_ccb_update ON demo.care_contract_bids
  FOR UPDATE TO public
  USING (demo.is_demo_user() AND (SELECT auth.uid()) = agency_id)
  WITH CHECK (demo.is_demo_user() AND (SELECT auth.uid()) = agency_id);
CREATE POLICY demo_ccb_delete ON demo.care_contract_bids
  FOR DELETE TO public
  USING (demo.is_demo_user() AND (SELECT auth.uid()) = agency_id);

ALTER TABLE demo.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_jobs_select ON demo.jobs;
DROP POLICY IF EXISTS demo_jobs_mutate ON demo.jobs;
CREATE POLICY demo_jobs_select ON demo.jobs FOR SELECT TO public USING (demo.is_demo_user());
CREATE POLICY demo_jobs_mutate ON demo.jobs
  FOR ALL TO public
  USING (demo.is_demo_user() AND posted_by = (SELECT auth.uid()))
  WITH CHECK (demo.is_demo_user() AND posted_by = (SELECT auth.uid()));

ALTER TABLE demo.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_inv_rw ON demo.invoices;
CREATE POLICY demo_inv_rw ON demo.invoices
  FOR ALL TO public
  USING (
    demo.is_demo_user()
    AND (
      (SELECT auth.uid()) IN (from_party_id, to_party_id)
      OR public.is_admin()
    )
  )
  WITH CHECK (
    demo.is_demo_user()
    AND (
      (SELECT auth.uid()) IN (from_party_id, to_party_id)
      OR public.is_admin()
    )
  );

ALTER TABLE demo.invoice_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_ili_select ON demo.invoice_line_items;
DROP POLICY IF EXISTS demo_ili_insert ON demo.invoice_line_items;
CREATE POLICY demo_ili_select ON demo.invoice_line_items
  FOR SELECT TO public
  USING (
    demo.is_demo_user()
    AND invoice_id IN (
      SELECT id FROM demo.invoices
      WHERE (SELECT auth.uid()) IN (from_party_id, to_party_id) OR public.is_admin()
    )
  );
CREATE POLICY demo_ili_insert ON demo.invoice_line_items
  FOR INSERT TO public
  WITH CHECK (
    demo.is_demo_user()
    AND EXISTS (
      SELECT 1 FROM demo.invoices i
      WHERE i.id = invoice_id
        AND ((SELECT auth.uid()) IN (i.from_party_id, i.to_party_id) OR public.is_admin())
    )
  );

ALTER TABLE demo.payment_proofs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS demo_pp_rw ON demo.payment_proofs;
CREATE POLICY demo_pp_rw ON demo.payment_proofs
  FOR ALL TO public
  USING (
    demo.is_demo_user()
    AND (SELECT auth.uid()) IN (submitted_by_id, received_by_id)
  )
  WITH CHECK (
    demo.is_demo_user()
    AND (SELECT auth.uid()) IN (submitted_by_id, received_by_id)
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallets') THEN
    EXECUTE 'ALTER TABLE demo.wallets ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS demo_wallets_rw ON demo.wallets';
    EXECUTE $p$
      CREATE POLICY demo_wallets_rw ON demo.wallets
        FOR ALL TO public
        USING (demo.is_demo_user() AND user_id = (SELECT auth.uid()))
        WITH CHECK (demo.is_demo_user() AND user_id = (SELECT auth.uid()))
    $p$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallet_transactions') THEN
    EXECUTE 'ALTER TABLE demo.wallet_transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS demo_wtx_select ON demo.wallet_transactions';
    EXECUTE 'DROP POLICY IF EXISTS demo_wtx_all ON demo.wallet_transactions';
    EXECUTE $p$
      CREATE POLICY demo_wtx_all ON demo.wallet_transactions
        FOR ALL TO public
        USING (
          demo.is_demo_user()
          AND wallet_id IN (SELECT w.id FROM demo.wallets w WHERE w.user_id = (SELECT auth.uid()))
        )
        WITH CHECK (
          demo.is_demo_user()
          AND wallet_id IN (SELECT w.id FROM demo.wallets w WHERE w.user_id = (SELECT auth.uid()))
        )
    $p$;
  END IF;
END $$;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA demo TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA demo TO authenticated;

-- Realtime (optional — channels use schema in client)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo.care_contracts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo.care_contract_bids;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo.invoices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE demo.payment_proofs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallets') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE demo.wallets;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'demo' AND table_name = 'wallet_transactions') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE demo.wallet_transactions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

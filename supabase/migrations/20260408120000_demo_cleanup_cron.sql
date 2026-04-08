-- Monthly purge of demo-user-created rows (demo_expires_at < now()). Permanent seeds keep demo_expires_at NULL.
-- If scheduling fails, run SELECT demo.cleanup_expired_rows(); manually (e.g. 1st of month).

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION demo.cleanup_expired_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = demo, public
AS $$
BEGIN
  IF to_regclass('demo.payment_proofs') IS NOT NULL THEN
    DELETE FROM demo.payment_proofs
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.invoice_line_items') IS NOT NULL THEN
    DELETE FROM demo.invoice_line_items
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.invoices') IS NOT NULL THEN
    DELETE FROM demo.invoices
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.care_contract_bids') IS NOT NULL THEN
    DELETE FROM demo.care_contract_bids
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.care_contracts') IS NOT NULL THEN
    DELETE FROM demo.care_contracts
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.shifts') IS NOT NULL THEN
    DELETE FROM demo.shifts
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.placements') IS NOT NULL THEN
    DELETE FROM demo.placements
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.jobs') IS NOT NULL THEN
    DELETE FROM demo.jobs
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.wallet_transactions') IS NOT NULL THEN
    DELETE FROM demo.wallet_transactions
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.wallets') IS NOT NULL THEN
    DELETE FROM demo.wallets
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.patients') IS NOT NULL THEN
    DELETE FROM demo.patients
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.caregiver_profiles') IS NOT NULL THEN
    DELETE FROM demo.caregiver_profiles
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.guardian_profiles') IS NOT NULL THEN
    DELETE FROM demo.guardian_profiles
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
  IF to_regclass('demo.agencies') IS NOT NULL THEN
    DELETE FROM demo.agencies
    WHERE demo_expires_at IS NOT NULL AND demo_expires_at < now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION demo.cleanup_expired_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION demo.cleanup_expired_rows() TO service_role;

-- Register cron (best-effort if pg_cron is enabled)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname = 'demo-monthly-cleanup' LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
  PERFORM cron.schedule(
    'demo-monthly-cleanup',
    '0 0 1 * *',
    'SELECT demo.cleanup_expired_rows()'
  );
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'demo-monthly-cleanup: cron.job not found (pg_cron disabled?)';
  WHEN undefined_function THEN
    RAISE NOTICE 'demo-monthly-cleanup: cron.schedule unavailable';
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'demo-monthly-cleanup: insufficient privileges; run SELECT demo.cleanup_expired_rows(); manually on the 1st of each month';
END $$;

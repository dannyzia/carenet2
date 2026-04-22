-- Add wallets and wallet_transactions to the supabase_realtime publication
-- so that postgres_changes listeners in subscribeToMonetization work correctly.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

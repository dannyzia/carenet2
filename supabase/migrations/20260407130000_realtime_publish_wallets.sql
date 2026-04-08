-- Add wallets and wallet_transactions to the supabase_realtime publication
-- so that postgres_changes listeners in subscribeToMonetization work correctly.

ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;

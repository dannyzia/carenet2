-- wallet_admin_all / tx_admin_all referenced wallets inside their own USING clause,
-- which can cause infinite recursion in RLS evaluation and HTTP 500 on SELECT.
-- Admin access should use public.is_admin() (stable helper used elsewhere).

DROP POLICY IF EXISTS "wallet_admin_all" ON public.wallets;
CREATE POLICY "wallet_admin_all" ON public.wallets AS PERMISSIVE FOR ALL TO public
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "tx_admin_all" ON public.wallet_transactions;
CREATE POLICY "tx_admin_all" ON public.wallet_transactions AS PERMISSIVE FOR ALL TO public
  USING (is_admin())
  WITH CHECK (is_admin());

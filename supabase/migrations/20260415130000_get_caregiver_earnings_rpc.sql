-- RPC: caregiver earnings + tax chart JSON from wallets / wallet_transactions
-- Matches client expectations in src/backend/services/caregiver.service.ts (rpcGetCaregiverEarningsOrEmpty).

CREATE OR REPLACE FUNCTION public.get_caregiver_earnings(p_caregiver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_id uuid;
  chart jsonb := '[]'::jsonb;
  tax jsonb := '[]'::jsonb;
  tot_earn bigint := 0;
  tot_with bigint := 0;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_caregiver_id THEN
    RAISE EXCEPTION 'not authorized' USING errcode = '42501';
  END IF;

  SELECT w.id INTO w_id
  FROM public.wallets w
  WHERE w.user_id = p_caregiver_id
  LIMIT 1;

  IF w_id IS NULL THEN
    RETURN jsonb_build_object(
      'earningsChart', '[]'::jsonb,
      'taxReport', '[]'::jsonb,
      'totalEarned', 0,
      'totalWithdrawn', 0
    );
  END IF;

  SELECT COALESCE(w.total_withdrawn, 0) INTO tot_with
  FROM public.wallets w
  WHERE w.id = w_id;

  SELECT COALESCE(SUM(GREATEST(0, t.amount)), 0)
  INTO tot_earn
  FROM public.wallet_transactions t
  WHERE t.wallet_id = w_id
    AND t.status = 'completed'
    AND t.amount > 0
    AND t.type IN (
      'earning',
      'contract_payment',
      'bonus',
      'admin_credit',
      'refund'
    );

  SELECT COALESCE(jsonb_agg(q.month_row ORDER BY q.ms), '[]'::jsonb)
  INTO chart
  FROM (
    SELECT
      date_trunc('month', t.created_at) AS ms,
      jsonb_build_object(
        'month', to_char(
          (date_trunc('month', t.created_at) AT TIME ZONE 'UTC'),
          'Mon'
        ),
        'earned', COALESCE(SUM(CASE
          WHEN t.amount > 0
            AND t.type IN (
              'earning',
              'contract_payment',
              'bonus',
              'admin_credit',
              'refund'
            )
          THEN t.amount
          ELSE 0
        END), 0),
        'withdrawn', COALESCE(SUM(CASE
          WHEN t.type = 'withdrawal' THEN GREATEST(0, -t.amount)
          ELSE 0
        END), 0)
      ) AS month_row
    FROM public.wallet_transactions t
    WHERE t.wallet_id = w_id
      AND t.status = 'completed'
    GROUP BY date_trunc('month', t.created_at)
  ) q;

  SELECT COALESCE(jsonb_agg(x.tax_row ORDER BY x.ms), '[]'::jsonb)
  INTO tax
  FROM (
    SELECT
      date_trunc('month', t.created_at) AS ms,
      jsonb_build_object(
        'month', to_char(
          (date_trunc('month', t.created_at) AT TIME ZONE 'UTC'),
          'Mon'
        ),
        'income', COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0)
      ) AS tax_row
    FROM public.wallet_transactions t
    WHERE t.wallet_id = w_id
      AND t.status = 'completed'
    GROUP BY date_trunc('month', t.created_at)
  ) x;

  RETURN jsonb_build_object(
    'earningsChart', chart,
    'taxReport', tax,
    'totalEarned', tot_earn,
    'totalWithdrawn', tot_with
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_caregiver_earnings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_caregiver_earnings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_caregiver_earnings(uuid) TO service_role;

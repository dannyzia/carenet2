-- Link invoices to care_contracts; fix RLS so both parties can manage invoices; allow line item inserts.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS care_contract_id UUID REFERENCES public.care_contracts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_one_per_care_contract
  ON public.invoices( care_contract_id )
  WHERE care_contract_id IS NOT NULL;

COMMENT ON COLUMN public.invoices.care_contract_id IS 'Optional link to care_contract when bill is generated after care completion.';

-- inv_manage previously allowed only from_party — both parties must manage invoices for manual payment flow.
DROP POLICY IF EXISTS "inv_manage" ON public.invoices;
CREATE POLICY "inv_manage" ON public.invoices AS PERMISSIVE FOR ALL TO public
  USING (
    from_party_id = (SELECT auth.uid())
    OR to_party_id = (SELECT auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    from_party_id = (SELECT auth.uid())
    OR to_party_id = (SELECT auth.uid())
    OR is_admin()
  );

-- Invoice line items: allow insert when user is party on parent invoice.
DROP POLICY IF EXISTS "ili_insert" ON public.invoice_line_items;
CREATE POLICY "ili_insert" ON public.invoice_line_items AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_line_items.invoice_id
        AND (
          i.from_party_id = (SELECT auth.uid())
          OR i.to_party_id = (SELECT auth.uid())
          OR is_admin()
        )
    )
  );

# Plan 10 — Central Payment Gateway (CENTRAL_PAYMENT_GATEWAY_001)

**Type:** ARCHITECTURE_REFACTOR  
**Flags:** ALLOW_SCHEMA_CHANGE · ALLOW_API_BREAKING_CHANGE · REALTIME_REQUIRED · HIGH_SECURITY_MODE

Transition billing from peer-to-peer (Guardian → Provider directly) to centralized platform escrow (Guardian → CareNet Platform → Provider). Payment proofs route to Admin for verification. On approval, an idempotent Postgres SECURITY DEFINER RPC credits the provider's internal wallet.

---

## Decisions

| Question | Decision |
|----------|----------|
| Platform payment details (bKash/bank) | Stored in `platform_config` table rows — never hardcoded. Fetched at runtime. |
| Moderator access to verify payments | Controlled by admin-togglable `platform_config` key `moderator_can_verify_payments` (default `false`). Moderators get a `/moderator/payment-proofs` route that checks this setting. |
| New `PointTransactionType` values | **None.** Use existing `earning` (provider) and `platform_fee` (platform) per spec §2–4. Ignore the contradictory §6 suggestion of `service_earning`/`product_sale`. |
| `provider_id` column on `invoices` | **Not added.** `from_party_id` IS the provider. Model adds `careContractId` only. |
| Direct `wallet_transactions` INSERT from service layer | **Forbidden.** All wallet mutations go through `credit_escrow_earning` SECURITY DEFINER RPC. |

---

## Current State (Gaps)

- `submitPaymentProof` routes `received_by_id` to the opposing party (Agency/Caregiver), not Admin.
- `verifyPaymentProof` has no role check — any authenticated user can call it.
- No automated wallet credit occurs when invoice is paid.
- `BillingInvoice` model lacks `careContractId` (needed for idempotency).
- `payment_proofs` UPDATE RLS allows `received_by_id` (provider) to update — security gap.
- No Admin UI exists for bulk proof verification.
- `billing.model.ts` doc comment still says "Agency/Caregiver verifies".

---

## Phase 1 — Schema & Backend

### 1.1 Migration: `supabase/migrations/20260422130000_central_payment_gateway.sql`

#### A. Seed `platform_config` rows

```sql
INSERT INTO platform_config (key, value) VALUES
  ('platform_bkash_number',          '"01613249520"'),
  ('platform_bank_name',             '"Eastern Bank Limited"'),
  ('platform_bank_account',          '"(set by admin)"'),
  ('moderator_can_verify_payments',  'false')
ON CONFLICT (key) DO NOTHING;
```

Admin edits these values through `AdminSettingsPage` (existing editor) — no hardcoding anywhere.

#### B. `credit_escrow_earning` (SECURITY DEFINER)

```sql
CREATE OR REPLACE FUNCTION public.credit_escrow_earning(
  p_invoice_id       UUID,
  p_provider_user_id UUID,
  p_amount           BIGINT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Idempotency: return early if this invoice was already credited
  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE contract_id = p_invoice_id::text AND type = 'earning'
  ) THEN RETURN; END IF;

  -- Upsert wallet (handles case where provider wallet doesn't exist yet)
  INSERT INTO wallets (user_id, user_role, balance, total_earned)
    SELECT p_provider_user_id,
           COALESCE((SELECT role FROM profiles WHERE id = p_provider_user_id), 'agency'),
           p_amount,
           p_amount
  ON CONFLICT (user_id) DO UPDATE
    SET balance      = wallets.balance + p_amount,
        total_earned = wallets.total_earned + p_amount;

  -- Record the earning transaction
  INSERT INTO wallet_transactions (
    wallet_id, type, amount, balance_after,
    description, contract_id, status
  ) VALUES (
    p_provider_user_id,
    'earning',
    p_amount,
    (SELECT balance FROM wallets WHERE user_id = p_provider_user_id),
    'Escrow payout — invoice ' || p_invoice_id::text,
    p_invoice_id::text,
    'completed'
  );
END;
$$;
```

> Frozen wallets (`status = 'frozen'`) still receive credits — frozen means no withdrawal, not no credit.

#### C. RLS Policy Changes

```sql
-- payment_proofs UPDATE: restrict to admin/moderator only
DROP POLICY IF EXISTS "pp_update" ON public.payment_proofs;
CREATE POLICY "pp_update" ON public.payment_proofs
  AS PERMISSIVE FOR UPDATE TO public
  USING (is_mod_or_admin());

-- payment_proofs SELECT: guardians, providers for their invoices, admins/mods
DROP POLICY IF EXISTS "pp_select"               ON public.payment_proofs;
DROP POLICY IF EXISTS "Payment proof parties read" ON public.payment_proofs;
CREATE POLICY "pp_select" ON public.payment_proofs
  AS PERMISSIVE FOR SELECT TO public
  USING (
    submitted_by_id = (SELECT auth.uid())
    OR received_by_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payment_proofs.invoice_id
        AND i.from_party_id = (SELECT auth.uid())
    )
    OR is_mod_or_admin()
  );
```

**Existing policies confirmed safe (no change needed):**
- `pp_insert`: `submitted_by_id = auth.uid()` ✓
- `inv_select`: parties + admin ✓
- `inv_manage`: `from_party_id = auth.uid()` OR admin ✓ (no direct UPDATE path for providers)
- `wallet_transactions`: INSERT only via RPC (SECURITY DEFINER bypasses RLS) ✓

---

### 1.2 `src/backend/models/billing.model.ts`

- **Line 3–4 comment**: `"Admin verifies via platform escrow — funds credited to provider wallet on approval"`
- **`BillingInvoice` interface**: Add `careContractId?: string;` after `placementId`

---

### 1.3 `src/backend/services/billing.service.ts`

#### `mapInvoice` (L50)
Add to returned object:
```ts
careContractId: d.care_contract_id,
```

#### `submitPaymentProof` (L183–261)

**New guard** (before insert):
```ts
if (inv.status === 'paid') throw new Error('billing.alreadyPaid');
```

**Replace dynamic `receiverId` logic** (L199–204) with:
```ts
const adminId =
  import.meta.env.VITE_PLATFORM_ADMIN_ID ||
  (await sbData().from("profiles").select("id").eq("role", "admin").limit(1).single()).data?.id;
if (!adminId) throw new Error("Platform admin not configured");

const receiverId   = adminId;
const receiverName = "CareNet Platform";
const receiverRole = "admin";
```

**Mock path**: simulate admin routing — `receiverId` set to a fixed demo-admin UUID.

#### `verifyPaymentProof` (L263–308)

Replace body with this flow:

**Step 1 — Auth guard**
```ts
const { data: callerProfile } = await getSupabaseClient()
  .from("profiles").select("role").eq("id", userId).single();
const callerRole = callerProfile?.role;
if (callerRole !== 'admin') {
  if (callerRole === 'moderator') {
    const { data: cfg } = await getSupabaseClient()
      .from("platform_config").select("value")
      .eq("key", "moderator_can_verify_payments").single();
    const allowed = JSON.parse(cfg?.value || "false");
    if (!allowed) throw new Error("UNAUTHORIZED");
  } else {
    throw new Error("UNAUTHORIZED");
  }
}
```

**Step 2** — Keep existing `payment_proofs` status update to `'verified'`

**Step 3** — Keep existing `invoices` update to `'paid'`

**Step 4 — Escrow payout**
```ts
const { data: inv } = await sbData().from("invoices")
  .select("from_party_id, subtotal").eq("id", proof.invoice_id).single();
const { error: rpcErr } = await getSupabaseClient().rpc("credit_escrow_earning", {
  p_invoice_id:        proof.invoice_id,
  p_provider_user_id:  inv.from_party_id,
  p_amount:            inv.subtotal,
});
if (rpcErr) throw rpcErr;
```

**Step 5 — Notifications (3 total)**
```ts
// 1. Guardian — payment accepted
notificationService.triggerNotification({
  type: "billing_proof_verified", title: "Payment Verified",
  body: `Your payment for invoice ${proof.invoice_id} has been verified by the Platform.`,
  receiverId: proof.submitted_by_id,
  actionUrl: `/billing/invoice/${proof.invoice_id}`,
});

// 2. Provider — wallet credited
notificationService.triggerNotification({
  type: "billing_provider_credited", title: "Funds Credited",
  body: `You have been credited ${inv.subtotal} CarePoints for invoice ${proof.invoice_id}.`,
  receiverId: inv.from_party_id,
  actionUrl: `/wallet`,
});

// 3. Admin confirmation (existing triggerBillingProofVerified call — keep)
```

**Mock path**: simulate `credit_escrow_earning` call with console log.

#### `rejectPaymentProof` (L310–358)

Add same auth guard as `verifyPaymentProof` (Step 1). Existing reject logic is correct.

#### New: `getPaymentProofsForAdmin(statusFilter?: string)`

```ts
async getPaymentProofsForAdmin(statusFilter?: string): Promise<PaymentProof[]> {
  if (USE_SUPABASE) {
    return sbRead(`proofs:admin:${statusFilter || "all"}`, async () => {
      let q = sbData().from("payment_proofs")
        .select("*").order("submitted_at", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapProof);
    });
  }
  return demoOfflineDelayAndPick(200, [] as PaymentProof[], (m) => m.MOCK_PAYMENT_PROOFS);
}
```

#### New: `getPlatformPaymentDetails()`

```ts
async getPlatformPaymentDetails(): Promise<{
  bkash: string; bankName: string; bankAccount: string;
}> {
  if (USE_SUPABASE) {
    const { data } = await getSupabaseClient().from("platform_config")
      .select("key, value")
      .in("key", ["platform_bkash_number", "platform_bank_name", "platform_bank_account"]);
    const cfg = Object.fromEntries(
      (data || []).map((r: any) => [r.key, JSON.parse(r.value)])
    );
    return {
      bkash:       cfg.platform_bkash_number || "",
      bankName:    cfg.platform_bank_name    || "",
      bankAccount: cfg.platform_bank_account || "",
    };
  }
  return { bkash: "", bankName: "", bankAccount: "" };
}
```

---

### 1.4 `src/backend/services/walletService.ts`

Add `creditEscrowEarning` (thin wrapper — billing.service calls the RPC directly, but this is available for standalone use):

```ts
export async function creditEscrowEarning(
  invoiceId: string,
  providerUserId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  if (!shouldUseSupabase()) {
    console.log(`[Mock] Escrow credit ${amount} CP → ${providerUserId} for invoice ${invoiceId}`);
    return { success: true };
  }
  return withRetry(async () => {
    const { error } = await getSupabaseClient().rpc("credit_escrow_earning", {
      p_invoice_id: invoiceId, p_provider_user_id: providerUserId, p_amount: amount,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, WRITE_RETRY);
}
```

---

### 1.5 `src/backend/services/realtime.ts`

Add `subscribeToAdminPaymentProofs`:

```ts
export function subscribeToAdminPaymentProofs(onChange: () => void): () => void {
  if (!USE_SUPABASE) return () => {};
  const sb = getSupabaseClient();
  const schema = getRealtimeDataSchema();
  const channelName = `admin:payment-proofs:${schema}`;
  const channel = sb.channel(channelName)
    .on("postgres_changes", { event: "INSERT", schema, table: "payment_proofs" },
      () => { recordMessageReceived(channelName); onChange(); })
    .on("postgres_changes", { event: "UPDATE", schema, table: "payment_proofs" },
      () => { recordMessageReceived(channelName); onChange(); })
    .subscribe();
  trackChannelConnected();
  _registerChannel(channelName, CHANNEL_STALE_PRESETS.admin);
  return () => {
    sb.removeChannel(channel);
    trackChannelDisconnected();
    _unregisterChannel(channelName);
  };
}
```

---

## Phase 2 — Frontend

### 2.1 `src/app/routes.ts`

Under admin children (after `role-activations`):
```ts
{ path: "payment-proofs", ...p(() => import("@/frontend/pages/admin/AdminPaymentProofsPage")) },
```

Under moderator routes (after `moderator/activations`):
```ts
{ path: "moderator/payment-proofs", ...p(() => import("@/frontend/pages/admin/AdminPaymentProofsPage")) },
```

The shared page component handles both roles internally.

---

### 2.2 `src/frontend/pages/admin/AdminPaymentProofsPage.tsx` (NEW)

**Features:**
- `useAuth()` to get `user.activeRole`
- If `activeRole === 'moderator'`: fetch `platform_config.moderator_can_verify_payments` — if false, render `t('billing.moderatorFeatureDisabled')` info card
- `useAsyncData` to fetch proofs via `billingService.getPaymentProofsForAdmin(activeFilter)`
- `useEffect` realtime via `subscribeToAdminPaymentProofs(() => refetch())`; cleanup on unmount
- Filter tabs: All | Pending | Verified | Rejected
- Table: Invoice ID · Guardian · Provider · Amount · Method · Date Submitted
- Row → modal/panel: screenshot preview, reference number, notes, `submittedBy`, proof status
- **Approve** → `billingService.verifyPaymentProof(proofId)` → success toast `t('billing.providerWalletCredited')`; handle `UNAUTHORIZED` error
- **Reject** → reason textarea → `billingService.rejectPaymentProof(proofId, reason)`
- Loading/error states with retry
- Design: `PageHero` with admin gradient, glassmorphic cards, motion fade-in on rows

---

### 2.3 `src/frontend/pages/billing/SubmitPaymentProofPage.tsx` (MODIFY)

**Changes:**
- `useAsyncData` to fetch `billingService.getPlatformPaymentDetails()` on mount
- **Amount card** (L147): `To: {t('billing.payToPlatform')}` — remove `invoice.fromParty.name`
- **New "How to Pay" section** between amount card and method selector:
  ```
  bKash: {details.bkash}  [Copy]
  Bank: {details.bankName} — Acct: {details.bankAccount}  [Copy]
  ```
  Copy button uses `navigator.clipboard.writeText` → shows `t('billing.copied')` briefly
- **Warning banner** (L219): `{t('billing.pendingAdminVerification')}` — remove provider name reference
- **Success screen** (L96): `{t('billing.platformVerifying')}` — remove `{invoice.fromParty.name}`
- **Toast** (L68): update description to use platform messaging

---

### 2.4 `src/frontend/pages/billing/VerifyPaymentPage.tsx` (MODIFY)

- Import `useAuth`
- At top of component (after loading guard):
  ```tsx
  const { user } = useAuth();
  const isVerifier = user?.activeRole === 'admin' || user?.activeRole === 'moderator';
  if (!isVerifier) {
    return (
      <div>  {/* info card */}
        <p>{t('billing.verificationHandledByPlatform')}</p>
        <Button onClick={() => navigate('/billing')}>Back to Billing</Button>
      </div>
    );
  }
  ```
- Update verify success toast to include `t('billing.providerWalletCredited')`
- Handle `UNAUTHORIZED` error on verify/reject — show error toast, do not redirect

---

### 2.5 `src/frontend/pages/billing/BillingOverviewPage.tsx` (MODIFY)

- **`InvoiceCard`**: no change to invoice actions
- **`ProofCard`** (L212–237): conditionally render based on `user.activeRole`
  ```tsx
  // Non-admin/moderator: read-only badge instead of "View" link
  {isVerifier
    ? <button onClick={onView}>View</button>
    : <span className="badge">{t('billing.platformVerifying')}</span>
  }
  ```
- **`statusConfig`** (L22): update `proof_submitted` label via `t('billing.pendingAdminVerification')` (all roles see the translated label — admin sees it too, which is fine)

---

## Phase 3 — i18n

### `src/locales/en/common.json`

Add inside the `billing` namespace (or at root if flat):

```json
"billing.pendingAdminVerification": "Pending Admin Verification",
"billing.platformVerifying": "Platform Verifying Payment",
"billing.payToPlatform": "CareNet Platform",
"billing.platformName": "CareNet Platform",
"billing.providerCreditedNotice": "You have been credited {{amount}} CarePoints for your service.",
"billing.paymentVerifiedByPlatform": "Your payment has been verified by the Platform.",
"billing.adminProofDashboard": "Payment Proof Verification",
"billing.alreadyPaid": "This invoice has already been paid.",
"billing.verificationHandledByPlatform": "Payment verification is handled by the CareNet Platform team.",
"billing.platformBkashLabel": "bKash Number",
"billing.platformBankLabel": "Bank Account",
"billing.copyToClipboard": "Copy",
"billing.copied": "Copied!",
"billing.payInstructions": "Send payment to CareNet using one of the methods below, then upload your proof.",
"billing.moderatorFeatureDisabled": "Payment verification is currently restricted to Admins. Contact your admin to enable moderator access.",
"billing.providerWalletCredited": "Payment verified. Provider wallet credited."
```

### `src/locales/bn/common.json`

Add Bangla translations for all keys above.

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `supabase/migrations/20260422130000_central_payment_gateway.sql` | **NEW** | 1 |
| `src/backend/models/billing.model.ts` | MODIFY | 1 |
| `src/backend/services/billing.service.ts` | MODIFY | 1 |
| `src/backend/services/walletService.ts` | MODIFY | 1 |
| `src/backend/services/realtime.ts` | MODIFY | 1 |
| `src/frontend/pages/admin/AdminPaymentProofsPage.tsx` | **NEW** | 2 |
| `src/app/routes.ts` | MODIFY | 2 |
| `src/frontend/pages/billing/SubmitPaymentProofPage.tsx` | MODIFY | 2 |
| `src/frontend/pages/billing/VerifyPaymentPage.tsx` | MODIFY | 2 |
| `src/frontend/pages/billing/BillingOverviewPage.tsx` | MODIFY | 2 |
| `src/locales/en/common.json` | MODIFY | 3 |
| `src/locales/bn/common.json` | MODIFY | 3 |

---

## Edge Cases

| Case | Handling |
|------|----------|
| Provider wallet doesn't exist | `credit_escrow_earning` uses `ON CONFLICT DO UPDATE` (upsert) |
| Admin verifies twice (double-click / retry) | RPC checks for existing `contract_id + type='earning'` row and returns early |
| Invoice already paid when Guardian submits proof | `submitPaymentProof` checks `inv.status === 'paid'` → throws `billing.alreadyPaid` |
| Provider manually calls `verifyPaymentProof` via API | Service guard throws `UNAUTHORIZED`; `pp_update` RLS blocks raw Supabase call |
| Wallet is frozen | RPC still credits — frozen = no withdrawal, not no credit |
| Realtime disconnect during verification | Provider dashboard fetches on mount; realtime is additive |
| Moderator toggle disabled mid-session | Next `verifyPaymentProof` call re-checks config → throws `UNAUTHORIZED` |

---

## Security Summary

| Layer | Control |
|-------|---------|
| Service layer | Role check before any write in `verifyPaymentProof` / `rejectPaymentProof` |
| RLS — `payment_proofs` UPDATE | `is_mod_or_admin()` only |
| RLS — `wallet_transactions` INSERT | Blocked from client; only via SECURITY DEFINER RPC |
| RLS — `wallets` INSERT/UPDATE | Blocked from client; only via SECURITY DEFINER RPC |
| Moderator feature gate | `platform_config.moderator_can_verify_payments` checked at service + UI layer |

---

## Verification Plan

### Vitest Unit Tests

- `verifyPaymentProof(proofId)` with provider role → `Error('UNAUTHORIZED')`
- `verifyPaymentProof(proofId)` with moderator + config disabled → `Error('UNAUTHORIZED')`
- `verifyPaymentProof(proofId)` with moderator + config enabled → succeeds
- `verifyPaymentProof(proofId)` called twice → second call is idempotent (no duplicate tx)
- `submitPaymentProof` on paid invoice → throws `billing.alreadyPaid`
- `submitPaymentProof` sets `received_by_id` to admin UUID, not provider
- `subtotal + platform_fee === total` in `ensureInvoiceForCompletedCareContract`

### RLS SQL Tests

- Provider JWT → `UPDATE payment_proofs SET status='verified'` → expect RLS violation
- Admin JWT → same UPDATE → expect success
- Provider A JWT → SELECT proofs for Provider B's invoice → expect 0 rows
- Admin JWT → SELECT all payment_proofs → expect all rows

### Manual Browser Flows

1. Guardian submits proof → sees "CareNet Platform" messaging + bKash/bank details
2. Agency navigates to `/billing/verify/:id` → sees redirect info message
3. Admin at `/admin/payment-proofs` → approves proof → provider wallet balance increases → toast confirms credit
4. Admin toggles `moderator_can_verify_payments` ON → moderator sees `/moderator/payment-proofs`
5. Rejection flow → Guardian receives rejection notification → can resubmit

### Realtime Tests

- New proof INSERT → `AdminPaymentProofsPage` list updates within 2s
- Unmount `AdminPaymentProofsPage` → `supabase.removeChannel` called (verify via channel count)

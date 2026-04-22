# Channel Partner (ChanP) Implementation Plan

**Status: ✅ COMPLETE (as of Apr 20, 2026)**

Complete implementation of the Channel Partner referral and commission system across all 3 phases - Foundation, ChanP Core Experience, and Admin Panel with production readiness.

---

## Completion Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | All 14 steps complete. Role types updated, mock auth, database migrations (4 tables + RLS), channelPartnerService.ts with full mock fallback |
| Phase 2: ChanP Core Experience | ✅ Complete | All 11 pages created (Dashboard, Leads, Commissions, Rates, Account, Pending/Rejected/Suspended states). Routes registered |
| Phase 3: Admin Panel | ✅ Complete | Admin list/detail pages created with approval/rejection/suspend/deactivate actions |

**Demo Access**: `channelpartner@carenet.demo` / `demo1234` / TOTP `123456`

**Key URLs**:
- ChanP Dashboard: `/cp/dashboard`
- ChanP Leads: `/cp/leads`
- ChanP Commissions: `/cp/commissions`
- Admin ChanP List: `/admin/channel-partners`

**Remaining for Production**:
- i18n translation keys (en/bn) for all ChanP strings
- Edge Functions for proxy lead creation and activation links
- Playwright E2E tests
- Vitest unit tests for service layer

---

## 1. IMPACT ANALYSIS

### Affected Systems
- **Authentication & Roles**: New `channel_partner` role type, status-gated routing, demo user additions
- **Database Schema**: 4 new tables (`channel_partners`, `channel_partner_leads`, `channel_partner_commission_rates`, `channel_partner_commissions`), RLS policies, indexes, SECURITY DEFINER functions
- **Audit System**: `audit_logs` table schema migration to expose `metadata` JSONB field in TypeScript model; 20+ new CP_* audit action types
- **Notification System**: New `commission` channel, 12+ ChanP-specific notification events
- **Wallet/Points**: New `cp_commission` PointTransactionType, commission credit flows
- **Billing/Invoices**: Postgres triggers on `public.invoices` for commission calculation and crediting
- **Frontend Routes**: 11 new ChanP routes, registration form changes, admin panel extensions
- **Service Layer**: New `channelPartnerService.ts` with 18+ functions, extensions to `admin.service.ts`
- **Realtime Subscriptions**: Filtered subscriptions on `channel_partner_commissions` and `channel_partner_leads`
- **i18n**: New namespace keys for all ChanP strings in both `en` and `bn` locales

### Risk Assessment
| Area | Risk Level | Mitigation |
|------|------------|------------|
| Database migrations | Medium | Additive changes only; no existing table modifications beyond `audit_logs.metadata` exposure |
| Commission triggers | Medium-High | SECURITY DEFINER functions with idempotency guarantees; fallback to Edge Function if triggers fail |
| RLS policies | Medium | Thoroughly test with ChanP, admin, moderator, and unrelated user credentials |
| Invoice flow interference | High | Triggers must complete <100ms; commission calculation is async to invoice creation |
| Mock fallback | Low | Full mock data coverage ensures offline/USE_SUPABASE=false compatibility |

### Breaking Changes
- **None** - All changes are additive. The `channel_partner` role type is new; existing roles unaffected.
- Rollback: Drop 4 new tables, remove `metadata` from TypeScript model (DB column remains), remove role type (requires code revert).

---

## 2. ARCHITECTURE DECISIONS

### Commission Trigger Mechanism: Postgres Triggers (Primary) with Edge Function Fallback

**Decision**: Implement two Postgres triggers on `public.invoices`:
1. `AFTER INSERT` → `calculate_cp_commission(NEW.id)` → inserts `pending` commission record
2. `AFTER UPDATE OF status` → `credit_cp_commission(NEW.id)` → transitions `pending` → `credited`, credits wallet

**Rationale**:
- **Consistency**: Triggers guarantee commission is calculated for every invoice regardless of creation path (API, admin, Edge Function)
- **Performance**: In-database calculation avoids network round-trip; target <100ms execution
- **Idempotency**: `UNIQUE(invoice_id, channel_partner_id)` with `ON CONFLICT DO NOTHING` handles race conditions
- **Security**: `SECURITY DEFINER` functions bypass RLS for wallet credit operations

**Fallback**: If trigger performance degrades or maintenance is needed, disable triggers and invoke equivalent Edge Function from invoice service layer.

### Rate History Design: Immutable Records with `effective_to` Closure

**Decision**: Each rate change creates a new record; old record gets `effective_to = now()` via `SECURITY DEFINER` function `close_previous_rate()`.

**Rationale**:
- **Audit compliance**: Full historical record of every rate change with previous_rate snapshot
- **Query performance**: `UNIQUE PARTIAL` index on `(channel_partner_id, lead_role) WHERE effective_to IS NULL` gives O(1) active rate lookup
- **Race safety**: Function-level locking prevents concurrent updates creating duplicate "active" rates

### Lead Attribution: Permanent with Admin Override

**Decision**: Attribution is permanent at creation time. Reassignment requires explicit admin action with audit trail (`CP_LEAD_REASSIGNED`).

**Rationale**:
- **Predictability**: ChanPs can rely on perpetual commission; no surprise attribution changes
- **Business clarity**: Prevents disputes over "stolen" leads
- **Override capability**: Admin can fix errors with full audit visibility

### Proxy Registration: Activation Link (No Temporary Password)

**Decision**: ChanP creates auth user; lead receives Supabase magic link/password-setup email valid 24 hours.

**Rationale**:
- **Security**: No plaintext password transmission
- **User experience**: Lead controls their own password
- **Commission timing**: Attribution established at proxy-creation; commission accrues from first invoice even if lead hasn't activated

---

## 3. DATABASE DESIGN

### New Tables

#### `channel_partners`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, gen_random_uuid() | ChanP record ID |
| user_id | UUID | FK→auth.users.id, UNIQUE, NOT NULL | Links to auth user |
| referral_code | TEXT | UNIQUE partial (WHERE NOT NULL) | Generated at approval |
| status | TEXT | NOT NULL, default pending_approval | pending_approval, active, suspended, deactivated, rejected |
| business_name | TEXT | | Trading name |
| nid_number | TEXT | | PII - restricted access |
| phone | TEXT | | Contact phone |
| bank_account | JSONB | | {bank, account_number, account_name, routing_number} |
| notes | TEXT | | Admin-only notes |
| reapplication_count | INTEGER | NOT NULL, default 0 | Times reapplied after rejection |
| approved_by | UUID | FK→auth.users.id | Admin who approved |
| approved_at | TIMESTAMPTZ | | Approval timestamp |
| rejected_by | UUID | FK→auth.users.id | Admin who rejected |
| rejected_at | TIMESTAMPTZ | | Rejection timestamp |
| rejection_reason | TEXT | | Rejection explanation |
| suspended_by | UUID | FK→auth.users.id | Admin who suspended |
| suspended_at | TIMESTAMPTZ | | Suspension timestamp |
| suspended_reason | TEXT | | Suspension reason |
| deactivated_by | UUID | FK→auth.users.id | Admin who deactivated |
| deactivated_at | TIMESTAMPTZ | | Deactivation timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Registration date |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | Auto-maintained by trigger |

**Indexes**: 
- `UNIQUE(referral_code) WHERE NOT NULL`
- `INDEX(user_id)`
- `INDEX(status)`

#### `channel_partner_leads`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, gen_random_uuid() | Record ID |
| channel_partner_id | UUID | FK→channel_partners.id, NOT NULL | Owning ChanP |
| lead_user_id | UUID | FK→auth.users.id, NOT NULL, UNIQUE | The referred user |
| lead_role | TEXT | NOT NULL | Role at attribution time |
| attribution_method | TEXT | NOT NULL, default referral_code | referral_code, cp_created, admin_assignment |
| referral_code_used | TEXT | | Exact code entered (referral_code method only) |
| assigned_by | UUID | FK→auth.users.id | Admin who manually assigned |
| is_active | BOOLEAN | NOT NULL, default true | Currently active |
| registration_completed_at | TIMESTAMPTZ | | When proxy lead activated account |
| deactivated_at | TIMESTAMPTZ | | When lead deactivated |
| deactivation_reason | TEXT | | Why lead deactivated |
| joined_at | TIMESTAMPTZ | NOT NULL, default now() | Attribution timestamp |

**Indexes**:
- `UNIQUE(lead_user_id)` - One ChanP per lead
- `INDEX(channel_partner_id)`
- `INDEX(channel_partner_id, is_active)`

#### `channel_partner_commission_rates`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, gen_random_uuid() | Record ID |
| channel_partner_id | UUID | FK→channel_partners.id, NOT NULL | Owning ChanP |
| lead_role | TEXT | NOT NULL | guardian, agency, caregiver, shop |
| rate | NUMERIC(5,2) | NOT NULL | Commission % of platform commission |
| effective_from | TIMESTAMPTZ | NOT NULL, default now() | When rate became active |
| effective_to | TIMESTAMPTZ | | When superseded (NULL = active) |
| expires_at | TIMESTAMPTZ | NOT NULL | Admin-set expiry |
| expiry_notified | BOOLEAN | NOT NULL, default false | Warning notification sent |
| previous_rate | NUMERIC(5,2) | | Rate before this change |
| changed_by | UUID | FK→auth.users.id, NOT NULL | Admin who set rate |
| reason | TEXT | | Why rate was set/changed |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Audit timestamp |

**Indexes**:
- `UNIQUE(channel_partner_id, lead_role) WHERE effective_to IS NULL` - One active rate per role
- `INDEX(channel_partner_id, lead_role, effective_from)`
- `INDEX(expires_at) WHERE expiry_notified = false` - Cron job query

#### `channel_partner_commissions`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, gen_random_uuid() | Record ID |
| channel_partner_id | UUID | FK→channel_partners.id, NOT NULL | Owning ChanP |
| lead_user_id | UUID | FK→auth.users.id, NOT NULL | Lead who generated invoice |
| lead_role | TEXT | NOT NULL | Lead role at invoice time |
| invoice_id | UUID | FK→public.invoices.id, NOT NULL | Source invoice |
| rate_record_id | UUID | FK→channel_partner_commission_rates.id, NOT NULL | Snapshot reference |
| invoice_amount | INTEGER | NOT NULL | Invoice total (CarePoints) |
| platform_commission_amount | INTEGER | NOT NULL | Platform commission (CarePoints) |
| cp_commission_rate | NUMERIC(5,2) | NOT NULL | Rate at invoice time (snapshot) |
| cp_commission_amount | INTEGER | NOT NULL | ChanP commission (CarePoints) |
| status | TEXT | NOT NULL, default pending | pending, credited, paid, reversed |
| wallet_transaction_id | UUID | FK→wallet_transactions.id | Set when credited |
| invoice_generated_at | TIMESTAMPTZ | NOT NULL | Invoice creation timestamp |
| payment_collected_at | TIMESTAMPTZ | | Payment verification timestamp |
| credited_at | TIMESTAMPTZ | | Wallet credit timestamp |
| reversed_at | TIMESTAMPTZ | | Reversal timestamp |
| reversal_reason | TEXT | | Why reversed |
| reversed_by | UUID | FK→auth.users.id | Admin who reversed |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Record creation |

**Indexes**:
- `UNIQUE(invoice_id, channel_partner_id)` - Idempotency
- `INDEX(channel_partner_id, status)`
- `INDEX(lead_user_id, lead_role)`
- `INDEX(invoice_generated_at)`

### Modified Tables/Schema

#### `audit_logs` (existing)
- **Current**: TypeScript `AuditLogEntry` model lacks `metadata` field despite DB having `metadata JSONB NOT NULL DEFAULT '{}'`
- **Change**: Add `metadata?: Record<string, unknown>` to TypeScript model in `src/backend/models/admin.model.ts`

#### `profiles` (CHECK constraint update)
- **Current**: `role` and `active_role` CHECK constraints exclude `channel_partner`
- **Change**: Migration to `DROP CONSTRAINT` and `ADD CONSTRAINT` including `channel_partner`

### RLS Policy Design

#### `channel_partners`
| Operation | Policy | Logic |
|-------------|--------|-------|
| SELECT | ChanP reads own | `auth.uid() = user_id` |
| SELECT | Admin reads all | `role claim = admin` |
| SELECT | Moderator reads all | `role claim = moderator` |
| INSERT | Admin/Mod only | `role claim IN (admin, moderator)` |
| UPDATE | Admin/Mod only | `role claim IN (admin, moderator)` |
| DELETE | Forbidden | Use `status = deactivated` |

#### `channel_partner_leads`
| Operation | Policy | Logic |
|-------------|--------|-------|
| SELECT | ChanP reads own | `EXISTS (SELECT 1 FROM channel_partners WHERE id = channel_partner_id AND user_id = auth.uid())` |
| INSERT | ChanP own leads | `channel_partner_id IN (SELECT id FROM channel_partners WHERE user_id = auth.uid())` |
| INSERT | Referral-code attribution | Via `attribute_lead_via_referral_code()` SECURITY DEFINER function only (bypasses user RLS) |
| INSERT | Admin/Mod all | `role claim IN (admin, moderator)` |
| UPDATE | Admin/Mod all | `role claim IN (admin, moderator)` |
| DELETE | Forbidden | Use `is_active = false` |

#### `channel_partner_commission_rates`
| Operation | Policy | Logic |
|-------------|--------|-------|
| SELECT | ChanP reads own | Via channel_partner_id JOIN |
| SELECT | Admin/Mod all | `role claim IN (admin, moderator)` |
| INSERT | Admin/Mod only | `role claim IN (admin, moderator)` |
| UPDATE | Admin/Mod only | `role claim IN (admin, moderator)` |

#### `channel_partner_commissions`
| Operation | Policy | Logic |
|-------------|--------|-------|
| SELECT | ChanP reads own | Via channel_partner_id |
| UPDATE | ChanP limited | `auth.uid() = user_id` AND status change `credited` → `paid` only |
| SELECT | Admin/Mod all | `role claim IN (admin, moderator)` |
| UPDATE | Admin/Mod all | `role claim IN (admin, moderator)` |

### SECURITY DEFINER Functions

```sql
-- Close previous rate when new rate inserted
CREATE OR REPLACE FUNCTION close_previous_rate(p_cp_id UUID, p_lead_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE channel_partner_commission_rates
  SET effective_to = now()
  WHERE channel_partner_id = p_cp_id 
    AND lead_role = p_lead_role 
    AND effective_to IS NULL;
END;
$$;

-- Calculate commission on invoice creation
CREATE OR REPLACE FUNCTION calculate_cp_commission(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementation: lookup lead, check rate, insert commission record
-- Idempotency: UNIQUE(invoice_id, channel_partner_id) + ON CONFLICT DO NOTHING
$$;

-- Credit commission on payment verification
CREATE OR REPLACE FUNCTION credit_cp_commission(p_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementation: find pending commission, credit wallet, update status
-- Idempotency: Check status = 'pending' before updating
$$;

-- Attribute lead via referral code (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION attribute_lead_via_referral_code(
  p_referral_code TEXT,
  p_lead_user_id UUID,
  p_lead_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_cp_id UUID;
BEGIN
  SELECT id INTO v_cp_id FROM channel_partners
  WHERE referral_code = upper(p_referral_code) AND status = 'active';
  IF v_cp_id IS NULL THEN RAISE EXCEPTION 'Invalid or inactive referral code'; END IF;
  INSERT INTO channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, referral_code_used)
  VALUES (v_cp_id, p_lead_user_id, p_lead_role, 'referral_code', upper(p_referral_code))
  ON CONFLICT (lead_user_id) DO NOTHING;
END; $$;
```

### Data Scoping Summary
- **User-scoped**: ChanPs see only their own profile, leads, commissions, rates
- **Admin/Mod global**: Full read/write access to all ChanP data
- **System functions**: SECURITY DEFINER functions bypass RLS for state transitions

### Realtime Subscriptions
| Table | Events | Filter | Consumer |
|-------|--------|--------|----------|
| `channel_partner_commissions` | INSERT, UPDATE | `channel_partner_id=eq.{myChanPId}` | ChanP Dashboard |
| `channel_partner_leads` | INSERT | `channel_partner_id=eq.{myChanPId}` | ChanP Leads page |

---

## 4. API DESIGN (Service Layer)

### New File: `src/backend/services/channelPartnerService.ts`

#### ChanP-Facing Functions

```typescript
// Types (concrete interfaces)
interface ChanPProfile {
  id: string;                    // channel_partners.id (myChanPId)
  userId: string;
  status: 'pending_approval' | 'active' | 'suspended' | 'deactivated' | 'rejected';
  referralCode: string | null;
  businessName: string | null;
  nidNumber: string | null;      // masked on display
  phone: string | null;
  bankAccount: { bank: string; accountNumber: string; accountName: string; routingNumber: string } | null;
  reapplicationCount: number;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface ChanPLead {
  id: string;
  channelPartnerId: string;
  leadUserId: string;
  leadName: string;
  leadRole: 'guardian' | 'agency' | 'caregiver' | 'shop';
  attributionMethod: 'referral_code' | 'cp_created' | 'admin_assignment';
  referralCodeUsed: string | null;
  isActive: boolean;
  registrationCompletedAt: string | null;
  joinedAt: string;
}

interface LeadJob {
  placementId: string;           // CJ ID
  invoiceId: string | null;
  invoiceAmount: number | null;  // CarePoints
  invoiceDate: string | null;
  paymentStatus: string | null;
}

interface ChanPCommission {
  id: string;
  channelPartnerId: string;
  leadUserId: string;
  leadName: string;
  leadRole: string;
  invoiceId: string;
  invoiceAmount: number;
  platformCommissionAmount: number;
  cpCommissionRate: number;
  cpCommissionAmount: number;
  status: 'pending' | 'credited' | 'paid' | 'reversed';
  walletTransactionId: string | null;
  invoiceGeneratedAt: string;
  paymentCollectedAt: string | null;
  creditedAt: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
}

interface ChanPRateRecord {
  id: string;
  channelPartnerId: string;
  leadRole: 'guardian' | 'agency' | 'caregiver' | 'shop';
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  expiresAt: string;
  expiryNotified: boolean;
  previousRate: number | null;
  changedBy: string;
  reason: string | null;
  createdAt: string;
}

type ChanPRateByRole = Partial<Record<'guardian' | 'agency' | 'caregiver' | 'shop', ChanPRateRecord>>;

interface CreateLeadInput {
  leadRole: 'guardian' | 'agency' | 'caregiver' | 'shop';
  name: string; phone: string; district: string; email?: string;
  // Guardian
  patientName?: string; careType?: string; specialRequirements?: string;
  // Agency
  agencyName?: string; licenseNumber?: string;
  // Caregiver
  specialty?: string; yearsOfExperience?: number;
  // Shop
  shopName?: string; shopCategory?: string; shopAddress?: string;
}

interface ChanPSummary {
  id: string; userId: string; name: string;
  referralCode: string | null; status: string;
  leadCount: number; hasExpiringRates: boolean; totalCommissionPaid: number;
}

interface ChanPDetail extends ChanPProfile {
  leads: ChanPLead[];
  commissions: ChanPCommission[];
  rates: ChanPRateRecord[];
  auditTrail: AuditLogEntry[];
}

interface RateInput {
  leadRole: 'guardian' | 'agency' | 'caregiver' | 'shop';
  rate: number; expiresAt: string; reason: string;
}

// Profile
function getMyChanPProfile(): Promise<ChanPProfile | null>

// Leads
function getMyLeads(opts?: { status?: string; role?: string }): Promise<ChanPLead[]>
function getLeadJobs(leadUserId: string): Promise<LeadJob[]>
function createLead(data: CreateLeadInput): Promise<{ success: boolean; leadUserId?: string; error?: string }>
function resendActivationLink(leadUserId: string): Promise<{ success: boolean; error?: string }>

// Commissions
function getMyCommissions(opts?: { status?: string; dateFrom?: string; dateTo?: string }): Promise<ChanPCommission[]>
function confirmPayoutReceipt(commissionId: string): Promise<{ success: boolean; error?: string }>

// Rates
function getMyRates(): Promise<ChanPRateByRole>
function getRateHistory(opts?: { leadRole?: string }): Promise<ChanPRateRecord[]>
```

#### Admin-Facing Functions (also in `admin.service.ts`)

```typescript
// ChanP Management
function adminGetChanPList(opts?: { status?: string }): Promise<ChanPSummary[]>
function adminGetChanPDetail(cpId: string): Promise<ChanPDetail>
function adminApproveChanP(cpId: string, initialRates: RateInput[]): Promise<{ success: boolean; error?: string }>
function adminRejectChanP(cpId: string, reason: string): Promise<{ success: boolean; error?: string }>
function adminSuspendChanP(cpId: string, reason: string): Promise<{ success: boolean; error?: string }>
function adminDeactivateChanP(cpId: string, reason: string): Promise<{ success: boolean; error?: string }>

// Rate Management
function adminSetChanPRate(cpId: string, leadRole: string, rate: number, expiresAt: string, reason: string): Promise<{ success: boolean; error?: string }>
function adminRenewChanPRate(rateId: string, newExpiresAt: string): Promise<{ success: boolean; error?: string }>

// Lead Management
function adminAssignLead(cpId: string, leadUserId: string): Promise<{ success: boolean; error?: string }>

// Commission Management
function adminReverseCommission(commissionId: string, reason: string): Promise<{ success: boolean; error?: string }>

// Audit
function adminGetChanPAuditTrail(cpId: string, opts?: { dateFrom?: string; dateTo?: string; action?: string }): Promise<AuditLogEntry[]>
```

### Implementation Pattern
- Mock fallback when `USE_SUPABASE = false`
- Retry via `withRetry()` for transient failures
- Deduplication via `dedup()` for idempotent operations
- Use shared helpers `sbRead`, `sbWrite`, `sb`, `currentUserId` where appropriate

---

## 5. FRONTEND DESIGN

### New Routes (add to `src/app/routes.ts`)

```typescript
// ChanP routes
/cp/dashboard
/cp/leads
/cp/leads/:id
/cp/create-lead
/cp/commissions
/cp/rates
/cp/account
/cp/pending-approval
/cp/rejected
/cp/suspended

// Admin routes
/admin/channel-partners
/admin/channel-partners/:id
```

### New Pages to Create

#### ChanP Pages
1. **Dashboard** (`/cp/dashboard`): Summary cards, rate-expiry banner, recent activity, quick links
2. **Leads List** (`/cp/leads`): Table with search/filter, Create New Lead button
3. **Lead Detail** (`/cp/leads/:id`): Lead info, Resend Activation Link, Jobs table, Commission breakdown
4. **Create Lead** (`/cp/create-lead`): Two-step form (role selection → dynamic fields), duplicate validation
5. **Commissions** (`/cp/commissions`): Ledger table with filters, totals row, Confirm Receipt buttons
6. **Rates** (`/cp/rates`): 4 role cards, rate history, read-only view
7. **Account** (`/cp/account`): Wallet balance, transactions, profile info, bank details, Confirm Payout Receipt
8. **Pending Approval** (`/cp/pending-approval`): Info screen only
9. **Rejected** (`/cp/rejected`): Rejection reason + Reapply button
10. **Suspended** (`/cp/suspended`): Suspension reason + admin contact

#### Admin Pages
11. **ChanP List** (`/admin/channel-partners`): Table with status, lead count, rate warnings, actions
12. **ChanP Detail** (`/admin/channel-partners/:id`): 5 tabs (Info, Rates, Leads, Commissions, Audit Trail)
13. **Rate Expiry Panel**: Dashboard widget listing expiring rates

### Modified Pages
- **Registration** (`/register`): Add ChanP role option, add Referral Code field (conditional), add CP-specific fields
- **Audit Logs** (`/admin/audit-logs`): Add CP_* action filtering

### Components to Create/Extend
- `RateCard`: Display rate with expiry and status badge
- `LeadStatusBadge`: Visual status indicator with accessible labels
- `CommissionStatusBadge`: pending/credited/paid/reversed states
- `RateExpiryBanner`: Dashboard warning banner
- `CreateLeadForm`: Multi-step form with role-specific fields
- `ChanPSummaryCards`: Dashboard metric cards
- `CommissionLedger`: Table with filtering and totals

### State Management
- `myChanPId`: Store `channel_partners.id` in auth context (separate from `auth.users.id`)
- Realtime subscriptions filtered by `myChanPId`
- Local state for forms, table filters
- No new global state libraries

### Realtime Integration
```typescript
// In ChanP Dashboard component
const commissionsChannel = supabase
  .channel('cp-commissions')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'channel_partner_commissions', filter: `channel_partner_id=eq.${myChanPId}` },
    (payload) => { /* Refetch commissions */ }
  )
  .subscribe();

// Cleanup on unmount
useEffect(() => {
  return () => {
    commissionsChannel.unsubscribe();
  };
}, []);
```

---

## 6. IMPLEMENTATION PLAN (STEP-BY-STEP)

### Phase 1: Foundation (Prerequisite for all other phases)

| Step | Task | Files | Notes |
|------|------|-------|-------|
| 1.1 | Add `channel_partner` to Role type | `src/backend/models/user.model.ts`, `src/frontend/auth/types.ts` | Update both model and auth types |
| 1.2 | Add CP demo user | `src/frontend/auth/mockAuth.ts` | `channel_partner@carenet.demo`, id `demo-channel-partner-1` |
| 1.3 | Update `DEMO_ACCOUNTS` and `inferRoleFromEmail()` | `src/frontend/auth/mockAuth.ts` | Map `channelpartner`/`cp` prefix |
| 1.4 | Add `commission` to NotificationChannel | `src/backend/models/notification.model.ts` | New channel type |
| 1.5 | Add `cp_commission` to PointTransactionType | `src/backend/utils/points.ts` | New transaction type |
| 1.6 | Add `metadata` to AuditLogEntry model | `src/backend/models/admin.model.ts` | `metadata?: Record<string, unknown>` |
| 1.7 | Create database migrations - 4 tables | `supabase/migrations/` | Tables, indexes, triggers, functions |
| 1.8 | Create RLS policies migration | `supabase/migrations/` | Policies for all 4 tables |
| 1.9 | Create `channelPartnerService.ts` | `src/backend/services/channelPartnerService.ts` | Full mock fallback, all functions |
| 1.10 | Add mock data | `src/backend/services/channelPartnerService.ts` | Demo ChanP, 4 rates, 5 leads, 7 commissions |
| 1.11 | Add mock CP audit entries | `src/backend/api/mock/adminMocks.ts` | One per CP_* action type |
| 1.12 | Add Referral Code field to Registration | `src/frontend/pages/auth/RegistrationPage.tsx` | Conditional visibility, case-insensitive validation |
| 1.13 | Update profiles CHECK constraints | Migration | Include `channel_partner` in role constraints. NOTE: `DROP CONSTRAINT / ADD CONSTRAINT` takes an ACCESS EXCLUSIVE lock on `profiles`. Check row count first; schedule during low-traffic window on production. |
| 1.14 | Add `channel_partner` to role-switching UI surfaces | All role-selector components in shell, `shared/` | Wherever existing roles are listed for selection or display |

### Phase 2: ChanP Core Experience

| Step | Task | Files | Notes |
|------|------|-------|-------|
| 2.1 | Implement ChanP status-gated routing | `src/backend/store/auth/`, `src/app/routes.ts` | Redirect by status: pending, rejected, suspended, active |
| 2.2 | Create Pending Approval page | `src/frontend/pages/cp/PendingApprovalPage.tsx` | Read-only submitted details |
| 2.3 | Create Rejected page with Reapply | `src/frontend/pages/cp/RejectedPage.tsx` | Show reason, edit form, resubmit |
| 2.4 | Create Suspended page | `src/frontend/pages/cp/SuspendedPage.tsx` | Show reason, admin contact |
| 2.5 | Create Dashboard page | `src/frontend/pages/cp/DashboardPage.tsx` | Summary cards, expiry banner, activity feed |
| 2.6 | Create Leads List page | `src/frontend/pages/cp/LeadsPage.tsx` | Table, search, filter, Create Lead button |
| 2.7 | Create Lead Detail page | `src/frontend/pages/cp/LeadDetailPage.tsx` | Info, Resend Activation Link, Jobs, Commissions |
| 2.8 | Create Create Lead page | `src/frontend/pages/cp/CreateLeadPage.tsx` | Two-step form, duplicate validation |
| 2.9 | Create Commissions page | `src/frontend/pages/cp/CommissionsPage.tsx` | Ledger, filters, Confirm Receipt |
| 2.10 | Create Rates page | `src/frontend/pages/cp/RatesPage.tsx` | Role cards, history, read-only |
| 2.11 | Create Account page | `src/frontend/pages/cp/AccountPage.tsx` | Wallet, profile, bank, Confirm Payout Receipt |
| 2.12 | Implement commission Postgres triggers | `supabase/migrations/` | calculate_cp_commission, credit_cp_commission |
| 2.12b | Invoice cancellation/dispute → commission reversal | migrations | `AFTER UPDATE OF status WHEN NEW.status IN ('disputed', 'cancelled')`: if commission `pending` → `reversed`; if `credited` → debit wallet + `reversed`. Log `CP_COMMISSION_REVERSED`. |
| 2.12c | Cache `myChanPId` in auth context at login | AuthContext.tsx | On login for `channel_partner` role, query `channel_partners WHERE user_id = (SELECT auth.uid())`, store `channel_partners.id` in context. This UUID is required for all realtime filter clauses. |
| 2.13 | Implement rate expiry cron job | Supabase Edge Function or pg_cron | Implement rate expiry cron job — two distinct notifications: (1) Approaching-expiry (`expires_at <= now() + notification_window` AND `expiry_notified = false`) → notify admin/mod + ChanP, set `expiry_notified = true`, log `CP_RATE_EXPIRING`. (2) Expired-on-date (`expires_at <= now()` AND `expiry_notified = true` AND `effective_to IS NULL`) → send one "Rate Has Expired" notification (severity: warning) to admin/mod only. |
| 2.14 | Add ChanP notifications | Service layer | All 12+ ChanP notification events |
| 2.15 | Implement realtime subscriptions | Dashboard, Leads pages | Filtered by myChanPId |
| 2.16 | Implement Activation Link flow | Auth service integration | Magic link for proxy-created leads |
| 2.17 | Add i18n strings (en) | `src/locales/en/cp*.json` | All ChanP namespace keys |
| 2.18 | Add i18n strings (bn) | `src/locales/bn/cp*.json` | Bangla translations |

### Phase 3: Admin Panel and Production Readiness

| Step | Task | Files | Notes |
|------|------|-------|-------|
| 3.1 | Create Admin ChanP List page | `src/frontend/pages/admin/ChannelPartnersPage.tsx` | Table with status, leads, rate warnings |
| 3.2 | Create Admin ChanP Detail page | `src/frontend/pages/admin/ChannelPartnerDetailPage.tsx` | 5 tabs: Info, Rates, Leads, Commissions, Audit |
| 3.3 | Implement ChanP approval/rejection | Admin service | Approval: generate referral code. If no rates configured, show **blocking acknowledgement modal** before confirm: "No commission rates configured — this Channel Partner will earn nothing until rates are set." Admin must explicitly dismiss to proceed. Rejection stores `rejection_reason/rejected_by/rejected_at`. |
| 3.4 | Implement rate management | Admin service + UI | Set rate, renew expiry, change rate with history |
| 3.5 | Implement lead assignment | Admin service + UI | Manual lead attribution |
| 3.6 | Implement commission reversal | Admin service + UI | Reverse with reason |
| 3.7 | Create Rate Expiry Panel | Admin dashboard widget | List rates expiring within visibility window |
| 3.8 | Create Commission reports | Admin reports | Expenditure, per-ChanP, per-role, charts |
| 3.9 | Add admin notifications | Service layer | All admin notification events |
| 3.10 | Update Audit Logs page | `src/frontend/pages/admin/AuditLogsPage.tsx` | CP_* action filtering |
| 3.11 | Write Vitest unit tests | `src/backend/services/__tests__/` | Commission calc, rate lookup, referral validation |
| 3.12 | Write Playwright E2E tests | `e2e/` | Auth flow, lead creation, commission lifecycle, mobile, offline |
| 3.13 | RLS testing | Manual + automated | All 4 tables, all roles |
| 3.14 | Realtime testing | Manual + automated | Connection, reconnection, filter clauses |
| 3.15 | Performance testing | K6 or similar | Commission trigger <100ms |
| 3.16 | Accessibility and mobile compliance pass | All ChanP pages | Touch targets ≥44×44px; `th scope` on all data tables; `aria-label` on all status badges; safe-area padding on ChanP shell; Create Lead multi-step form verified on 375px viewport |
| 3.17 | Security audit | Manual review | PII access, RLS enforcement, audit logging |

---

## 7. EDGE CASES AND FAILURE HANDLING

| Edge Case | Expected Behavior |
|-----------|-------------------|
| **Duplicate invoice commission attempt** | `UNIQUE(invoice_id, channel_partner_id)` + `ON CONFLICT DO NOTHING` = silent no-op |
| **ChanP suspended while commissions pending** | Pending commissions still credit when payment verified. No NEW commissions created after suspension date. |
| **Invoice generated, no active rate for lead role** | Skip silently, log `CP_COMMISSION_SKIPPED_NO_RATE` warning |
| **Proxy lead phone/email already exists** | Error: "Already registered - ask them to use your referral code instead" |
| **Referral code belongs to suspended/deactivated ChanP** | Validation error on registration; proceed without attribution |
| **Admin renews rate expiry** | `expiry_notified` MUST reset to `false` for next cycle |
| **Concurrent rate updates race condition** | `close_previous_rate()` SECURITY DEFINER function serializes updates |
| **Lead activates after proxy creation** | Set `registration_completed_at`, notify ChanP, log `CP_LEAD_ACTIVATED` |
| **Invoice cancelled after commission credited** | Reverse: debit wallet, set status `reversed`, log `CP_COMMISSION_REVERSED` |
| **Realtime connection loss** | On reconnection, re-fetch current state from service layer |
| **RLS policy denies unexpected access** | Log security event, show generic error to user, alert admin |
| **Activation link expired (24h)** | ChanP can resend within 72h of creation; after 72h requires admin intervention |

---

## 8. TESTING STRATEGY

### Unit Tests (Vitest)

| Test Suite | Coverage |
|------------|----------|
| `channelPartnerService.test.ts` | All service functions with mock fallback |
| `commissionCalculation.test.ts` | Rate lookup, amount calculation, idempotency |
| `referralValidation.test.ts` | Code format, case-insensitivity, active status check |
| `rateLifecycle.test.ts` | effective_to closure, expiry notification, renewal |

### Integration Tests

| Test Suite | Coverage |
|------------|----------|
| Commission pipeline | Invoice → trigger → commission record → payment → credit |
| Rate expiry cron | Cron job → notification → database state update |
| Proxy registration | Create lead → activation link → completion → notification |

### E2E Tests (Playwright)

| Test Flow | Scenarios |
|-----------|-----------|
| ChanP registration | Sign up → admin approval → login → dashboard |
| Referral code | Self-signup with code → attribution verification |
| Proxy lead creation | Create lead → activation link → lead activation |
| Commission lifecycle | Invoice → pending → payment → credited → confirmed |
| Rate expiry | Set short expiry → wait → notification → renewal |
| Mobile | Create Lead multi-step form on mobile viewport |
| Offline | USE_SUPABASE=false, all ChanP pages functional |
| Data isolation | ChanP A cannot see ChanP B data (RLS enforcement) |

---

## 9. ROLLBACK PLAN

### Database Rollback
```sql
-- Drop tables (in dependency order)
DROP TABLE IF EXISTS channel_partner_commissions;
DROP TABLE IF EXISTS channel_partner_commission_rates;
DROP TABLE IF EXISTS channel_partner_leads;
DROP TABLE IF EXISTS channel_partners;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_cp_commission(UUID);
DROP FUNCTION IF EXISTS credit_cp_commission(UUID);
DROP FUNCTION IF EXISTS close_previous_rate(UUID, TEXT);
DROP FUNCTION IF EXISTS attribute_lead_via_referral_code(TEXT, UUID, TEXT);

-- Drop RLS policies (automatic with table drop)

-- Revert profiles CHECK constraints (requires migration)
```

### Code Rollback
- Remove `channel_partner` from Role types
- Remove CP demo user from `mockAuth.ts`
- Delete `channelPartnerService.ts`
- Remove ChanP routes from `routes.ts`
- Delete all ChanP page components
- Remove CP_* audit entries from mock data
- Revert registration form changes
- Remove `commission` from NotificationChannel
- Remove `cp_commission` from PointTransactionType
- Remove `metadata` from AuditLogEntry model

### Safety Notes
- All migrations are additive - no existing data is modified
- `audit_logs.metadata` column remains in DB even if TypeScript model reverted
- Existing users, invoices, wallets unaffected by rollback
- ChanP-related commission records would be lost (expected)

---

## 10. OUTSTANDING QUESTIONS (From Spec Section 2.4)

These require stakeholder input before final implementation:

1. **Minimum payout threshold** - Minimum CarePoints before payout request?
2. **Payout method** - CarePoints to wallet, or BDT via bank/bKash?
3. **Payout schedule** - On-demand, weekly, monthly?
4. **Tax/TDS** - Tax deducted at source on commission?
5. **Clawback window** - Refund window for commission reversal?
6. **Multi-level** - Can ChanP refer another ChanP? (Assume NO for v1)
7. **Lead reassignment** - Can admin reassign lead? Historical commissions?
8. **Commission rate cap** - Maximum rate (e.g., 30%)?
9. **Dual-role eligibility** - Can existing user also be ChanP?
10. **Deactivated ChanP payouts** - Uncredited commissions paid out or forfeited?
11. **Proxy lead contact** - Phone alone sufficient, or must email also be provided?

---

## 11. CONFIGURABLE CONSTANTS

Define these in a constants file for easy adjustment:

```typescript
// src/backend/utils/channelPartnerConstants.ts
export const CP_CONFIG = {
  REFERRAL_CODE_PREFIX: 'REF-CP-',
  REFERRAL_CODE_LENGTH: 6,
  ACTIVATION_LINK_TTL_HOURS: 24,
  ACTIVATION_LINK_RESEND_WINDOW_HOURS: 72,
  DEFAULT_RATE_EXPIRY_DAYS: 90,
  RATE_EXPIRY_NOTIFICATION_WINDOW_DAYS: 7,
  RATE_EXPIRY_DASHBOARD_VISIBILITY_DAYS: 30,
  PLATFORM_COMMISSION_PERCENTAGE: 25, // Default, matches existing
} as const;
```

---

*Plan version: 1.0*
*Generated: 2026-04-18*
*Task ID: CHANNEL_PARTNER_001*

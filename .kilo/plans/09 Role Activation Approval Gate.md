# Role Activation Approval Gate

**Flags active:** `ALLOW_SCHEMA_CHANGE` · `HIGH_SECURITY_MODE`

**Implementation Status:** ⚠️ Several critical items are NOT yet implemented: `ActivationStatus` type missing from `types.ts`; `activationStatus` not mapped in `AuthContext`; `refreshActivationStatus()` not on context; `ProtectedRoute` gate not added; 5 new routes not registered in `routes.ts`; admin/moderator service delegation not wired. Pages exist as stubs but will crash at runtime without the above. Remaining work: all type/context/guard/route wiring, suspended page, sidebar nav badges, i18n keys, confirm dialogs, profile detail in queue, backfill execution.

---

## 1. IMPACT ANALYSIS

### Parts of the System Affected

| Layer | Impact |
|---|---|
| `supabase-schema.sql` | New columns on `profiles`, new audit table, new trigger |
| `src/frontend/auth/types.ts` | New `ActivationStatus` type + 2 new `User` fields (**not yet added**) |
| `src/frontend/auth/AuthContext.tsx` | `mapSupabaseUser()` reads new columns; new `refreshActivationStatus()` context method (**not yet added**) |
| `src/frontend/auth/mockAuth.ts` | Mock register sets activation status; new mock helpers; `getDemoUserByRole()` sets `activationStatus: 'approved'` |
| `src/frontend/components/guards/ProtectedRoute.tsx` | 4-state gate for gated roles (**not yet added**) |
| `src/app/routes.ts` | 6 new routes (**not yet registered**) |
| `src/backend/services/` | `activation.service.ts` ✅; delegation into `admin.service.ts` and `moderator.service.ts` (**not yet wired**); `getMyActivationStatus()` mock fallback reads `carenet-mock-registry` |
| `src/frontend/pages/auth/` | 4 holding pages (complete-profile ✅, pending-approval ✅, account-rejected ✅, account-suspended **NEW**) |
| `src/frontend/pages/admin/` | 1 queue page ✅ — needs profile detail panel, confirm dialog, audit log tab |
| `src/frontend/pages/moderator/` | 1 queue page ✅ — same additions |
| `src/frontend/components/shell/GatedLayout.tsx` | **NEW** — authenticated layout without sidebar, used by holding pages |
| Admin + Moderator nav | 1 new nav entry each with live badge (**not yet added**) |
| `src/locales/en/` + `src/locales/bn/` | New `activation.*` key tree (**not yet added**) |

### Risk Level: **Medium**

- Schema migration on `profiles` is additive (new nullable columns, no column drops).
- The `ProtectedRoute` gate is the single highest-risk change — a bug here locks all gated-role users out.
- Existing `channel_partner` gating (via `ChanPPendingApprovalPage`) becomes a subset of the new unified flow; it must not break.

### Breaking Change Assessment

| Change | Breaking? | Mitigation |
|---|---|---|
| New `profiles.activation_status` column, default `profile_incomplete` | **Yes for existing users** — requires immediate backfill | Backfill SQL runs before ProtectedRoute gate is deployed |
| New `User.activationStatus` field | No — optional field, typed with `?` | — |
| `ProtectedRoute` gate logic | Breaking for gated roles without approved status | Deploy schema + backfill BEFORE frontend gate |
| New routes | No | — |
| `admin.service.ts` / `moderator.service.ts` delegation | No — additive only | — |

---

## 2. ARCHITECTURE DECISION

### Chosen Approach: Unified `activation.service.ts` + `ProtectedRoute` gate

A single shared service (`activation.service.ts`) owns all read/write logic for the activation lifecycle. `ProtectedRoute` reads `user.activationStatus` (already in context) and redirects to one of three auth holding pages. Admin and moderator queue pages delegate entirely to the shared service.

### Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| Per-role per-page gating (like current CP flow) | 5 role pages × gate code = unmaintainable duplication |
| Supabase RLS block (deny all authenticated reads until approved) | Too coarse — denies profile reads needed on the holding pages themselves |
| Middleware/Edge Function gate | Overkill; adds network hop; can't use offline mock mode |

### Why This Approach Is Optimal

- **Single gate point** in `ProtectedRoute` covers all 100+ authenticated routes with 6 lines of code.
- `activation.service.ts` is the only place Supabase queries for this feature exist — clean to test, mock, and extend.
- No new global state libraries; status flows through existing `useAuth()` / `user.activationStatus`.
- Additive DB changes only — no existing queries break.

---

## 3. DATABASE DESIGN

### Tables Affected: `profiles`, new `role_activation_reviews`

### Changes

#### New Columns on `profiles`

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_status TEXT
    NOT NULL DEFAULT 'profile_incomplete'
    CHECK (activation_status IN (
      'profile_incomplete',
      'pending_approval',
      'approved',
      'rejected',
      'suspended'
    ));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS activation_note TEXT;  -- rejection reason; nullable
```

#### New Table: `role_activation_reviews`

```sql
CREATE TABLE IF NOT EXISTS role_activation_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id   UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Trigger (auto-approve guardian/patient)

```sql
CREATE OR REPLACE FUNCTION auto_approve_low_risk_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('guardian', 'patient') THEN
    NEW.activation_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_approve_role
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_approve_low_risk_roles();
```

#### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_profiles_activation
  ON profiles(activation_status, role);

CREATE INDEX IF NOT EXISTS idx_activation_reviews_profile
  ON role_activation_reviews(profile_id);
```

#### ⚠️ Required Backfill (run immediately after schema migration)

```sql
-- Approve all accounts created before today to avoid mass lockout
UPDATE profiles
SET activation_status = 'approved'
WHERE activation_status = 'profile_incomplete'
  AND created_at < NOW() - INTERVAL '1 day';
```

---

### RLS Policy Updates

**`profiles` table** — current policies are unknown from code (managed in Supabase dashboard). Required state after migration:

| Policy | Rule |
|---|---|
| `profiles_own_read` | `FOR SELECT USING (auth.uid() = id)` — user reads own profile |
| `profiles_own_update` | `FOR UPDATE USING (auth.uid() = id)` — user updates own profile |
| `profiles_admin_all` | `FOR ALL USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))` |
| `profiles_mod_select` | `FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'moderator'))` |

> [!IMPORTANT]
> The moderator SELECT policy on `profiles` is required so the moderator activation queue can read all pending profiles. Currently moderators may not have this access — verify in the Supabase dashboard before deployment.
> **Schema Versioning:** If RLS policies are managed in code, add the `profiles_mod_select` policy to `supabase-schema.sql` to keep the schema definition complete.

**`role_activation_reviews` table** — new table, policies to create:

```sql
ALTER TABLE role_activation_reviews ENABLE ROW LEVEL SECURITY;

-- Reviewer (admin or mod) can insert
CREATE POLICY activation_review_insert ON role_activation_reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- Admin/mod can read all reviews
CREATE POLICY activation_review_admin_read ON role_activation_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- User can read their own review
CREATE POLICY activation_review_own_read ON role_activation_reviews
  FOR SELECT USING (profile_id = auth.uid());
```

### Data Scoping

- `profiles.activation_status` — user-scoped on reads (`auth.uid() = id`); admin/mod can read all via policy.
- `role_activation_reviews` — reviewer can INSERT; user can SELECT own; admin/mod can SELECT all.
- The activation queue query filters `activation_status = 'pending_approval'` with an optional `role IN (...)` scope applied in the service layer (not RLS) to support the moderator vs admin role split.

### Realtime Changes

**None required.** The holding pages use a manual "Refresh Status" button that re-queries the profile on demand. No realtime subscriptions are added for this feature to avoid complexity. If a future iteration adds realtime approval notification, subscribe to `profiles` on `UPDATE` filtered by `id = auth.uid()`.

---

## 4. API DESIGN

All API interactions are service-layer calls (no REST endpoints — Supabase direct from client).

---

### `activationService.submitForReview(profileId)`

- **Method:** `UPDATE` on `profiles`
- **Request:** `{ activation_status: 'pending_approval' }` WHERE `id = profileId AND activation_status = 'profile_incomplete'`
- **Response:** void
- **Validation:** Status must be `profile_incomplete` before update (enforced in service layer + CHECK constraint)
- **Auth:** User updates own profile — covered by `profiles_own_update` RLS
- **Supabase Query:**
  ```ts
  await sb().from('profiles')
    .update({ activation_status: 'pending_approval' })
    .eq('id', profileId)
    .eq('activation_status', 'profile_incomplete')
  ```
  - Tables: `profiles`
  - RLS: `profiles_own_update` (`auth.uid() = id`)
  - Data scoping: user-scoped
  - Realtime: none

---

### `activationService.reopenForEditing(profileId)`

- **Method:** `UPDATE` on `profiles`
- **Request:** `{ activation_status: 'profile_incomplete', activation_note: null }`
- **Response:** void
- **Validation:** Status must be `rejected`
- **Auth:** User updates own profile — `profiles_own_update` RLS
- **Supabase Query:**
  ```ts
  await sb().from('profiles')
    .update({ activation_status: 'profile_incomplete', activation_note: null })
    .eq('id', profileId)
    .eq('activation_status', 'rejected')
  ```

---

### `activationService.getPendingActivations(allowedRoles?)`

- **Method:** `SELECT` on `profiles`
- **Request:** Filter `activation_status = 'pending_approval'`, optionally `role IN (allowedRoles)`
- **Response:** `RoleActivationItem[]`
- **Auth:** Requires admin or moderator session — `profiles_admin_all` or `profiles_mod_select` RLS
- **Supabase Query:**
  ```ts
  let q = sb().from('profiles')
    .select('id, name, email, role, phone, district, created_at, activation_status, activation_note')
    .eq('activation_status', 'pending_approval')
    .order('created_at', { ascending: true });
  if (allowedRoles?.length) {
    q = q.in('role', allowedRoles);
  }
  const { data, error } = await q;
  ```
  - Tables: `profiles`
  - RLS: `profiles_admin_all` / `profiles_mod_select`
  - Data scoping: global (all pending profiles visible to admin/mod)
  - Realtime: none

---

### `activationService.approveActivation(profileId, reviewerName, note?)`

- **Method:** `UPDATE` profiles + `INSERT` into `role_activation_reviews` + `INSERT` into `notifications`
- **Response:** void
- **Validation:** Status must be `pending_approval`; reviewer must be admin or moderator
- **Auth:** Admin or moderator — `profiles_admin_all` RLS for update; `activation_review_insert` RLS for audit insert
- **Supabase Queries (in sequence via `sbWrite`):**
  ```ts
  // 1. Update profile status
  await sb().from('profiles')
    .update({ activation_status: 'approved', activation_note: null })
    .eq('id', profileId);

  // 2. Write audit row
  const reviewerId = await currentUserId();
  await sb().from('role_activation_reviews').insert({
    profile_id: profileId,
    reviewer_id: reviewerId,
    reviewer_name: reviewerName,
    decision: 'approved',
    note: note ?? null,
  });

  // 3. Write in-app notification (uses push-notification Edge Function pattern)
  await sb().functions.invoke('push-notification', {
    body: {
      type: 'activation_approved',
      title_en: 'Account Approved',
      title_bn: 'অ্যাকাউন্ট অনুমোদিত হয়েছে',
      message_en: 'Your account has been approved. Welcome to CareNet!',
      message_bn: 'আপনার অ্যাকাউন্ট অনুমোদিত হয়েছে। CareNet-এ স্বাগতম!',
      receiver_id: profileId,
      action_url: null,
    },
  });
  ```
  > **Note:** The `push-notification` Edge Function already exists (used by `notification.service.ts`). The new `type` values `activation_approved` / `activation_rejected` are additive only.

---

### `activationService.rejectActivation(profileId, reviewerName, note)`

- Same pattern as `approveActivation` with:
  - `activation_status: 'rejected'`
  - `activation_note: note`
  - Notification type: `activation_rejected`
  - `message_en`: `'Your account was not approved. Reason: {{note}}'`

---

### `activationService.getMyActivationStatus()`

- **Method:** `SELECT` on `profiles`
- **Request:** `WHERE id = auth.uid()` — reads own activation status
- **Response:** `{ activationStatus: ActivationStatus; activationNote?: string }`
- **Auth:** `profiles_own_read` RLS
- **Used by:** `refreshActivationStatus()` in `AuthContext`

---

## 5. FRONTEND DESIGN

### Components to Update / Create

| Component | Type | Notes |
|---|---|---|
| `ProtectedRoute.tsx` | MODIFY | Add 4-state gate (incomplete/pending/rejected/suspended); gated role list constant; `channel_partner` excluded (handled by `CpRouteGuard`) |
| `AuthContext.tsx` | MODIFY | Map new fields; add `refreshActivationStatus()`; `AuthContextType` declaration updated |
| `types.ts` | MODIFY | `ActivationStatus` type; `activationStatus?` / `activationNote?` on `User` |
| `mockAuth.ts` | MODIFY | Status per role on register; mock helpers; `getDemoUserByRole()` sets `activationStatus: 'approved'`; `getMyActivationStatus()` reads `carenet-mock-registry` |
| `activation.service.ts` | NEW ✅ | All Supabase queries; mock fallback for `getMyActivationStatus()` still returns null — must be fixed |
| `admin.service.ts` | MODIFY | Delegate `getPendingActivations`, `approveActivation`, `rejectActivation` to `activationService` (**not yet wired**) |
| `moderator.service.ts` | MODIFY | Same delegation scoped to `['caregiver','agency','shop']` (**not yet wired**) |
| `GatedLayout.tsx` | NEW | Authenticated layout shell with no sidebar — used by all 4 holding pages; includes a visible Log Out button |
| `CompleteProfilePage.tsx` | NEW ✅ | Stage 1 holding page — needs i18n, role-aware edit-profile link, submit validation, a11y attrs, logout via `GatedLayout` |
| `PendingApprovalPage.tsx` | NEW ✅ | Stage 2 holding page — needs i18n, `aria-live`, focus management, logout via `GatedLayout` |
| `AccountRejectedPage.tsx` | NEW ✅ | Rejection holding page — needs i18n, error focus, logout via `GatedLayout` |
| `SuspendedAccountPage.tsx` | NEW | Suspension holding page — tells user to contact support; logout via `GatedLayout` |
| `AdminRoleActivationPage.tsx` | NEW ✅ | Queue page — needs filter tabs, stats bar, expandable profile detail panel, audit log tab, confirm modal (replace `alert`/`prompt`) |
| `ModeratorActivationsPage.tsx` | NEW ✅ | Same additions as admin queue |
| `ActivationConfirmModal.tsx` | NEW | Shared modal for approve (confirm) and reject (note + confirm) actions; keyboard accessible |
| Admin sidebar nav | MODIFY | New "Role Activations" entry + pending badge (**not yet added**) |
| Moderator sidebar nav | MODIFY | New "Activations" entry + pending badge (**not yet added**) |
| `routes.ts` | MODIFY | 6 new routes (**not yet registered** — see Step 17 for correct layout placement) |
| `en/common.json` + `bn/common.json` | MODIFY | `activation.*` key tree + `t()` calls in all pages (**not yet added**) |

### State Management Changes

- **No new global state.** `activationStatus` and `activationNote` live on the existing `user` object in `AuthContext`.
- `refreshActivationStatus()` is a new function on the context that calls `activationService.getMyActivationStatus()` and calls `setUser()` with the updated status — same pattern as the existing `switchRole`.
- Queue pages use the existing `useAsyncData()` hook for loading state (same as `AdminVerificationsPage`).

### API Integration

```
CompleteProfilePage  → activationService.submitForReview()
AccountRejectedPage  → activationService.reopenForEditing()
PendingApprovalPage  → AuthContext.refreshActivationStatus()
AdminRoleActivationPage → activationService.getPendingActivations(['caregiver','agency','shop','moderator','channel_partner'])
                       → activationService.approveActivation() / rejectActivation()
ModeratorActivationsPage → activationService.getPendingActivations(['caregiver','agency','shop'])
                        → activationService.approveActivation() / rejectActivation()
```

### Loading / Error Handling

- Queue pages: `useAsyncData()` → `PageSkeleton` while loading; inline error banner on fetch failure.
- `submitForReview()` / `approveActivation()` / `rejectActivation()`: button spinners; toast error via existing toast system on failure.
- `refreshActivationStatus()`: spinner on the Refresh button; silently no-op on error (user can retry).

### Realtime Integration

**None.** The holding pages poll on-demand via the Refresh button. No subscriptions to set up or clean up.

---

## 6. IMPLEMENTATION PLAN (STEP-BY-STEP)

> [!CAUTION]
> Steps 1–3 are database-only and must be deployed and verified BEFORE the frontend gate (Steps 5+) goes live to avoid locking out existing users.

1. **Schema migration** — Add `activation_status` and `activation_note` columns to `profiles`; create `role_activation_reviews` table; create auto-approve trigger; add indexes.

2. **Backfill** — Run the backfill SQL: `UPDATE profiles SET activation_status = 'approved' WHERE created_at < NOW() - INTERVAL '1 day'`.

3. **RLS policies** — Add/verify `profiles_mod_select` policy; create all `role_activation_reviews` policies via Supabase dashboard.

4. **`supabase-schema.sql`** — Append new SQL blocks to keep the local schema file in sync.

5. **`src/frontend/auth/types.ts`** — Add `ActivationStatus` type and `activationStatus?` / `activationNote?` to `User`.

6. **`src/frontend/auth/mockAuth.ts`** — Update `mockRegister()` to set status by role; add `mockSubmitProfileForReview`, `mockApproveUser`, `mockRejectUser` exports.

7. **`src/backend/services/activation.service.ts`** — Create new file with all 5 service methods (`submitForReview`, `reopenForEditing`, `getPendingActivations`, `approveActivation`, `rejectActivation`). Include mock fallback paths for each method.

8. **`src/frontend/auth/AuthContext.tsx`** — Map `profile.activation_status` and `profile.activation_note` in `mapSupabaseUser()`; add `refreshActivationStatus()` method; expose it in `AuthContextType`.

9. **`src/backend/services/admin.service.ts`** — Add delegation methods for `getPendingActivations`, `approveActivation`, `rejectActivation` from `activationService`.

10. **`src/backend/services/moderator.service.ts`** — Same delegation, scoped to `['caregiver', 'agency', 'shop']`.

11. **`src/frontend/components/guards/ProtectedRoute.tsx`** — Add the 4-state gate block (after the `isAuthenticated` check, before `<Outlet />`). Gate only applies to `GATED_ROLES` (excludes `guardian`, `patient`, `admin`, `channel_partner`). Status → route mapping:
    - `profile_incomplete` → `/auth/complete-profile`
    - `pending_approval` → `/auth/pending-approval`
    - `rejected` → `/auth/account-rejected`
    - `suspended` → `/auth/account-suspended`
    - `approved` (or missing status on demo users) → `<Outlet />`

12. **`src/frontend/components/shell/GatedLayout.tsx`** — New layout wrapper: renders children centred with no sidebar, no bottom nav. Shows app logo + a **Log Out** button in the top-right so gated users can always exit. All 4 holding pages use this layout.

13. **`src/frontend/pages/auth/CompleteProfilePage.tsx`** — Existing stub. Update:
    - Wrap with `GatedLayout`.
    - Add role-aware **"Edit Profile"** link pointing to the role-specific profile page (`/caregiver/profile`, `/agency/storefront`, etc.).
    - Disable "Submit for Review" button if the profile has no name or phone (client-side guard).
    - Replace hardcoded strings with `t('activation.completeProfile.*')` calls.
    - Add `id` attrs on interactive elements; `<main>` semantic wrapper.

14. **`src/frontend/pages/auth/PendingApprovalPage.tsx`** — Existing stub. Update:
    - Wrap with `GatedLayout`.
    - Add `aria-live="polite"` on the status description; `aria-busy` while refreshing.
    - Replace hardcoded strings with `t('activation.pendingApproval.*')` calls.
    - When `refreshActivationStatus()` resolves to `'approved'`, navigate to the role dashboard automatically.

15. **`src/frontend/pages/auth/AccountRejectedPage.tsx`** — Existing stub. Update:
    - Wrap with `GatedLayout`.
    - Move focus to the rejection note block on mount.
    - Replace hardcoded strings with `t('activation.accountRejected.*')` calls.

16. **`src/frontend/pages/auth/SuspendedAccountPage.tsx`** — New. Shows suspension message; support contact link; **Log Out** via `GatedLayout`. Uses `t('activation.accountSuspended.*')` keys.

17. **`src/frontend/components/shared/ActivationConfirmModal.tsx`** — New shared modal:
    - **Approve flow**: simple confirm dialog ("Approve this account?").
    - **Reject flow**: textarea for rejection note + confirm. Note is required.
    - Keyboard-accessible (focus trap, Escape to cancel).
    - Used by both `AdminRoleActivationPage` and `ModeratorActivationsPage` to replace `alert()`/`prompt()`.

18. **`src/frontend/pages/admin/AdminRoleActivationPage.tsx`** — Existing stub. Update:
    - Add filter tabs by role (All / Caregiver / Agency / Shop / Moderator).
    - Add stats bar (total pending count).
    - Add expandable row / side-panel showing phone, district, `activation_note`, and `documents` list fetched from `caregiver_documents` (or role-equivalent).
    - Add **Audit Log** tab per user showing `role_activation_reviews` history (reviewer name, decision, note, date).
    - Wire `ActivationConfirmModal` for approve and reject actions.
    - Expose `activationService.getReviewHistory(profileId)` — new method needed on `activation.service.ts`.

19. **`src/frontend/pages/moderator/ModeratorActivationsPage.tsx`** — Same additions as Step 18; narrower role scope.

20. **`src/app/routes.ts`** — Add 6 new routes. **Holding pages must NOT go under `PublicLayout`** — they require an authenticated user and call `useAuth()`. Correct placement:
    ```
    ProtectedRoute
      GatedLayout               ← new authenticated layout without sidebar
        auth/complete-profile   → CompleteProfilePage
        auth/pending-approval   → PendingApprovalPage
        auth/account-rejected   → AccountRejectedPage
        auth/account-suspended  → SuspendedAccountPage
      AuthenticatedLayout
        admin/role-activations  → AdminRoleActivationPage  (inside RequireAdminRoute)
        moderator/activations   → ModeratorActivationsPage
    ```
    Also add `getReviewHistory` method to `activation.service.ts` (SELECT from `role_activation_reviews` WHERE `profile_id = $id`).

21. **Admin nav + Moderator nav** — `AuthenticatedLayout.tsx` currently has no entries for role activations. Add:
    - Create hook `usePendingActivationsCount()` that fetches count (with 30-second interval caching).
    - Admin nav: "Role Activations" entry at `/admin/role-activations` with badge.
    - Moderator nav: "Activations" entry at `/moderator/activations` with badge.

22. **Localization** — Add `activation.*` key tree to `src/locales/en/common.json` and `src/locales/bn/common.json`. Keys needed:
    - `activation.completeProfile.title`, `.description`, `.submitButton`, `.editProfileButton`, `.backButton`
    - `activation.pendingApproval.title`, `.description`, `.refreshButton`, `.hint`
    - `activation.accountRejected.title`, `.description`, `.reopenButton`, `.reasonLabel`
    - `activation.accountSuspended.title`, `.description`, `.contactSupport`, `.logoutButton`
    - `activation.status.profile_incomplete`, `.pending_approval`, `.approved`, `.rejected`, `.suspended`
    - `activation.queue.noItems`, `.approve`, `.reject`, `.confirmApprove`, `.rejectNote`, `.history`
    - `sidebar.roleActivations`, `sidebar.activations`
    - Replace all hardcoded strings in the 6 pages with `t()` calls.
    - Run `npm run i18n:sync` to propagate to Bangla locale.

23. **Smoke test** — Register a caregiver in mock mode and walk through the full gate cycle (incomplete → submit → approve); verify guardian auto-approve; verify demo user bypass; verify suspended route redirects correctly.


---

## 7. EDGE CASES & FAILURE HANDLING

| Scenario | Expected Behavior |
|---|---|
| User refreshes on `CompleteProfilePage` without reloading profile | `user.activationStatus` is already in context from login; page renders correctly |
| `submitForReview()` fails (Supabase error) | Show inline error toast; button re-enables; status stays `profile_incomplete` |
| Admin approves a user who is already approved | `UPDATE` where `activation_status = 'pending_approval'` returns 0 rows; service logs warning; UI shows "Already approved" toast |
| Two admins approve the same user simultaneously | Both `UPDATE` attempts succeed (idempotent); two `role_activation_reviews` rows inserted (harmless audit duplication) |
| User on `PendingApprovalPage` clicks Refresh after approval | `refreshActivationStatus()` fetches updated profile; `activationStatus` becomes `'approved'`; `ProtectedRoute` now lets them through; navigate to dashboard |
| Demo user's `activationStatus` field is missing in localStorage | `loadPersistedUser()` returns `null` for `activationStatus`; `mapSupabaseUser` fallback returns `'approved'`; gate skipped |
| Guardian/patient trigger fires on existing row UPDATE | Trigger is `BEFORE INSERT` only — does not affect updates to existing rows |
| Moderator tries to approve a `moderator`-role account | `activationService.getPendingActivations(['caregiver','agency','shop'])` filters moderators out — they never appear in the mod queue |
| Network offline during `submitForReview()` | `sbWrite` retry logic retries 2× with 500ms backoff; if all fail, error toast shown; status unchanged |
| Rejected user hits browser Back to try to access dashboard directly | `ProtectedRoute` re-checks `user.activationStatus` on every render; redirects to `/auth/account-rejected` |
| User with `activation_status = 'suspended'` tries any authenticated route | `ProtectedRoute` gate redirects to `/auth/account-suspended`; `SuspendedAccountPage` shows contact-support message and a Log Out button |
| Supabase user has no `profiles` row (orphaned auth record) | `getMyActivationStatus()` returns `null` (PGRST116 error code caught); `ProtectedRoute` treats null as `'profile_incomplete'` and redirects to `/auth/complete-profile` (safe default) |
| `channel_partner` role user hits `ProtectedRoute` gate | `channel_partner` is excluded from `GATED_ROLES`; gate is skipped; `CpRouteGuard` handles CP-specific status independently via `channel_partners.status` |
| `getMyActivationStatus()` called in mock mode | Reads `carenet-mock-registry` from localStorage to return the current mock user's `activationStatus`; returns `null` only if user is not in registry |
| `approveActivation()` INSERT to `role_activation_reviews` fails after UPDATE succeeds | Profile is approved but audit row is missing; service logs error with profile ID; **TODO:** wrap in Supabase RPC for atomicity in hardening pass (tracked in Section 7 RLS Edge Cases) |

### RLS Edge Cases

- If `profiles_mod_select` is missing, the moderator queue returns an empty array silently (Supabase returns no rows, no error). Service logs a warning; UI shows empty state with a hint to contact support.
- If `activation_review_insert` policy denies insert (e.g. role mismatch), `approveActivation` throws; the profile update in step 1 has already succeeded → profile is approved but no audit row exists. **Mitigation:** wrap both UPDATE and INSERT in a Supabase RPC function for atomicity in a future hardening pass.

### Realtime Edge Cases

Not applicable — no realtime subscriptions added.

---

## 8. TESTING STRATEGY

### Unit Tests (Vitest)

**`src/test/auth/activationGate.test.ts`**

```
- ProtectedRoute: gated role + 'profile_incomplete' → redirects to /auth/complete-profile
- ProtectedRoute: gated role + 'pending_approval' → redirects to /auth/pending-approval
- ProtectedRoute: gated role + 'rejected' → redirects to /auth/account-rejected
- ProtectedRoute: gated role + 'suspended' → redirects to /auth/account-suspended
- ProtectedRoute: gated role + 'approved' → renders Outlet (no redirect)
- ProtectedRoute: 'guardian' with 'profile_incomplete' → renders Outlet (not gated)
- ProtectedRoute: 'patient' with 'profile_incomplete' → renders Outlet (not gated)
- ProtectedRoute: 'channel_partner' with any status → renders Outlet (excluded from GATED_ROLES)
- ProtectedRoute: demo user (activationStatus missing) → renders Outlet (demo bypass)
- ProtectedRoute: null activationStatus (no profile row) → redirects to /auth/complete-profile
```

**`src/test/services/activation.test.ts`** (mock mode)

```
- submitForReview(): sets status to 'pending_approval' in mock registry
- reopenForEditing(): resets status to 'profile_incomplete'; clears note
- approveActivation(): sets status to 'approved'; mock notification emitted
- rejectActivation(): sets status to 'rejected'; stores note
- getPendingActivations(): returns only 'pending_approval' rows
- getPendingActivations(['caregiver']): filters by role correctly
- getMyActivationStatus(): reads from carenet-mock-registry; returns correct status
- getReviewHistory(profileId): returns array of review records for that profile
```

### Integration Tests

- Register a mock caregiver → assert `activationStatus === 'profile_incomplete'`
- Register a mock guardian → assert `activationStatus === 'approved'`
- `mockApproveUser()` then login → assert `activationStatus === 'approved'`

### E2E (Playwright)

**`e2e/activation-gate.spec.ts`**

```
- Register caregiver (mock mode) → assert URL is /auth/complete-profile
- Click "Submit for Review" → assert URL is /auth/pending-approval
- Admin demo login → navigate to /admin/role-activations → open confirm modal → approve the user
- Caregiver refreshes status → assert URL is /caregiver/dashboard
- Admin rejects a user → confirm modal opens → enter note → confirm → user sees note on /auth/account-rejected
- Click "Update & Resubmit" → assert URL is /auth/complete-profile
- Register guardian → assert URL is /guardian/dashboard (no gate)
- Demo caregiver login → assert URL is /caregiver/dashboard (bypass)
- Set mock status to 'suspended' → login → assert URL is /auth/account-suspended
- Click Log Out on any holding page → assert user is logged out and redirected to /auth/login
- Moderator approves a user visible in /moderator/activations → assert user transitions to dashboard
```

**Mobile viewport:** Run gate scenarios at 390×844 (iPhone 14) to confirm holding pages are mobile-safe.

**Offline:** Use Playwright network interception to block Supabase during `submitForReview()` → verify error toast and status unchanged.

### RLS Testing

- Log in as `caregiver` role → call `getPendingActivations()` → assert RLS blocks it (returns error or empty, not other users' data)
- Log in as `moderator` → call `getPendingActivations(['moderator'])` → assert no moderator profiles returned (role not in allowed list)
- Log in as `admin` → call `getPendingActivations()` → assert all pending profiles visible

### Realtime Testing

Not applicable.

---

## 9. ROLLBACK PLAN

### If the schema migration causes issues

```sql
-- Remove new columns (data loss — only safe before backfill)
ALTER TABLE profiles DROP COLUMN IF EXISTS activation_status;
ALTER TABLE profiles DROP COLUMN IF EXISTS activation_note;
DROP TABLE IF EXISTS role_activation_reviews;
DROP TRIGGER IF EXISTS trg_auto_approve_role ON profiles;
DROP FUNCTION IF EXISTS auto_approve_low_risk_roles();
```

> [!CAUTION]
> If the backfill has already run, dropping the column loses no meaningful data. If NOT yet run, dropping is safe — columns were all on `DEFAULT`. Do NOT attempt to rollback schema after any user has been approved/rejected via the new UI.

### If the ProtectedRoute gate causes mass lockout

1. Revert `ProtectedRoute.tsx` to the previous version (remove the gate block) — this is a single file change, deployable in minutes.
2. The schema and `User` type changes are non-breaking without the gate in place.
3. Run the backfill SQL if not yet done.
4. Re-deploy the gate only after confirming backfill is complete.

### If RLS policies are too restrictive

- Moderator queue returns empty: add `profiles_mod_select` policy in Supabase dashboard. No code change required.
- Approval fails on insert to `role_activation_reviews`: add `activation_review_insert` policy. No code change required.

### Rollback RLS Policy Changes

Policies can be dropped individually in the Supabase dashboard under Authentication → Policies without schema migration:
```sql
DROP POLICY IF EXISTS profiles_mod_select ON profiles;
DROP POLICY IF EXISTS activation_review_insert ON role_activation_reviews;
DROP POLICY IF EXISTS activation_review_admin_read ON role_activation_reviews;
DROP POLICY IF EXISTS activation_review_own_read ON role_activation_reviews;
```

### Orphaned Realtime Subscriptions

Not applicable — no subscriptions added.

---

## 10. CHANNEL PARTNER MIGRATION STRATEGY

> [!IMPORTANT]
> The Channel Partner role already has its own independent approval flow (`CpRouteGuard` + `channel_partners.status`). This section documents the decision on how the two systems coexist.

### Decision: Parallel Systems — CP Excluded from `GATED_ROLES`

`channel_partner` is **excluded** from the unified `GATED_ROLES` list in `ProtectedRoute`. The two status systems remain independent:

| System | Table | Used By | Status Values |
|---|---|---|---|
| Unified gate | `profiles.activation_status` | caregiver, agency, shop, moderator | profile_incomplete, pending_approval, approved, rejected, suspended |
| CP gate | `channel_partners.status` | channel_partner only | pending_approval, active, suspended, rejected, deactivated |

### Why Not Merge?

- CP statuses include `deactivated` which has no equivalent in the unified system.
- `CpRouteGuard` fetches the full `channel_partners` profile (needed for CP-specific data like commissions and leads access); this is a heavier lookup not needed for other roles.
- Merging would require migrating all existing CP statuses and retiring `CpRouteGuard` — high risk, low urgency.

### How Activation_status Interacts with CP

- New CP registrations: the `auto_approve_low_risk_roles` trigger does **not** fire for `channel_partner` (only `guardian` and `patient` are listed). A new CP user gets `activation_status = 'profile_incomplete'` on `profiles`, but the `ProtectedRoute` gate skips them — the `CpRouteGuard` governs access instead.
- `profiles.activation_status` for CP users is set to `'approved'` via the backfill (existing users) and should be set to `'approved'` on new CP registration by a separate trigger or by the CP application submission handler.
- If a CP is suspended: use `channel_partners.status = 'suspended'` (existing `ChanPSuspendedPage`). The unified `profiles.activation_status` is not used for CP suspension.

### Required Schema Change

Extend the `auto_approve_low_risk_roles` trigger to also auto-approve `channel_partner` on `profiles` insert, so their `profiles.activation_status` never blocks them:

```sql
CREATE OR REPLACE FUNCTION auto_approve_low_risk_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('guardian', 'patient', 'channel_partner') THEN
    NEW.activation_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 11. ACCESSIBILITY CHECKLIST

All pages introduced by this feature must satisfy the following before shipping:

| Requirement | Pages | Implementation Note |
|---|---|---|
| Semantic `<main>` wrapper | All 4 holding pages + 2 queue pages | Replace outermost `<div>` |
| Single `<h1>` per page | All 6 pages | Already present; queue pages need heading hierarchy (`<h2>` for section headers) |
| Unique `id` on all interactive elements | All 6 pages | Required for Playwright selectors and screen reader labels |
| `aria-live="polite"` on status text | `PendingApprovalPage` | Wrap the status description |
| `aria-busy="true"` during async ops | All holding pages + queue pages | Set on the primary CTA button while loading |
| Focus moves to error on failure | `CompleteProfilePage`, `AccountRejectedPage` | `useRef` + `.focus()` on error element mount |
| Focus moves to heading on page load | `AccountRejectedPage`, `SuspendedAccountPage` | Auto-focus `<h1>` on mount |
| Keyboard-accessible modal | `ActivationConfirmModal` | Focus trap + Escape to close + initial focus on cancel button |
| Log Out button visible without scroll | All 4 holding pages | Provided by `GatedLayout` header |
| Colour contrast AA | All pages | Verify in Storybook / browser devtools |

# UCCF v1.0 implementation checklist

**Normative spec:** [packages-1.md](./packages-1.md) (Unified Care Contract Format + platform layers).  
**Duplicate:** [packages.md](./packages.md) should stay in sync with `packages-1.md` or be removed to avoid drift.

**TypeScript models:** [`src/backend/models/uccf.model.ts`](../backend/models/uccf.model.ts)

---

## Status legend

| Tag | Meaning |
|-----|---------|
| **Done** | Shipped in repo, used by app or tests |
| **Partial** | Some behavior exists under different shape (e.g. Supabase service vs REST path) |
| **Stub** | Types/constants/registry only; no production behavior |
| **Not started** | No meaningful implementation |

---

## Phase A — Domain & persistence (UCCF document)

- [x] **Done** — Shared constants and `CareCategory` in `src/backend/domain/uccf/`
- [x] **Done** — `careContractToSupabaseRow` / row mappers for `care_contracts`
- [x] **Done** — `createCareRequest` and `createAgencyPackage` (Supabase + mock) with `assertUCCFRequest` / `assertUCCFOffer`

---

## Phase B — Guardian / patient wizard

- [x] **Done** — [`CareRequirementWizardPage`](../frontend/pages/guardian/CareRequirementWizardPage.tsx): UCCF request fields including `care_subject`, `care_needs`, `medical`, `services`, `logistics`, `equipment`, `exclusions`, `add_ons`, `meta.duration_type`, location, `pricing.preferred_model`
- [x] **Done** — Categories use canonical spec enums (`VALID_CARE_CATEGORIES`), not legacy wizard-only ids
- [x] **Done** — Route `/patient/care-requirement-wizard` (and guardian variant) wired

---

## Phase C — Agency package wizard

- [x] **Done** — [`AgencyPackageCreatePage`](../frontend/pages/agency/AgencyPackageCreatePage.tsx): offer fields + validation; `agency_id` from `currentUserId()` when using Supabase

---

## Phase D — i18n & tests (UCCF mappers)

- [x] **Done** — Strings in `src/locales/en/guardian.json` and `src/locales/bn/guardian.json` for wizard copy
- [x] **Done** — Vitest: UCCF mapper round-trip / validation coverage in `src/backend/domain/uccf/__tests__/`

---

## Phase E — Platform API path registry (`packages-1.md` §1)

**Gap:** The repo has **no** standalone HTTP server implementing `/auth/*`, `/contracts/*`, etc. The SPA uses **Supabase + services**. Paths are registered for gateway work later.

- [x] **Stub** — [`src/backend/api/platformEndpoints.ts`](../backend/api/platformEndpoints.ts): `PLATFORM_API` + `PLATFORM_API_TOTAL` (97 routes per doc §1.1–1.10; admin block lists 7 routes)
- [x] **Stub** — [`src/backend/api/platformBridge.ts`](../backend/api/platformBridge.ts): maps each spec domain to current app layer (honest “not HTTP” notes)
- [x] **Done** — Re-export from [`endpoints.ts`](../backend/api/endpoints.ts): `PLATFORM_API`, `PLATFORM_API_TOTAL`

---

## Phase F — Lifecycle state machine (`packages-1.md` §3)

- [x] **Done** — [`src/backend/domain/lifecycle/contractLifecycle.ts`](../backend/domain/lifecycle/contractLifecycle.ts): primary flow + failure states, `canTransition` / `assertTransition`, re-post → `published` allowlist
- [x] **Done** — Vitest: [`contractLifecycle.test.ts`](../backend/domain/lifecycle/__tests__/contractLifecycle.test.ts)
- [x] **Done** — Postgres: [`20260406200000_care_contracts_lifecycle_and_rls_bids.sql`](../../supabase/migrations/20260406200000_care_contracts_lifecycle_and_rls_bids.sql) — `care_contract_valid_transition()` + lifecycle trigger; extended `status` CHECK; maintenance `SET app.bypass_lifecycle = 'true'` to skip trigger
- [x] **Done** — [`20260406210000_marketplace_rls_hardening_and_lifecycle_insert.sql`](../../supabase/migrations/20260406210000_marketplace_rls_hardening_and_lifecycle_insert.sql) — `BEFORE INSERT OR UPDATE OF status` (initial status `draft`/`published` only + transitions); consolidated RLS on `care_contracts` / `care_contract_bids`
- [x] **Done** — [`20260406220000_valid_transition_alias.sql`](../../supabase/migrations/20260406220000_valid_transition_alias.sql) — `valid_transition()` alias + trigger uses spec-style exception text `Invalid transition: % → %`

---

## Phase G — Trust score constants (`packages-1.md` §1 fraud/trust JSON)

- [x] **Stub** — [`src/backend/domain/lifecycle/trustSignals.ts`](../backend/domain/lifecycle/trustSignals.ts): weight constants only
- [ ] **Not started** — Scoring engine, KYC, attendance proofs, penalties

---

## Phase H — Real-time bidding (`packages-1.md` §2)

- [ ] **Not started** — Dedicated WebSocket service, Redis queue, Kafka event bus
- [x] **Partial** — Supabase Realtime `postgres_changes` on `care_contract_bids`: [`subscribeToCareContractBids`](../backend/services/realtime.ts) + [`GuardianMarketplaceHubPage`](../frontend/pages/guardian/GuardianMarketplaceHubPage.tsx) (toast on new bid) + [`BidReviewPage`](../frontend/pages/guardian/BidReviewPage.tsx) (silent refetch); table in `supabase_realtime` publication (base migration)
- [x] **Partial** — In-app bids via `marketplace.service` (submit/accept/counter/withdraw); expiry rules not full spec

### RLS (marketplace)

- [x] **Done** — Multi-tenant RLS on `care_contracts` / `care_contract_bids` in [`20260406210000_*`](../../supabase/migrations/20260406210000_marketplace_rls_hardening_and_lifecycle_insert.sql) (guardian-owned requests; agencies: published + own offers; bids visible to request owner + bidding agency; bid insert/update checks)

### Edge Functions (orchestration stubs)

- [x] **Stub** — [`supabase/functions/marketplace-expire-bids`](../../supabase/functions/marketplace-expire-bids/index.ts) — expire stale bids (Bearer service role); schedule via Supabase cron or external caller
- [x] **Stub** — [`supabase/functions/payment-webhook`](../../supabase/functions/payment-webhook/index.ts) — gateway webhook ack (wire to bookings/payments when schema allows)
- [x] **Stub** — [`supabase/functions/matching-run`](../../supabase/functions/matching-run/index.ts) — server-side matching placeholder (JWT auth)

---

## Phase I — HTTP gateway for §1 endpoints

- [ ] **Not started** — Implement 97 REST handlers + auth middleware + OpenAPI (or Edge Functions) behind `VITE_API_URL` / `/api`

---

## Phase J — Operations, payments, reviews, admin (§1.7–1.10)

- [ ] **Partial** — Payments/wallet/admin **mocks** under `src/backend/api/mock/`
- [ ] **Not started** — Production `/operations/*`, `/payments/*`, `/reviews/*`, `/admin/*` matching spec

---

## Phase K — Workforce & mobile (`packages-1.md` §2 caregiver / §3 apps)

- [ ] **Not started** — Roster/payroll/replacement engines as described
- [ ] **Partial** — Capacitor shell exists; dedicated operator/caregiver apps not built to spec

---

## Summary — largest gaps (honest)

| Area | Spec section | In repo today |
|------|----------------|---------------|
| REST API §1 (~97 routes) | §1 | Path constants + bridge doc only; **no** HTTP server |
| Real-time bidding | §2 | **Supabase Realtime** on `care_contract_bids` for guardian hub; **no** separate WS/Redis/Kafka |
| Lifecycle enforcement | §3 | TS + **Postgres trigger** on `care_contracts.status` (+ re-post → `published`); client should still use `canTransition` before writes |
| Trust engine | Fraud §1 | Constants only |
| Operations / payments / admin APIs | §1.7–1.10 | Mostly **not** implemented as REST |
| Mobile UX | §3 | **Not** fully implemented |

---

## Manual QA (URLs)

| Flow | Path |
|------|------|
| Guardian requirement | `/guardian/care-requirement-wizard` |
| Patient requirement | `/patient/care-requirement-wizard` |
| Agency package | `/agency/package-create` |
| List packages (mock vs SB) | `/guardian/marketplace-hub?tab=packages` |

**Supabase:** confirm rows in `care_contracts` populate JSONB `care_needs` / `services` and flat medical/logistics/equipment columns when filled.

**Required vs optional (spec):** Schema marks `meta`, `party`, `care_subject`, `care_needs`, `staffing`, `schedule`, `pricing` as required for a full validated document. The app applies **defaults** where the UI does not collect a field yet (documented in code comments / defaults in mapper).

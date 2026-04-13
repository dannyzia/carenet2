# Caregiving Contract Convergence — Full Plan (Consolidated)

**Status:** Authoritative specification (product + data + migration lessons)  
**Last updated:** 2026-04-11  
**Scope:** Guardian–Agency contracts (GAC), Caregiver–Agency contracts (CAC), Caregiving Jobs (CJ), marketplace convergence, Supabase migrations, UI/IA, and all corrections from review iterations.

This document merges: the dashboard two-card IA, the GAC/CAC/CJ conceptual model, staffing-channel rules, the D025 system-design draft, and the **merciless migration review** (fatal SQL errors, ordering, idempotency, RLS, JSONB discovery, and clone-vs-mutate evolution for `acceptBid`).

---

## Table of contents

1. [Product model (what users see)](#1-product-model-what-users-see)  
2. [Canonical taxonomy](#2-canonical-taxonomy)  
3. [How negotiation is stored today](#3-how-negotiation-is-stored-today)  
4. [Current codebase gaps](#4-current-codebase-gaps)  
5. [Target database model](#5-target-database-model)  
6. [Non‑negotiable engineering rules](#6-nonnegotiable-engineering-rules)  
7. [Phase A — marketplace / contract convergence](#7-phase-a--marketplace--contract-convergence)  
8. [Phase B — caregiving jobs & assignments](#8-phase-b--caregiving-jobs--assignments)  
9. [Supabase migration — specification & lessons learned](#9-supabase-migration--specification--lessons-learned)  
10. [Application & UI work](#10-application--ui-work)  
11. [Testing, rollout, and validation SQL](#11-testing-rollout-and-validation-sql)  
12. [Deferred / out of scope](#12-deferred--out-of-scope)  
13. [Implementation order](#13-implementation-order)  
14. [Key file references](#14-key-file-references)

---

## 1. Product model (what users see)

### 1.1 Packages and requirements are **inputs**, not flows

- **Agency package** (`care_contracts` row, `type = offer`, published) is one way to start a guardian–agency deal.  
- **Guardian requirement** (`care_contracts` row, `type = request`, published) is another.  
- Both can involve **negotiation** (different mechanics per path — see §3).  
- The **outcome** the business cares about for “family + agency + caregiver operations” is expressed as **contracts** and **caregiving jobs**, not as endless browsing of listings.

### 1.2 Two kinds of Guardian–Agency Contract (GAC)

| Kind | Origin (conceptual) | Staffing rule (CAC channel) |
|------|---------------------|-------------------------------|
| **Package-GAC** | Guardian–agency agreement reached via **package** path (subscribe / client package engagement / accept). | Only **package–caregiver** CACs (`staffing_channel = package_caregiver`). |
| **Request-GAC** | Guardian–agency agreement reached via **posted requirement** path (bids / counters / accept). | Only **forwarded-requirement** CACs (`staffing_channel = forwarded_requirement`). |

**Glossary:** User phrasing like “offer accepted by agency” on a **request** flow should be read as **Request-GAC** (requirement / posted-job pipeline), not as a separate third kind, unless product explicitly defines another event.

### 1.3 Two kinds of Caregiver–Agency Contract (CAC)

| CAC path | How created | `staffing_channel` |
|----------|-------------|--------------------|
| **Package–caregiver** | Caregiver applies to agency package → negotiate → accept. | `package_caregiver` |
| **Forwarded-requirement** | Agency forwards a requirement slice to caregiver → negotiate → accept. | `forwarded_requirement` |

### 1.4 Caregiving Job (CJ) — operational hub

- **CJ** = **operational job** (scheduling, coverage, work attribution), **not** the same as “the commercial GAC row only.”  
- **No CJ row** until there is at least **one CAC** involved in creating that job (agency tags **GAC ↔ first CAC**). GAC-only is a commercial agreement but **not** a CJ in this model.  
- **Who creates / extends:** **Agency** only.  
- **Create CJ:** “Tag GAC to CAC” / “Tag CAC to GAC” → one transaction: `INSERT caregiving_jobs` + first row in `caregiving_job_caregiver_assignments`.  
- **Add caregivers:** “Add CAC to this job” → more rows in `caregiving_job_caregiver_assignments` on the **same** `caregiving_job_id`.  
  - **Same CAC twice** on one CJ is allowed: use **`assignment_label`** (and/or slot/time band) so rows are distinct; recommended uniqueness: `UNIQUE (caregiving_job_id, caregiver_agency_contract_id, assignment_label)`.  
- **Multiple CJ rows for the same (GAC, CAC)** are allowed when the agency needs a **new operational container** (new period, renewed segment, parallel operational track). Optional later: `job_group_key` or `cj_group_id` for UX grouping.  
- **Downstream:** `placements` / shifts should eventually reference **`caregiving_job_id`** and **`caregiving_job_caregiver_assignment_id`** (not only `cac_id`).

### 1.5 `assertCompatible(gac, cac)` (merciless rule)

Enforce before **every** CJ create and **every** new assignment:

- `gac.contract_party_scope = 'guardian_agency'` and `gac.gac_kind` is set; `gac.staffing_channel` must be **NULL** on GAC rows.  
- `cac.contract_party_scope = 'caregiver_agency'` and `cac.staffing_channel` is set; `cac.gac_kind` must be **NULL** on CAC rows.  
- `(gac.gac_kind = 'package_gac' AND cac.staffing_channel = 'package_caregiver')` **OR** `(gac.gac_kind = 'request_gac' AND cac.staffing_channel = 'forwarded_requirement')`.  
- Reject all other pairings unless a **documented** product exception is added.

---

## 2. Canonical taxonomy

### 2.1 `source_type` / `source_id` on `care_contracts` (traceability)

Canonical enumeration for **new** rows (adjust if product renames):

| `source_type` | `source_id` points to |
|---------------|------------------------|
| `package_client_engagement` | `package_client_engagements.id` |
| `package_caregiver_engagement` | `package_caregiver_engagements.id` |
| `care_contract_bid` | `care_contract_bids.id` (winning / accepted bid path — future migration) |
| `direct_subscription` | Package `care_contracts.id` when guardian subscribes without engagement thread |

### 2.2 `financial_status` (billing vs operational)

- Operational `status` on `care_contracts` (e.g. `booked`, `active`) is **not** the same as billing.  
- Add **`financial_status`**: e.g. `pending`, `invoiced`, `paid`, `waived`, `cancelled` — default `pending` for new “provisional booking” rows.

### 2.3 Legacy `contracts` (CarePoints)

- Remains **separate** from UCCF `care_contracts` for Phase A/B MVP.  
- No dual-write in scope; document **double-entry** risk if finance uses both UIs.

---

## 3. How negotiation is stored today

| Path | Storage | Counter-offer shape |
|------|---------|------------------------|
| Requirement / bids | `care_contract_bids` + `counter_offer` JSONB | Latest counter **overwrites** prior (no threaded history on row). |
| Package / guardian client | `package_client_engagements` + `package_client_engagement_events` | Append-only events; `event_kind` includes `counter_offer`. |
| Package / caregiver | `package_caregiver_engagements` + `package_caregiver_engagement_events` | Same pattern. |
| Forwarded requirement (target) | **Deferred** — mirror engagement+events, scoped to requirement + caregiver + agency. |

---

## 4. Current codebase gaps

1. **`acceptBid` / requirement path:** Today may **mutate** the requirement `care_contracts` row in place (`locked`, etc.) instead of treating listing vs “contract outcome” as separate concerns — **align with product**: either clone a new row with `source_type` / `gac_kind` or document invariants if keeping mutate.  
2. **`subscribeToPackage`:** Creates new `care_contracts` at `booked` — closer to desired pattern; should set **`source_type` / `source_id`** and **`gac_kind = package_gac`** when GAC semantics apply.  
3. **Package engagement `accepted`:** Often updates engagement **only** — **no** linked `care_contracts` row — **must** create GAC/CAC contract row + `contract_id` on engagement (idempotent).  
4. **`placements` / shifts:** Not tied to GAC/CAC/CJ — operational rollup missing.  
5. **`ContractListPage`:** Uses legacy `contracts` table — not UCCF truth.  
6. **Dashboards:** Do not yet expose the two-card **packages vs requirements** entry model with cross-links.

---

## 5. Target database model

### 5.1 `care_contracts` (UCCF) — new / clarified columns

- `source_type` TEXT, `source_id` UUID — provenance for dashboards and audits.  
- `financial_status` TEXT + CHECK (eventually `VALIDATE`).  
- `contract_party_scope` TEXT: `guardian_agency` | `caregiver_agency` (nullable for legacy until backfill).  
- `parent_guardian_agency_contract_id` UUID NULL → self-FK to parent GAC for CAC rows.  
- `gac_kind` TEXT: `package_gac` | `request_gac` — **only** on GAC rows.  
- `staffing_channel` TEXT: `package_caregiver` | `forwarded_requirement` — **only** on CAC rows.  

**CHECK strategy:** Add constraints **`NOT VALID`**, backfill / insert compliant rows, then **`VALIDATE CONSTRAINT`** in a controlled window.

**Partial index:** `parent_guardian_agency_contract_id` WHERE NOT NULL (no `CONCURRENTLY` inside single-transaction Supabase migrations).

### 5.2 `package_client_engagements` / `package_caregiver_engagements`

- `contract_id` UUID NULL FK → `care_contracts(id)` ON DELETE SET NULL.

### 5.3 `caregiving_jobs`

- `id`, `guardian_agency_contract_id` NOT NULL FK, `agency_id` NOT NULL, operational fields (`start_date`, `end_date`, `schedule_pattern`, `location_id`, …), `status`, `notes`, optional `job_group_key`.  
- **No** `UNIQUE (guardian_agency_contract_id, start_date)` unless product explicitly wants that dedupe — it blocked legitimate multiple jobs same day.

### 5.4 `caregiving_job_caregiver_assignments`

- `id`, `caregiving_job_id`, `caregiver_agency_contract_id`, **`assignment_label` NOT NULL**, `role`, `status`.  
- Recommended: `UNIQUE (caregiving_job_id, caregiver_agency_contract_id, assignment_label)` to prevent duplicate “Morning” twice for same CAC.

### 5.5 `placements` (optional in same migration)

- Nullable `caregiving_job_id`, `caregiving_assignment_id` — backfill **manual / heuristic**, not automated guess in MVP migration.

---

## 6. Non‑negotiable engineering rules

1. **Idempotency:** Contract creation from an engagement must be safe under double-submit (unique logical key per engagement or “if accepted and contract_id not null then return”).  
2. **Backfill:** Any migration that changes meaning of `accepted` engagements must ship with a **backfill** path or explicit “accepted_without_contract” repair.  
3. **Financial integrity:** `financial_status` separates billing from `status`.  
4. **No `CREATE INDEX CONCURRENTLY`** in standard Supabase single-transaction migrations (use plain `CREATE INDEX` for MVP table sizes, or a separate ops migration).  
5. **RPC return rows:** After `UPDATE` + `INSERT`, **re-SELECT** engagement before `RETURNING jsonb` so `contract_id` is not stale.

---

## 7. Phase A — marketplace / contract convergence

**Goals**

- Link `package_*_engagements` to resulting `care_contracts` via `contract_id`.  
- Add traceability + financial columns on `care_contracts`.  
- Backfill **package engagement `accepted`** rows that lack contracts (historical repair).  
- **Deferred in Phase A file:** Request-GAC creation from **`care_contract_bids` / `acceptBid`** — separate migration after bid-flow analysis.

**Services**

- `packageEngagement.service.ts`: on `accepted`, create contract row **idempotently** (or call RPC `accept_client_engagement`).  
- `marketplace.service.ts`: align `subscribeToPackage` / `acceptBid` with `source_type`, `gac_kind`, `financial_status`, and chosen clone/mutate policy.

---

## 8. Phase B — caregiving jobs & assignments

- RPC / service: `create_caregiving_job` + `add_caregiver_assignment` with `assertCompatible`.  
- Agency UI: link GAC↔CAC, list assignments, add caregiver.  
- Redaction: caregiver-facing payloads exclude commercial fields.  
- Forwarded-requirement CAC **UI** remains backlog until structure exists.

---

## 9. Supabase migration — specification & lessons learned

This section records **every fatal or serious mistake** caught during review so they are not reintroduced.

### 9.1 Fatal: `EXECUTE … INTO v_temp_table_name` after `INSERT … RETURNING`

**Wrong:** Treating a TEXT variable holding a temp table name as the `INTO` target for `INSERT … RETURNING` (wrong arity and wrong semantics).

**Right:** CTE chain:

```sql
WITH to_backfill AS (...),
inserted AS (
  INSERT INTO public.care_contracts (...)
  SELECT ... FROM to_backfill
  RETURNING id, source_id, 'package_client_engagement'::text AS source_type
)
INSERT INTO temp_table (contract_id, source_id, source_type)
SELECT id, source_id, source_type FROM inserted;
```

### 9.2 Fatal: section ordering (columns before backfill)

Backfill `INSERT` must not reference `contract_party_scope` / `gac_kind` / `staffing_channel` **before** those columns exist on `care_contracts`.

### 9.3 Fatal: temp table overlap between client and caregiver passes

**Fix:** `TRUNCATE temp_table` between client GAC pass and caregiver CAC pass (or two temp tables).

### 9.4 Wrong: CAC `type = 'offer'`

CAC is **not** the agency catalog offer. CAC rows should use the same `type` convention as the rest of UCCF for caregiver agreements (typically `request` with scope discriminator — **verify** against `uccf.model` and queries).

### 9.5 Risk: `CREATE INDEX CONCURRENTLY` inside transactional migration

Remove `CONCURRENTLY` for managed migrations.

### 9.6 Risk: `CHECK` constraints immediately validating legacy rows

Use `ADD CONSTRAINT … NOT VALID`, backfill compliant fields, then `VALIDATE CONSTRAINT` separately.

### 9.7 Risk: JSONB column = alphabetical `LIMIT 1`

**Final hardened discovery** — prioritized allowlist (remove unreachable `ELSE` branch if `IN (...)` is strict):

```sql
SELECT column_name INTO v_jsonb_column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'care_contracts'
  AND data_type = 'jsonb'
  AND column_name IN (
    'care_details', 'care_data', 'uccf_data',
    'payload', 'body', 'details', 'document'
  )
ORDER BY
  CASE column_name
    WHEN 'care_details' THEN 1
    WHEN 'care_data'   THEN 2
    WHEN 'uccf_data'   THEN 3
    WHEN 'payload'     THEN 4
    WHEN 'body'        THEN 5
    WHEN 'details'     THEN 6
    WHEN 'document'    THEN 7
  END,
  column_name
LIMIT 1;

IF v_jsonb_column_name IS NULL THEN
  RAISE EXCEPTION 'No recognized JSONB column found (expected one of: care_details, care_data, uccf_data, payload, body, details, document).';
END IF;
```

Add your **real** UCCF column name **first** in the `IN` list when schema audit confirms it.

### 9.8 Flat path: validate **all** required columns

Require the full set used by `INSERT` (e.g. `title`, `description`, `care_details`, `budget_period`, `budget_amount`) — if any missing, either take JSONB path or fail with a clear list (`string_agg` of missing names).

### 9.9 `accepted_at` vs `updated_at`

Discover with priority `accepted_at` then `updated_at`. Note: `updated_at` almost always exists, so “accepted timestamp” may semantically be “last update” if `accepted_at` absent — acceptable if documented.

### 9.10 RLS when `profiles.agency_id` (or `agency_uuid`) is missing

- `ENABLE ROW LEVEL SECURITY` without agency policies **blocks** normal authenticated agency access unless using **service_role** or other policies.  
- **Explicit product choice:** either require profiles agency mapping, or document “all writes via service_role,” or add fallback policies.

### 9.11 Post-migration counts (revised)

```sql
SELECT 'Accepted client engagements' AS label, COUNT(*)
FROM public.package_client_engagements
WHERE status = 'accepted'
UNION ALL
SELECT 'GACs created (client)', COUNT(*)
FROM public.care_contracts
WHERE source_type = 'package_client_engagement'
  AND contract_party_scope = 'guardian_agency'
  AND gac_kind = 'package_gac';
```

Tune analogous query for caregiver engagements vs `package_caregiver_engagement` CAC rows.

### 9.12 Constraint validation (after data cleanup)

```sql
ALTER TABLE public.care_contracts VALIDATE CONSTRAINT check_financial_status_values;
ALTER TABLE public.care_contracts VALIDATE CONSTRAINT check_contract_party_scope_values;
ALTER TABLE public.care_contracts VALIDATE CONSTRAINT check_gac_kind_values;
ALTER TABLE public.care_contracts VALIDATE CONSTRAINT check_staffing_channel_values;
ALTER TABLE public.care_contracts VALIDATE CONSTRAINT check_contract_role_consistency;
```

---

## 10. Application & UI work

| Area | Action |
|------|--------|
| Guardian dashboard | Two cards: packages + requirements; cross-links; live counts null-safe. |
| Agency dashboard | Two cards: our packages + family requirements; cross-links. |
| `ContractListPage` | Query UCCF `care_contracts` with `source_type` / origin badges; tabs for guardian-agency vs caregiver-agency where applicable. |
| i18n | `en` + `bn` `dashboard.json` / `common.json` keys for cards and contract labels. |
| Nav (optional) | Align “Care hub” vs “Care Marketplace” copy. |
| Services | Idempotent engagement accept; `assertCompatible` on CJ flows; redacted caregiver DTOs. |

---

## 11. Testing, rollout, and validation SQL

1. Apply migration to a **database clone** (`supabase db reset` / branch DB).  
2. Run **count reconciliation** queries (§9.11 + caregiver mirror).  
3. Spot-check a few rows: titles, amounts, `contract_party_scope`, `gac_kind` / `staffing_channel`, `contract_id` on engagements.  
4. Run app smoke tests: accept engagement twice, list contracts, create CJ with compatible CAC, negative test incompatible CAC.  
5. Only then `VALIDATE CONSTRAINT` on production after a maintenance window.

---

## 12. Deferred / out of scope

| Item | Reason |
|------|--------|
| Request-GAC backfill from `care_contract_bids` | Needs bid-flow audit + possibly clone-vs-mutate decision. |
| Forwarded-requirement CAC **creation UI** | Phase B can add schema + services; UI backlog. |
| Heuristic `placements` backfill | Human-validated script, not auto-migration. |
| Legacy CarePoints `contracts` removal | Not MVP. |
| `schedule_pattern` cron | JSON storage only; no worker in MVP. |

---

## 13. Implementation order

1. **Migration Phase A+B** (engagement `contract_id`, `care_contracts` columns, CHECKs NOT VALID, indexes, temp-table backfill for **package** engagements only, `caregiving_*` tables, placements nullable FKs, RPCs, RLS as policy).  
2. **Wire services** to RPC or shared insert helper; add tests for idempotency + `assertCompatible`.  
3. **Dashboards + i18n.**  
4. **`ContractListPage` + origin badges.**  
5. **Follow-up migration:** Request-GAC / bid-linked contracts + any `acceptBid` semantic change.  
6. **Placements** link to `caregiving_job_id` when operational model is ready.  
7. **`VALIDATE CONSTRAINT`** when data is clean.

---

## 14. Key file references

| Topic | Path |
|-------|------|
| Package engagement service | `src/backend/services/packageEngagement.service.ts` |
| Marketplace / bids / subscribe | `src/backend/services/marketplace.service.ts` |
| Engagement models | `src/backend/models/packageEngagement.model.ts` |
| UCCF model | `src/backend/models/uccf.model.ts` |
| Guardian dashboard | `src/frontend/pages/guardian/GuardianDashboardPage.tsx` |
| Agency dashboard | `src/frontend/pages/agency/AgencyDashboardPage.tsx` |
| Contract list | `src/frontend/pages/contracts/ContractListPage.tsx` |
| Original design draft | `src/imports/Building Plan/D025_-_Caregiving Contract Lifecycle Convergence.md` |
| Cursor plan (short + todos) | `.cursor/plans/packages_requirements_contract_convergence_661ca029.plan.md` |

---

**Merciless bottom line:** The product model (Package-GAC vs Request-GAC, CJ + assignments, `assertCompatible`) is coherent. The migration is **structurally viable** only after the **CTE + temp table + TRUNCATE** pattern and **prioritized JSONB** discovery. **“Runs” still requires clone validation** against your real `care_contracts` shape. This file is the single place that records both the **intent** and the **failure modes we already paid for in review**.

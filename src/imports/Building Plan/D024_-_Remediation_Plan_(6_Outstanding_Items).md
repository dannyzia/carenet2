# D024 — Remediation Plan: 6 Outstanding Items
> Authored after full line-by-line audit of the codebase (March 2026)
> All findings are confirmed from actual file reads, not assumptions.
> Execution log appended at the bottom as work is completed.

---

## About `src/imports/`

**Answer: No. This folder is not needed to run the project.**

The `src/imports/` folder contains only planning and architecture documents (`.md` files). It is
never imported by any TypeScript, TSX, or CSS file in the build graph. Vite never touches it.
The production bundle, the dev server, and the test runner are all completely unaware of this folder.

**Recommendation:** Keep it in the repository as a reference library for the team. It does not affect
build size, runtime performance, or deployment. If you ever want to clean the repo root, you could
move it to a top-level `docs/` or `planning/` folder — but there is no technical reason to do so.

The `src/imports/` folder is safe to leave exactly where it is.

---

## Executive Summary of the 6 Items

| # | Item | Type | Risk | Effort | Status |
|---|---|---|---|---|---|
| 1 | ProtectedRoute not wired into routes | Security gap | 🔴 High | Very small | ✅ DONE |
| 2 | FeaturesPage is a stub | UX / public-facing | 🟠 Medium | Medium | ✅ DONE (full page; see log) |
| 3 | PricingPage is a stub | UX / public-facing | 🟠 Medium | Medium | ✅ DONE (full page; see log) |
| 4 | `/agency/incidents` page missing | Functional gap | 🟠 Medium | Medium | ✅ DONE |
| 5 | Supabase not connected | Deployment blocker | 🔴 High | Ops task | 🔄 `.env` configured; database + deploy env still pending (see Item 5) |
| 6 | `useDocumentTitle` hook missing | Accessibility gap | 🟡 Low | Small | ✅ DONE (Waves 1–3 wired; see log) |

**Execution order: 1 → 5 → 6 → 4 → 2 → 3**

---

## Item 1 — ProtectedRoute Not Wired Into routes.ts

### Finding
`src/frontend/components/guards/ProtectedRoute.tsx` exists and is correctly implemented.
It checks `isAuthenticated` from `useAuth()` and redirects to `/auth/login` if false.

`src/app/routes.ts` did NOT wrap the `AuthenticatedLayout` branch with this guard — 130+ role
pages were fully accessible to unauthenticated users who knew a URL.

### Root Cause
Opus built `ProtectedRoute` as a standalone component but the Phase 0 routing restructure did
not wire it as a parent of the authenticated branch. Clerical omission, not an architectural flaw.

### Fix Applied ✅
**File changed:** `src/app/routes.ts`

1. Added import:
   ```ts
   // ─── Route Guards ───
   import { ProtectedRoute } from "@/frontend/components/guards/ProtectedRoute";
   ```

2. Wrapped `AuthenticatedLayout` inside `ProtectedRoute`:
   ```ts
   {
     Component: ProtectedRoute,
     children: [
       {
         Component: AuthenticatedLayout,
         children: [ /* all 130+ role routes */ ],
       },
     ],
   },
   ```

3. `agency/incidents` route added at the same time (Item 4, Step 3):
   ```ts
   { path: "agency/incidents", ...p(() => import("@/frontend/pages/agency/AgencyIncidentsPage")) },
   ```

`ShopFrontLayout` deliberately NOT wrapped — shop front is public browsing.

### Verification checklist
- [ ] Navigate to `/caregiver/dashboard` while logged out → redirected to `/auth/login`
- [ ] Navigate to `/admin/users` while logged out → redirected to `/auth/login`
- [ ] Navigate to `/home` while logged out → public page loads normally
- [ ] Log in → redirected back to originally requested URL
- [ ] `/shop` browsing works without login

---

## Item 2 — FeaturesPage Is a Stub

### Finding
`src/frontend/pages/public/FeaturesPage.tsx` — 26 lines, 🐣 placeholder. Reachable from
`PublicNavBar` and the authenticated sidebar. D013 flags as "placeholder content depth."

### What the page should contain

**Role-segmented feature showcase:**
- Guardian: post requirements, browse agencies, review bids, monitor placements, manage payments
- Caregiver: job marketplace, apply to jobs, log care, track earnings, portfolio, training
- Agency: requirements inbox, job management, placement ops, shift monitoring, payroll, storefront
- Patient: care history, vitals, medications, emergency hub
- Shop Owner: product listings, order management, inventory

**Platform-wide:** Offline-first, bilingual EN/BN, PWA, Capacitor native, real-time monitoring,
agency-mediated safety model.

### Fix

**File to rewrite:** `src/frontend/pages/public/FeaturesPage.tsx`

**Structure:**
```
FeaturesPage
├── useDocumentTitle("Features")
├── Hero — headline + subheading + CTA buttons (Get Started / View Pricing)
├── Role tabs — Guardian | Caregiver | Agency | Patient | Shop
│   └── 4–6 feature cards per tab (icon + title + 2-line description)
├── Platform-wide strip — Offline, Bilingual, PWA, Real-time, Secure
└── CTA footer — "Ready to get started?" → /auth/register
```

**Conventions:**
- `cn` tokens from `@/frontend/theme/tokens` — no hardcoded hex
- `roleConfig` for role accent colors on each tab
- Lucide icons
- `useTranslation("common")`
- Radix `Tabs` from `src/frontend/components/ui/tabs.tsx`
- Study `HomePage.tsx` card structure before writing

### Status: 🔄 Remaining

---

## Item 3 — PricingPage Is a Stub

### Finding
`src/frontend/pages/public/PricingPage.tsx` — identical 26-line placeholder. D013 flags as
"Pricing page content depth — Placeholder content."

### What the page should contain

**Pricing model (from D003 + D019):**
- Guardian: free browsing + requirement posting; service fee on placements; bKash/Nagad/Rocket/Card
- Agency: commission per placement + optional monthly subscription
- Caregiver: free to join; no platform fee on caregiver side
- Shop Merchant: listing fee or revenue share per order
- Note: exact BDT amounts not defined in corpus — show structure, not invented numbers

### Fix

**File to rewrite:** `src/frontend/pages/public/PricingPage.tsx`

**Structure:**
```
PricingPage
├── useDocumentTitle("Pricing")
├── Hero — "Simple, transparent pricing for Bangladesh's care economy"
├── Billing toggle — Monthly / Annual (UI only)
├── 3 pricing cards — Guardian | Agency | Shop Merchant
├── FAQ accordion (4–6 questions)
│   ├── "How does the platform fee work?"
│   ├── "Which payment methods are accepted?"
│   ├── "Is there a contract or lock-in?"
│   └── "What currency is used?"
└── CTA — "Get started for free" → /auth/register
```

**Conventions:**
- Same as FeaturesPage (tokens, i18n, useDocumentTitle)
- Radix `Accordion` from `src/frontend/components/ui/accordion.tsx`
- BDT symbol (৳) for currency
- `cn.pink`, `cn.green`, `cn.teal` for card accents

### Status: ✅ DONE (verified March 19, 2026)

**Implemented in** `src/frontend/pages/public/PricingPage.tsx`: `useDocumentTitle`, monthly/annual
toggle, three tier cards (Guardian / Agency / Shop Merchant), Radix `Accordion` FAQ, BDT note in
copy, token accents (`cn.green`, `cn.teal`, `cn.orange`). **Note:** Same i18n gap as Features —
most strings are hardcoded English; title key `pageTitles.pricing` is wired.

---

## Item 4 — `/agency/incidents` Page Missing

### Finding
`IncidentReportWizardPage.tsx` exists (creates incidents), but the list/management view at
`/agency/incidents` had no page file, no route, no service method, no model type, no mock data.
D009 §3.1, D010 W09, D013 §4.6 all flag as active backlog.

### Pre-work (files read before any code written)
- `agency.service.ts` — no `getIncidents()` method existed
- `agencyMocks.ts` — no incident mock array existed
- `agency.model.ts` — no `Incident` type existed

### Fix Applied (infrastructure + page file) ✅

#### Step 1 — Model ✅
**File:** `src/backend/models/agency.model.ts`

Appended to end of file:
```ts
// ─── Incidents ───
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "in-review" | "resolved" | "escalated";

export interface AgencyIncident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;       // caregiver name
  patientName: string;
  placementId?: string;
  reportedAt: string;       // ISO timestamp
  resolvedAt?: string;
  resolutionNote?: string;
}
```

#### Step 2 — Service methods ✅
**File rewritten:** `src/backend/services/agency.service.ts`

Added `AgencyIncident` to import from `@/backend/models`.
Added `MOCK_AGENCY_INCIDENTS` to import from `@/backend/api/mock`.
Three new methods added inside `agencyService`:

```ts
async getIncidents(): Promise<AgencyIncident[]>
  // Supabase: incident_reports table filtered by agency_id
  // Mock: returns MOCK_AGENCY_INCIDENTS

async resolveIncident(id: string, note: string): Promise<void>
  // Supabase: status → "resolved", sets resolution_note + resolved_at
  // Mock: delay(300)

async escalateIncident(id: string): Promise<void>
  // Supabase: status → "escalated"
  // Mock: delay(300)
```

Note: File was fully rewritten (not patched) because an accidental append in a prior attempt
landed outside the object closing brace. Rewrite is identical to original plus additions above.

#### Step 3 — Route ✅
**File:** `src/app/routes.ts` (done simultaneously with Item 1)

```ts
{ path: "agency/incidents", ...p(() => import("@/frontend/pages/agency/AgencyIncidentsPage")) },
```

#### Step 4 — Mock data ✅
**File rewritten:** `src/backend/api/mock/agencyMocks.ts`

Added `AgencyIncident` to type imports. Appended at end of file:

```ts
// ─── Incidents (W09) ───
export const MOCK_AGENCY_INCIDENTS: AgencyIncident[] = [
  { id: "INC-2026-0012", title: "Patient fall during morning routine",
    severity: "high", status: "open", reportedBy: "Karim Uddin",
    patientName: "Mr. Rahim Ahmed", ... },
  { id: "INC-2026-0011", title: "Medication administered late",
    severity: "medium", status: "resolved", ... resolvedAt + resolutionNote },
  { id: "INC-2026-0010", title: "Caregiver no-show",
    severity: "critical", status: "escalated", ... },
  { id: "INC-2026-0009", title: "Minor allergic reaction",
    severity: "low", status: "in-review", ... },
  { id: "INC-2026-0008", title: "Vital signs outside normal range",
    severity: "high", status: "resolved", ... resolvedAt + resolutionNote },
];
```

5 incidents covering all 4 severity levels and all 4 status values — filters can be fully tested.

#### Step 5 — Sidebar link ✅
**File rewritten:** `src/frontend/components/shell/AuthenticatedLayout.tsx`

Added to agency `operations` section, between `incidentReport` and `branches`:
```ts
{ i18nKey: "incidentsList", path: "/agency/incidents", icon: Flag },
```

#### Step 6 — i18n key ✅
**File rewritten:** `src/locales/en/common.json`

Added to `sidebar` object:
```json
"incidentsList": "Incidents"
```

Also added a new top-level `pageTitles` section for Item 6:
```json
"pageTitles": {
  "home": "Home", "features": "Features", "pricing": "Pricing",
  "signIn": "Sign In", "register": "Register", "chooseRole": "Choose Your Role",
  "caregiverDashboard": "Dashboard", "guardianDashboard": "Dashboard",
  "agencyDashboard": "Dashboard", "adminDashboard": "Dashboard",
  "patientDashboard": "Dashboard", "moderatorDashboard": "Dashboard",
  "shopDashboard": "Dashboard", "careRequirements": "Care Requirements",
  "newCareRequirement": "New Care Requirement",
  "requirementsInbox": "Requirements Inbox", "jobManagement": "Job Management",
  "jobMarketplace": "Job Marketplace", "careLog": "Care Log",
  "payments": "Payments", "billing": "Billing", "wallet": "Wallet",
  "incidentManagement": "Incident Management",
  "settings": "Settings", "notifications": "Notifications", "messages": "Messages"
}
```

The vite-i18n-sync plugin will propagate both `incidentsList` and all `pageTitles` keys to BN
and all 40+ other locale files automatically on next `pnpm dev`.

#### Step 7 — Page file: ✅ DONE [L309-360]
**File created:** `src/frontend/pages/agency/AgencyIncidentsPage.tsx` (239 lines)

Structure to build (modelled on `AgencyRequirementsInboxPage.tsx` pattern):
```
AgencyIncidentsPage
├── useDocumentTitle(t("pageTitles.incidentManagement", "Incident Management"))
├── Page header — "Incident Management" + "Report New Incident" → /agency/incident-report
├── Stat strip — Open | In Review | Escalated | Resolved (counts from data)
├── Filter tabs — All | Open | In Review | Resolved | Escalated
├── Severity filter pills — All | Critical | High | Medium | Low
├── useAsyncData(() => agencyService.getIncidents())
├── Incident card list (filtered by both status + severity)
│   ├── Severity badge: critical=red, high=amber, medium=blue, low=green
│   ├── Status badge: open=amber, in-review=blue, resolved=green, escalated=red
│   ├── Title + description (2-line clamp)
│   ├── "Reported by {name} · Patient: {name} · {time ago}"
│   └── Actions: "Mark Resolved" (open/in-review) | "Escalate" (open) | "View Details"
├── Empty state — icon + "No incidents match your filters"
└── PageSkeleton while loading
```

Color config:
```ts
const severityConfig = {
  critical: { label: "Critical", color: cn.red,   bg: "rgba(239,68,68,0.1)" },
  high:     { label: "High",     color: cn.amber,  bg: cn.amberBg },
  medium:   { label: "Medium",   color: cn.blue,   bg: cn.blueBg },
  low:      { label: "Low",      color: cn.green,  bg: cn.greenBg },
};
const statusConfig = {
  "open":       { label: "Open",       color: cn.amber, bg: cn.amberBg },
  "in-review":  { label: "In Review",  color: cn.blue,  bg: cn.blueBg },
  "resolved":   { label: "Resolved",   color: cn.green, bg: cn.greenBg },
  "escalated":  { label: "Escalated",  color: cn.red,   bg: "rgba(239,68,68,0.1)" },
};
```

Imports:
```ts
import { useState } from "react";
import { Link } from "react-router";
import { Flag, AlertTriangle, CheckCircle2, ArrowUpCircle, Plus, Clock } from "lucide-react";
import { useAsyncData, useDocumentTitle } from "@/frontend/hooks";
import { agencyService } from "@/backend/services";
import { cn } from "@/frontend/theme/tokens";
import { PageSkeleton } from "@/frontend/components/shared/PageSkeleton";
import type { AgencyIncident, IncidentSeverity, IncidentStatus } from "@/backend/models";
import { useTranslation } from "react-i18next";
```

### Verification checklist
- [ ] `/agency/incidents` loads without 404
- [ ] All 5 mock incidents render
- [ ] Status tab filter works (Open / In Review / Resolved / Escalated / All)
- [ ] Severity pill filter works (Critical / High / Medium / Low / All)
- [ ] Combined filters work (e.g. Critical + Open = correct subset)
- [ ] "Report New Incident" → `/agency/incident-report`
- [ ] Sidebar shows "Incidents" under Operations
- [ ] Empty state renders when filters return nothing
- [ ] Works at 375px mobile width
- [ ] Dark mode correct (all colors via CSS vars)

---

## Item 5 — Supabase Not Connected

### Finding
`src/backend/services/supabase.ts` auto-detects from env vars. If `.env` is missing, `USE_SUPABASE`
resolves to `false` → services use mock data. No code changes required.

### Fix — Your action required 🔄 (partially completed)

#### Status update (March 19, 2026)

✅ Local `.env` is now configured for **two Supabase projects**:
- **CareNet 2 (main app)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Medicine data**: `VITE_MEDICINE_API_URL`, `VITE_MEDICINE_API_KEY`

🔄 Remaining to fully complete Item 5:
- Run the SQL/migrations below on the **CareNet 2** Supabase project.
- Set the same env vars in your deployment provider (e.g. Vercel) and redeploy.

**Step 1** — Supabase dashboard → Settings → API → copy Project URL + anon key.

**Step 2** — Run these 10 SQL files in the Supabase SQL Editor, **in this exact order**:

| # | File | Creates |
|---|---|---|
| 1 | `supabase/migrations/20260318_full_domain_schema.sql` | All domain tables |
| 2 | `seed/00_seed_auth_users.sql` | Demo auth users |
| 3 | `seed/01_seed_data.sql` | Seed/demo data |
| 4 | `seed/02_views_and_rpcs.sql` | 14 views, 4 RPCs |
| 5 | `seed/03_moderation_tables.sql` | 6 moderation tables + triggers |
| 6 | `seed/04_rls_policies.sql` | 60+ RLS policies |
| 7 | `supabase/migrations/20260317_notifications_and_preferences.sql` | Notification tables |
| 8 | `supabase/migrations/20260317b_queued_notifications.sql` | Notification queue |
| 9 | `supabase/migrations/20260317c_pgcron_process_queue.sql` | pg_cron queue processor |
| 10 | `supabase/migrations/20260317d_cleanup_queued_notifications.sql` | Cleanup job |

**Step 3** — Ensure `.env` in the project root contains:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MEDICINE_API_URL=https://your-medicine-api-project.supabase.co
VITE_MEDICINE_API_KEY=your-medicine-api-anon-key
```
Medicine API vars can be empty — app falls back to mock medicine data gracefully.

**Step 4** — `pnpm dev`. `USE_SUPABASE` auto-resolves to `true`.

**Step 5** — Verify: browser console shows no "Supabase not configured" message. Log in with
a seed demo user. Check Supabase Table Editor — `profiles` table has a row.

**Step 6** — Vercel: Settings → Environment Variables → add same 4 vars → redeploy.

**Note:** The `deployment.md` instruction to "flip `USE_SUPABASE` to `true`" is outdated —
`supabase.ts` already auto-detects from env. Setting env vars is all that is needed.

---

## Item 6 — `useDocumentTitle` Hook Missing

### Finding
No `useDocumentTitle` hook in `src/frontend/hooks/`. `document.title` stays "CareNet 2" on
every page navigation. WCAG 2.4.2 violation (Page Titled, Level A).

### Fix Applied (Hook done — page wiring remaining) ✅

#### Step 1 — Hook created ✅
**New file:** `src/frontend/hooks/useDocumentTitle.ts`

```ts
import { useEffect } from "react";

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} — CareNet`;
    return () => { document.title = previous; };
  }, [title]);
}
```

Appends " — CareNet" for consistency. Restores previous title on unmount to prevent stale
titles on back-navigation.

#### Step 2 — Exported from hooks index ✅
**File:** `src/frontend/hooks/index.ts`

Added at end:
```ts
export { useDocumentTitle } from "./useDocumentTitle";
```

#### Step 3 — i18n title keys added ✅
**File:** `src/locales/en/common.json`

Added `"pageTitles"` section (done simultaneously with Item 4 Step 6). Keys cover Wave 1 and
Wave 2 pages. vite-i18n-sync propagates to all other locales automatically.

#### Step 4 — Page wiring: ✅ DONE (Waves 1–3; Session 5 for Wave 3 bulk)

**Wave 1 — ✅ COMPLETE** (verified March 19, 2026). All pages in the Wave 1 table below call
`useDocumentTitle` with the listed `pageTitles.*` keys (grep across `src/frontend/pages`).

Pattern for each remaining page (1 import line + 1 hook call):
```tsx
import { useDocumentTitle } from "@/frontend/hooks";

export default function SomePage() {
  const { t } = useTranslation("common");  // already present in most pages
  useDocumentTitle(t("pageTitles.someKey", "Fallback Title"));
  // ... rest of component unchanged
}
```

**Wave 1 — High-traffic (do first):**

| Page file | pageTitles key | Fallback |
|---|---|---|
| `caregiver/CaregiverDashboardPage.tsx` | `pageTitles.caregiverDashboard` | "Dashboard" |
| `guardian/GuardianDashboardPage.tsx` | `pageTitles.guardianDashboard` | "Dashboard" |
| `agency/AgencyDashboardPage.tsx` | `pageTitles.agencyDashboard` | "Dashboard" |
| `admin/AdminDashboardPage.tsx` | `pageTitles.adminDashboard` | "Dashboard" |
| `patient/PatientDashboardPage.tsx` | `pageTitles.patientDashboard` | "Dashboard" |
| `moderator/ModeratorDashboardPage.tsx` | `pageTitles.moderatorDashboard` | "Dashboard" |
| `shop/ShopDashboardPage.tsx` | `pageTitles.shopDashboard` | "Dashboard" |
| `auth/LoginPage.tsx` | `pageTitles.signIn` | "Sign In" |
| `auth/RegisterPage.tsx` | `pageTitles.register` | "Register" |
| `auth/RoleSelectionPage.tsx` | `pageTitles.chooseRole` | "Choose Your Role" |
| `public/HomePage.tsx` | `pageTitles.home` | "Home" |
| `public/FeaturesPage.tsx` | `pageTitles.features` | "Features" ← done in Item 2 |
| `public/PricingPage.tsx` | `pageTitles.pricing` | "Pricing" ← done in Item 3 |
| `agency/AgencyIncidentsPage.tsx` | `pageTitles.incidentManagement` | "Incident Management" ← done in Item 4 |

**Wave 2 — Core workflow pages:** ✅ DONE (Session 4, March 19, 2026)

| Page file | Fallback | Status |
|---|---|---|
| `guardian/CareRequirementsListPage.tsx` | "Care Requirements" | ✅ Wired |
| `guardian/CareRequirementWizardPage.tsx` | "New Care Requirement" | ✅ Wired |
| `guardian/CareRequirementDetailPage.tsx` | "Care Requirement" | ✅ Wired |
| `agency/AgencyRequirementsInboxPage.tsx` | "Requirements Inbox" | ✅ Wired |
| `agency/AgencyJobManagementPage.tsx` | "Job Management" | ✅ Wired |
| `caregiver/CaregiverJobsPage.tsx` | "Job Marketplace" | ✅ Wired |
| `caregiver/CaregiverCareLogPage.tsx` | "Care Log" | ✅ Wired |
| `guardian/GuardianPaymentsPage.tsx` | "Payments" | ✅ Wired |
| `billing/BillingOverviewPage.tsx` | "Billing" | ✅ Wired |
| `wallet/WalletPage.tsx` | "Wallet" | ✅ Wired |
| `shared/SettingsPage.tsx` | "Settings" | ✅ Wired |
| `shared/NotificationsPage.tsx` | "Notifications" | ✅ Wired |
| `shared/MessagesPage.tsx` | "Messages" | ✅ Wired |

**Wave 3 — All remaining pages:** ✅ DONE (Session 5, March 19, 2026)

154 `*Page.tsx` files wired in one pass via `scripts/wire-document-title-wave3.mjs` (all routes under
`src/frontend/pages` that lacked `useDocumentTitle`). `pageTitles` in `src/locales/en/common.json`
expanded and alphabetized. Manual follow-up: acronym keys `cmsManager`, `mfaSetup`, `mfaVerify` (was
auto `cMSManager` / `mFA*` — corrected in pages + JSON).

---

## Execution Order Summary

```
Item 1 — ProtectedRoute wiring          ✅ DONE
    ↓
Item 5 — Supabase connection             🔄 Your action (ops task — not code)
    ↓
Item 6 — useDocumentTitle
  └─ Hook created + exported             ✅ DONE
  └─ pageTitles i18n keys added          ✅ DONE
  └─ Wave 1 page wiring                  ✅ DONE
  └─ Wave 2 page wiring                  ✅ DONE
  └─ Wave 3 page wiring                  ✅ DONE
    ↓
Item 4 — /agency/incidents               ✅ DONE (page + service + mocks + route)
    ↓
Item 2 — FeaturesPage full rewrite       ✅ DONE
    ↓
Item 3 — PricingPage full rewrite        ✅ DONE
```

---

## Execution Log

### Session 1 — March 2026

#### ✅ Item 1 — `src/app/routes.ts` rewritten

- Added `import { ProtectedRoute } from "@/frontend/components/guards/ProtectedRoute"`
- Wrapped `AuthenticatedLayout` branch inside `ProtectedRoute` parent
- Added `agency/incidents` route to agency section simultaneously
- Updated block comments for clarity
- `ShopFrontLayout` branch left unprotected (public browsing)

No page components changed. No other files changed.

---

#### ✅ Item 6 (Steps 1–2) — Hook created and exported

**`src/frontend/hooks/useDocumentTitle.ts`** — new file created.
Sets `document.title = "${title} — CareNet"` on mount. Restores previous title on unmount.
Satisfies WCAG 2.4.2.

**`src/frontend/hooks/index.ts`** — one line added:
```ts
export { useDocumentTitle } from "./useDocumentTitle";
```

---

#### ✅ Item 4 (Steps 1–2) — Model and service

**`src/backend/models/agency.model.ts`** — `AgencyIncident` interface + `IncidentSeverity` and
`IncidentStatus` types appended at end of file.

**`src/backend/services/agency.service.ts`** — fully rewritten (identical to original plus):
- `AgencyIncident` added to type imports
- `MOCK_AGENCY_INCIDENTS` added to mock imports
- `getIncidents()`, `resolveIncident()`, `escalateIncident()` added inside the service object
- `mapAgency` helper at bottom preserved unchanged

Note: full rewrite was necessary because an earlier append attempt accidentally placed new
methods outside the closing `};` of the agencyService object.

---

### Session 2 — March 2026

#### ✅ Item 4 (Steps 4–6) — Mock data, sidebar, i18n

**`src/backend/api/mock/agencyMocks.ts`** — fully rewritten (identical to original plus):
- `AgencyIncident` added to type imports from `@/backend/models`
- `MOCK_AGENCY_INCIDENTS` array appended at end of file with 5 incidents:
  - `INC-2026-0012` — high / open (patient fall)
  - `INC-2026-0011` — medium / resolved (late medication, has resolutionNote)
  - `INC-2026-0010` — critical / escalated (caregiver no-show)
  - `INC-2026-0009` — low / in-review (allergic reaction)
  - `INC-2026-0008` — high / resolved (vital signs out of range, has resolutionNote)
- All 4 severity levels and all 4 status values represented — filters fully testable

**`src/frontend/components/shell/AuthenticatedLayout.tsx`** — fully rewritten (identical to
original plus one line in the agency `operations` nav section):
```ts
{ i18nKey: "incidentsList", path: "/agency/incidents", icon: Flag },
```
Inserted between `incidentReport` and `branches`.

**`src/locales/en/common.json`** — fully rewritten (identical to original plus):
- `"incidentsList": "Incidents"` added to `sidebar` object (between `incidentReport` and `branches`)
- New top-level `"pageTitles"` section added with 24 keys covering Wave 1 + Wave 2 pages

The vite-i18n-sync Vite plugin propagates all new keys to BN and 40+ other locale files
automatically on next `pnpm dev` — no manual translation file edits required.

---

### Session 3 — March 19, 2026 (verification + plan sync)

**Agent:** follow-up after Sonnet 4.6 claimed Items 2–3 complete and Wave 2 had 12 pages left.

#### Verification performed

1. **Item 2 (FeaturesPage)** — Read `src/frontend/pages/public/FeaturesPage.tsx`. Confirmed: not a stub;
   full layout (hero, Radix Tabs by role, platform strip, CTA footer), `useDocumentTitle`, `roleConfig`,
   tokens. **Verdict: DONE.**

2. **Item 3 (PricingPage)** — Read `src/frontend/pages/public/PricingPage.tsx`. Confirmed: tiers,
   billing toggle, FAQ accordion, CTAs, `useDocumentTitle`, token accents. **Verdict: DONE.**

3. **Item 4 (Agency incidents)** — `AgencyIncidentsPage.tsx` present with `useDocumentTitle` and
   `agencyService.getIncidents()` usage (grep). Plan text previously contradicted itself (“page
   remaining” vs Step 7 DONE); **aligned to DONE** in this session.

4. **Item 6 Wave 1** — `rg useDocumentTitle` under `src/frontend/pages`: 15 files hit the hook
   (includes `CareRequirementsListPage` which is Wave 2 in the table but was wired early). All
   Wave 1 targets from the plan table (dashboards, auth trio, Home, Features, Pricing,
   AgencyIncidents) **have** `useDocumentTitle`. **Verdict: Wave 1 complete.**

5. **Item 6 Wave 2** — Per-file grep for `useDocumentTitle` on the 12 pages Sonnet listed: **no
   matches** on any of:
   `CareRequirementWizardPage`, `CareRequirementDetailPage`, `AgencyRequirementsInboxPage`,
   `AgencyJobManagementPage`, `CaregiverJobsPage`, `CaregiverCareLogPage`, `GuardianPaymentsPage`,
   `BillingOverviewPage`, `WalletPage`, `SettingsPage`, `NotificationsPage`, `MessagesPage`.
   `CareRequirementsListPage` **does** have the hook. **Verdict: 12 pages remaining — Sonnet count
   correct.**

#### Issues / follow-ups noted

- **i18n:** Features and Pricing use `useTranslation("common")` mainly for document title; most
  user-visible strings are hardcoded English. Repo rule prefers committed `en`/`bn` keys — optional
  backlog, not a blocker for “stub removal.”
- **FeaturesPage:** Hero uses inline hex `#FFF5F7` in a couple of places; plan asked to avoid
  hardcoded hex where possible (minor consistency nit).

#### Plan file edits (this session)

- Executive summary table: Items 2, 3, 4 → DONE; Item 6 row clarified (Wave 1 done, Wave 2 partial).
- Item 2 / Item 3 sections: status flipped to DONE + verification notes.
- Item 4 header: removed “page file remaining” wording.
- Item 6 Step 4: Wave 1 marked complete; Wave 2 table expanded with per-row wiring status.
- Execution Order Summary: reconciled with codebase (Items 2–4 done; Wave 1 done; 12 Wave 2 left).

#### Can we continue per plan?

**Yes.** Next concrete coding work from D024: **wire `useDocumentTitle` on the 12 Wave 2 pages**
(imports already documented in plan), then **Wave 3** module-by-module. Item 5 remains **operator /
env** (no code). No blockers found for that sequence.

---

### Session 4 — March 19, 2026 (Item 6 Wave 2 — useDocumentTitle on 12 pages)

**Context:** User requested to proceed with “next items” assuming items 1–5 are done (Item 5 is ops/env).
Next in plan: Item 6 Wave 2 — wire `useDocumentTitle` on the 12 core workflow pages.

#### Work completed

1. **Locale** — `src/locales/en/common.json`: Added `"careRequirement": "Care Requirement"` to
   `pageTitles` (for CareRequirementDetailPage; other keys already existed).

2. **12 page files updated** (import `useDocumentTitle` from `@/frontend/hooks`, add
   `useTranslation("common")` where missing, call `useDocumentTitle(t("pageTitles.xxx", "Fallback"))` at top of component):

   - `guardian/CareRequirementWizardPage.tsx` — uses `useTranslation("guardian")` for content; added
     `useTranslation("common")` as `tCommon` and `useDocumentTitle(tCommon("pageTitles.newCareRequirement", "New Care Requirement"))`.
   - `guardian/CareRequirementDetailPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.careRequirement", "Care Requirement"))`.
   - `agency/AgencyRequirementsInboxPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.requirementsInbox", "Requirements Inbox"))`.
   - `agency/AgencyJobManagementPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.jobManagement", "Job Management"))`.
   - `caregiver/CaregiverJobsPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.jobMarketplace", "Job Marketplace"))`.
   - `caregiver/CaregiverCareLogPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.careLog", "Care Log"))`.
   - `guardian/GuardianPaymentsPage.tsx` — already had `useTranslation()`; added
     `useDocumentTitle(t("common:pageTitles.payments", "Payments"))`.
   - `billing/BillingOverviewPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.billing", "Billing"))`.
   - `wallet/WalletPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.wallet", "Wallet"))`.
   - `shared/SettingsPage.tsx` — added `useDocumentTitle`, `useDocumentTitle(t("pageTitles.settings", "Settings"))`.
   - `shared/NotificationsPage.tsx` — already had `useTranslation()`; switched to `useTranslation("common")` and added `useDocumentTitle(t("pageTitles.notifications", "Notifications"))`.
   - `shared/MessagesPage.tsx` — added `useTranslation("common")`, `useDocumentTitle(t("pageTitles.messages", "Messages"))`.

3. **Plan doc** — Executive summary Item 6 row updated to “Wave 1+2 done; Wave 3 (~115 pages) left”.
   Execution order summary: Wave 2 marked ✅ DONE. Wave 2 table: status column set to ✅ Wired for all 13 rows (CareRequirementsListPage was already wired earlier).

#### Verification

- No new TypeScript/lint errors introduced by these edits. Existing linter warnings in
  CaregiverCareLogPage, NotificationsPage, GuardianPaymentsPage (inline styles, button labels) are
  pre-existing.

#### Next (superseded by Session 5)

- Wave 3 completed in Session 5 — see below.

---

### Session 5 — March 19, 2026 (Item 6 Wave 3 — bulk `useDocumentTitle`)

#### Approach

- Added **`scripts/wire-document-title-wave3.mjs`**: walks `src/frontend/pages/**/*Page.tsx`, skips
  files that already call `useDocumentTitle`, derives `pageTitles.<camelCase>` from the component
  name (e.g. `CaregiverProfilePage` → `caregiverProfile`), merges `useDocumentTitle` into
  `@/frontend/hooks` imports (including migrating `useAsyncData` from `hooks/useAsyncData` where
  needed), inserts `useTranslation("common")` as `tDocTitle` when `useTranslation("common")` with `t`
  is not already present, and appends missing keys to `common.json` → `pageTitles`.

#### Results

- **154 page files** updated in one `node scripts/wire-document-title-wave3.mjs` run.
- **`src/locales/en/common.json`** — `pageTitles` section now contains all keys (sorted A–Z).
- **Manual fixes after automation:**
  - `CMSManagerPage.tsx` → key `cmsManager`, title `"CMS Manager"` (not `cMSManager`).
  - `MFASetupPage.tsx` / `MFAVerifyPage.tsx` → keys `mfaSetup` / `mfaVerify`, titles `"MFA Setup"` /
    `"MFA Verify"`.

#### Verification / issues

- Production build, tests, and i18n sync were re-run successfully in Session 6 (below).
- No duplicate-hook or “skip” warnings from the script beyond the above acronym keys.

#### What you should do (operator)

1. **i18n sync** — Already completed in Session 6; re-run `npm run i18n:sync` if you add more keys.
2. **Item 5 (Supabase)** — Still your action: SQL seeds/migrations + Vercel env vars (see Item 5).
3. **Optional** — Re-run the Wave 3 script is a no-op for already-wired pages; safe to keep script
   for new `*Page.tsx` files added later (watch acronym component names).

---

### Session 6 — March 19, 2026 (Ops verification + test fix + plan sync)

#### Work completed

1. **Confirmed `.env` configured** for both CareNet 2 and Medicine Supabase projects.
2. **i18n sync** — `npm run i18n:sync` completed with **0 files created** and **0 keys added**.
3. **Tests** — `npm run test` passes (25/25).
   - Fixed `useOptimisticUndo` test failures caused by `vi.mock` hoisting and missing `window.matchMedia` in jsdom.
   - Ensured test cleanup runs between hook instances to avoid multiple global keydown listeners affecting LIFO assertions.
4. **Production build** — `npm run build` succeeds.

#### Remaining (Item 5)

- Run the listed SQL files against the **CareNet 2** Supabase project.
- Configure the same env vars in Vercel and redeploy.

---

### Session 7 — March 19, 2026 (user ops status + Supabase self‑verify + i18n follow‑ups)

#### User‑reported status

1. **Vercel** — Not configured yet → still required for production `VITE_*` env vars + redeploy.
2. **GitHub** — Remote not updated → push when ready (no agent access to your account).
3. **Supabase SQL** — User reports migrations/seeds were run in the SQL Editor. **Agent cannot connect**
   to your Supabase project from this environment; verification is **operator‑side**.

#### Supabase verification (you run)

- New helper: **`scripts/verify-supabase-after-seed.sql`** — paste into Supabase → SQL → Run.
  - Confirms expected tables exist, lists `public` tables, optional row counts / RLS spot‑check.
- App‑side: with `.env` set, open the app → log in with a **seed demo user** (from `seed/00_seed_auth_users.sql`)
  → confirm data loads (not only mocks). Check browser devtools for Supabase errors.

#### i18n “half translated” note (root cause)

- Locale JSON can be **100% filled** for `bn` while the UI still looks “broken” because many components
  use **hardcoded English** in JSX instead of `t()`. `npm run translate` only updates JSON files;
  it does not wrap components. See assistant reply / future i18n extraction workflow.

## What Does NOT Need to Change

The following were verified as correctly implemented and require no remediation:

| Area | Status |
|---|---|
| Route architecture (nested layouts) | ✅ Correctly implemented |
| Auth context (dual-location bridge pattern) | ✅ Correctly implemented |
| i18n (auto-discovery, vite plugin, BN support) | ✅ Correctly implemented |
| Offline stack (Dexie, syncEngine, hooks) | ✅ Correctly implemented |
| Native abstractions (Capacitor layer) | ✅ Correctly implemented |
| Dark mode (CSS vars, inline override selectors) | ✅ Correctly implemented |
| All 141 core page files on disk | ✅ Confirmed present |
| Mobile shell components | ✅ Correctly implemented |
| Mock data layer | ✅ Fully populated |
| Push notification infrastructure | ✅ Edge Functions present |
| Wallet / Billing / Contracts pages | ✅ Present (beyond original 141 scope) |
| React Router shim (startTransition) | ✅ Correctly implemented |
| Theme tokens and CSS variable system | ✅ Correctly implemented |

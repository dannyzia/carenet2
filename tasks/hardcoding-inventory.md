# Hardcoding and mock-data inventory

This file supports ongoing cleanup. **P0** items are user-visible fake data or mock substitution for live users; **P1** is static assets/copy; **P2** is acceptable chrome (i18n fallbacks, layout).

## Automation

```bash
node scripts/hardcoding-audit.mjs
```

Emits JSON with hits in `src/backend/services` (mock barrel patterns) and `src/frontend/pages` (Unsplash URLs). Last run snapshot (approximate counts): `loadMockBarrel` ~90, `MOCK_` ~267, `mockData(` ~81, Unsplash in pages ~6 (many more across the repo outside `pages/`).

## P0 — mitigated in this pass

- **`useInAppMockDataset()`** in [`src/backend/services/_sb.ts`](../src/backend/services/_sb.ts): live Supabase + non-demo session must not receive in-memory mock rows on errors/empty tables (see [`liveEmptyDefaults.ts`](../src/backend/services/liveEmptyDefaults.ts)).
- **Admin service**: catch branches and audit-log empty paths gated; dashboard base merge uses empty dashboard for live when RPC missing.
- **Agency**: `getStorefrontData`, `getAgencySettings`, branches, staff attendance/hiring empty paths for live.
- **Caregiver**: `getTrainingModules` empty catalog; `getDashboardSummary` without mock filler for live.
- **Guardian**: `getDashboardSummary` without mock `totalSessions` filler for live.
- **Shop**: `getDashboardStats` without mock merge for live.
- **Moderator**: queue catch + dashboard stats counts (no mock fallback for live).

## P0 — remaining (burn-down)

- Services that are **`!USE_SUPABASE` only**: still use mock barrel (expected for offline dev).
- **[`search.service.ts`](../src/backend/services/search.service.ts)**, **[`message.service.ts`](../src/backend/services/message.service.ts)**, **[`contractService.ts`](../src/backend/services/contractService.ts)**, **[`billing.service.ts`](../src/backend/services/billing.service.ts)**, **[`backup.service.ts`](../src/backend/services/backup.service.ts)**: confirm each `USE_SUPABASE` branch never returns mock for live; add gates where needed.
- **Patient service** (if any mock-on-error patterns).

## P1 — follow-up

- Replace or host **hero/stock images** (Unsplash) from CMS or static assets with stable URLs.
- Move remaining **English-only page strings** into `src/locales/en` + `bn` (and other locales as needed).

## P2 — acceptable

- `t("key", "English default")` fallbacks.
- Design tokens and layout-only constants.

## Frontend routes

- **Admin**: [`RequireAdminRoute`](../src/frontend/components/guards/RequireRole.tsx) wraps nested `admin/*` routes in [`routes.ts`](../src/app/routes.ts) so only `admin` role reaches System Health and other admin pages (moderators stay on `/moderator/*`).

---
description: Review code changes in CareNet 2 for bugs, offline risks, auth regressions, localization gaps, and missing tests.
---

You are reviewing code changes for **CareNet 2**. Review with a bug-first mindset using the repo's real constraints. Do not edit any file — only report findings.

Check all of the following:

**Routing and auth**
- New routes registered in `src/app/routes.ts` with lazy-load pattern?
- Auth/role state accessed only via `useAuth()` and `user.activeRole`?
- No direct session manipulation outside `src/backend/store/auth/`?

**Data layer**
- `USE_SUPABASE` mock fallbacks preserved?
- `_sb.ts` helpers (`sbRead`, `sbWrite`, `sb`, `currentUserId`) used instead of raw query boilerplate?
- Realtime subscriptions (`supabase.channel(...)`) cleaned up on unmount?
- Write flows that must survive disconnects routed through the Dexie sync queue?
- Operations idempotent and retry-safe?

**UI**
- Shared components reused from `src/frontend/components/shared/`, `shell/`, `ui/`?
- Design tokens / CSS variables used — no raw color literals?
- Accessibility: icon labels, reduced-motion, dark mode, safe-area?

**Localization**
- Both `src/locales/en/` and `src/locales/bn/` updated for new strings?
- No hardcoded user-facing strings in JSX?

**Mobile**
- Native calls behind platform guards in `src/frontend/native/`?
- Safe-area and back-button behavior preserved?
- `npm run build && npx cap sync` noted if native assets changed?

**Testing**
- Vitest coverage for new hooks, utilities, and service logic?
- Playwright coverage for new user-visible flows?

Report findings ordered by severity: critical → high → medium → low.
Include file path and user-visible risk for each finding.
If no issues found, say so and list any test gaps.

**Code to review:**

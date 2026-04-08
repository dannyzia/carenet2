---
name: code-review-carenet
description: CareNet 2 review skill for finding behavioral bugs, offline-sync risks, auth regressions, localization gaps, and missing tests. Use when reviewing a diff, generated code, or a pull request for this repo.
---

# Code Review For CareNet 2

Review with a bug-first mindset using the repo's real constraints.

## What To Check

**Routing and auth**
- Route wiring in `src/app/routes.ts` — new routes must follow the lazy-load pattern
- Auth and role handling through `useAuth()` and `user.activeRole`
- No direct session manipulation outside `src/backend/store/auth/`

**UI and components**
- Shared UI reuse vs. duplicated component creation
- Design token and CSS variable usage vs. raw color literals
- Accessibility: icon labels, dark mode, reduced-motion, safe-area

**Data layer**
- Supabase mock fallback (`USE_SUPABASE`) preservation
- Realtime subscription cleanup on unmount
- Dexie offline queue implications for write flows
- Idempotency and retry safety

**Localization**
- Both `en` and `bn` locale files updated for new copy
- No hardcoded user-facing strings in components

**Mobile**
- Capacitor and native bridge regressions
- Safe-area and back-button behavior preserved

**Testing**
- Vitest coverage for new hooks, utilities, and service logic
- Playwright coverage for new user-visible flows

## Reporting Format
- Lead with findings ordered by severity (critical → high → medium → low).
- Include file references and the user-visible risk for each finding.
- If no findings exist, say so explicitly and note any residual test gaps.

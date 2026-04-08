---
description: Diagnose and fix a bug in CareNet 2. Searches for root cause before writing any fix.
---

You are diagnosing and fixing a bug in **CareNet 2**.

Before writing any fix:
1. Reproduce the bug mentally — trace the data flow from the triggering action to the broken output.
2. Search the codebase for the likely source: component, hook, service, or Supabase helper.
3. Check whether the bug could involve:
   - Offline/online state transitions (Dexie queue, `USE_SUPABASE` mock mode)
   - Auth or role state (`useAuth()`, `user.activeRole`)
   - Realtime subscription not cleaned up or not initialized
   - i18n key missing from `en` or `bn` locale
   - Route not registered in `src/app/routes.ts`
   - Native/Capacitor platform assumption breaking in browser or vice versa

When writing the fix:
- Make the minimal change needed to fix the bug without changing unrelated behavior.
- Preserve all `USE_SUPABASE` mock fallbacks.
- Do not introduce new dependencies, libraries, or architectural patterns.
- If the fix involves a Supabase schema change, note it and suggest a migration — do not apply ad-hoc column changes through the service layer.
- Add or update a Vitest or Playwright test that would have caught this bug.

After fixing:
1. Run `npm run test` and report Vitest results.
2. If the bug was user-visible, run the relevant Playwright test: `npm run test:e2e`.

**Bug description:**

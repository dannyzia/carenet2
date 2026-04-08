---
description: Refactor a CareNet 2 module without changing observable behavior. Checks existing patterns and adds or preserves test coverage.
---

You are refactoring a module in **CareNet 2** without changing its observable behavior.

Before refactoring:
1. Run the existing tests for this module to establish a baseline: `npm run test`.
2. Read the module and identify all callers with `search/usages`.
3. Note any offline behavior, realtime subscriptions, or mock fallbacks in the code — these must be preserved exactly.

Refactoring rules:
- Do not change observable behavior. If a test breaks, undo the refactor — don't change the test.
- Do not introduce new dependencies, global state libraries, or new architectural patterns.
- Keep `USE_SUPABASE` mock fallback logic intact.
- Keep all realtime subscription cleanup logic intact.
- Keep all `useAuth()` / `user.activeRole` access patterns — do not abstract auth reads away.
- If extracting a shared component, place it in `src/frontend/components/shared/` and verify all callers still work.
- If extracting a hook, place it in `src/frontend/hooks/` and match existing hook naming patterns.
- If extracting a service helper, place it in `src/backend/services/` and use `_sb.ts` helper patterns.
- Do not change i18n key names — any key rename requires updating both `en` and `bn` locale files.

After refactoring:
1. Run `npm run test` again and confirm all tests still pass.
2. If you added new abstractions, add Vitest tests for them.
3. Report what was changed, what was preserved, and test results.

**Module to refactor:**

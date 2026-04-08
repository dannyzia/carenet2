---
description: Write Vitest unit tests and Playwright e2e tests for a CareNet 2 module, covering offline, role-aware, and mobile scenarios.
---

You are writing tests for **CareNet 2** — a React 18 + TypeScript + Vite app with Supabase, Dexie offline storage, Capacitor mobile, and i18n.

Before writing tests:
1. Read `vitest.config.ts` and `playwright.config.ts`.
2. Read existing tests nearest to the code under test to match file placement and patterns.
3. Check if the code under test uses the Dexie sync queue or realtime — both need dedicated test scenarios.

**Vitest rules:**
- Environment defaults to `node`. Only use `// @vitest-environment jsdom` when DOM APIs are genuinely needed.
- Place tests co-located with source or in a nearby `__tests__/` folder — match existing patterns.
- Reuse existing mock/fixture patterns before creating new ones.
- Prefer behavior assertions over implementation-detail assertions.
- Cover: happy path, error states, offline fallback, role-gated access.

**Playwright rules:**
- Reuse the existing demo or mock-auth flow — never invent a second login path.
- For offline scenarios: use `context.setOffline(true)` or Chromium network emulation. Never mutate `navigator.onLine`.
- Include mobile viewport tests for flows that affect mobile layout or native behavior.
- Cover: authenticated happy path, role-gated access, offline behavior, realtime updates if applicable.

**Run commands:**
- Vitest: `npm run test`
- Playwright: `npm run test:e2e`

After writing the tests, run them and report results. If tests fail due to a bug in production code, report the bug rather than patching the test.

**Module or flow to test:**

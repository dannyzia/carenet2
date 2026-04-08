---
applyTo: "{e2e/**,src/**/__tests__/**,src/**/*.test.ts,src/**/*.test.tsx,src/**/*.spec.ts,src/**/*.spec.tsx}"
---

You are writing tests for CareNet 2.

**Vitest:**
- Default environment is `node`. Only add `// @vitest-environment jsdom` when DOM APIs are genuinely needed.
- Place tests co-located or in the nearest `__tests__/` folder — match existing patterns.
- Cover happy path, error states, offline fallback, and role-gated access.
- Prefer behavior assertions over Tailwind class or implementation-detail assertions.

**Playwright:**
- Reuse the existing mock-auth or demo-auth flow. Never invent a second login path.
- For offline: use `context.setOffline(true)` or Chromium network emulation. Never mutate `navigator.onLine`.
- Cover authenticated flows, role-gated access, offline behavior, and realtime updates where applicable.
- Include mobile viewport tests for flows that affect mobile or native layout.

**General:**
- Run commands: `npm run test` (Vitest), `npm run test:e2e` (Playwright).
- If tests fail due to a production code bug, report the bug — don't patch the test to hide it.
- Keep tests resilient to mock/demo mode differences.

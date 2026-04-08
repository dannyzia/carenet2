---
name: vitest-playwright
description: CareNet 2 testing skill for Vitest, Testing Library, Playwright, offline scenarios, mobile viewports, and mock-auth flows. Use when creating or updating automated tests in this repo.
---

# Test Workflow

Read these files first:
- `vitest.config.ts`
- `playwright.config.ts`
- `e2e/`
- `src/frontend/hooks/__tests__/` (if present)

Follow these rules:
- Keep Vitest tests near the repo's existing co-located or `__tests__` patterns.
- Remember that Vitest defaults to `node` environment; opt into `jsdom` only when a test genuinely needs DOM APIs.
- Reuse existing demo or mock-auth flows in Playwright instead of inventing a second auth path.
- Cover offline, mobile, role-aware, realtime, and localization behavior when those concerns are part of the change.
- Use `context.setOffline(true)` or Chromium network emulation for offline Playwright coverage.
- Prefer behavior assertions over Tailwind class or implementation-detail assertions.

When adding tests:
1. Add Vitest unit coverage for new hooks, utilities, and service logic.
2. Add Playwright end-to-end coverage for new user journeys.
3. Favor behavior assertions — what the user sees and can do.
4. Keep tests resilient to mock or demo mode differences.

Avoid:
- mutating `navigator.onLine` directly to fake offline mode (use Chromium network controls)
- asserting raw Tailwind class strings as the primary correctness signal
- skipping tests for new user-facing flows without a documented reason
- inventing a parallel Playwright login flow when the existing mock-auth pattern works

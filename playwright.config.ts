import { defineConfig, devices } from "@playwright/test";

/**
 * CareNet Playwright E2E Configuration
 * ─────────────────────────────────────
 * Run with:
 *   pnpm test:e2e              — headless
 *   pnpm test:e2e --headed     — see the browser
 *   pnpm test:e2e --debug      — step through in Playwright Inspector
 *
 * Prerequisites:
 *   npx playwright install chromium
 *
 * Optional: `PW_TEST_PORT=5174` (or `set PW_TEST_PORT=5174` on Windows) when port 5173
 * is already taken by a normal `npm run dev` — Playwright will start E2E Vite on that port.
 */
const testPort = process.env.PW_TEST_PORT ?? "5173";
const baseURL = `http://localhost:${testPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    // Base URL for the Vite dev server (see PW_TEST_PORT above)
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],

  // Auto-start the Vite dev server before tests.
  // VITE_PLAYWRIGHT_E2E forces mock Supabase + E2E-only UI (see vite.config + supabase.ts).
  // Windows: `webServer.env` is not always inherited by `npx`; prefix the shell command.
  webServer: {
    command:
      process.platform === "win32"
        ? `cmd /c "set VITE_PLAYWRIGHT_E2E=true&& npx vite --host --port ${testPort}"`
        : `env VITE_PLAYWRIGHT_E2E=true npx vite --host --port ${testPort}`,
    url: baseURL,
    // Reusing a normal `npm run dev` server skips `VITE_PLAYWRIGHT_E2E` → dashboards hang on real Supabase.
    // Set `PW_REUSE_VITE=1` if you intentionally want to attach to an already-running dev server.
    reuseExistingServer: process.env.PW_REUSE_VITE === "1",
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_PLAYWRIGHT_E2E: "true",
    },
  },
});

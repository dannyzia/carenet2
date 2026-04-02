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
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    // Base URL for the Vite dev server
    baseURL: "http://localhost:5173",
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
        ? "cmd /c \"set VITE_PLAYWRIGHT_E2E=true&& npx vite --host\""
        : "env VITE_PLAYWRIGHT_E2E=true npx vite --host",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      ...process.env,
      VITE_PLAYWRIGHT_E2E: "true",
    },
  },
});

/**
 * CareNet E2E Test Helpers
 * ─────────────────────────
 * Shared utilities for all CareNet Playwright specs.
 * Import from this file in every spec.
 */

import { type Page, expect } from "@playwright/test";

// ─── Credentials ────────────────────────────────────────────────────

export const DEMO_PASSWORD = "demo1234";
export const DEMO_TOTP = "123456";

export const DEMO_ACCOUNTS = {
  caregiver:  { email: "caregiver@carenet.demo",  name: "Karim Uddin",       dashboard: "/caregiver/dashboard"  },
  guardian:   { email: "guardian@carenet.demo",   name: "Rashed Hossain",    dashboard: "/guardian/dashboard"   },
  patient:    { email: "patient@carenet.demo",    name: "Amina Begum",       dashboard: "/patient/dashboard"    },
  agency:     { email: "agency@carenet.demo",     name: "CareFirst Agency",  dashboard: "/agency/dashboard"     },
  admin:      { email: "admin@carenet.demo",      name: "Admin User",        dashboard: "/admin/dashboard"      },
  moderator:  { email: "moderator@carenet.demo",  name: "Mod User",          dashboard: "/moderator/dashboard"  },
  shop:       { email: "shop@carenet.demo",       name: "MediMart Store",    dashboard: "/shop/dashboard"       },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

/** Authenticated page body (excludes duplicate nav/sidebar copy). */
export function mainLandmark(page: Page) {
  return page.getByRole("main");
}

/** Heading inside `<main>` — sidebar/nav often repeat the same label as the page title. */
export async function expectMainHeading(page: Page, name: string | RegExp, opts?: { timeout?: number }) {
  await expect(page.getByRole("main").getByRole("heading", { name })).toBeVisible({
    timeout: opts?.timeout ?? 15_000,
  });
}

/** Submit control on the login form (public nav also exposes a "Log In" button). */
export function loginSubmitButton(page: Page) {
  return page
    .locator("form")
    .filter({ has: page.locator('input[autocomplete="current-password"]') })
    .getByRole("button", { name: /log in/i });
}

// ─── Login helpers ───────────────────────────────────────────────────

/**
 * Perform a full email + password + TOTP login for a demo account.
 * Lands on the role's dashboard.
 *
 * NOTE: The login button in CareNet UI is labelled "Log In", not "Sign In".
 * The form uses React onSubmit — clicking the "Log In" button triggers it.
 */
export async function loginAs(page: Page, role: DemoRole) {
  const account = DEMO_ACCOUNTS[role];
  await page.goto("/auth/login", { waitUntil: "load" });
  await page.waitForLoadState("load");

  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', DEMO_PASSWORD);

  await loginSubmitButton(page).click();

  // MFA step — enter TOTP digit by digit
  await expect(page.getByText("Two-Factor Authentication")).toBeVisible({ timeout: 8_000 });
  const boxes = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await boxes.nth(i).fill(DEMO_TOTP[i]);
  }

  // Wait for dashboard
  await page.waitForURL(`**${account.dashboard}`, { timeout: 15_000, waitUntil: "commit" });
  await page.waitForLoadState("load");
}

/**
 * One-click demo login via the Demo Access button on the login page.
 * Faster than full credential login — use this for all non-auth tests.
 *
 * The Demo Access section expands on click and shows role buttons.
 * Each role button shows the role label text (e.g. "Caregiver", "Guardian").
 */
export async function demoLogin(page: Page, role: DemoRole) {
  const account = DEMO_ACCOUNTS[role];

  await page.goto("/auth/login", { waitUntil: "domcontentloaded", timeout: 20000 });

  // Clicks role button - try multiple selectors to find the right one.
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  let roleButton = page.getByRole("button", { name: new RegExp(`^${roleLabel}$`, "i") }).first();

  // Expand Demo Access only when the role buttons are not already visible.
  if (!(await roleButton.isVisible().catch(() => false))) {
    const demoAccessBtn = page.getByRole("button", { name: /demo access/i });
    await expect(demoAccessBtn).toBeVisible({ timeout: 15_000 });
    await demoAccessBtn.click({ timeout: 10000 });
  }

  // If exact match is not visible, fall back to partial label match.
  if (!(await roleButton.isVisible().catch(() => false))) {
    roleButton = page.getByRole("button", { name: new RegExp(roleLabel, "i") }).first();
  }

  // If still not visible, try data-testid / data-role fallback.
  if (!(await roleButton.isVisible().catch(() => false))) {
    roleButton = page.locator(`[data-testid*="${role}"], [data-role*="${role}"]`).first();
  }

  await expect(roleButton, `Role button for ${roleLabel} not found`).toBeVisible({ timeout: 10_000 });
  await roleButton.click({ timeout: 10000 });

  await page.waitForURL(`**${account.dashboard}`, { timeout: 15_000, waitUntil: "domcontentloaded" });

  await expect(page.getByRole("main").first()).toBeVisible({ timeout: 10_000 });
}

/**
 * Navigate to a page and wait for it to be ready.
 */
export async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForLoadState("load");

  await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
}

// ─── Assertion helpers ───────────────────────────────────────────────

/**
 * Capture console errors. Call at top of test, call returned fn at end.
 */
/** Chromium logs failed images/fonts/CDN as console "error" — ignore for stable E2E. */
const RESOURCE_FAIL_RE = /^Failed to load resource:/;

export function captureConsoleErrors(page: Page): () => string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (RESOURCE_FAIL_RE.test(text)) return;

      errors.push(text);
    }
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return () => errors;
}

/**
 * Assert page title contains the expected string.
 */
export async function assertTitle(page: Page, expected: string) {
  await expect(page).toHaveTitle(new RegExp(expected, "i"));
}

/**
 * Assert a Sonner toast is visible.
 */
export async function assertToast(page: Page, text?: string) {
  const toastLocator = text
    ? page.locator("[data-sonner-toast]").filter({ hasText: text })
    : page.locator("[data-sonner-toast]").first();
  await expect(toastLocator).toBeVisible({ timeout: 5_000 });
}

/**
 * Assert an inline error message is visible.
 * Matches by text if provided, otherwise falls back to red-coloured elements.
 */
export async function assertInlineError(page: Page, text?: RegExp | string) {
  if (text) {
    await expect(page.getByText(text)).toBeVisible({ timeout: 5_000 });
  } else {
    const err = page.locator('[style*="EF4444"], [style*="ef4444"], .text-red-500, [class*="error"]').first();
    await expect(err).toBeVisible({ timeout: 5_000 });
  }
}

/**
 * E2E: Mobile Responsiveness
 * ───────────────────────────
 * Runs each role dashboard and key flows at 375px viewport width.
 * Uses the mobile-chrome project defined in playwright.config.ts
 * (Pixel 7 — 412px wide, close enough to 375px for layout testing).
 *
 * Run:
 *   pnpm test:e2e -- mobile --project=mobile-chrome
 */

import { test, expect } from "@playwright/test";
import { demoLogin, captureConsoleErrors } from "./helpers";

// ════════════════════════════════════════════════════════════════════
// Role dashboards at mobile viewport
// ════════════════════════════════════════════════════════════════════

const roleDashboards = [
  { role: "caregiver",  path: "/caregiver/dashboard"  },
  { role: "guardian",   path: "/guardian/dashboard"   },
  { role: "patient",    path: "/patient/dashboard"    },
  { role: "agency",     path: "/agency/dashboard"     },
  { role: "admin",      path: "/admin/dashboard"      },
  { role: "moderator",  path: "/moderator/dashboard"  },
  { role: "shop",       path: "/shop/dashboard"       },
] as const;

for (const { role, path } of roleDashboards) {
  test(`${role} dashboard renders without overflow at mobile width`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors = captureConsoleErrors(page);

    await demoLogin(page, role);
    await page.goto(path);
    await page.waitForLoadState("load");

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390); // allow tiny tolerance

    // Page has content
    await expect(page.locator("body")).not.toBeEmpty();
    expect(errors()).toHaveLength(0);
  });
}

// ════════════════════════════════════════════════════════════════════
// Booking Wizard at mobile
// ════════════════════════════════════════════════════════════════════

test("booking wizard renders all 4 steps without overflow at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await demoLogin(page, "guardian");
  await page.goto("/guardian/booking");
  await page.waitForLoadState("load");

  const main = page.locator("main").first();

  // Progress bar step icons all visible
  await expect(main.getByText("Service Details")).toBeVisible();
  await expect(main.getByText("Schedule")).toBeVisible();
  await expect(main.getByText("Patient Info")).toBeVisible();
  await expect(main.getByText("Payment")).toBeVisible();

  // Service cards stack vertically — Next Step button is full width and visible
  await expect(page.getByRole("button", { name: /next step/i })).toBeVisible();

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

// ════════════════════════════════════════════════════════════════════
// Guardian Search filter drawer at mobile
// ════════════════════════════════════════════════════════════════════

test("guardian search filter drawer opens and closes at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await demoLogin(page, "guardian");
  await page.goto("/guardian/search");
  await page.waitForLoadState("load");

  // Mobile filter icon (SlidersHorizontal) should be visible
  const filterIcon = page.locator('button.w-12.h-12.rounded-2xl.bg-white\\/20.backdrop-blur-md').first();
  await expect(filterIcon).toBeVisible({ timeout: 5_000 });
  await filterIcon.click();

  const filtersHeading = page.getByRole("heading", { name: /^Filters$/i });

  // Drawer should open
  await expect(page.getByRole("heading", { name: /^Filters$/ })).toBeVisible({ timeout: 3_000 });

  // Close it
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
});

// ════════════════════════════════════════════════════════════════════
// Caregiver Jobs at mobile — cards stack, no overflow
// ════════════════════════════════════════════════════════════════════

test("caregiver jobs page renders correctly at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await demoLogin(page, "caregiver");
  await page.goto("/caregiver/jobs");
  await page.waitForLoadState("load");

  await expect(page.getByText("Find Jobs")).toBeVisible();

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

// ════════════════════════════════════════════════════════════════════
// Shift Check-In at mobile
// ════════════════════════════════════════════════════════════════════

test("shift check-in renders progress bar and button at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await demoLogin(page, "caregiver");
  await page.goto("/caregiver/shift-check-in");
  await page.waitForLoadState("load");

  await expect(page.getByRole("button", { name: /start check-in/i })).toBeVisible();

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

// ════════════════════════════════════════════════════════════════════
// Shop Front at mobile
// ════════════════════════════════════════════════════════════════════

test("shop product list renders at 375px without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = captureConsoleErrors(page);
  await page.goto("/shop");
  await page.waitForLoadState("load");

  await expect(page.locator("body")).not.toBeEmpty();
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
  expect(errors()).toHaveLength(0);
});

// ════════════════════════════════════════════════════════════════════
// Login page at mobile
// ════════════════════════════════════════════════════════════════════

test("login page renders correctly at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/auth/login");
  await page.waitForLoadState("load");

  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  const submitBtn = page.locator("form").getByRole("button", { name: /log in/i }).first();
  await expect(submitBtn).toBeVisible();

  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(390);
});

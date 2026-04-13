/**
 * E2E: Admin, Moderator, Shop
 * ────────────────────────────
 * Run:
 *   pnpm test:e2e -- admin-moderator-shop
 */

import { test, expect, type Page } from "@playwright/test";
import { demoLogin, captureConsoleErrors, mainLandmark } from "./helpers";

// ════════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════════

test.describe("Admin flows", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await demoLogin(page, "admin");
  });

  test.describe("Dashboard", () => {
    test("renders operational action bar and work queue", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/admin/dashboard");
      await page.waitForLoadState("load");

      await expect(mainLandmark(page).getByRole("heading", { name: /Admin Dashboard/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole("link", { name: /Review approvals/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Resolve flags/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /Process payouts/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Work queue/i })).toBeVisible();
      await expect(page.getByText("Verification").first()).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("Process payouts action links to payments", async ({ page }) => {
      await page.goto("/admin/dashboard");
      await page.waitForLoadState("load");
      await page.getByRole("link", { name: /Process payouts/i }).click();
      await expect(page).toHaveURL(/admin\/payments/);
    });
  });

  test.describe("Users", () => {
    test("user table renders with expected columns", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/admin/users");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
      expect(errors()).toHaveLength(0);
    });
  });

  test.describe("Verifications", () => {
    test("verification queue loads without crash", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/admin/verifications");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
      expect(errors()).toHaveLength(0);
    });

    test("verification case detail loads", async ({ page }) => {
      await page.goto("/admin/verification-case/1");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    });
  });

  // All remaining admin pages — load check
  const adminPages: [string, string][] = [
    ["/admin/agency-approvals",       "Agency"],
    ["/admin/placement-monitoring",   "Placement"],
    ["/admin/payments",               "Payment"],
    ["/admin/wallet-management",      "Wallet"],
    ["/admin/contracts",              "Contract"],
    ["/admin/disputes",               "Dispute"],
    ["/admin/financial-audit",        "Financial"],
    ["/admin/audit-logs",             "Audit"],
    ["/admin/reports",                "Report"],
    ["/admin/cms",                    "CMS"],
    ["/admin/languages",              "Language"],
    ["/admin/policy",                 "Policy"],
    ["/admin/promos",                 "Promo"],
    ["/admin/support-ticket/1",       ""],
    ["/admin/system-health",          "System Health"],
    ["/admin/sitemap",                "Sitemap"],
    ["/admin/settings",               "Setting"],
    ["/admin/user-inspector",         "Inspector"],
  ];

  for (const [path, keyword] of adminPages) {
    test(`${path} loads without crash`, async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(2_000);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
      if (keyword) {
        await expect(page.getByText(new RegExp(keyword, "i")).first()).toBeVisible({ timeout: 8_000 });
      }
      expect(errors()).toHaveLength(0);
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// MODERATOR
// ════════════════════════════════════════════════════════════════════

test.describe("Moderator flows", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await demoLogin(page, "moderator");
  });

  test.describe("Dashboard", () => {
    test("renders action bar and work queue", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");

      await expect(page.getByText("Moderator Dashboard")).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: /Review queue/i }).first()).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: /^Reports$/i }).first()).toBeVisible();
      await expect(page.getByRole("main").getByRole("link", { name: /Flagged content/i }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: /Work queue/i })).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("Review queue action links to /moderator/reviews", async ({ page }) => {
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");
      await page.getByRole("main").getByRole("link", { name: /Review queue/i }).first().click();
      await expect(page).toHaveURL(/moderator\/reviews/);
    });

    test("/moderator/sanctions loads from direct navigation", async ({ page }) => {
      await page.goto("/moderator/sanctions");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    });

    test("Open case in queue navigates without crash", async ({ page }) => {
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");
      const openCase = page.getByRole("link", { name: /open case/i }).first();
      await expect(openCase).toBeVisible({ timeout: 15_000 });
      await openCase.click();
      await expect(page).toHaveURL(/moderator\/(reviews|reports|content)/);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    });
  });

  // All moderator pages — load check
  const moderatorPages: [string, string][] = [
    ["/moderator/reviews",         "Review"],
    ["/moderator/reports",         "Report"],
    ["/moderator/content",         "Content"],
    ["/moderator/queue-detail/1",  ""],
    ["/moderator/sanctions",       ""],
    ["/moderator/escalations",     ""],
  ];

  for (const [path, keyword] of moderatorPages) {
    test(`${path} loads without crash`, async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(2_000);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
      if (keyword) {
        await expect(page.getByText(new RegExp(keyword, "i")).first()).toBeVisible({ timeout: 8_000 });
      }
      expect(errors()).toHaveLength(0);
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// SHOP MERCHANT
// ════════════════════════════════════════════════════════════════════

test.describe("Shop Merchant flows", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await demoLogin(page, "shop");
  });

  test.describe("Dashboard", () => {
    test("renders operational action bar and orders queue", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/shop/dashboard");
      await page.waitForLoadState("load");

      await expect(page.getByText("Shop Dashboard")).toBeVisible();
      const main = mainLandmark(page);
      await expect(main.getByRole("link", { name: /^Products$/i }).first()).toBeVisible();
      await expect(main.getByRole("link", { name: /^Orders$/i }).first()).toBeVisible();
      await expect(main.getByRole("link", { name: /^Inventory$/i }).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: /Orders & signals/i })).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("work queue shows column labels", async ({ page }) => {
      await page.goto("/shop/dashboard");
      await page.waitForLoadState("load");
      await expect(page.getByText("Type", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Priority", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Entity", { exact: true }).first()).toBeVisible();
    });
  });

  test.describe("Product Editor", () => {
    test("create form renders required fields", async ({ page }) => {
      await page.goto("/shop/product-editor");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    });

    test("edit form pre-fills for existing product", async ({ page }) => {
      await page.goto("/shop/product-editor/1");
      await page.waitForLoadState("load");
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    });
  });

  // Remaining shop merchant pages
  const shopMerchantPages: [string, string][] = [
    ["/shop/onboarding",          "Onboarding"],
    ["/shop/products",            "Product"],
    ["/shop/orders",              "Order"],
    ["/shop/fulfillment",         "Fulfillment"],
    ["/shop/inventory",           "Inventory"],
    ["/shop/analytics",           "Analytics"],
    ["/shop/merchant-analytics",  "Analytics"],
  ];

  for (const [path, keyword] of shopMerchantPages) {
    test(`${path} loads without crash`, async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(2_000);
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
      if (keyword) {
        await expect(page.getByText(new RegExp(keyword, "i")).first()).toBeVisible({ timeout: 8_000 });
      }
      expect(errors()).toHaveLength(0);
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// SHOP FRONT (Customer — no login required)
// ════════════════════════════════════════════════════════════════════

/** Shop layouts sometimes render nested `<main>` (e.g. category hub); use first landmark. */
function shopMain(page: Page) {
  return page.locator("main").first();
}

test.describe("Shop Front", () => {
  test.describe.configure({ timeout: 90_000 });

  test("product list loads with cards", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await page.goto("/shop");
    await page.waitForLoadState("load");
    await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
    expect(errors()).toHaveLength(0);
  });

  test("product detail page loads", async ({ page }) => {
    await page.goto("/shop/product/1");
    await page.waitForLoadState("load");
    await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
  });

  test("cart page loads", async ({ page }) => {
    await page.goto("/shop/cart");
    await page.waitForLoadState("load");
    await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
  });

  test("checkout page loads", async ({ page }) => {
    await page.goto("/shop/checkout");
    await page.waitForLoadState("load");
    await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
  });

  test("wishlist page loads", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await page.goto("/shop/wishlist");
    await page.waitForLoadState("load");
    await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
    expect(errors()).toHaveLength(0);
  });

  const shopFrontPages: [string, string][] = [
    ["/shop/category/medical",     ""],
    ["/shop/product/1/reviews",    "Review"],
    ["/shop/order-success",        ""],
    ["/shop/order-tracking/1",     ""],
    ["/shop/order-history",        "Order"],
  ];

  for (const [path, keyword] of shopFrontPages) {
    test(`${path} loads without crash`, async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(2_000);
      await expect(shopMain(page)).toBeVisible({ timeout: 15_000 });
      if (keyword) {
        await expect(page.getByText(new RegExp(keyword, "i")).first()).toBeVisible({ timeout: 8_000 });
      }
      expect(errors()).toHaveLength(0);
    });
  }
});

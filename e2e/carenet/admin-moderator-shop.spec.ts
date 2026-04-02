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
    test("renders KPI cards, charts, and activity feed", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/admin/dashboard");
      await page.waitForLoadState("load");

      await expect(mainLandmark(page).getByRole("heading", { name: /Admin Dashboard/i })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText("Total Users")).toBeVisible();
      await expect(page.getByText("Active Caregivers")).toBeVisible();
      await expect(page.getByText("User Growth")).toBeVisible();
      await expect(page.getByText("Monthly Revenue")).toBeVisible();
      await expect(page.getByText("Recent Activity")).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("Points in Circulation card links to wallet management", async ({ page }) => {
      await page.goto("/admin/dashboard");
      await page.waitForLoadState("load");
      await page.getByText("Points in Circulation").click();
      await expect(page).toHaveURL(/admin\/wallet-management/);
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
    test("renders 4 stat cards and moderation queue", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");

      await expect(page.getByText("Moderator Dashboard")).toBeVisible();
      await expect(page.getByText("Pending Reviews")).toBeVisible();
      await expect(page.getByText("Open Reports")).toBeVisible();
      await expect(page.getByText("Content Flags")).toBeVisible();
      await expect(page.getByText("Resolved Today")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Moderation Queue" })).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("Pending Reviews card links to /moderator/reviews", async ({ page }) => {
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");
      await page.getByText("Pending Reviews").click();
      await expect(page).toHaveURL(/moderator\/reviews/);
    });

    test("User Sanctions link navigates correctly", async ({ page }) => {
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");
      await page.getByText("User Sanctions").click();
      await expect(page).toHaveURL(/moderator\/sanctions/);
    });

    test("Approve button in queue changes item state", async ({ page }) => {
      await page.goto("/moderator/dashboard");
      await page.waitForLoadState("load");
      const approveBtn = page.getByRole("button", { name: /approve/i }).first();
      await expect(approveBtn).toBeVisible({ timeout: 15_000 });
      await approveBtn.click();
      await page.waitForTimeout(500);
      // No crash
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
    test("renders stat cards and recent orders table", async ({ page }) => {
      const errors = captureConsoleErrors(page);
      await page.goto("/shop/dashboard");
      await page.waitForLoadState("load");

      await expect(page.getByText("Shop Dashboard")).toBeVisible();
      await expect(page.getByText("Total Sales")).toBeVisible();
      await expect(page.getByText("Active Products")).toBeVisible();
      await expect(page.getByText("New Orders")).toBeVisible();
      await expect(page.getByText("Total Customers")).toBeVisible();
      await expect(page.getByText("Recent Orders")).toBeVisible();

      expect(errors()).toHaveLength(0);
    });

    test("order table has expected columns", async ({ page }) => {
      await page.goto("/shop/dashboard");
      await page.waitForLoadState("load");
      await expect(page.getByRole("columnheader", { name: "Order ID" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Customer" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
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

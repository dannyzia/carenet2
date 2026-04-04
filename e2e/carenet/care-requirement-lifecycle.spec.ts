/**
 * Guardian care requirement wizard: full path through submit (mock marketplace).
 */
import { test, expect } from "@playwright/test";
import { demoLogin } from "./helpers";

test.describe("Care requirement lifecycle", () => {
  test("wizard completes and returns to dashboard", async ({ page }) => {
    test.setTimeout(90_000);
    await demoLogin(page, "guardian");
    await page.goto("/guardian/care-requirement-wizard?direct=true", { waitUntil: "load" });

    await expect(page.getByRole("heading", { name: /select an agency/i })).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /HealthCare Pro BD/i }).click();

    await expect(page.getByRole("heading", { name: /patient information/i })).toBeVisible();
    await page.getByPlaceholder(/full name of care recipient/i).fill("E2E Patient");
    await page.locator('input[type="number"]').first().fill("72");

    await page.getByRole("button", { name: /^next$/i }).click();
    await expect(page.getByRole("heading", { name: /care requirements/i })).toBeVisible();
    await page.waitForTimeout(350);
    await page.locator("button").filter({ hasText: "Elderly Care" }).first().click();

    await page.getByRole("button", { name: /^next$/i }).click();
    await expect(page.getByRole("heading", { name: /schedule preferences/i })).toBeVisible();
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const iso = start.toISOString().slice(0, 10);
    await page.locator('input[type="date"]').fill(iso);
    await page
      .locator("div")
      .filter({ has: page.locator("label").filter({ hasText: /^duration$/i }) })
      .locator('input[type="text"]')
      .fill("1 month");

    await page.getByRole("button", { name: /^next$/i }).click();
    await expect(page.getByRole("heading", { name: /budget range/i })).toBeVisible();
    await page.getByLabel(/minimum/i).fill("20000");
    await page.getByLabel(/maximum/i).fill("30000");

    await page.getByRole("button", { name: /^next$/i }).click();
    await expect(page.getByRole("heading", { name: /review/i })).toBeVisible();

    await page.getByRole("button", { name: /submit requirement/i }).click();

    await page.waitForURL("**/guardian/dashboard**", { timeout: 25_000 });
    await expect(page).toHaveURL(/guardian\/dashboard/);
  });
});

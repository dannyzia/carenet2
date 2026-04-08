/**
 * E2E: Dashboard KPI tiles navigate to role routes.
 */
import { test, expect } from "@playwright/test";
import { demoLogin } from "./helpers";

test.describe("Dashboard stat links", () => {
  test("agency first KPI navigates to caregivers", async ({ page }) => {
    await demoLogin(page, "agency");
    await page.goto("/agency/dashboard");
    await page.waitForLoadState("load");
    const main = page.locator("#main-content");
    const kpi = main.getByRole("link", { name: /Active Caregivers/i });
    await kpi.first().waitFor({ state: "visible", timeout: 25_000 });
    await expect(kpi.first()).toHaveAttribute("href", "/agency/caregivers");
    await kpi.first().click();
    await expect(page).toHaveURL(/\/agency\/caregivers/);
  });

  test("caregiver first KPI navigates to jobs", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/caregiver/dashboard");
    await page.waitForLoadState("load");
    const main = page.locator("#main-content");
    const kpi = main.getByRole("link", { name: /Active Jobs/i });
    await kpi.first().waitFor({ state: "visible", timeout: 25_000 });
    await expect(kpi.first()).toHaveAttribute("href", "/caregiver/jobs");
    await kpi.first().click();
    await expect(page).toHaveURL(/\/caregiver\/jobs/);
  });
});

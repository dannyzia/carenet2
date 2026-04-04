/**
 * Shift check-in and check-out surfaces for the same mock shift id (navigation lifecycle).
 */
import { test, expect } from "@playwright/test";
import { demoLogin } from "./helpers";

test.describe("Shift lifecycle navigation", () => {
  test("check-in and check-out pages load for mock shift sp-1", async ({ page }) => {
    await demoLogin(page, "caregiver");

    await page.goto("/caregiver/shift-check-in/sp-1", { waitUntil: "load" });
    await expect(
      page.getByRole("heading", { name: /shift check-in|already checked in/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/caregiver/shift-checkout/sp-1", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /shift check-out/i })).toBeVisible({ timeout: 15_000 });
  });
});

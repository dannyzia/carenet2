import { test, expect } from "@playwright/test";
import { demoLogin } from "./helpers";

test.describe("Dead controls smoke", () => {
  test("agency caregivers add button navigates", async ({ page }) => {
    await demoLogin(page, "agency");
    await page.goto("/agency/caregivers");
    await page.getByRole("link", { name: /Add Caregiver/i }).click();
    await expect(page).toHaveURL(/\/agency\/hiring/);
  });

  test("caregiver earnings withdraw button navigates to wallet", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/caregiver/earnings");
    await page.getByRole("button", { name: /Withdraw Now/i }).click();
    await expect(page).toHaveURL(/\/wallet\?role=caregiver/);
  });

  test("guardian payments add funds goes to wallet", async ({ page }) => {
    await demoLogin(page, "guardian");
    await page.goto("/guardian/payments");
    await page.getByRole("link", { name: /Add Funds/i }).click();
    await expect(page).toHaveURL(/\/wallet\?role=guardian/);
  });

  test("patient emergency contact uses tel link", async ({ page }) => {
    await demoLogin(page, "patient");
    await page.goto("/patient/messages");
    await expect(page.getByRole("link", { name: /Call emergency/i })).toHaveAttribute("href", "tel:999");
  });

  test("shop products add product navigates", async ({ page }) => {
    await demoLogin(page, "shop");
    await page.goto("/shop/products");
    await page.getByRole("link", { name: /Add Product/i }).click();
    await expect(page).toHaveURL(/\/shop\/inventory/);
  });
});

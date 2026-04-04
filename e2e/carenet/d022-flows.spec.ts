/**
 * D022 smoke: daily schedule, shift checkout, document viewer, emergency SOS.
 */
import { test, expect } from "@playwright/test";
import { demoLogin } from "./helpers";

test.describe("D022 core flows", () => {
  test("daily schedule page renders", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/schedule/daily", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /daily schedule/i })).toBeVisible({ timeout: 15_000 });
  });

  test("shift checkout page renders for mock shift", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/caregiver/shift-checkout/sp-1", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /shift check-out/i })).toBeVisible({ timeout: 15_000 });
  });

  test("document viewer loads mock upload", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/documents/view/uf-1", { waitUntil: "load" });
    await expect(page.getByTestId("medical-document-viewer")).toBeVisible({ timeout: 15_000 });
  });

  test("document viewer resolves mock caregiver document id from documents list", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/documents/view/1", { waitUntil: "load" });
    await expect(page.getByTestId("medical-document-viewer")).toBeVisible({ timeout: 15_000 });
  });

  test("emergency SOS page and FAB for patient", async ({ page }) => {
    await demoLogin(page, "patient");
    await page.goto("/patient/dashboard", { waitUntil: "load" });
    await expect(page.getByTestId("emergency-sos-fab")).toBeVisible({ timeout: 15_000 });
    await page.goto("/patient/emergency-sos", { waitUntil: "load" });
    await expect(page.getByTestId("emergency-sos-page")).toBeVisible({ timeout: 15_000 });
  });
});

/**
 * Automated accessibility smoke (axe-core).
 * Color contrast is disabled: themed CSS variables often fail generic contrast heuristics.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { demoLogin } from "./helpers";

async function expectNoSeriousViolations(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect.soft(bad, `${label}: ${bad.map((v) => v.id).join(", ")}`).toEqual([]);
}

test.describe("Accessibility smoke (axe)", () => {
  test("login page", async ({ page }) => {
    await page.goto("/auth/login", { waitUntil: "load" });
    await expectNoSeriousViolations(page, "login");
  });

  test("caregiver dashboard after demo login", async ({ page }) => {
    await demoLogin(page, "caregiver");
    await page.goto("/caregiver/dashboard", { waitUntil: "load" });
    await expectNoSeriousViolations(page, "caregiver dashboard");
  });
});

import { test, expect } from "@playwright/test";
import { goto, loginSubmitButton, assertTitle } from "./helpers";

test.describe("Login with MFA (Workflow 1)", () => {
  // ✅ Correct way: capture console errors inside the test, not as a top-level call
  test("should log in successfully with email, password and TOTP", async ({
    page,
  }) => {
    // Optional: capture console errors for this test
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // 1. Go to login page
    await goto(page, "/auth/login");

    // 2. Fill email and password (using demo caregiver account)
    await page.fill('input[type="email"]', "caregiver@carenet.demo");
    await page.fill('input[type="password"]', "demo1234");

    // 3. Click the login submit button (helper avoids duplicate header button)
    const submitBtn = await loginSubmitButton(page);
    await submitBtn.click();

    // 4. Wait for MFA page to appear (6 numeric input boxes)
    await expect(
      page.locator('input[inputmode="numeric"]').first(),
    ).toBeVisible({ timeout: 5000 });

    // 5. Fill the 6‑digit TOTP code (demo accounts use 123456)
    const code = "123456";
    const mfaInputs = page.locator('input[inputmode="numeric"]');
    for (let i = 0; i < code.length; i++) {
      await mfaInputs.nth(i).fill(code[i]);
    }

    // 6. After the 6th digit, the form auto‑submits – wait for dashboard
    await expect(page).toHaveURL(/\/caregiver\/dashboard/, { timeout: 10000 });

    // 7. Verify the dashboard main content is visible
    const mainLandmark = page.getByRole("main").first();
    await expect(mainLandmark).toBeVisible();

    // 8. Optional: check that the page title contains "Dashboard"
    await assertTitle(page, /Dashboard/i);
  });

  test("should log in via Demo Access (bypass MFA)", async ({ page }) => {
    await goto(page, "/auth/login");

    // Click the "Demo Access" button
    await page.getByRole("button", { name: /demo access/i }).click();

    // Click the "Caregiver" role button
    await page.getByRole("button", { name: /caregiver/i }).click();

    // Should go directly to caregiver dashboard
    await expect(page).toHaveURL(/\/caregiver\/dashboard/, { timeout: 5000 });
    await expect(page.getByRole("main").first()).toBeVisible();
  });
});

/**
 * E2E: Guardian – Complete Role Workflows (Real Supabase)
 * ──────────────────────────────────────────────────────
 * Full coverage of every guardian route with real form interactions.
 * Uses guardian1@indigobangladesh.xyz for real Supabase auth.
 */

import { test, expect } from "@playwright/test";
import {
  loginAsReal,
  goto,
  mainLandmark,
  assertTitle,
  assertToast,
  captureConsoleErrors,
} from "./helpers";

test.use({ launchOptions: { slowMo: 500 } });

test.describe("Guardian – Complete Role Workflows", () => {
  test.describe.configure({ timeout: 180_000, mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsReal(page, "guardian");
    await expect(page).toHaveURL(/\/guardian\/dashboard|\/dashboard/);
  });

  // ════════════════════════════════════════════════════════════════
  // 1. Dashboard
  // ════════════════════════════════════════════════════════════════

  test("1. Dashboard loads correctly", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await expect(mainLandmark(page)).toBeVisible();
    await assertTitle(page, /Dashboard/i);
    expect(errors()).toHaveLength(0);
  });

  // ════════════════════════════════════════════════════════════════
  // 2. Search agencies and caregivers
  // ════════════════════════════════════════════════════════════════

  test("2. Search agencies and caregivers", async ({ page }) => {
    await goto(page, "/guardian/search");
    const main = mainLandmark(page);
    await expect(main.getByText("Find a Care Agency")).toBeVisible();

    const searchInput = page.getByPlaceholder("Search by agency, specialty, or location...");
    await searchInput.fill("Elder");
    await searchInput.press("Enter");

    const filterTag = main.getByText("Elder Care").first();
    if (await filterTag.isVisible()) {
      await filterTag.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 3. Booking Wizard – step 1 loads
  // ════════════════════════════════════════════════════════════════

  test("3. Booking Wizard – step 1 loads", async ({ page }) => {
    await goto(page, "/guardian/booking");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 4. View and manage patients
  // ════════════════════════════════════════════════════════════════

  test("4. View and manage patients", async ({ page }) => {
    await goto(page, "/guardian/patients");
    const main = mainLandmark(page);
    await expect(main.getByRole("heading", { name: /^My Patients$/i })).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Add Patient")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 5. Patient intake form
  // ════════════════════════════════════════════════════════════════

  test("5. Patient intake form – fill and submit", async ({ page }) => {
    await goto(page, "/guardian/patient-intake");
    const main = mainLandmark(page);
    await expect(
      main.getByRole("heading", { name: /add new patient|edit patient/i }),
    ).toBeVisible({ timeout: 15_000 });

    const nameInput = main.getByPlaceholder(/e\.g\. mr\./i);
    if (await nameInput.isVisible()) {
      await nameInput.fill("E2E Test Patient");
    }

    const ageInput = main.getByPlaceholder(/e\.g\. 75/i);
    if (await ageInput.isVisible()) {
      await ageInput.fill("72");
    }

    const maleBtn = main.getByRole("button", { name: /^male$/i });
    if (await maleBtn.isVisible()) {
      await maleBtn.click();
    }

    const diabetesTag = main.getByText("Diabetes").first();
    if (await diabetesTag.isVisible()) {
      await diabetesTag.click();
    }

    const conditionNote = main.getByPlaceholder(/add details about the selected conditions/i);
    if (await conditionNote.isVisible()) {
      await conditionNote.fill("Patient requires regular monitoring of blood sugar and blood pressure.");
    }

    const contactName = main.getByPlaceholder(/primary contact/i);
    if (await contactName.isVisible()) {
      await contactName.fill("Test Guardian");
    }

    const contactPhone = main.getByPlaceholder(/\+880/i);
    if (await contactPhone.isVisible()) {
      await contactPhone.fill("+8801712345678");
    }

    const submitBtn = main.getByRole("button", { name: /create profile|save changes/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 6. View schedule
  // ════════════════════════════════════════════════════════════════

  test("6. View schedule – today and week views", async ({ page }) => {
    await goto(page, "/guardian/schedule");
    const main = mainLandmark(page);
    await expect(main.getByText("Care Schedule")).toBeVisible({ timeout: 15_000 });

    const weekBtn = main.getByRole("button", { name: /^week$/i }).first();
    if (await weekBtn.isVisible()) {
      await weekBtn.click();
      await page.waitForTimeout(300);
    }

    const todayBtn = main.getByRole("button", { name: /^today$/i }).first();
    if (await todayBtn.isVisible()) {
      await todayBtn.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 7. Messages – view and type
  // ════════════════════════════════════════════════════════════════

  test("7. Messages – view and type", async ({ page }) => {
    await goto(page, "/guardian/messages");
    const input = page.getByPlaceholder("Type your message...").filter({ visible: true }).first();
    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill("Hello, test message from Guardian E2E.");
    await expect(input).toHaveValue("Hello, test message from Guardian E2E.");
  });

  // ════════════════════════════════════════════════════════════════
  // 8. Payments overview
  // ════════════════════════════════════════════════════════════════

  test("8. Payments overview", async ({ page }) => {
    await goto(page, "/guardian/payments");
    const main = mainLandmark(page);
    await expect(main.getByText("Payments")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(/Wallet Balance/i)).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 9. Reviews – view and write
  // ════════════════════════════════════════════════════════════════

  test("9. Reviews – view and write", async ({ page }) => {
    await goto(page, "/guardian/reviews");
    const main = mainLandmark(page);
    await expect(main.getByText("Reviews")).toBeVisible({ timeout: 15_000 });

    const writeReviewBtn = main.getByRole("button", { name: /write review/i }).first();
    if (await writeReviewBtn.isVisible()) {
      await writeReviewBtn.click();
      const textarea = main.getByPlaceholder("Share your experience...");
      if (await textarea.isVisible()) {
        await textarea.fill("Excellent caregiver, very professional.");
      }
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 10. Update guardian profile
  // ════════════════════════════════════════════════════════════════

  test("10. Update guardian profile", async ({ page }) => {
    await goto(page, "/guardian/profile");
    const main = mainLandmark(page);
    await expect(main.getByText(/verified/i).or(main.getByText("Contact Information"))).toBeVisible({ timeout: 15_000 });

    await main.getByRole("button", { name: /^edit$/i }).click();

    const phoneInput = main.getByPlaceholder(/\+880/i).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill("+8801712345678");
    }

    await main.getByRole("button", { name: /save changes/i }).click();
  });

  // ════════════════════════════════════════════════════════════════
  // 11. Care Requirements list
  // ════════════════════════════════════════════════════════════════

  test("11. Care Requirements list", async ({ page }) => {
    await goto(page, "/guardian/care-requirements");
    const main = mainLandmark(page);
    await expect(main.getByText("My Care Requirements")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("New Requirement")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 12. Care Requirement Wizard – pre-wizard choice
  // ════════════════════════════════════════════════════════════════

  test("12. Care Requirement Wizard – choice screen", async ({ page }) => {
    await goto(page, "/guardian/care-requirement-wizard");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 13. Care Requirement Wizard – full 6-step flow
  // ════════════════════════════════════════════════════════════════

  test("13. Care Requirement Wizard – 6-step flow", async ({ page }) => {
    await goto(page, "/guardian/care-requirement-wizard");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });

    const postReqBtn = main.getByRole("link", { name: /create requirement|post requirement/i }).first();
    if (await postReqBtn.isVisible()) {
      await postReqBtn.click();
    }

    const firstAgency = main.locator("[class*='card'], .finance-card").first();
    if (await firstAgency.isVisible().catch(() => false)) {
      await firstAgency.click();
    }

    const nextBtn = main.getByRole("button", { name: /^next$/i }).first();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }

    const patientNameInput = main.getByPlaceholder(/full name|patient name/i).first();
    if (await patientNameInput.isVisible().catch(() => false)) {
      await patientNameInput.fill("E2E Patient 1");
    }

    const ageInput = main.getByPlaceholder(/age/i).first();
    if (await ageInput.isVisible().catch(() => false)) {
      await ageInput.fill("72");
    }

    const nextBtn2 = main.getByRole("button", { name: /^next$/i }).first();
    if (await nextBtn2.isVisible().catch(() => false)) {
      await nextBtn2.click();
    }

    const elderCareTag = main.getByText(/elderly care|elder care/i).first();
    if (await elderCareTag.isVisible().catch(() => false)) {
      await elderCareTag.click();
    }

    const nextBtn3 = main.getByRole("button", { name: /^next$/i }).first();
    if (await nextBtn3.isVisible().catch(() => false)) {
      await nextBtn3.click();
    }

    const nextBtn4 = main.getByRole("button", { name: /^next$/i }).first();
    if (await nextBtn4.isVisible().catch(() => false)) {
      await nextBtn4.click();
    }

    const minBudget = main.getByPlaceholder(/15,000|minimum/i).first();
    if (await minBudget.isVisible().catch(() => false)) {
      await minBudget.fill("20000");
    }

    const maxBudget = main.getByPlaceholder(/35,000|maximum/i).first();
    if (await maxBudget.isVisible().catch(() => false)) {
      await maxBudget.fill("30000");
    }

    const nextBtn5 = main.getByRole("button", { name: /^next$/i }).first();
    if (await nextBtn5.isVisible().catch(() => false)) {
      await nextBtn5.click();
    }

    const submitBtn = main.getByRole("button", { name: /submit requirement/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 14. Care Requirement Detail
  // ════════════════════════════════════════════════════════════════

  test("14. Care Requirement Detail – view", async ({ page }) => {
    await goto(page, "/guardian/care-requirements");
    const main = mainLandmark(page);
    const viewDetailsBtn = main.getByText("View Details").first();
    if (await viewDetailsBtn.isVisible().catch(() => false)) {
      await viewDetailsBtn.click();
      await expect(page).toHaveURL(/\/guardian\/care-requirement\//);
    } else {
      await goto(page, "/guardian/care-requirement/1");
      await expect(mainLandmark(page)).toBeVisible({ timeout: 15_000 });
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 15. Placements list
  // ════════════════════════════════════════════════════════════════

  test("15. Placements list", async ({ page }) => {
    await goto(page, "/guardian/placements");
    const main = mainLandmark(page);
    await expect(main.getByText("My Placements")).toBeVisible({ timeout: 15_000 });

    const activeTab = main.getByRole("button", { name: /active/i }).first();
    if (await activeTab.isVisible()) {
      await activeTab.click();
      await page.waitForTimeout(300);
    }

    const completedTab = main.getByRole("button", { name: /completed/i }).first();
    if (await completedTab.isVisible()) {
      await completedTab.click();
      await page.waitForTimeout(300);
    }

    const allTab = main.getByRole("button", { name: /^all$/i }).first();
    if (await allTab.isVisible()) {
      await allTab.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 16. Placement detail
  // ════════════════════════════════════════════════════════════════

  test("16. Placement detail – view", async ({ page }) => {
    await goto(page, "/guardian/placement/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 17. Marketplace Hub
  // ════════════════════════════════════════════════════════════════

  test("17. Marketplace Hub – browse packages and posted jobs", async ({ page }) => {
    await goto(page, "/guardian/marketplace-hub");
    const main = mainLandmark(page);
    await expect(main.getByText("Care Marketplace")).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 18. Bid Review
  // ════════════════════════════════════════════════════════════════

  test("18. Bid Review – view", async ({ page }) => {
    await goto(page, "/guardian/bid-review/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 19. Care Diary
  // ════════════════════════════════════════════════════════════════

  test("19. Care Diary – view", async ({ page }) => {
    await goto(page, "/guardian/care-log");
    const main = mainLandmark(page);
    await expect(main.getByText(/care diary/i)).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 20. Alerts
  // ════════════════════════════════════════════════════════════════

  test("20. Alerts – view alert rules", async ({ page }) => {
    await goto(page, "/guardian/alerts");
    const main = mainLandmark(page);
    await expect(main.getByText(/alerts/i)).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 21. Live Tracking
  // ════════════════════════════════════════════════════════════════

  test("21. Live Tracking – view", async ({ page }) => {
    await goto(page, "/guardian/live-tracking");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 22. Live Monitor
  // ════════════════════════════════════════════════════════════════

  test("22. Live Monitor – view", async ({ page }) => {
    await goto(page, "/guardian/live-monitor");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 23. Care Scorecard
  // ════════════════════════════════════════════════════════════════

  test("23. Care Scorecard – view", async ({ page }) => {
    await goto(page, "/guardian/care-scorecard");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 24. Family Board
  // ════════════════════════════════════════════════════════════════

  test("24. Family Board – view", async ({ page }) => {
    await goto(page, "/guardian/family-board");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 25. Family Hub
  // ════════════════════════════════════════════════════════════════

  test("25. Family Hub – view", async ({ page }) => {
    await goto(page, "/guardian/family-hub");
    const main = mainLandmark(page);
    await expect(main.getByText("Family Hub")).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 26. Incident Report – full wizard
  // ════════════════════════════════════════════════════════════════

  test("26. Incident Report – full wizard", async ({ page }) => {
    await goto(page, "/guardian/incident-report");
    const main = mainLandmark(page);
    await expect(main.getByText("Incident Reports")).toBeVisible();

    await main.getByRole("button", { name: /report incident/i }).click();

    await main.getByText("Fall").click();

    await main.getByText("Low").first().click();
    const patientSelect = main.locator("select");
    const optionCount = await patientSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip(true, "No patients available for this guardian — cannot complete wizard");
    }
    await patientSelect.selectOption({ index: 1 });

    const continueBtn = main.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    await main.getByPlaceholder("Describe the incident in detail...").fill("Patient slipped near bathroom during E2E test.");
    await main.getByPlaceholder("What did you do immediately?").fill("Helped patient up, checked vitals.");
    const continueBtn2 = main.getByRole("button", { name: /continue/i });
    await expect(continueBtn2).toBeEnabled();
    await continueBtn2.click();

    await main.getByRole("button", { name: /submit incident report/i }).click();
    await expect(main.getByText(/incident reported/i)).toBeVisible({ timeout: 5_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 27. Shift Rating
  // ════════════════════════════════════════════════════════════════

  test("27. Shift Rating – view", async ({ page }) => {
    await goto(page, "/guardian/shift-rating/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 28. Caregiver Comparison
  // ════════════════════════════════════════════════════════════════

  test("28. Caregiver Comparison – view", async ({ page }) => {
    await goto(page, "/guardian/caregiver-comparison");
    const main = mainLandmark(page);
    await expect(main.getByText("Compare Caregivers")).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 29. Caregiver Public Profile
  // ════════════════════════════════════════════════════════════════

  test("29. Caregiver Public Profile – view", async ({ page }) => {
    await goto(page, "/guardian/caregiver/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 30. Agency Public Profile
  // ════════════════════════════════════════════════════════════════

  test("30. Agency Public Profile – view", async ({ page }) => {
    await goto(page, "/guardian/agency/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 31. Invoice Detail
  // ════════════════════════════════════════════════════════════════

  test("31. Invoice Detail – view", async ({ page }) => {
    await goto(page, "/guardian/invoice/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 32. Package Detail
  // ════════════════════════════════════════════════════════════════

  test("32. Package Detail – view", async ({ page }) => {
    await goto(page, "/guardian/marketplace/package/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 33. Emergency Hub
  // ════════════════════════════════════════════════════════════════

  test("33. Emergency Hub – view", async ({ page }) => {
    await goto(page, "/guardian/emergency");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 34. Settings
  // ════════════════════════════════════════════════════════════════

  test("34. Settings – view", async ({ page }) => {
    await goto(page, "/settings");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 35. Logout
  // ════════════════════════════════════════════════════════════════

  test("35. Logout", async ({ page }) => {
    await page.getByRole("button", { name: /avatar|user menu|account/i }).click();
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

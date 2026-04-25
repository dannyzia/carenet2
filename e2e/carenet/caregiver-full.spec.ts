/**
 * E2E: Caregiver – Complete Role Workflows (Real Supabase)
 * ─────────────────────────────────────────────────────
 * Full coverage of every caregiver route with real form interactions.
 * Uses caregiver1@inigobangladesh.xyz for real Supabase auth.
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

test.describe("Caregiver – Complete Role Workflows", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    await loginAsReal(page, "caregiver");
    await expect(page).toHaveURL(/\/caregiver\/dashboard|\/dashboard/);
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
  // 2. View and filter jobs
  // ════════════════════════════════════════════════════════════════

  test("2. View and filter jobs", async ({ page }) => {
    await goto(page, "/caregiver/jobs");
    const main = mainLandmark(page);
    await expect(main.getByText("Find Jobs")).toBeVisible();

    const searchInput = page.getByPlaceholder("Search by title or location...");
    await searchInput.fill("Post-Op");
    await searchInput.press("Enter");

    const firstDetailsBtn = page.getByRole("button", { name: /^details$/i }).first();
    if (await firstDetailsBtn.isVisible()) {
      await firstDetailsBtn.click();
      await expect(page).toHaveURL(/\/caregiver\/jobs\//);
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 3. Submit a job application
  // ════════════════════════════════════════════════════════════════

  test("3. Submit a job application", async ({ page }) => {
    await goto(page, "/caregiver/jobs");
    const applyButton = page.getByRole("button", { name: /apply now/i }).first();
    if (await applyButton.isVisible()) {
      await applyButton.click();
      await assertToast(page, /applied|submitted|success/i);
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 4. View schedule
  // ════════════════════════════════════════════════════════════════

  test("4. View schedule – week and list views", async ({ page }) => {
    await goto(page, "/caregiver/schedule");
    const main = mainLandmark(page);
    await expect(main.getByText("My Schedule")).toBeVisible();

    await main.getByRole("button", { name: /^list$/i }).click();
    await page.waitForTimeout(300);
    await main.getByRole("button", { name: /^week$/i }).click();

    const saveBtn = page.getByRole("button", { name: /save availability/i });
    await expect(saveBtn).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 5. Care Log – select type, fill, submit
  // ════════════════════════════════════════════════════════════════

  test("5. Care Log – Meal type flow", async ({ page }) => {
    await goto(page, "/caregiver/care-log");
    const main = mainLandmark(page);
    await expect(main.getByText("What are you logging?")).toBeVisible();

    await main.getByRole("button", { name: /^Meal$/i }).click();
    await page.waitForTimeout(300);
    await main.getByRole("button", { name: /breakfast/i }).click();
    await main.getByRole("button", { name: /^Normal$/i }).click();
    await main.locator("textarea").fill("Patient ate well.");
    await main.getByRole("button", { name: /save care log|save offline/i }).click();
    await expect(main.getByText(/care log saved|saved offline/i)).toBeVisible({ timeout: 5_000 });
  });

  test("5b. Care Log – Vitals type flow", async ({ page }) => {
    await goto(page, "/caregiver/care-log");
    const main = mainLandmark(page);

    await main.getByRole("button", { name: /^Vitals$/i }).click();
    await page.waitForTimeout(300);
    await main.getByPlaceholder("Sys").fill("120");
    await main.getByPlaceholder("Dia").fill("80");
    await main.getByPlaceholder("72").fill("72");
    await main.getByPlaceholder("98.6").fill("98.6");
    await main.locator("textarea").fill("All vitals within normal range.");

    // Dismiss notification permission modal if present
    const notNowBtn = page.getByRole("button", { name: /not now/i });
    if (await notNowBtn.isVisible().catch(() => false)) {
      await notNowBtn.click();
    }

    await main.getByRole("button", { name: /save care log|save offline/i }).click();
    await expect(main.getByText(/care log saved|saved offline/i)).toBeVisible({ timeout: 5_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 6. Incident Report – 4-step wizard
  // ════════════════════════════════════════════════════════════════

  test("6. Incident Report – full wizard", async ({ page }) => {
    await goto(page, "/caregiver/incident-report");
    const main = mainLandmark(page);
    await expect(main.getByText("Incident Reports")).toBeVisible();

    await main.getByRole("button", { name: /report incident/i }).click();
    await expect(main.getByText(/step 1 of 4/i)).toBeVisible();

    await main.getByText("Fall").click();
    await expect(main.getByText(/step 2 of 4/i)).toBeVisible();

    await main.getByText("Low").first().click();
    const patientSelect = main.locator("select");
    await expect(patientSelect).toBeVisible();
    const optionCount = await patientSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip(true, "No assigned patients available – cannot complete incident report wizard");
    }
    await patientSelect.selectOption({ index: 1 });

    const continueBtn = main.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled({ timeout: 5_000 });
    await continueBtn.click();

    await expect(main.getByText(/step 3 of 4/i)).toBeVisible();
    await main.getByPlaceholder("Describe the incident in detail...").fill("Patient slipped near bathroom.");
    await main.getByPlaceholder("What did you do immediately?").fill("Helped patient up.");
    const continueBtn2 = main.getByRole("button", { name: /continue/i });
    await expect(continueBtn2).toBeEnabled();
    await continueBtn2.click();

    await expect(main.getByText(/step 4 of 4/i)).toBeVisible();
    await main.getByRole("button", { name: /submit incident report/i }).click();
    await expect(main.getByText(/incident reported/i)).toBeVisible({ timeout: 5_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 7. Profile
  // ════════════════════════════════════════════════════════════════

  test("7. Update caregiver profile", async ({ page }) => {
    await goto(page, "/caregiver/profile");
    const main = mainLandmark(page);
    await expect(main.getByText("Documents & Certificates").or(main.getByText(/verified/i))).toBeVisible({ timeout: 15_000 });

    await main.getByRole("button", { name: /edit profile/i }).click();

    const bioTextarea = main.locator("textarea").first();
    if (await bioTextarea.isVisible()) {
      await bioTextarea.clear();
      await bioTextarea.fill("Experienced caregiver with 5 years in elderly care.");
    }

    await main.getByRole("button", { name: /save changes/i }).click();
  });

  // ════════════════════════════════════════════════════════════════
  // 8. Earnings
  // ════════════════════════════════════════════════════════════════

  test("8. View earnings", async ({ page }) => {
    await goto(page, "/caregiver/earnings");
    const main = mainLandmark(page);
    await expect(main.getByRole('heading', { name: 'Earnings', exact: true })).toBeVisible();
    await expect(main.getByText(/৳|bdt/i).or(main.getByText(/available balance/i)).first()).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 9. Marketplace Hub
  // ════════════════════════════════════════════════════════════════

  test("9. Marketplace Hub – browse packages", async ({ page }) => {
    await goto(page, "/caregiver/marketplace-hub");
    const main = mainLandmark(page);
    await expect(main.locator("h1").first()).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 10. Messages
  // ════════════════════════════════════════════════════════════════

  test("10. Messages – view and type", async ({ page }) => {
    // Skip message input test on mobile due to layout: input only appears after selecting a conversation
    const viewportSize = await page.viewportSize();
    const isMobile = page.context().browser().browserType().name() === 'chromium' &&
                    (viewportSize?.width || 0) <= 768;
    if (isMobile) {
      console.log("Skipping message input test on mobile");
      // Still verify the page loads
      await goto(page, "/caregiver/messages");
      const main = mainLandmark(page);
      await expect(main.getByText("Messages")).toBeVisible();
      return;
    }

    await goto(page, "/caregiver/messages");
    const main = mainLandmark(page);

    // Wait for page to load and determine which state we're in
    const inputLocator = page.getByPlaceholder("Type your message...").filter({ visible: true });
    const emptyStateLocator = main.getByText(/no conversations found/i);

    // Race between input appearing and empty state appearing
    const inputPromise = inputLocator.waitFor({ timeout: 5_000 }).then(() => "input" as const);
    const emptyStatePromise = emptyStateLocator.waitFor({ timeout: 5_000 }).then(() => "empty" as const);

    const result = await Promise.race([inputPromise, emptyStatePromise]).catch(() => null);

    if (result === "empty") {
      // Empty state - verify at least one empty state indicator is visible
      // "No conversations found" is always visible, "Select a conversation" is desktop-only
      const emptyIndicator = main.getByText(/no conversations found/i)
        .or(main.getByText(/select a conversation to start messaging/i));
      await expect(emptyIndicator.first()).toBeVisible();
      return;
    }

    if (result === null) {
      // Neither appeared - check which element exists
      const hasInput = await inputLocator.count() > 0;
      if (!hasInput) {
        const emptyIndicator = main.getByText(/no conversations found/i)
          .or(main.getByText(/select a conversation to start messaging/i));
        await expect(emptyIndicator.first()).toBeVisible();
        return;
      }
    }

    // Input is available - proceed with typing test
    const input = inputLocator.first();
    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill("Hello, test message from E2E.");
    await expect(input).toHaveValue("Hello, test message from E2E.");
  });

  // ════════════════════════════════════════════════════════════════
  // 11. Reviews
  // ════════════════════════════════════════════════════════════════

  test("11. Reviews – view ratings", async ({ page }) => {
    await goto(page, "/caregiver/reviews");
    const main = mainLandmark(page);
    await expect(main.getByText("Reviews & Ratings")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(/based on.*reviews/i)).toBeVisible();
    await main.getByRole("button", { name: /helpful/i }).first().click();
  });

  // ════════════════════════════════════════════════════════════════
  // 12. Documents
  // ════════════════════════════════════════════════════════════════

  test("12. Documents – view and upload area", async ({ page }) => {
    await goto(page, "/caregiver/documents");
    const main = mainLandmark(page);
    await expect(main.getByText("Documents & Certificates")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Upload New Document")).toBeVisible();
    await expect(main.getByText("My Documents")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 13. Assigned Patients
  // ════════════════════════════════════════════════════════════════

  test("13. Assigned Patients – active and past tabs", async ({ page }) => {
    await goto(page, "/caregiver/assigned-patients");
    const main = mainLandmark(page);
    await expect(main.getByRole("heading", { name: /^My Patients$/i })).toBeVisible({ timeout: 15_000 });
    await expect(main.getByRole("button", { name: /active/i })).toBeVisible();
    await expect(main.getByRole("button", { name: /past/i })).toBeVisible();

    await main.getByRole("button", { name: /past/i }).click();
    await page.waitForTimeout(300);

    await main.getByRole("button", { name: /active/i }).click();
  });

  // ════════════════════════════════════════════════════════════════
  // 14. Handoff Notes
  // ════════════════════════════════════════════════════════════════

  test("14. Handoff Notes – create and submit", async ({ page }) => {
    await goto(page, "/caregiver/handoff-notes");
    const main = mainLandmark(page);
    await expect(main.getByText("Shift Handoff Notes")).toBeVisible({ timeout: 15_000 });
    await main.getByRole("button", { name: /new handoff/i }).click();
    await expect(main.getByText("Create Handoff Note")).toBeVisible();

    await main.locator("textarea").first().fill("Patient stable. BP monitored.");
    await main.locator("textarea").nth(1).fill("BP elevated — recheck in 2 hours");
    await main.getByRole("button", { name: /submit handoff/i }).click();
    await expect(main.getByText("Create Handoff Note")).not.toBeVisible({ timeout: 5_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 15. Care Notes
  // ════════════════════════════════════════════════════════════════

  test("15. Care Notes – create new note", async ({ page }) => {
    await goto(page, "/caregiver/care-notes");
    const main = mainLandmark(page);
    await expect(main.getByText("Care Notes & Remarks")).toBeVisible({ timeout: 15_000 });

    await main.getByRole("button", { name: /new note/i }).click();
    await expect(main.getByText("New Care Note")).toBeVisible();

    await main.getByPlaceholder("Brief summary of the note").fill("Patient vitals stable");
    await main.locator("textarea").filter({ hasText: "" }).last().fill("All vitals within normal range. Continue monitoring.");
    await main.getByRole("button", { name: /save note/i }).click();
  });

  // ════════════════════════════════════════════════════════════════
  // 16. Alerts
  // ════════════════════════════════════════════════════════════════

  test("16. Alerts – view alert rules", async ({ page }) => {
    await goto(page, "/caregiver/alerts");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 17. Prescription
  // ════════════════════════════════════════════════════════════════

  test("17. Prescription – view patient prescriptions", async ({ page }) => {
    await goto(page, "/caregiver/prescription");
    const main = mainLandmark(page);
    await expect(main.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 18. Medication Schedule
  // ════════════════════════════════════════════════════════════════

  test("18. Med Schedule – view", async ({ page }) => {
    await goto(page, "/caregiver/med-schedule");
    const main = mainLandmark(page);
    await expect(main.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 19. Shift Planner
  // ════════════════════════════════════════════════════════════════

  test("19. Shift Planner – view planned shifts", async ({ page }) => {
    await goto(page, "/caregiver/shift-planner");
    const main = mainLandmark(page);
    await expect(main.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 20. Shift Check-In / Check-Out
  // ════════════════════════════════════════════════════════════════

  test("20. Shift Check-In page loads", async ({ page }) => {
    await goto(page, "/caregiver/shift-check-in");
    const main = mainLandmark(page);
    await expect(
      main.getByRole("heading", { name: /shift check-in|already checked in/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("20b. Shift Check-Out page loads", async ({ page }) => {
    await page.goto("/caregiver/shift-checkout/sp-1", { waitUntil: "load" });
    await expect(
      page.getByRole("heading", { name: /shift check-out|not found/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 21. Shift Detail
  // ════════════════════════════════════════════════════════════════

  test("21. Shift Detail – view a shift", async ({ page }) => {
    await goto(page, "/caregiver/shift/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 22. Job Detail
  // ════════════════════════════════════════════════════════════════

  test("22. Job Detail – view a job", async ({ page }) => {
    await goto(page, "/caregiver/jobs");
    const main = mainLandmark(page);
    const detailsBtn = main.getByRole("button", { name: /^details$/i }).first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await expect(page).toHaveURL(/\/caregiver\/jobs\//);
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 23. Job Application Detail
  // ════════════════════════════════════════════════════════════════

  test("23. Job Application Detail – view", async ({ page }) => {
    await goto(page, "/caregiver/job-application/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 24. Daily Earnings
  // ════════════════════════════════════════════════════════════════

  test("24. Daily Earnings – view breakdown", async ({ page }) => {
    await goto(page, "/caregiver/daily-earnings");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 25. Tax Reports
  // ════════════════════════════════════════════════════════════════

  test("25. Tax Reports – view financial reports", async ({ page }) => {
    await goto(page, "/caregiver/tax-reports");
    const main = mainLandmark(page);
    await expect(main.getByText("Financial & Tax Reports")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(/yearly gross/i)).toBeVisible();
    await expect(main.getByText(/estimated tax/i)).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 26. Payout Setup
  // ════════════════════════════════════════════════════════════════

  test("26. Payout Setup – view methods", async ({ page }) => {
    await goto(page, "/caregiver/payout-setup");
    const main = mainLandmark(page);
    await expect(main.getByText("Payout Methods")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Your Accounts")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 27. Training Portal
  // ════════════════════════════════════════════════════════════════

  test("27. Training Portal – view courses", async ({ page }) => {
    await goto(page, "/caregiver/training");
    const main = mainLandmark(page);
    await expect(main.getByText("Learning Hub")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Active Courses")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 28. Skills Assessment
  // ════════════════════════════════════════════════════════════════

  test("28. Skills Assessment – answer questions", async ({ page }) => {
    await goto(page, "/caregiver/skills-assessment");
    const main = mainLandmark(page);
    await expect(main.getByText("Skills Certification")).toBeVisible({ timeout: 15_000 });

    const firstAnswer = main.getByRole("button", { name: /lying flat|sitting upright/i }).first();
    if (await firstAnswer.isVisible()) {
      await firstAnswer.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 29. Portfolio Editor
  // ════════════════════════════════════════════════════════════════

  test("29. Portfolio Editor – view and add", async ({ page }) => {
    await goto(page, "/caregiver/portfolio");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
    const addBtn = main.getByRole("button", { name: /add|new|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(main.locator("input, textarea").first()).toBeVisible();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 30. Reference Manager
  // ════════════════════════════════════════════════════════════════

  test("30. Reference Manager – view and add", async ({ page }) => {
    await goto(page, "/caregiver/references");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
    const addBtn = main.getByRole("button", { name: /add|new reference|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(main.locator("input").first()).toBeVisible();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 31. Logout
  // ════════════════════════════════════════════════════════════════

  test("31. Logout", async ({ page }) => {
    await page.getByRole("button", { name: /avatar|user menu|account/i }).click();
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

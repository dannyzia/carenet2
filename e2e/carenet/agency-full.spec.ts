/**
 * E2E: Agency – Complete Role Workflows (Real Supabase)
 * ─────────────────────────────────────────────────────
 * Full coverage of every agency route with real form interactions.
 * Uses agent@indigobangladesh.xyz for real Supabase auth.
 */

import { test, expect } from "@playwright/test";
import {
  loginAsReal,
  goto,
  mainLandmark,
  captureConsoleErrors,
  assertToast,
} from "./helpers";

test.use({ launchOptions: { slowMo: 500 } });

test.describe("Agency – Complete Role Workflows", () => {
  test.describe.configure({ timeout: 180_000, mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsReal(page, "agency");
    await expect(page).toHaveURL(/\/agency\/dashboard|\/dashboard/);
  });

  // ════════════════════════════════════════════════════════════════
  // 1. Dashboard
  // ════════════════════════════════════════════════════════════════

  test("1. Dashboard loads correctly", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await expect(mainLandmark(page)).toBeVisible();
    expect(errors()).toHaveLength(0);
  });

  // ════════════════════════════════════════════════════════════════
  // 2. Caregivers list
  // ════════════════════════════════════════════════════════════════

  test("2. Caregivers – view and search", async ({ page }) => {
    await goto(page, "/agency/caregivers");
    const main = mainLandmark(page);
    await expect(main.getByText("Caregivers")).toBeVisible({ timeout: 15_000 });
    const searchInput = page.getByPlaceholder("Search caregivers...");
    if (await searchInput.isVisible()) {
      await searchInput.fill("Karim");
      await page.waitForTimeout(400);
    }
    await expect(main.getByText("Add Caregiver")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 3. Clients list
  // ════════════════════════════════════════════════════════════════

  test("3. Clients – view list", async ({ page }) => {
    await goto(page, "/agency/clients");
    const main = mainLandmark(page);
    await expect(main.getByText("Clients")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Add Client")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 4. Client Intake
  // ════════════════════════════════════════════════════════════════

  test("4. Client Intake – view and interact", async ({ page }) => {
    await goto(page, "/agency/client-intake");
    const main = mainLandmark(page);
    await expect(main.getByText("Client Intake Management")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("New Contract")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 5. Payments overview
  // ════════════════════════════════════════════════════════════════

  test("5. Payments – view financial overview", async ({ page }) => {
    await goto(page, "/agency/payments");
    const main = mainLandmark(page);
    await expect(main.getByText("Payments")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(/Revenue/i)).toBeVisible();
    await expect(main.getByText("Export")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 6. Reports
  // ════════════════════════════════════════════════════════════════

  test("6. Reports – view analytics", async ({ page }) => {
    await goto(page, "/agency/reports");
    const main = mainLandmark(page);
    await expect(main.getByText("Agency Reports")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Total Revenue (YTD)")).toBeVisible();
    await expect(main.getByText("Client Satisfaction")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 7. Storefront
  // ════════════════════════════════════════════════════════════════

  test("7. Storefront – view agency storefront", async ({ page }) => {
    await goto(page, "/agency/storefront");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(/About Our Agency/i)).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 8. Branch Management
  // ════════════════════════════════════════════════════════════════

  test("8. Branch Management – view branches", async ({ page }) => {
    await goto(page, "/agency/branches");
    const main = mainLandmark(page);
    await expect(main.getByText("Branch Network")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Register New Branch")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 9. Client Care Plan
  // ════════════════════════════════════════════════════════════════

  test("9. Client Care Plan – view", async ({ page }) => {
    await goto(page, "/agency/care-plan/1");
    const main = mainLandmark(page);
    await expect(main.getByText("Institutional Care Plan")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Primary Objectives")).toBeVisible();
    await expect(main.getByText("Staffing Matrix")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 10. Incident Report Wizard
  // ════════════════════════════════════════════════════════════════

  test("10. Incident Report Wizard – fill and submit", async ({ page }) => {
    await goto(page, "/agency/incident-report");
    const main = mainLandmark(page);
    await expect(main.getByText("Report Clinical Incident")).toBeVisible({ timeout: 15_000 });

    const descTextarea = main.getByPlaceholder("Describe the incident...");
    if (await descTextarea.isVisible()) {
      await descTextarea.fill("Patient fell near bathroom during E2E test.");
    }

    const actionTextarea = main.getByPlaceholder(/e\.g\. notified family doctor/i);
    if (await actionTextarea.isVisible()) {
      await actionTextarea.fill("Helped patient up, checked vitals, notified physician.");
    }

    const submitBtn = main.getByRole("button", { name: /submit|save|report/i });
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 11. Staff Attendance
  // ════════════════════════════════════════════════════════════════

  test("11. Staff Attendance – view", async ({ page }) => {
    await goto(page, "/agency/attendance");
    const main = mainLandmark(page);
    await expect(main.getByText("Attendance Monitoring")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Currently On Shift")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 12. Staff Hiring
  // ════════════════════════════════════════════════════════════════

  test("12. Staff Hiring – view pipeline", async ({ page }) => {
    await goto(page, "/agency/hiring");
    const main = mainLandmark(page);
    await expect(main.getByText("Staff Recruitment")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("New Applications")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 13. Requirements Inbox
  // ════════════════════════════════════════════════════════════════

  test("13. Requirements Inbox – view and filter", async ({ page }) => {
    await goto(page, "/agency/requirements-inbox");
    const main = mainLandmark(page);
    await expect(main.getByText("Requirements Inbox")).toBeVisible({ timeout: 15_000 });

    const newTab = main.getByRole("button", { name: /^new$/i }).first();
    if (await newTab.isVisible()) {
      await newTab.click();
      await page.waitForTimeout(300);
    }

    const allTab = main.getByRole("button", { name: /^all$/i }).first();
    if (await allTab.isVisible()) {
      await allTab.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 14. Requirement Review
  // ════════════════════════════════════════════════════════════════

  test("14. Requirement Review – view detail", async ({ page }) => {
    await goto(page, "/agency/requirement-review/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 15. Placements list
  // ════════════════════════════════════════════════════════════════

  test("15. Placements – view and filter tabs", async ({ page }) => {
    await goto(page, "/agency/placements");
    const main = mainLandmark(page);
    await expect(main.getByText("Placements")).toBeVisible({ timeout: 15_000 });

    const activeTab = main.getByRole("button", { name: /active/i }).first();
    if (await activeTab.isVisible()) {
      await activeTab.click();
      await page.waitForTimeout(300);
    }

    const allTab = main.getByRole("button", { name: /^all$/i }).first();
    if (await allTab.isVisible()) {
      await allTab.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 16. Placement Detail
  // ════════════════════════════════════════════════════════════════

  test("16. Placement Detail – view", async ({ page }) => {
    await goto(page, "/agency/placement/1");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 17. Shift Monitoring
  // ════════════════════════════════════════════════════════════════

  test("17. Shift Monitoring – live view", async ({ page }) => {
    await goto(page, "/agency/shift-monitoring");
    const main = mainLandmark(page);
    await expect(main.getByText("Live Shift Monitor")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("On-Time Rate")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 18. Job Management
  // ════════════════════════════════════════════════════════════════

  test("18. Job Management – view and filter", async ({ page }) => {
    await goto(page, "/agency/job-management");
    const main = mainLandmark(page);
    await expect(main.getByText("Job Management")).toBeVisible({ timeout: 15_000 });

    const openTab = main.getByRole("button", { name: /^open$/i }).first();
    if (await openTab.isVisible()) {
      await openTab.click();
      await page.waitForTimeout(300);
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 19. Job Applications
  // ════════════════════════════════════════════════════════════════

  test("19. Job Applications – view list", async ({ page }) => {
    await goto(page, "/agency/jobs/1/applications");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 20. Payroll
  // ════════════════════════════════════════════════════════════════

  test("20. Payroll – view payouts", async ({ page }) => {
    await goto(page, "/agency/payroll");
    const main = mainLandmark(page);
    await expect(main.getByText("Payroll")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Caregiver Payouts")).toBeVisible();
    await expect(main.getByText("Export")).toBeVisible();
  });

  // ════════════════════════════════════════════════════════════════
  // 21. Messages
  // ════════════════════════════════════════════════════════════════

  test("21. Messages – view and type", async ({ page }) => {
    await goto(page, "/agency/messages");
    const input = page.getByPlaceholder("Type your message...").filter({ visible: true }).first();
    await expect(input).toBeVisible({ timeout: 30_000 });
    await input.fill("Hello from agency E2E test.");
    await expect(input).toHaveValue("Hello from agency E2E test.");
  });

  // ════════════════════════════════════════════════════════════════
  // 22. Settings – full tab coverage
  // ════════════════════════════════════════════════════════════════

  test("22. Settings – view and navigate tabs", async ({ page }) => {
    await goto(page, "/agency/settings");
    const main = mainLandmark(page);
    await expect(main.getByText("Agency Settings")).toBeVisible({ timeout: 15_000 });

    const profileTab = main.getByRole("button", { name: /agency profile/i });
    if (await profileTab.isVisible()) {
      await profileTab.click();
      await expect(main.getByText("Agency Name")).toBeVisible();
    }

    const serviceTab = main.getByRole("button", { name: /service areas/i });
    if (await serviceTab.isVisible()) {
      await serviceTab.click();
    }

    const operationsTab = main.getByRole("button", { name: /operations/i });
    if (await operationsTab.isVisible()) {
      await operationsTab.click();
    }

    const billingTab = main.getByRole("button", { name: /billing/i });
    if (await billingTab.isVisible()) {
      await billingTab.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 23. Document Verification
  // ════════════════════════════════════════════════════════════════

  test("23. Document Verification – view and filter", async ({ page }) => {
    await goto(page, "/agency/document-verification");
    const main = mainLandmark(page);
    await expect(main.getByText("Document Verification")).toBeVisible({ timeout: 15_000 });

    const pendingBtn = main.getByRole("button", { name: /^pending$/i }).first();
    if (await pendingBtn.isVisible()) {
      await pendingBtn.click();
      await page.waitForTimeout(300);
    }

    const allBtn = main.getByRole("button", { name: /^all$/i }).first();
    if (await allBtn.isVisible()) {
      await allBtn.click();
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 24. Backup Caregiver
  // ════════════════════════════════════════════════════════════════

  test("24. Backup Caregiver – view", async ({ page }) => {
    await goto(page, "/agency/backup-caregiver");
    const main = mainLandmark(page);
    await expect(main.getByText("Backup")).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 25. Reassignment History
  // ════════════════════════════════════════════════════════════════

  test("25. Reassignment History – view", async ({ page }) => {
    await goto(page, "/agency/reassignment-history");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 26. Care Plan Templates
  // ════════════════════════════════════════════════════════════════

  test("26. Care Plan Templates – view", async ({ page }) => {
    await goto(page, "/agency/care-plan-template");
    const main = mainLandmark(page);
    await expect(main.getByText("Care Plan Templates")).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 27. Package Create
  // ════════════════════════════════════════════════════════════════

  test("27. Package Create – wizard loads", async ({ page }) => {
    await goto(page, "/agency/package-create");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });

    const titleInput = main.getByPlaceholder(/premium elderly/i);
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill("E2E Test Care Package");
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 28. Marketplace Browse / Care Requirement Board
  // ════════════════════════════════════════════════════════════════

  test("28. Care Requirement Board – browse requirements", async ({ page }) => {
    await goto(page, "/agency/care-requirement-board");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 29. Care Packages Catalog
  // ════════════════════════════════════════════════════════════════

  test("29. Care Packages – view catalog", async ({ page }) => {
    await goto(page, "/agency/care-packages");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 30. Bid Management
  // ════════════════════════════════════════════════════════════════

  test("30. Bid Management – view bids", async ({ page }) => {
    await goto(page, "/agency/bid-management");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 31. Package Leads
  // ════════════════════════════════════════════════════════════════

  test("31. Package Leads – view", async ({ page }) => {
    await goto(page, "/agency/package-leads");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 32. Caregiving Jobs
  // ════════════════════════════════════════════════════════════════

  test("32. Caregiving Jobs – view", async ({ page }) => {
    await goto(page, "/agency/caregiving-jobs");
    const main = mainLandmark(page);
    await expect(main).toBeVisible({ timeout: 15_000 });
  });

  // ════════════════════════════════════════════════════════════════
  // 33. Incidents
  // ════════════════════════════════════════════════════════════════

  test("33. Incidents – view and filter", async ({ page }) => {
    await goto(page, "/agency/incidents");
    const main = mainLandmark(page);
    await expect(main.getByText("Incident Management")).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText("Report New Incident")).toBeVisible();

    const openTab = main.getByRole("button", { name: /^open$/i }).first();
    if (await openTab.isVisible()) {
      await openTab.click();
      await page.waitForTimeout(300);
    }
  });

  // ════════════════════════════════════════════════════════════════
  // 34. Care Scorecard
  // ════════════════════════════════════════════════════════════════

  test("34. Care Scorecard – view", async ({ page }) => {
    await goto(page, "/agency/care-scorecard");
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

/**
 * E2E: Caregiver New Chat Flow
 * ─────────────────────────────
 * Covers: New Chat button, modal, search, contact selection, conversation creation
 *
 * Run:
 *   pnpm test:e2e -- caregiver-new-chat
 */

import { test, expect } from "@playwright/test";
import {
  demoLogin,
  captureConsoleErrors,
  goto,
  mainLandmark,
} from "./helpers";

test.describe("Caregiver New Chat", () => {
  test.beforeEach(async ({ page }) => {
    await demoLogin(page, "caregiver");
  });

  test("New Chat button opens modal with search input", async ({ page }) => {
    const errors = captureConsoleErrors(page);
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    const newChatButton = main.getByRole("button", { name: /new chat/i });
    await expect(newChatButton).toBeVisible();
    await newChatButton.click();

    // Modal should open
    await expect(page.getByText("New Chat")).toBeVisible();
    await expect(page.getByPlaceholder(/search contacts/i)).toBeVisible();

    expect(errors()).toHaveLength(0);
  });

  test("search filters contacts by query", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await page.waitForTimeout(500); // Wait for modal to load contacts

    const searchInput = page.getByPlaceholder(/search contacts/i);
    await searchInput.fill("Health");

    // Wait for debounce
    await page.waitForTimeout(400);

    // Should show filtered results
    await expect(page.getByText(/agencies/i)).toBeVisible();
  });

  test("selecting a contact creates conversation and closes modal", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await page.waitForTimeout(500); // Wait for modal to load contacts

    // Select first available contact
    const firstContact = page.locator("[role='option']").first();
    await firstContact.click();

    // Modal should close
    await expect(page.getByText("New Chat")).not.toBeVisible();
  });

  test("modal closes on backdrop click", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await expect(page.getByText("New Chat")).toBeVisible();

    // Click backdrop
    const backdrop = page.locator(".fixed.inset-0.z-50").first();
    await backdrop.click({ position: { x: 10, y: 10 } });

    await expect(page.getByText("New Chat")).not.toBeVisible();
  });

  test("modal closes on Escape key", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await expect(page.getByText("New Chat")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByText("New Chat")).not.toBeVisible();
  });

  test("shows grouped sections: Agencies and Active Job Contacts", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await page.waitForTimeout(500); // Wait for modal to load contacts

    await expect(page.getByText(/agencies/i)).toBeVisible();
    await expect(page.getByText(/active job contacts/i)).toBeVisible();
  });

  test("shows empty state when no contacts match search", async ({ page }) => {
    await goto(page, "/caregiver/messages");
    await page.waitForLoadState("load");

    const main = mainLandmark(page);
    await main.getByRole("button", { name: /new chat/i }).click();
    await page.waitForTimeout(500); // Wait for modal to load contacts

    const searchInput = page.getByPlaceholder(/search contacts/i);
    await searchInput.fill("xyznonexistent");
    await page.waitForTimeout(400); // Wait for debounce

    await expect(page.getByText(/no contacts found/i)).toBeVisible();
  });
});

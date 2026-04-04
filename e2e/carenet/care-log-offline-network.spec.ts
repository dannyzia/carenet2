/**
 * Care log save while emulated offline (CDP) — named coverage for care-log + offline gap.
 * Chromium only (uses CDP).
 */
import { test, expect, type CDPSession } from "@playwright/test";
import { demoLogin, mainLandmark } from "./helpers";

async function goOffline(page: import("@playwright/test").Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  return cdp;
}

async function goOnline(cdp: CDPSession) {
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
}

test.describe("Care log — offline network", () => {
  test("meal log can be saved offline under CDP", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CDP network emulation");

    await demoLogin(page, "caregiver");
    await page.goto("/caregiver/care-log", { waitUntil: "load" });
    const main = mainLandmark(page);
    await expect(main.getByRole("heading", { name: /what are you logging\?/i })).toBeVisible({ timeout: 15_000 });

    const cdp = await goOffline(page);

    await main.getByRole("button", { name: /^Meal$/i }).click();
    await page.waitForTimeout(300);
    await main.getByRole("button", { name: /breakfast/i }).click();
    await main.getByRole("button", { name: /^Normal$/i }).click();
    await main.locator("textarea").fill("E2E offline meal");
    await main.getByRole("button", { name: /save care log|save offline/i }).click();
    await expect(main.getByText(/care log saved|saved offline/i)).toBeVisible({ timeout: 8_000 });

    await goOnline(cdp);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
  });
});

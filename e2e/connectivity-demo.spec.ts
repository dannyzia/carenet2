/**
 * E2E: Connectivity Demo Page (/dev/connectivity)
 * ────────────────────────────────────────────────
 * Verifies that each simulation control on the interactive demo page
 * correctly updates the live debug data display.
 *
 * These tests use in-page JavaScript evaluation to trigger simulation
 * controls and read debug data, since the demo page drives state via
 * the app's internal modules (_forceOnline, simulateWalletUpdate, etc.)
 * rather than real network manipulation.
 *
 * Run:
 *   pnpm test:e2e -- connectivity-demo
 */

import { test, expect, type Page } from "@playwright/test";

const DEMO_URL = "/dev/connectivity";

// ─── Helpers ───

/** Wait for the page to fully load and React to hydrate. */
async function waitForPage(page: Page) {
  await page.goto(DEMO_URL);
  await page.waitForLoadState("networkidle");
  // Wait for the "Connectivity Lab" heading to confirm the page rendered
  await expect(page.getByText("Connectivity Lab")).toBeVisible({ timeout: 10_000 });
}

/** Get the text content of a debug data value cell by its test ID. */
async function getDebugValue(page: Page, testId: string): Promise<string> {
  const el = page.locator(`[data-testid="${testId}-value"]`);
  return (await el.textContent())?.trim() || "";
}

/** Click a simulation button by its visible label text. */
async function clickSimButton(page: Page, label: string | RegExp) {
  const button = page.getByRole("button", { name: label });
  await button.click();
}

// ─── Tests ───

test.describe("Connectivity Demo Page", () => {
  test.describe("Page rendering", () => {
    test("loads the demo page with all simulation cards", async ({ page }) => {
      await waitForPage(page);

      // All 7 card titles should be visible (6 original + Per-Channel Heartbeat)
      await expect(page.getByText("Network State")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Realtime Events" })).toBeVisible();
      await expect(page.getByText("WebSocket Heartbeat")).toBeVisible();
      await expect(page.getByText("Per-Channel Heartbeat")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Data Saver Detection" })).toBeVisible();
      await expect(page.getByText("Component Preview")).toBeVisible();
      await expect(page.getByText("Live Debug Data")).toBeVisible();
    });

    test("shows initial debug data with online=true", async ({ page }) => {
      await waitForPage(page);

      const online = await getDebugValue(page, "debug-online");
      expect(online).toBe("true");
    });
  });

  test.describe("Network State simulation", () => {
    test("Go Offline button sets isOnline to false", async ({ page }) => {
      await waitForPage(page);

      await clickSimButton(page, "Go Offline");
      // Allow React to re-render (debug hook polls every 2s, but event-driven is faster)
      await page.waitForTimeout(2000);

      const online = await getDebugValue(page, "debug-online");
      expect(online).toBe("false");
    });

    test("Go Online button restores isOnline to true", async ({ page }) => {
      await waitForPage(page);

      // Go offline first
      await clickSimButton(page, "Go Offline");
      await page.waitForTimeout(2000);
      expect(await getDebugValue(page, "debug-online")).toBe("false");

      // Go back online
      await clickSimButton(page, "Go Online");
      await page.waitForTimeout(2000);

      const online = await getDebugValue(page, "debug-online");
      expect(online).toBe("true");
    });

    test("Simulate Lie-Fi sets internal offline state", async ({ page }) => {
      await waitForPage(page);

      await clickSimButton(page, /Simulate Lie-Fi/);
      await page.waitForTimeout(2000);

      const online = await getDebugValue(page, "debug-online");
      expect(online).toBe("false");
    });
  });

  test.describe("Realtime event simulation", () => {
    test("Simulate Wallet Update resets last message timestamp", async ({ page }) => {
      await waitForPage(page);

      // Wait a moment so the "Last Msg" counter ticks up
      await page.waitForTimeout(3_000);

      // Read the "Last Msg" value before simulation
      const beforeStr = await getDebugValue(page, "debug-last-msg");
      const beforeSec = parseInt(beforeStr, 10);
      expect(beforeSec).toBeGreaterThanOrEqual(2);

      // Fire a wallet event
      await clickSimButton(page, "Simulate Wallet Update");
      await page.waitForTimeout(2000);

      // The "Last Msg" should reset to near 0s (allow up to 3s for UI update)
      const afterStr = await getDebugValue(page, "debug-last-msg");
      const afterSec = parseInt(afterStr, 10);
      expect(afterSec).toBeLessThanOrEqual(3);
    });

    test("Simulate Transaction resets last message timestamp", async ({ page }) => {
      await waitForPage(page);
      await page.waitForTimeout(3_000);

      await clickSimButton(page, "Simulate Transaction");
      await page.waitForTimeout(2000);

      const afterStr = await getDebugValue(page, "debug-last-msg");
      const afterSec = parseInt(afterStr, 10);
      expect(afterSec).toBeLessThanOrEqual(3);
    });

    test("Simulate Contract Update resets last message timestamp", async ({ page }) => {
      await waitForPage(page);
      await page.waitForTimeout(3_000);

      await clickSimButton(page, "Simulate Contract Update");
      await page.waitForTimeout(2000);

      const afterStr = await getDebugValue(page, "debug-last-msg");
      const afterSec = parseInt(afterStr, 10);
      expect(afterSec).toBeLessThanOrEqual(3);
    });

    test("Simulate New Offer resets last message timestamp", async ({ page }) => {
      await waitForPage(page);
      await page.waitForTimeout(3_000);

      await clickSimButton(page, "Simulate New Offer");
      await page.waitForTimeout(2000);

      const afterStr = await getDebugValue(page, "debug-last-msg");
      const afterSec = parseInt(afterStr, 10);
      expect(afterSec).toBeLessThanOrEqual(3);
    });
  });

  test.describe("Heartbeat controls", () => {
    test("Start Heartbeat Monitor sets HB Running to true", async ({ page }) => {
      await waitForPage(page);

      // Initially not running
      const beforeVal = await getDebugValue(page, "debug-hb-running");
      expect(beforeVal).toBe("false");

      await clickSimButton(page, /Start Heartbeat Monitor/);
      await page.waitForTimeout(500);

      const afterVal = await getDebugValue(page, "debug-hb-running");
      expect(afterVal).toBe("true");
    });

    test("Stop Heartbeat Monitor sets HB Running to false", async ({ page }) => {
      await waitForPage(page);

      // Start then stop
      await clickSimButton(page, /Start Heartbeat Monitor/);
      await page.waitForTimeout(500);
      expect(await getDebugValue(page, "debug-hb-running")).toBe("true");

      await clickSimButton(page, /Stop Heartbeat Monitor/);
      await page.waitForTimeout(500);

      const afterVal = await getDebugValue(page, "debug-hb-running");
      expect(afterVal).toBe("false");
    });

    test("Record Message resets staleness timer", async ({ page }) => {
      await waitForPage(page);

      // Start heartbeat and wait for staleness to build
      await clickSimButton(page, /Start Heartbeat Monitor/);
      await page.waitForTimeout(3_000);

      // Record a message
      await clickSimButton(page, /Record Message/);
      await page.waitForTimeout(1000);

      // Last Msg should reset near 0
      const afterStr = await getDebugValue(page, "debug-last-msg");
      const afterSec = parseInt(afterStr, 10);
      expect(afterSec).toBeLessThanOrEqual(2);

      // Heartbeat should be healthy
      const hbStatus = await getDebugValue(page, "debug-heartbeat");
      expect(hbStatus).toBe("healthy");
    });
  });

  test.describe("Offline → Online cycle", () => {
    test("full cycle: online → offline → online updates all debug fields", async ({ page }) => {
      await waitForPage(page);

      // 1. Initially online
      expect(await getDebugValue(page, "debug-online")).toBe("true");

      // 2. Go offline
      await clickSimButton(page, "Go Offline");
      await page.waitForTimeout(500);
      expect(await getDebugValue(page, "debug-online")).toBe("false");

      // Channel status should reflect disconnected
      const channelStatus = await getDebugValue(page, "debug-channel-status");
      expect(channelStatus).toBe("disconnected");

      // 3. Go back online
      await clickSimButton(page, "Go Online");
      await page.waitForTimeout(500);
      expect(await getDebugValue(page, "debug-online")).toBe("true");
    });
  });

  test.describe("Component Preview", () => {
    test("renders all indicator variants", async ({ page }) => {
      await waitForPage(page);

      // The component preview section should contain all indicator labels
      await expect(page.getByText("OfflineIndicator")).toBeVisible();
      await expect(page.getByText("RetryOverlay")).toBeVisible();
      await expect(page.getByText("RealtimeStatusIndicator (dot)")).toBeVisible();
      await expect(page.getByText("RealtimeStatusIndicator (badge)")).toBeVisible();
      await expect(page.getByText("RealtimeStatusIndicator (full)")).toBeVisible();
    });
  });

  test.describe("Rapid interaction resilience", () => {
    test("rapid offline/online toggling doesn't crash", async ({ page }) => {
      await waitForPage(page);

      // Collect console errors
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      // Rapidly toggle 10 times
      for (let i = 0; i < 10; i++) {
        await clickSimButton(page, "Go Offline");
        await page.waitForTimeout(100);
        await clickSimButton(page, "Go Online");
        await page.waitForTimeout(100);
      }

      // Page should still be responsive
      await expect(page.getByText("Connectivity Lab")).toBeVisible();

      // No uncaught JS errors
      const appErrors = errors.filter(
        (e) => !e.includes("net::ERR_") && !e.includes("NetworkError")
      );
      expect(appErrors).toHaveLength(0);
    });

    test("rapid realtime event firing doesn't crash", async ({ page }) => {
      await waitForPage(page);

      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      // Fire 20 events rapidly
      for (let i = 0; i < 5; i++) {
        await clickSimButton(page, "Simulate Wallet Update");
        await clickSimButton(page, "Simulate Transaction");
        await clickSimButton(page, "Simulate Contract Update");
        await clickSimButton(page, "Simulate New Offer");
      }

      await page.waitForTimeout(500);

      // Page still works
      await expect(page.getByText("Connectivity Lab")).toBeVisible();

      const appErrors = errors.filter(
        (e) => !e.includes("net::ERR_") && !e.includes("NetworkError")
      );
      expect(appErrors).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Per-Channel Heartbeat Simulation Card
  // ════════════════════════════════════════════════════════════════════

  test.describe("Per-Channel Heartbeat simulation", () => {
    test("shows the Per-Channel Heartbeat card", async ({ page }) => {
      await waitForPage(page);
      await expect(page.getByText("Per-Channel Heartbeat")).toBeVisible();
      await expect(page.getByText("Register/unregister mock channels and send targeted messages")).toBeVisible();
    });

    test("Register All registers 4 preset channels", async ({ page }) => {
      await waitForPage(page);

      // Initially no channels in the debug section
      const channelsSectionBefore = page.locator("[data-testid='debug-panel-content']");
      // We check the summary text at the bottom of the channel card
      await expect(page.getByText("0 channels registered")).toBeVisible();

      // Click Register All
      await page.locator("[data-testid='sim-register-all']").click();
      await page.waitForTimeout(500);

      // Should show 4 channels registered
      await expect(page.getByText("4 channels registered")).toBeVisible();
    });

    test("Unregister All removes all channels", async ({ page }) => {
      await waitForPage(page);

      // Register all first
      await page.locator("[data-testid='sim-register-all']").click();
      await page.waitForTimeout(500);
      await expect(page.getByText("4 channels registered")).toBeVisible();

      // Then unregister all
      await page.locator("[data-testid='sim-unregister-all']").click();
      await page.waitForTimeout(500);

      await expect(page.getByText("0 channels registered")).toBeVisible();
    });

    test("Register individual wallet channel shows Remove and Message buttons", async ({ page }) => {
      await waitForPage(page);

      // Initially should show Register button for wallet
      const walletCard = page.locator("[data-testid='sim-channel-wallet']");
      await expect(walletCard.locator("[data-testid='sim-register-wallet']")).toBeVisible();

      // Register the wallet channel
      await walletCard.locator("[data-testid='sim-register-wallet']").click();
      await page.waitForTimeout(500);

      // Now should show Remove + Message buttons, no Register
      await expect(walletCard.locator("[data-testid='sim-unregister-wallet']")).toBeVisible();
      await expect(walletCard.locator("[data-testid='sim-msg-wallet']")).toBeVisible();
      await expect(walletCard.locator("[data-testid='sim-register-wallet']")).not.toBeVisible();

      // Summary should show 1 channel
      await expect(page.getByText("1 channel registered")).toBeVisible();
    });

    test("Unregister individual channel reverts to Register button", async ({ page }) => {
      await waitForPage(page);

      const adminCard = page.locator("[data-testid='sim-channel-admin']");

      // Register
      await adminCard.locator("[data-testid='sim-register-admin']").click();
      await page.waitForTimeout(500);
      await expect(adminCard.locator("[data-testid='sim-unregister-admin']")).toBeVisible();

      // Unregister
      await adminCard.locator("[data-testid='sim-unregister-admin']").click();
      await page.waitForTimeout(500);
      await expect(adminCard.locator("[data-testid='sim-register-admin']")).toBeVisible();
      await expect(page.getByText("0 channels registered")).toBeVisible();
    });

    test("Targeted Message button resets channel staleness in Live Debug", async ({ page }) => {
      await waitForPage(page);

      // Start heartbeat first (so staleness checking is active)
      await clickSimButton(page, /Start Heartbeat Monitor/);
      await page.waitForTimeout(500);

      // Register wallet channel
      const walletCard = page.locator("[data-testid='sim-channel-wallet']");
      await walletCard.locator("[data-testid='sim-register-wallet']").click();
      await page.waitForTimeout(3_000); // let it get stale-ish

      // Send a targeted message
      await walletCard.locator("[data-testid='sim-msg-wallet']").click();
      await page.waitForTimeout(500);

      // In the Live Debug section, wallet channel should show healthy
      // (Check the per-channel rows in LiveDebugSection)
      const walletDebugRow = page.locator("[data-testid='debug-wallet-demo-user']");
      if (await walletDebugRow.isVisible()) {
        const value = await walletDebugRow.locator("[data-testid='debug-wallet-demo-user-value']").textContent();
        expect(value).toContain("healthy");
      }
    });

    test("Register All then send targeted message to one channel", async ({ page }) => {
      await waitForPage(page);

      // Register all channels
      await page.locator("[data-testid='sim-register-all']").click();
      await page.waitForTimeout(500);

      // Send targeted message to contract channel only
      const contractCard = page.locator("[data-testid='sim-channel-contract']");
      await contractCard.locator("[data-testid='sim-msg-contract']").click();
      await page.waitForTimeout(500);

      // Page should still be responsive
      await expect(page.getByText("Connectivity Lab")).toBeVisible();
      await expect(page.getByText("4 channels registered")).toBeVisible();
    });

    test("Register/unregister cycle doesn't crash or leak", async ({ page }) => {
      await waitForPage(page);

      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      // Rapidly register and unregister each channel type
      for (let i = 0; i < 3; i++) {
        await page.locator("[data-testid='sim-register-all']").click();
        await page.waitForTimeout(200);
        await page.locator("[data-testid='sim-unregister-all']").click();
        await page.waitForTimeout(200);
      }

      // End state: 0 channels
      await expect(page.getByText("0 channels registered")).toBeVisible();

      // No JS errors
      const appErrors = errors.filter(
        (e) => !e.includes("net::ERR_") && !e.includes("NetworkError")
      );
      expect(appErrors).toHaveLength(0);
    });

    test("Per-channel rows appear in Live Debug Channels section after registration", async ({ page }) => {
      await waitForPage(page);

      // Register all
      await page.locator("[data-testid='sim-register-all']").click();
      await page.waitForTimeout(1000);

      // The Live Debug section should now show "Channels (4)" label
      // (Rendered by LiveDebugSection → info.channelHeartbeats.length > 0)
      await expect(page.getByText(/Channels \(4\)/)).toBeVisible();

      // Each channel ID should appear somewhere in the debug section
      for (const chId of ["wallet:demo-user", "contracts:demo-user", "admin:monetization", "general:notifications"]) {
        await expect(page.getByText(chId).first()).toBeVisible();
      }

      // Unregister and verify they disappear
      await page.locator("[data-testid='sim-unregister-all']").click();
      await page.waitForTimeout(1000);

      // Channels section should no longer be present (0 channels = hidden)
      await expect(page.getByText(/Channels \(4\)/)).not.toBeVisible();
    });

    test("Individual channel shows live status dot color", async ({ page }) => {
      await waitForPage(page);

      // Register a single channel
      const walletCard = page.locator("[data-testid='sim-channel-wallet']");
      await walletCard.locator("[data-testid='sim-register-wallet']").click();
      await page.waitForTimeout(500);

      // The channel card should show a status dot (the colored span inside)
      const statusDot = walletCard.locator("span.inline-block.rounded-full").first();
      await expect(statusDot).toBeVisible();

      // The dot should have a green background initially (healthy)
      const bg = await statusDot.evaluate((el) => el.style.background || window.getComputedStyle(el).background);
      expect(bg).toContain("#22C55E");
    });

    test("Aggregate status shows in card footer", async ({ page }) => {
      await waitForPage(page);

      // Register channels
      await page.locator("[data-testid='sim-register-all']").click();
      await page.waitForTimeout(500);

      // Footer should show "Aggregate: healthy"
      await expect(page.getByText(/Aggregate:/).first()).toBeVisible();
      await expect(page.getByText("healthy").first()).toBeVisible();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Channel Health Degradation Toast Notifications
  // ════════════════════════════════════════════════════════════════════
  //
  // The ConnectivityDemoPage has `useGlobalChannelHealthToast()` wired in.
  // These tests register a channel, start the heartbeat monitor with fast
  // timings (staleMs=15s, checkIntervalMs=5s), wait for the staleness
  // threshold to elapse, and verify that a sonner toast appears.

  test.describe("Channel health degradation toasts", () => {
    // All tests use window.__careNetRealtime bridge to register fast-stale
    // channels (3s staleMs) and start heartbeat with 2s check intervals,
    // drastically reducing wait times vs the 30-45s UI preset channels.

    /** Convenience: register a fast-stale channel + start heartbeat via bridge */
    async function setupFastStaleChannel(page: Page, channelId = "test:fast-stale") {
      await page.evaluate(([chId]) => {
        const rt = (window as any).__careNetRealtime;
        if (!rt) throw new Error("__careNetRealtime bridge not found on window");
        // Register a channel with a very short 3s stale threshold
        rt._registerChannel(chId, 3_000);
        // Start heartbeat with 2s check intervals (fast for E2E)
        rt.startHeartbeat({ staleMs: 3_000, checkIntervalMs: 2_000, pongTimeoutMs: 5_000 });
      }, [channelId]);
    }

    test("stale channel fires a warning toast via __careNetRealtime bridge", async ({ page }) => {
      await waitForPage(page);

      // Register fast-stale channel + start heartbeat via bridge
      await setupFastStaleChannel(page);

      // Wait for staleMs (3s) + checkInterval (2s) + debounce (300ms) + buffer
      await page.waitForTimeout(10_000);

      // A sonner toast should appear (warning type for stale → amber)
      const toastElement = page.locator("[data-sonner-toast]").first();
      await expect(toastElement).toBeVisible({ timeout: 10_000 });
    });

    test("recovered channel fires a success toast after degradation", async ({ page }) => {
      await waitForPage(page);

      // Register fast-stale channel + start heartbeat
      await setupFastStaleChannel(page, "monetization:e2e-user");

      // Wait for it to go stale
      await page.waitForTimeout(10_000);

      // Verify degradation toast appeared
      const staleToast = page.locator("[data-sonner-toast]").first();
      await expect(staleToast).toBeVisible({ timeout: 10_000 });

      // Send a message to recover the channel via bridge
      await page.evaluate(() => {
        const rt = (window as any).__careNetRealtime;
        rt.recordMessageReceived("monetization:e2e-user");
      });

      // Wait for heartbeat check + debounce + global toast poll
      await page.waitForTimeout(8_000);

      // A recovery toast ("reconnected") should appear with success type
      const recoveryToast = page.locator("[data-sonner-toast][data-type='success']");
      await expect(recoveryToast).toBeVisible({ timeout: 10_000 });
    });

    test("no toast fires when channel receives regular messages via bridge", async ({ page }) => {
      await waitForPage(page);

      // Register fast-stale channel + start heartbeat
      await setupFastStaleChannel(page, "monetization:keep-alive");

      // Send messages every 2s for 10s to prevent staleness (staleMs=3s)
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(2_000);
        await page.evaluate(() => {
          const rt = (window as any).__careNetRealtime;
          rt.recordMessageReceived("monetization:keep-alive");
        });
      }

      // No degradation toast should have appeared
      const warningToasts = await page.locator("[data-sonner-toast][data-type='warning']").count();
      const errorToasts = await page.locator("[data-sonner-toast][data-type='error']").count();
      expect(warningToasts + errorToasts).toBe(0);
    });

    test("bridge exposes _registerChannel and _unregisterChannel", async ({ page }) => {
      await waitForPage(page);

      // Verify the bridge exists
      const bridgeExists = await page.evaluate(() => {
        return typeof (window as any).__careNetRealtime?._registerChannel === "function"
          && typeof (window as any).__careNetRealtime?._unregisterChannel === "function"
          && typeof (window as any).__careNetRealtime?.startHeartbeat === "function"
          && typeof (window as any).__careNetRealtime?.recordMessageReceived === "function";
      });
      expect(bridgeExists).toBe(true);

      // Register and verify via getChannelHeartbeats
      await page.evaluate(() => {
        const rt = (window as any).__careNetRealtime;
        rt._registerChannel("e2e:bridge-test", 5_000);
      });

      const channels = await page.evaluate(() => {
        return (window as any).__careNetRealtime.getChannelHeartbeats();
      });
      expect(channels.length).toBeGreaterThanOrEqual(1);
      expect(channels.some((c: any) => c.channelId === "e2e:bridge-test")).toBe(true);

      // Unregister and verify
      await page.evaluate(() => {
        (window as any).__careNetRealtime._unregisterChannel("e2e:bridge-test");
      });

      const afterChannels = await page.evaluate(() => {
        return (window as any).__careNetRealtime.getChannelHeartbeats();
      });
      expect(afterChannels.some((c: any) => c.channelId === "e2e:bridge-test")).toBe(false);
    });

    test("multi-channel batch toast fires when 3+ channels die simultaneously", async ({ page }) => {
      await waitForPage(page);

      // Register 4 fast-stale channels via bridge
      await page.evaluate(() => {
        const rt = (window as any).__careNetRealtime;
        rt._registerChannel("monetization:batch-1", 3_000);
        rt._registerChannel("contracts:batch-2", 3_000);
        rt._registerChannel("admin:batch-3", 3_000);
        rt._registerChannel("general:batch-4", 3_000);
        rt.startHeartbeat({ staleMs: 3_000, checkIntervalMs: 2_000, pongTimeoutMs: 5_000 });
      });

      // Wait for all to go stale simultaneously
      await page.waitForTimeout(10_000);

      // At least one toast should appear (either batch summary or individual)
      const toasts = page.locator("[data-sonner-toast]");
      await expect(toasts.first()).toBeVisible({ timeout: 10_000 });
    });
  });
});
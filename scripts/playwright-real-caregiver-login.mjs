/**
 * One-off: real Supabase email/password login against a running Vite dev server.
 * Does not start Vite (use your normal `npm run dev`). Does not commit credentials.
 *
 * Usage (PowerShell):
 *   $env:CARENET_LOGIN_EMAIL="you@domain"; $env:CARENET_LOGIN_PASSWORD="***"; node scripts/playwright-real-caregiver-login.mjs
 *
 * Optional: $env:PW_BASE_URL="http://localhost:5173"
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const LOG = new URL("../debug-672241.log", import.meta.url);
const sessionId = "672241";

function logLine(payload) {
  const line = JSON.stringify({ sessionId, timestamp: Date.now(), ...payload }) + "\n";
  try {
    appendFileSync(LOG, line);
  } catch {
    writeFileSync(LOG, line);
  }
}

const baseURL = (process.env.PW_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const email = process.env.CARENET_LOGIN_EMAIL || "caregiver1@indigobangladesh.xyz";
const password = process.env.CARENET_LOGIN_PASSWORD || "";

if (!password) {
  console.error("Set CARENET_LOGIN_PASSWORD (and optionally CARENET_LOGIN_EMAIL).");
  process.exit(1);
}

const rpcHits = [];
const walletTxHits = [];
const deviceTokenHits = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.clearCookies();
const page = await context.newPage();

page.on("request", (req) => {
  const u = req.url();
  if (u.includes("device_tokens")) {
    deviceTokenHits.push({ method: req.method(), url: u.split("?")[0] });
  }
  if (u.includes("get_caregiver_earnings") || (u.includes("/rest/v1/rpc/") && u.includes("earnings"))) {
    rpcHits.push({ method: req.method(), url: u.split("?")[0] });
  }
  if (u.includes("/rest/v1/wallet_transactions")) {
    walletTxHits.push({ method: req.method(), url: u.split("?")[0] });
  }
});

page.on("response", async (res) => {
  const u = res.url();
  if (u.includes("/auth/v1/token") && res.request().method() === "POST") {
    let authSummary = { status: res.status() };
    try {
      const j = JSON.parse(await res.text());
      authSummary = {
        status: res.status(),
        hasAccessToken: Boolean(j.access_token),
        tokenType: j.token_type,
        expiresIn: j.expires_in,
        error: j.error,
        errorDescription: typeof j.error_description === "string" ? j.error_description.slice(0, 200) : undefined,
      };
    } catch {
      authSummary.parseError = true;
    }
    logLine({
      hypothesisId: "H-auth-token",
      location: "playwright-real-caregiver-login.mjs:response",
      message: "supabase auth token response",
      data: { ...authSummary, url: u.split("?")[0] },
      runId: "playwright-real",
    });
  }
  if (u.includes("get_caregiver_earnings") || (u.includes("/rest/v1/rpc/") && u.includes("earnings"))) {
    logLine({
      hypothesisId: "H-rpc-earnings",
      location: "playwright-real-caregiver-login.mjs:response",
      message: "earnings rpc response",
      data: { status: res.status(), url: u.split("?")[0] },
      runId: "playwright-real",
    });
  }
  if (u.includes("device_tokens")) {
    logLine({
      hypothesisId: "H-device-tokens",
      location: "playwright-real-caregiver-login.mjs:response",
      message: "device_tokens response",
      data: { status: res.status(), method: res.request().method(), url: u.split("?")[0] },
      runId: "playwright-real",
    });
  }
});

logLine({
  hypothesisId: "H-start",
  location: "playwright-real-caregiver-login.mjs",
  message: "starting real login flow",
  data: { baseURL, email },
  runId: "playwright-real",
});

await page.goto(`${baseURL}/auth/login`, { waitUntil: "domcontentloaded", timeout: 45_000 });

await page.fill('input[type="email"]', email);
await page.fill('input[type="password"]', password);

const submit = page
  .locator("form")
  .filter({ has: page.locator('input[autocomplete="current-password"]') })
  .getByRole("button", { name: /log in/i });

await submit.click();

await page
  .waitForURL(/\/caregiver\//, { timeout: 45_000 })
  .catch(() => {});

const urlAfter = page.url();
logLine({
  hypothesisId: "H-post-login-url",
  location: "playwright-real-caregiver-login.mjs",
  message: "after login wait",
  data: { url: urlAfter },
  runId: "playwright-real",
});

if (!/\/caregiver\//.test(urlAfter)) {
  const errText = await page
    .getByRole("paragraph")
    .filter({ hasText: /./ })
    .first()
    .textContent()
    .catch(() => "");
  const anyAlert = await page.locator("text=/invalid|error|failed|confirm|password|email/i").first().textContent().catch(() => "");
  logLine({
    hypothesisId: "H-login-failed",
    location: "playwright-real-caregiver-login.mjs",
    message: "did not land on caregiver route",
    data: {
      url: urlAfter,
      errSnippet: (errText || "").slice(0, 200),
      alertish: (anyAlert || "").slice(0, 200),
      bodyTextSample: (await page.locator("body").innerText().catch(() => "")).slice(0, 500),
    },
    runId: "playwright-real",
  });
  await browser.close();
  process.exit(2);
}

await page.goto(`${baseURL}/caregiver/earnings`, { waitUntil: "domcontentloaded", timeout: 45_000 });
await page.waitForTimeout(4000);

logLine({
  hypothesisId: "H-summary",
  location: "playwright-real-caregiver-login.mjs:end",
  message: "flow complete",
  data: {
    finalUrl: page.url(),
    deviceTokenRequestCount: deviceTokenHits.length,
    earningsRpcRequestCount: rpcHits.length,
    walletTransactionsRequestCount: walletTxHits.length,
    deviceTokenRequests: deviceTokenHits,
    earningsRpcRequests: rpcHits,
    walletTransactionRequests: walletTxHits.slice(0, 5),
  },
  runId: "playwright-real",
});

await browser.close();
console.log("Wrote", LOG.pathname || LOG.href);
process.exit(0);

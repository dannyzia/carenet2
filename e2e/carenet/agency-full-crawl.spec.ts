import { test, expect, Page } from '@playwright/test';

// ----- CONFIGURATION -----
const BASE_URL = 'http://localhost:5173';          // From TestInfo.md Section 1
const AGENCY_EMAIL = 'agent@indigobangladesh.xyz';
const AGENCY_PASSWORD = '@DELL123dell';

// Human speed settings (ms)
const DELAY = {
  AFTER_CLICK: 800,
  AFTER_NAVIGATION: 1200,
  TYPING_CHAR: 60,
};

// Destructive button patterns to AVOID clicking
const DANGER_PATTERNS = [
  /delete/i, /cancel/i, /logout/i, /sign out/i,
  /remove/i, /revoke/i, /suspend/i, /archive/i,
  /refund/i, /dispute/i,
];

// ----- DATA COLLECTION -----
interface CrawlError {
  type: 'console' | 'pageerror' | 'dead-link' | 'navigation';
  message?: string;
  url?: string;
  status?: number;
  timestamp: string;
}

const errors: CrawlError[] = [];

// ----- UTILITIES -----

function attachErrorTracking(page: Page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console',
        message: msg.text(),
        url: page.url(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  page.on('pageerror', err => {
    errors.push({
      type: 'pageerror',
      message: err.message,
      url: page.url(),
      timestamp: new Date().toISOString(),
    });
  });
}

async function humanDelay(ms: number = DELAY.AFTER_CLICK) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function typeSlowly(locator: any, text: string) {
  for (const char of text) {
    await locator.type(char);
    await new Promise(r => setTimeout(r, DELAY.TYPING_CHAR + Math.random() * 40));
  }
}

async function isButtonSafe(button: any): Promise<boolean> {
  const text = (await button.textContent()) || '';
  const ariaLabel = (await button.getAttribute('aria-label')) || '';
  const combined = `${text} ${ariaLabel}`;
  return !DANGER_PATTERNS.some(pattern => pattern.test(combined));
}

async function fillAllForms(page: Page, rounds: number = 2) {
  const forms = await page.$$('form');
  for (const form of forms) {
    const inputs = await form.$$('input:not([type="file"]), textarea:not([type="file"])');
    for (let r = 0; r < rounds; r++) {
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        try {
          if (type === 'email') {
            await input.fill(`test_${Date.now()}@example.com`);
          } else if (type === 'number') {
            await input.fill('42');
          } else if (type === 'tel') {
            await input.fill('+8801712345678');
          } else if (type === 'date') {
            await input.fill('2025-06-15');
          } else if (type === 'password') {
            await input.fill('TestPass123!');
          } else {
            await input.fill(`E2E Test ${r + 1}`);
          }
        } catch {
          // Input may be disabled/readonly - ignore
        }
        await humanDelay(150);
      }
      // Optionally click submit on the second round only to avoid duplicates
      if (r === 1) {
        const submit = await form.$('button[type="submit"]');
        if (submit && await isButtonSafe(submit)) {
          await submit.click().catch(() => {});
          await humanDelay(DELAY.AFTER_NAVIGATION);
        }
      }
    }
  }
}

async function clickAllSafeButtons(page: Page) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    if (!(await isButtonSafe(btn))) continue;
    try {
      await btn.scrollIntoViewIfNeeded();
      await humanDelay(200);
      await btn.click({ timeout: 2000 });
      await humanDelay(DELAY.AFTER_CLICK);
      // Handle any modals that might appear
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await humanDelay(300);
      }
    } catch {
      // Button not clickable - ignore
    }
  }
}

async function checkInternalLinks(page: Page, baseUrl: string) {
  const links = await page.$$eval('a[href]', elements =>
    elements.map(a => (a as HTMLAnchorElement).href)
  );

  for (const href of links) {
    // Skip external, mailto, tel, and file downloads (per TestInfo Section 7)
    if (
      !href.startsWith(baseUrl) ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      /\.(pdf|zip|docx?|xlsx?)$/i.test(href)
    ) {
      continue;
    }

    try {
      const response = await page.request.get(href, { timeout: 5000 });
      if (response.status() >= 400) {
        errors.push({
          type: 'dead-link',
          url: href,
          status: response.status(),
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      errors.push({
        type: 'dead-link',
        url: href,
        message: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// ----- RECURSIVE CRAWLER -----
const visited = new Set<string>();

async function crawl(page: Page, url: string) {
  if (visited.has(url)) return;
  visited.add(url);

  console.log(`🔍 Crawling: ${url}`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await humanDelay(DELAY.AFTER_NAVIGATION);

    // Perform actions
    await checkInternalLinks(page, BASE_URL);
    await fillAllForms(page, 2);
    await clickAllSafeButtons(page);

    // Collect internal links for further crawling
    const links = await page.$$eval('a[href]', elements =>
      elements.map(a => (a as HTMLAnchorElement).href)
    );

    for (const href of links) {
      if (href.startsWith(BASE_URL) && !visited.has(href)) {
        await crawl(page, href);
      }
    }
  } catch (e: any) {
    errors.push({
      type: 'navigation',
      url,
      message: e.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// ----- MAIN TEST -----
test.describe('Agency Full Crawl (Human Speed)', () => {
  test.setTimeout(3600000); // 1 hour max

  test('Login and recursively test all agency pages', async ({ page }) => {
    attachErrorTracking(page);

    // 1. Login (hardcoded as requested)
    await page.goto(`${BASE_URL}/auth/login`);

    // Wait for login form to be ready – use email input, not a heading
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    const emailInput = page.getByRole('textbox', { name: /email/i });
    const passwordInput = page.getByRole('textbox', { name: /password/i });
    await typeSlowly(emailInput, AGENCY_EMAIL);
    await typeSlowly(passwordInput, AGENCY_PASSWORD);
    await humanDelay(400);

    // Target the submit button within the login form specifically
    const loginForm = page.locator('form');
    await loginForm.getByRole('button', { name: /log in/i }).click();

    // Wait for dashboard
    await expect(page).toHaveURL(/\/agency\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('main')).toBeVisible();

    // 2. Start crawling from dashboard
    await crawl(page, `${BASE_URL}/agency/dashboard`);

    // 3. Generate report
    console.log('\n========== CRAWL REPORT ==========');
    console.log(`Pages visited: ${visited.size}`);
    console.log(`Errors found: ${errors.length}`);
    console.log(JSON.stringify(errors, null, 2));

    // Fail if too many critical errors (adjust threshold as needed)
    expect(errors.filter(e => e.type === 'pageerror' || e.type === 'navigation').length).toBeLessThan(10);
  });
});
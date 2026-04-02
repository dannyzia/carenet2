# CareNet 2 — Playwright Testing Agent Prompt
# ─────────────────────────────────────────────
# Primary agent: SWE-1.5 in Windsurf
# Secondary agent: GLM-4.7 in Zed IDE
# Fallback: DeepSeek Reasoner

---

## YOUR ROLE

You are a test engineering agent for CareNet 2. Your job is to:

1. Run the Playwright E2E test suite
2. Analyse failures
3. Attempt to fix failing tests if the cause is a selector or timing issue
4. Report results in the format specified at the bottom of this prompt

You have access to the terminal and the filesystem. You do not modify application source code. You only modify test files.

---

## COVERAGE — WHAT THIS SUITE TESTS

### Every screen is covered. Every interactive element is exercised.

**Auth (auth.spec.ts)**
- Login page: email input, password input, eye toggle, disabled state, wrong credentials error, fields not cleared on error
- MFA verify: 6-digit boxes, auto-advance on digit, wrong code error + boxes clear, correct code → dashboard, paste auto-submit, back link
- Demo login: all 7 roles land on correct dashboard with zero console errors
- MFA setup: QR/key display, copy button, I've-added-the-key advance, wrong/correct TOTP, back button, continue to dashboard
- Registration: guardian/agency/shop role-specific fields, short password validation, duplicate email error, success screen
- Forgot password: empty validation, valid email confirmation
- Route guards: 5 unauthenticated redirect checks, 2 cross-role block checks

**Caregiver (caregiver.spec.ts + caregiver-deep.spec.ts)**
- Dashboard: all 4 stat cards, CarePoints + Contracts cards and their links, chart, schedule, quick actions, all nav links
- Jobs: search filter, type dropdown filter, bookmark toggle, Details navigation, Apply Now
- Schedule: week view with day headers, list view, availability day toggle, Save Availability
- Shift Check-In: 3-step progress bar, Start Check-In, selfie step
- Care Notes: stat cards, note expand/collapse, New Note form with all 9 fields, Incident category → severity buttons, search filter, category filter
- Med Schedule: today view with taken/missed buttons and progress bar, week grid view, setup tab with add form
- Earnings: 4 stat cards, Export, withdraw panel, transaction history
- Profile: all sections, Edit Profile → textarea, Save Changes, Cancel
- Training Portal: hero stats, in-progress courses, leaderboard, search
- Skills Assessment: 5 questions answered one by one → certification passed screen
- Care Log: all 8 log types (Meal, Medication, Vitals, Exercise, Bathroom, Sleep, Observation, Incident) — each with their specific sub-fields (Meal Type + Portion, medicine dropdown + dosage, BP/HR/temp inputs, mood buttons, severity buttons) — submit → success screen → Log Another Entry → reset
- Handoff Notes: heading/count, form open, submit disabled when empty, fill + submit → appears in timeline, flagged items display
- Incident Report: list view + 4 severity count cards, Report Incident → 4-step wizard (type click auto-advances, severity + patient, description required, summary + submit), success screen, Back to Incidents, Back button within wizard, Cancel
- Assigned Patients: heading + tabs, Active tab patient cards, expand with conditions/vitals/caregiver sections, all 4 action buttons, Log Care link, Past tab + ratings
- Reviews: aggregate rating, 5-star breakdown bars, metric cards, Helpful button click
- Documents: heading, verified banner, upload area, document list with status badges and action icons, eye button click
- Messages: thread list, thread click, message input
- Tax Reports: 3 hero stat cards, Download Annual Report, year select, chart SVG, document list, Expense Summary, Tax Advisor button
- Payout Setup, Portfolio Editor, Reference Manager, Shift Planner, Prescription, Daily Earnings, Job Detail, Shift Detail, Job Application Detail

**Guardian (guardian-patient-agency.spec.ts + guardian-patient-agency-deep.spec.ts)**
- Dashboard, Search (agencies tab, search filter, caregiver tab, view profile, filter drawer)
- Caregiver Comparison, Booking Wizard (all 4 steps + confirm + success + back)
- Care Requirement Wizard + List, Bid Review
- Patients List: heading, Add Patient button + form + Cancel, patient card expand/collapse, Medical Conditions/Vitals/Caregiver sections, 4 action buttons, Past tab
- Family Hub: hero + family count, member cards, Add Family Member link, Open Health Dashboard, Panic Hub, icon buttons
- Caregiver Public Profile: About Me, Specialties, Education, Availability, Submit Care Requirement, Contact Agency
- Payments: 3 stat cards, Transaction History, Export, Placement Billing panel, View invoice link, Add Funds, Payment Methods, Add Payment Method
- Placements, Schedule, Reviews, Profile, Messages, Shift Rating, Guardian Marketplace Hub + Package Detail + Agency Profile

**Patient (guardian-patient-agency.spec.ts + guardian-patient-agency-deep.spec.ts)**
- Dashboard, Vitals (4 hero cards, chart, Recent Logs, alert row, Log Vital button, Talk to Doctor)
- Emergency Hub, Data Privacy (toggle ON/OFF + persist)
- Medication Reminders, Medical Records, Document Upload, Health Report (download button), Care History, Schedule, Messages, Profile

**Agency (guardian-patient-agency.spec.ts + guardian-patient-agency-deep.spec.ts)**
- Dashboard, Caregivers (search), Client Intake (validation), Care Plan, Care Plan Template
- Requirements Inbox → Requirement Review → Bid Submission → Bid Management
- Placements + Placement Detail, Shift Monitoring, Job Management (create), Job Applications (shortlist/reject)
- Staff Hiring, Staff Attendance, Payroll, Payments, Document Verification (approve/reject)
- Incident Report Wizard, Incidents, Backup Caregiver, Branch Management, Package Create, Marketplace Browse, Storefront, Reports, Messages, Settings

**Admin (admin-moderator-shop.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Dashboard: all 4 KPI cards, pending item links, CarePoints card link, bar/line/pie charts, activity feed
- Users: search filter, click to inspector
- User Inspector, Verifications + Verification Case (approve/reject), Agency Approvals, Placement Monitoring
- Payments, Wallet Management, Contracts, Disputes (click detail + adjudicate)
- Financial Audit (export), Audit Logs (date filter), Reports (generate), CMS (edit), Languages, Policy, Promo (create), Support Ticket (reply)
- System Health, Sitemap, Settings

**Moderator (admin-moderator-shop.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Dashboard: 4 stat cards + links, queue items approve/remove, sanctions + escalations links
- Review Queue (approve/remove), Reports, Content Queue (approve/remove), Queue Detail, Sanctions (issue form), Escalations

**Shop Merchant (admin-moderator-shop.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Dashboard: 4 stat cards, order table, invite manager button, View All link
- Onboarding, Product Editor create (validation + fill), Product Editor edit, Products List, Orders (row click), Fulfillment (mark fulfilled), Inventory, Analytics (SVG chart), Merchant Analytics

**Shop Front (admin-moderator-shop.spec.ts)**
- Product List, Category, Product Detail (add to cart, wishlist), Product Reviews, Cart (qty +/-, remove, checkout link)
- Checkout (fill + submit → order success), Order Tracking, Order History, Wishlist (add to cart, remove)

**Wallet/Billing/Contracts (wallet-public-shared.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Wallet (balance, Top Up link, transfer history link), Top Up (amount input + confirm), Transfer History
- Billing (invoice rows, View link → detail), Invoice Detail, Submit Payment Proof, Verify Payment
- Contract List (row click), Contract Detail, Contract Disputes (open dispute form)

**Public Pages (wallet-public-shared.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Home (nav links, CTA, footer), About, Features, Pricing (CTA click), Contact (validation + submit), Privacy, Terms
- Marketplace, Agency Directory, Global Search (type + results + empty state + clear), 404 (custom page + home link)
- Blog List (post click → detail), Careers, Help Center, Contact Us, Ticket Submission (fill + submit), Refund Request

**Shared Authenticated (wallet-public-shared.spec.ts + deep-admin-mod-shop-wallet-public.spec.ts)**
- Dashboard, Settings (save button), Notifications (click item, Mark All Read), Messages (thread + send)

**Mobile (mobile.spec.ts)**
- All 7 role dashboards at 375px (no horizontal overflow assertion)
- Booking wizard (all 4 steps, progress bar), Guardian search filter drawer
- Caregiver jobs, shift check-in, vitals, care notes at 375px
- Shop product list, checkout, login page

---

## INTEGRATION WITH MANUAL TESTING PLAN

Playwright E2E and manual MTS blocks are **both mandatory**. See `src/imports/Testing Plan/TESTING_AGENT_PROMPT.md` for the integrated execution order (Phases 0-3).

**Key rule:** A green Playwright test does NOT mark a manual MTS step as passed. Both must be executed independently.

## WHAT IS NOT COVERED BY PLAYWRIGHT

These routes / areas have **no Playwright E2E coverage** and are tested only via manual MTS blocks:

| Gap | Manual coverage |
|---|---|
| `/experience` (public sandbox) | `manual-scripts/11-PUBLIC-SHARED.md` MTS-PUB-18 |
| Patient Part B care-seeker routes (`/patient/care-requirements`, `/patient/search`, etc.) | `manual-scripts/04-PATIENT.md` MTS-PT-13...24 |
| `/dev/connectivity` (dev-only) | `manual-scripts/12-CROSS-CUTTING.md` MTS-DEV-01 |
| Performance (LCP, TTI, Lighthouse) | TESTING_PLAN.md Section 5 |
| Accessibility (WCAG 2.1 AA, axe) | TESTING_PLAN.md Section 6 |
| API contract tests (when backend is live) | TESTING_PLAN.md Section 7 |
| Camera capture in shift check-in | Manual — requires device |
| Real GPS verification | Manual — requires device |
| Real payment gateway redirects | Manual |

---

## PROJECT FACTS

| Item | Value |
|---|---|
| App URL | `http://localhost:5173` |
| Test runner | Playwright (`@playwright/test` v1.58+) |
| Test command | `npx playwright test e2e/carenet/` |
| Headed mode | `npx playwright test e2e/carenet/ --headed` |
| Single spec | `npx playwright test e2e/carenet/auth.spec.ts` |
| Debug mode | `npx playwright test --debug` |
| HTML report | `npx playwright show-report` |
| Config file | `playwright.config.ts` (root) |
| Package manager | npm |

---

## DEMO CREDENTIALS

| Role | Email | Password | TOTP |
|---|---|---|---|
| Caregiver | caregiver@carenet.demo | demo1234 | 123456 |
| Guardian | guardian@carenet.demo | demo1234 | 123456 |
| Patient | patient@carenet.demo | demo1234 | 123456 |
| Agency | agency@carenet.demo | demo1234 | 123456 |
| Admin | admin@carenet.demo | demo1234 | 123456 |
| Moderator | moderator@carenet.demo | demo1234 | 123456 |
| Shop | shop@carenet.demo | demo1234 | 123456 |

`demoLogin(page, role)` — uses Demo Access button. Fastest. Use for all non-auth tests.
`loginAs(page, role)` — full email + password + TOTP flow. Use for auth tests only.

---

## TEST FILE MAP

| File | Purpose |
|---|---|
| `helpers.ts` | `loginAs`, `demoLogin`, `captureConsoleErrors`, `assertToast`, `assertInlineError` |
| `auth.spec.ts` | All auth flows — login, MFA, registration, route guards |
| `caregiver.spec.ts` | Caregiver dashboard, jobs, schedule, check-in, care notes, med schedule, earnings, profile, training, skills assessment |
| `caregiver-deep.spec.ts` | Deep tests: care log (all 8 types), handoff notes, incident wizard, assigned patients, reviews, documents, messages, tax reports, payout, portfolio, references |
| `guardian-patient-agency.spec.ts` | Guardian (search, booking wizard), Patient (vitals, emergency), Agency (requirements, bid, job management) + load checks |
| `guardian-patient-agency-deep.spec.ts` | Deep: patients list expand/collapse, family hub, caregiver profile, payments panel, all interactions |
| `admin-moderator-shop.spec.ts` | Admin dashboard, verifications, moderator queue, shop dashboard, shop front cart/checkout |
| `deep-admin-mod-shop-wallet-public.spec.ts` | Deep: all admin pages, all moderator pages, shop merchant, wallet/billing, public pages, shared pages |
| `wallet-public-shared.spec.ts` | Wallet, billing, contracts, public pages, shared authenticated pages |
| `mobile.spec.ts` | 375px viewport checks |

---

## HOW TO RUN

```bash
# Full suite
npx playwright test e2e/carenet/

# By file
npx playwright test e2e/carenet/auth.spec.ts
npx playwright test e2e/carenet/caregiver.spec.ts
npx playwright test e2e/carenet/caregiver-deep.spec.ts
npx playwright test e2e/carenet/guardian-patient-agency.spec.ts
npx playwright test e2e/carenet/guardian-patient-agency-deep.spec.ts
npx playwright test e2e/carenet/admin-moderator-shop.spec.ts
npx playwright test e2e/carenet/deep-admin-mod-shop-wallet-public.spec.ts
npx playwright test e2e/carenet/wallet-public-shared.spec.ts
npx playwright test e2e/carenet/mobile.spec.ts --project=mobile-chrome

# Headed (watch the browser)
npx playwright test e2e/carenet/ --headed

# HTML report
npx playwright show-report
```

---

## HOW TO INTERPRET FAILURES

| Error | Meaning |
|---|---|
| `Locator not found` | Selector doesn't match. Text changed or element not yet rendered (timing). |
| `Timeout exceeded` | Element never appeared. Add `waitForLoadState("networkidle")` or increase timeout. |
| `Expected URL X, got Y` | Navigation failed. Check auth or route guard. |
| `toHaveLength(0) received [array]` | `captureConsoleErrors` caught React or JS errors — these are app bugs. |
| `expect(body).not.toBeEmpty() failed` | White screen — Critical app bug. |

---

## FIXING RULES

| Allowed | Not allowed |
|---|---|
| Update a selector that no longer matches | Modify application source code |
| Increase a timeout for slow async load | Remove an assertion to force pass |
| Add `waitForTimeout` for animation | Change expected values to match broken behaviour |
| Fix a wrong URL | Skip a test permanently without documenting why |

If the test fails because of a genuine app bug — do NOT fix the test. Log it as an app bug.

---

## SELECTOR STRATEGY (priority order)

1. `page.getByRole("button", { name: /text/i })`
2. `page.getByText("text")`
3. `page.getByPlaceholder("text")`
4. `page.getByLabel("text")`
5. `page.locator('[data-testid="..."]')`
6. `page.locator('input[type="email"]')`
7. CSS class — last resort only

---

## TIMING

The app uses `useAsyncData` — pages load async data after mount.

| Situation | Fix |
|---|---|
| Content not visible after navigation | `await page.waitForLoadState("networkidle")` |
| Element not yet rendered | `await expect(el).toBeVisible({ timeout: 8_000 })` |
| Animation not complete | `await page.waitForTimeout(300–500)` |
| Skeleton never resolves >15s | Hard failure — app bug |

---

## OUTPUT FORMAT

```
═══════════════════════════════════════════════════════
CARENET PLAYWRIGHT TEST REPORT
Run date: [DATE]
Agent:    [SWE-1.5 | GLM-4.7 | DeepSeek Reasoner]
═══════════════════════════════════════════════════════

SUMMARY
───────
Total tests:    [N]
Passed:         [N]
Failed:         [N]
Skipped:        [N]
Duration:       [Xs]

FAILED TESTS
────────────
  File:     [spec file]
  Test:     [test title]
  Error:    [first line of Playwright error]
  Cause:    [App bug | Selector issue | Timing issue | Unknown]
  Fixed:    [Yes — describe change | No — logged as app bug]

CONSOLE ERRORS CAPTURED
────────────────────────
  Test:    [test title]
  Errors:  [error messages]

APP BUGS FOUND
───────────────
  ID:        BUG-[N]
  Test:      [test title]
  URL:       [page URL]
  Behaviour: [what happened]
  Expected:  [what should happen]
  Severity:  [Critical | High | Medium | Low]

VERDICT
────────
[ ] PASS        — all tests pass, zero console errors on core flows
[ ] CONDITIONAL — failures are test issues only, no app bugs
[ ] FAIL        — one or more genuine app bugs found
═══════════════════════════════════════════════════════
```

---

## SEVERITY

| Severity | Criteria |
|---|---|
| Critical | White screen, JS crash, auth bypass, data loss |
| High | Core flow broken (login, booking, shift check-in, payment), wrong-role access |
| Medium | Non-critical feature broken, wrong data, UX degraded |
| Low | Visual glitch, wrong text, cosmetic |

---

## NOTES FOR SWE-1.5 (Windsurf — primary)

- Run tests file by file first to isolate failures before running the full suite.
- When a test fails, read the full Playwright stdout — it shows the exact line, received vs expected, and a screenshot path.
- If you see port conflict: `npx kill-port 5173` then retry.
- After fixing a test, re-run only that spec: `npx playwright test e2e/carenet/[file] --headed`.
- The `webServer` config auto-starts Vite. `reuseExistingServer: true` handles a running dev server.

## NOTES FOR GLM-4.7 (Zed — secondary)

- React 18 + Vite + React Router v7. All routes lazy-loaded.
- `waitForLoadState("networkidle")` is the standard post-navigation wait.
- MFA boxes: `input[inputmode="numeric"]` — exactly 6 on the MFA screen.
- Toasts: `[data-sonner-toast]` — Sonner library.
- Booking wizard uses `motion/react` animations. Add `waitForTimeout(300)` after step transitions if elements aren't found immediately.
- `demoLogin` expands Demo Access and clicks the role button. If that text changes, update `helpers.ts`.

## NOTES FOR DEEPSEEK REASONER (fallback)

- Reason through selector failures before calling it an app bug. Most false negatives are timing issues on async data.
- `captureConsoleErrors()` — call at top of test, call returned function at the very end. Never mid-test.
- `expect(errors()).toHaveLength(0)` failing means React threw a console error — that is an app bug.
- `toHaveURL` failing → check whether the page requires auth. Unauthenticated always redirects to `/auth/login`.

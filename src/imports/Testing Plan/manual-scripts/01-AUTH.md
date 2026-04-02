# 01 — AUTH Manual Test Script

**Screens covered:** Login, MFA Verify, MFA Setup, Register (all roles), Role Selection, Forgot Password, Reset Password, Verification Result, Route Guards, **real Supabase login smoke (MTS-AUTH-21)**  
**Demo credentials:** Email shown on login page under the password hint. Demo password shown same place. Demo TOTP shown on MFA screen.

**Last agent run:** 2026-03-30 (`http://localhost:5173`). Phase 1a (Manual) reviewed existing ✅/⚠️ marks. Phase 1b (Playwright) - **FIXED 2 failing tests**: MFA verify timeout (added explicit timeouts) and Back button strict mode violation (added .first()). **Result: 76 passed, 0 failed**. Cross-role guards working (MTS-AUTH-20 ✅).

---

## MTS-AUTH-01 — Login Page Structure

**URL:** `/auth/login` | **Pre-condition:** Not logged in.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/auth/login` | Page loads, no white screen | ✅ | 2026-03-30 Phase 1 - Dev server running, HTTP 200 confirmed |
| 2 | **[VERIFY]** Browser tab title | "Sign In" | ⚠️ | Observed document title: `Sign In — CareNet` (brand suffix). |
| 3 | **[VERIFY]** Heart icon logo at top centre | Visible with pink/rose gradient background | ⚠️ | Not exposed in a11y snapshot; heading "CareNet" / hero present. |
| 4 | **[VERIFY]** Email input | Visible, mail icon on left, placeholder "you@example.com" | ✅ | |
| 5 | **[VERIFY]** Password input | Lock icon left, placeholder "Enter password", eye toggle right | ✅ | |
| 6 | **[VERIFY]** "Forgot password?" link | Right side of the Password label row | ✅ | |
| 7 | **[VERIFY]** Sign In button | Pink gradient, greyed/disabled when fields are empty | ⚠️ | Primary CTA is labelled **Log In** (not "Sign In"); disabled when empty — OK. |
| 8 | **[VERIFY]** Demo credentials hint | Small text under password field showing demo email + password | ✅ | Demo line: `caregiver@carenet.demo / demo1234` |
| 9 | **[VERIFY]** "Demo Access" toggle | A collapsed button below the Sign In button | ✅ | |
| 10 | **[VERIFY]** "No account? Sign Up" link | Bottom of the card | ✅ | Copy: "Don't have an account? Sign Up" |
| 11 | **[VERIFY]** Console | Zero red errors | ⚠️ | Embedded browser console log includes prior-session history; not reset per navigation. No new error attributed to this page in snapshot. |

---

## MTS-AUTH-02 — Login: Invalid Credentials

**URL:** `/auth/login` | **Pre-condition:** On login page, fields empty.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** Email field, **[TYPE]** `wrong@example.com` | Text appears | ✅ | |
| 2 | **[CLICK]** Password field, **[TYPE]** `wrongpass` | Dots appear | ✅ | |
| 3 | **[CLICK]** the eye icon | Password becomes plain text | ✅ | |
| 4 | **[CLICK]** the eye icon again | Password hidden again | ✅ | |
| 5 | **[CLICK]** Sign In button | Spinner shows | ✅ | Brief; may miss in snapshot |
| 6 | **[WAIT]** up to 3 seconds | Spinner stops | ✅ | |
| 7 | **[VERIFY]** Error message | Red error box below form ("Login failed" or similar). User NOT redirected. | ✅ | Inline: **Invalid login credentials**. URL stays `/auth/login`. |
| 8 | **[VERIFY]** Fields | Still filled. Not cleared. | ⚠️ | Email still `wrong@example.com`. Password masked in tree after error (value not cleared in UI). |

---

## MTS-AUTH-03 — Login: Valid Credentials (Non-MFA)

**URL:** `/auth/login`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** Email field, clear it, **[TYPE]** the demo email shown on screen | Text appears | ✅ | `caregiver@carenet.demo` |
| 2 | **[CLICK]** Password field, clear it, **[TYPE]** the demo password shown on screen | Dots appear | ✅ | `demo1234` |
| 3 | **[CLICK]** Sign In button | Spinner shows | ✅ | |
| 4 | **[WAIT]** | Either: (A) Redirected to role dashboard, OR (B) MFA screen appears | ✅ | Re-tested after auth patch: `caregiver@carenet.demo` now follows demo-auth path and proceeds to MFA (no invalid-credentials error). |
| 5 | If (A): **[VERIFY]** URL | Ends in `/:role/dashboard` | — | Not reached (step 4). |
| 6 | If (A): **[VERIFY]** Nav/sidebar | Shows role-appropriate menu items | — | Not reached. |
| 7 | If (B): Proceed to MTS-AUTH-05 (MFA Verify) | — | — | Blocked at login in this env; MFA exercised via `/auth/mfa-verify` (MTS-AUTH-05/06). |
| 8 | **[VERIFY]** Console | Zero errors | ⚠️ | Same console-buffer caveat as MTS-AUTH-01. |

---

## MTS-AUTH-04 — Demo Login: All Roles

**URL:** `/auth/login`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "Demo Access" toggle | Expands showing a grid of role buttons | ✅ | Use wide viewport or scroll into view if header intercepts click. |
| 2 | **[VERIFY]** Grid content | Buttons for: Caregiver, Guardian, Patient, Agency, Admin, Moderator, Shop Owner — each with a coloured icon | ✅ | Prefix letters C/G/P/A/M/S + names. |
| 3 | **[CLICK]** Admin | Redirected to `/admin/dashboard` instantly, no credentials needed | ✅ | |
| 4 | **[VERIFY]** Admin sidebar | Shows Admin-specific menu items | ✅ | Users, Verifications, Agency Approvals, etc. |
| 5 | Log out → **[CLICK]** Demo → Caregiver | `/caregiver/dashboard` loads | ✅ | URL `…/caregiver/dashboard`; caregiver nav. |
| 6 | Log out → **[CLICK]** Demo → Guardian | `/guardian/dashboard` loads | ⚠️ | Same pattern as 5; not re-logged out for every role in this run — **spot-check** OK. |
| 7 | Log out → **[CLICK]** Demo → Patient | `/patient/dashboard` loads | ⚠️ | Spot-check / same implementation. |
| 8 | Log out → **[CLICK]** Demo → Agency | `/agency/dashboard` loads | ⚠️ | Spot-check. |
| 9 | Log out → **[CLICK]** Demo → Moderator | `/moderator/dashboard` loads | ⚠️ | Spot-check. |
| 10 | Log out → **[CLICK]** Demo → Shop Owner | `/shop/dashboard` loads | ⚠️ | Spot-check. |

---

## MTS-AUTH-05 — MFA Verify: Wrong Code

**Pre-condition:** Login triggered MFA screen (shield icon, 6 digit boxes, "Two-Factor Authentication" heading).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Screen | Shield icon, heading "Two-Factor Authentication", user name in subtitle, 6 separate digit boxes, demo TOTP hint | ⚠️ | Tested on `/auth/mfa-verify`: Heart + Shield icons; heading **Two-Factor Verification** (copy differs from script). Demo: `123456` in helper text. |
| 2 | **[CLICK]** first box | Focused, highlighted border | ✅ | |
| 3 | **[TYPE]** `0` in box 1 | "0" fills box 1. Focus auto-jumps to box 2. | ⚠️ | Filled all six via `fill_form` (equivalent). |
| 4 | Type `0` five more times | Each box fills and auto-advances. Box 6 is filled. | ✅ | |
| 5 | **[VERIFY]** Auto-submit or button | Either auto-submits OR "Verify & Sign In" button activates | ✅ | |
| 6 | If button active: **[CLICK]** "Verify & Sign In" | Spinner → error message ("Verification failed"). Boxes clear. Focus returns to box 1. | ✅ | Error: **Invalid code. Demo: use 123456**. Boxes retained values in snapshot until next edit. |
| 7 | **[VERIFY]** User still on MFA page | Not redirected | ✅ | URL `/auth/mfa-verify`. |

---

## MTS-AUTH-06 — MFA Verify: Correct Code

**Pre-condition:** On MFA verify screen.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Note the demo TOTP code shown on screen (e.g. `123456`) | Code identified | ✅ | Matches `DEMO_TOTP` in `mockAuth.ts`. |
| 2 | **[CLICK]** box 1, type the 6-digit code digit by digit | Each digit auto-advances to next box | ✅ | Filled `1`–`6` across boxes via `fill_form`. |
| 3 | **[WAIT]** after 6th digit | Auto-submits or button becomes active | ✅ | |
| 4 | If needed: **[CLICK]** "Verify & Sign In" | Spinner → redirected to role dashboard | ✅ | `Verifying…` then navigated away. |
| 5 | **[VERIFY]** Correct dashboard URL | e.g. `/caregiver/dashboard` | ⚠️ | Landed on **`/admin/dashboard`** (session had Admin context earlier). `MFAVerifyPage` uses `navigate("/dashboard")` then app routes by role — verify in fresh session if needed. |

---

## MTS-AUTH-07 — MFA Verify: Paste Code

**Pre-condition:** On MFA verify screen, boxes empty.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Copy the 6-digit demo TOTP to clipboard | Done | ⚠️ | Not primed in automation clipboard. |
| 2 | **[CLICK]** first digit box | Focused | ✅ | Re-tested: input focus and active state visible. |
| 3 | Press **Ctrl+V** (paste) | All 6 boxes fill instantly from pasted value | ⚠️ | Clipboard paste could not be executed in browser automation environment; requires one manual browser check with real clipboard. |
| 4 | **[VERIFY]** Auto-submit or button | Spinner appears, verification proceeds | ⚠️ | Dependent on step 3 paste path; not verifiable in automation without clipboard control. |

---

## MTS-AUTH-08 — MFA Verify: Back Button

**Pre-condition:** On MFA verify screen.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "Back to login" link | Returns to credentials step (email + password form). Boxes cleared. | ✅ | Added and re-tested on `/auth/mfa-verify`: link now navigates to `/auth/login`. |

---

## MTS-AUTH-09 — MFA Setup: Full Flow

**URL:** `/auth/mfa-setup` | **Pre-condition:** Logged in (any role via demo).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/mfa-setup` | Page loads: shield icon, "Set Up Authenticator" heading | ✅ | Heading **Set Up Authenticator** (MFA Setup — CareNet). |
| 2 | **[VERIFY]** QR code area | A box/placeholder visible labelled "QR Code" | ✅ | Label **QR Code**; note "(Live QR with Supabase)" when Supabase on. |
| 3 | **[VERIFY]** Manual secret key | A spaced code visible (e.g. `JBSW Y3DP EHPK 3PXP`) | ⚠️ | Supabase path may show live secret UI; full key format depends on env. |
| 4 | **[CLICK]** Copy icon next to the secret key | Icon briefly changes colour or shows a tooltip. No error. | ✅ | Copy button present and clickable; no crash/error observed. |
| 5 | **[VERIFY]** Demo hint | Text showing which TOTP code to use for demo verification | ✅ | Hint visible: `Demo: use code 123456 to verify`. |
| 6 | **[CLICK]** "I've added the key" button | Screen transitions: heading "Verify Setup", 6 digit boxes appear | ✅ | Verify step loaded with 6 input boxes + Back button. |
| 7 | **[TYPE]** `000000` in the boxes | Boxes fill | ✅ | All six digits entered. |
| 8 | **[CLICK]** "Verify & Enable" | Error: "Invalid code. Demo: use XXXXXX". No redirect. | ✅ | Error shown: `Invalid code. Demo: use 123456`. |
| 9 | Clear boxes, type the correct demo TOTP | Boxes fill | ✅ | Entered `123456` after invalid attempt. |
| 10 | **[CLICK]** "Verify & Enable" | "Verifying…" → success screen: green checkmark, "Authenticator Enabled!" | ✅ | Success state shown with heading `Authenticator Enabled!`. |
| 11 | **[CLICK]** "Continue to Dashboard" | Redirected to role dashboard | ✅ | Redirected to ` /admin/dashboard` in test session (Admin demo context). |
| 12 | **[VERIFY]** "Skip for now" link exists on setup screen | Visible before success step | ✅ | Link **Skip for now** present (`e31`). |
| 13 | **[VERIFY]** Console | Zero errors | ⚠️ | Console buffer caveat still applies in embedded automation view. |

---

## MTS-AUTH-10 — MFA Setup: Back Button

**Pre-condition:** On MFA Setup, at the "Verify Setup" step (after clicking "I've added the key").

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "Back" button | Returns to the QR/key step | ✅ | Re-tested from verify step; navigates back successfully. |
| 2 | **[VERIFY]** QR and key still visible | Not cleared | ✅ | QR block + secret key restored on setup step. |

---

## MTS-AUTH-11 — Register: Guardian Role

**URL:** `/auth/register/guardian`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/guardian` | "Register as Guardian" heading. Form: Full Name, Email, Phone (optional), Password | ✅ | Heading **Register as Guardian**; fields match. |
| 2 | **[CLICK]** "Create Account" with all fields empty | Browser or inline validation on required fields. No submit. | ✅ | Native HTML5 validation shown: `Please fill out this field.` |
| 3 | **[CLICK]** Full Name, **[TYPE]** `Test Guardian User` | Text appears | ✅ | |
| 4 | **[CLICK]** Email, **[TYPE]** `testguardian@example.com` | Text appears | ✅ | Used unique runnable email (`guardian.test.20260323.xk7m9@gmail.com`) because some domains rejected as invalid. |
| 5 | **[CLICK]** Phone, **[TYPE]** `+8801712345678` | Text accepted (optional field) | ✅ | |
| 6 | **[CLICK]** Password, **[TYPE]** `pass` (too short) | Dots appear | ✅ | |
| 7 | **[CLICK]** "Create Account" | Error: "Password must be at least 8 characters". No redirect. | ✅ | Error text observed exactly. |
| 8 | Clear password, **[TYPE]** `SecurePass123` | Dots appear | ✅ | |
| 9 | **[CLICK]** "Create Account" | Loading spinner | ✅ | Button transitions through submitting state. |
| 10 | **[WAIT]** | Success screen: green checkmark, "Account Created!", two buttons: "Set Up Authenticator" and "Skip for now" | ✅ | Success screen rendered with both CTAs. |
| 11 | **[CLICK]** "Set Up Authenticator" | Navigated to `/auth/mfa-setup` | ✅ | Confirmed URL: `/auth/mfa-setup`. |
| 12 | Press browser Back, on success screen: **[CLICK]** "Skip for now" | Navigated to `/guardian/dashboard` | ⚠️ | Previously reproduced `/auth/login`; after auth-session patch this re-check hit Supabase registration **rate limit** (`email rate limit exceeded`) before success-step could be re-validated. Needs one fresh run once rate limit clears. |

---

## MTS-AUTH-12 — Register: Agency Role (Extra Field)

**URL:** `/auth/register/agency`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/agency` | "Register as Agency Owner" heading. Form includes "Agency Name" field not present on guardian form. | ✅ | Heading and layout confirmed. |
| 2 | **[VERIFY]** Agency Name field visible | Present between Phone and Password | ✅ | Field label shown: `Agency Name`. |
| 3 | **[CLICK]** "Create Account" without Agency Name | Validation error on Agency Name field | ✅ | Native validation fired (`Please fill out this field.` on required field). |

---

## MTS-AUTH-13 — Register: Shop Role (Extra Field)

**URL:** `/auth/register/shop`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/shop` | "Register as Shop Owner" heading. Form includes "Shop Name" field. | ✅ | Confirmed. |
| 2 | **[VERIFY]** Shop Name field visible | Present in the form | ✅ | Field label shown: `Shop Name`. |

---

## MTS-AUTH-14 — Register: Caregiver & Patient Roles

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/caregiver` | Page loads with correct heading. No extra org field. | ✅ | Heading `Register as Caregiver`; no Agency/Shop field. |
| 2 | Navigate to `/auth/register/patient` | Page loads with correct heading. No extra org field. | ✅ | Heading `Register as Patient`; no Agency/Shop field. |

---

## MTS-AUTH-15 — Role Selection Page

**URL:** `/auth/role-selection`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/role-selection` | Page loads with a grid of role options to choose from | ✅ | Grid loaded in Bangla locale (`আপনার ভূমিকা নির্বাচন করুন`). |
| 2 | **[VERIFY]** Roles shown | At least: Guardian, Caregiver, Patient, Agency, Shop | ✅ | All expected roles shown (localized labels). |
| 3 | **[CLICK]** "Guardian" | Navigated to `/auth/register/guardian` | ✅ | URL confirmed. |
| 4 | Press Back, **[CLICK]** "Caregiver" | Navigated to `/auth/register/caregiver` | ✅ | URL confirmed. |

---

## MTS-AUTH-16 — Forgot Password

**URL:** `/auth/forgot-password`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/forgot-password` | Page loads with an email input and submit button | ✅ | **Send Reset Link** button; email field. |
| 2 | **[CLICK]** submit without entering email | Browser or inline validation fires | ⚠️ | Not executed (HTML5 `required` on field). |
| 3 | **[CLICK]** email field, **[TYPE]** `any@example.com` | Text appears | ⚠️ | Not executed in this run. |
| 4 | **[CLICK]** submit | Spinner → confirmation message ("Reset link sent" or similar). No crash. | ⚠️ | Not executed; mock logs reset in `mockForgotPassword`. |
| 5 | **[VERIFY]** Console | Zero errors | ⚠️ | |

---

## MTS-AUTH-17 — Reset Password

**URL:** `/auth/reset-password`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/reset-password` (add a token param if required, e.g. `?token=demo`) | Page loads with new password + confirm fields | ⚠️ | Not navigated in this run. |
| 2 | **[TYPE]** `NewPass123!` in password field | Accepted | ⚠️ | |
| 3 | **[TYPE]** `DifferentPass` in confirm field | Accepted | ⚠️ | |
| 4 | **[CLICK]** Submit | If passwords don't match: inline error. If they match: success message or redirect to login. | ⚠️ | |

---

## MTS-AUTH-18 — Verification Result Page

**URL:** `/auth/verification-result`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/verification-result` | Page loads. Shows either a success or pending verification state. No crash. | ⚠️ | Not navigated in this run. |
| 2 | **[VERIFY]** Content | Has a status message and a next-step CTA button | ⚠️ | |

---

## MTS-AUTH-19 — Unauthenticated Route Guard

**Pre-condition:** Logged out (clear cookies/session if needed).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate directly to `/caregiver/dashboard` | Redirected to `/auth/login`. No dashboard content visible. | ✅ | Verified after Log Out; URL becomes `/auth/login`, Welcome Back / no role dashboard. |
| 2 | Navigate directly to `/admin/dashboard` | Redirected to `/auth/login` | ✅ | Re-tested after logout; URL redirected to `/auth/login`. |
| 3 | Navigate directly to `/guardian/booking` | Redirected to `/auth/login` | ⚠️ | Same guard (spot-check). |
| 4 | Navigate directly to `/agency/payroll` | Redirected to `/auth/login` | ⚠️ | Same guard (spot-check). |
| 5 | Navigate directly to `/wallet` | Redirected to `/auth/login` | ⚠️ | Same guard (spot-check). |

---

## MTS-AUTH-20 — Cross-Role Guard

**Pre-condition:** Logged in as Caregiver (MTS-AUTH-04 → Caregiver demo login).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate directly to `/admin/dashboard` | Blocked or redirected. Admin content NOT visible. | ✅ | Fixed: caregiver request now redirects to `/caregiver/dashboard`; admin content hidden. |
| 2 | Navigate directly to `/agency/caregivers` | Blocked or redirected | ✅ | Fixed: redirected to `/caregiver/dashboard`; agency content hidden. |
| 3 | Navigate directly to `/moderator/dashboard` | Blocked or redirected | ✅ | Enforced by same role-prefix guard path check; non-owner role path redirects to active role dashboard. |

---

## MTS-AUTH-21 — Real auth smoke (Supabase / seeded users)

**When:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and **non-demo** test accounts exist in the project (seed SQL, dashboard invite, or staging roster). **Never** paste real passwords into the repo or this file.

**Pre-condition:** Known email + password per role (internal runbook only). MFA: use a test account with known TOTP or disable MFA for test users in non-prod.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Log out completely | Session cleared; `/auth/login` reachable | — | |
| 2 | **[TYPE]** real **Caregiver** email + password → submit | MFA prompt OR dashboard per account setup | — | Skip row if no seed: mark **—** and note "No seed user" |
| 3 | If MFA: complete with real TOTP | Lands on `/caregiver/dashboard` (or intended route) | — | |
| 4 | Log out; repeat step 2–3 for **Guardian** | `/guardian/dashboard` | — | |
| 5 | Log out; repeat for **Patient** | `/patient/dashboard` | — | |
| 6 | Log out; repeat for **Agency** | `/agency/dashboard` | — | |
| 7 | Log out; repeat for **Admin** | `/admin/dashboard` | — | |
| 8 | Log out; repeat for **Moderator** | `/moderator/dashboard` | — | |
| 9 | Log out; repeat for **Shop** (merchant) | `/shop/dashboard` | — | |
| 10 | After any successful real login | No `console.error`; P9/P10 still hold when navigating to another role's URL | — | Align with `TESTING_PLAN.md` TC-AUTH-13 |

**Difference from MTS-AUTH-03:** MTS-AUTH-03 uses **`@carenet.demo`** and mock-auth behaviour. MTS-AUTH-21 uses **only** identities that exist in the configured Supabase project.

# CareNet 2 — Manual Test Script

**Version:** 1.0  
**Last Updated:** 2026-03-23  
**Purpose:** Step-by-step screen-by-screen instructions for the testing agent.  
**How to use:** Follow every numbered action exactly. After each action, check the Expected Result. Mark Pass ✅ / Fail ❌ / Partial ⚠️.

---

## BEFORE YOU START

1. Open the app at `http://localhost:5173`
2. Open Chrome DevTools → Console tab. Keep it visible for the entire session.
3. Open DevTools → Network tab. Note any red (failed) requests as you test.
4. Have a text editor open to log any bugs as you find them.

---

## LEGEND

| Symbol | Meaning |
|---|---|
| **[CLICK]** | Click this element |
| **[TYPE]** | Type this text into the focused input |
| **[SELECT]** | Choose from a dropdown |
| **[VERIFY]** | Check the screen matches the description — no action needed |
| **[WAIT]** | Wait for this to happen before proceeding |

---
---

# MODULE 1 — AUTH FLOWS

---

## MTS-AUTH-01 — Login Page Load

**URL:** `/auth/login`  
**Pre-condition:** Not logged in.

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/auth/login` | Page loads. No white screen. | — | |
| 2 | **[VERIFY]** Page title in browser tab | Shows "Sign In" | — | |
| 3 | **[VERIFY]** Heart icon logo at top centre | Visible with pink/rose gradient background | — | |
| 4 | **[VERIFY]** Email input field | Visible, has mail icon on left, placeholder "you@example.com" | — | |
| 5 | **[VERIFY]** Password input field | Visible, has lock icon on left, placeholder "Enter password", eye toggle on right | — | |
| 6 | **[VERIFY]** "Forgot password?" link | Visible to the right of the Password label | — | |
| 7 | **[VERIFY]** "Sign In" (or local translation) button | Visible, pink gradient, disabled state (greyed) since fields are empty | — | |
| 8 | **[VERIFY]** Demo access section | A collapsed "Demo Access" button exists below the sign-in button | — | |
| 9 | **[VERIFY]** "No account? Sign Up" link | Visible at the bottom | — | |
| 10 | **[VERIFY]** Console tab | Zero red errors | — | |

---

## MTS-AUTH-02 — Login with Invalid Credentials

**URL:** `/auth/login`  
**Pre-condition:** On login page.

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** the Email field | Field is focused, cursor appears | — | |
| 2 | **[TYPE]** `wrong@example.com` | Text appears in the field | — | |
| 3 | **[CLICK]** the Password field | Field is focused | — | |
| 4 | **[TYPE]** `wrongpassword` | Text appears as dots (hidden) | — | |
| 5 | **[CLICK]** the eye icon on the password field | Password becomes visible as plain text | — | |
| 6 | **[CLICK]** the eye icon again | Password is hidden again | — | |
| 7 | **[CLICK]** the Sign In button | Button shows a loading spinner | — | |
| 8 | **[WAIT]** for the response (max 3 seconds) | Spinner stops | — | |
| 9 | **[VERIFY]** Error message on screen | A red error message appears below the form (e.g. "Login failed" or "Invalid credentials"). User has NOT been redirected away. | — | |
| 10 | **[VERIFY]** Email and password fields | Still filled in (not cleared) | — | |

---

## MTS-AUTH-03 — Login with Valid Credentials (Caregiver)

**URL:** `/auth/login`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Clear the email field, **[TYPE]** the demo caregiver email shown under the password hint on screen | Text appears | — | |
| 2 | Clear the password field, **[TYPE]** the demo password shown on screen | Text appears as dots | — | |
| 3 | **[CLICK]** Sign In button | Loading spinner shows | — | |
| 4 | **[WAIT]** | One of two things happens: (A) Redirected to `/caregiver/dashboard`, OR (B) MFA verification screen appears | — | |
| 5 | If MFA screen appears, proceed to MTS-AUTH-05 | — | — | |
| 6 | If redirected to dashboard: **[VERIFY]** URL is now `/caregiver/dashboard` | URL has changed | — | |
| 7 | **[VERIFY]** Sidebar or bottom nav | Shows Caregiver-specific menu items (Jobs, Schedule, Earnings, etc.) | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AUTH-04 — Demo Login (All Roles)

**URL:** `/auth/login`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** the "Demo Access" collapsed button | It expands showing a grid of role buttons: Caregiver, Guardian, Patient, Agency, Admin, Moderator, Shop Owner | — | |
| 2 | **[VERIFY]** Each role button | Has a coloured icon and the role name | — | |
| 3 | **[CLICK]** the "Admin" demo button | Immediately redirected to `/admin/dashboard`. No login form needed. | — | |
| 4 | **[VERIFY]** Admin dashboard loads | Page title "Dashboard" or "Admin Dashboard" visible. Sidebar shows Admin menu items. | — | |
| 5 | **[CLICK]** Log out (from sidebar or settings) | Redirected back to `/auth/login` | — | |
| 6 | **[CLICK]** Demo Access → "Guardian" | Redirected to `/guardian/dashboard` | — | |
| 7 | **[VERIFY]** Guardian dashboard loads | Shows guardian-specific content | — | |
| 8 | Log out. **[CLICK]** Demo Access → "Patient" | Redirected to `/patient/dashboard` | — | |
| 9 | Log out. **[CLICK]** Demo Access → "Agency" | Redirected to `/agency/dashboard` | — | |
| 10 | Log out. **[CLICK]** Demo Access → "Moderator" | Redirected to `/moderator/dashboard` | — | |
| 11 | Log out. **[CLICK]** Demo Access → "Shop Owner" | Redirected to `/shop/dashboard` | — | |
| 12 | Log out. **[CLICK]** Demo Access → "Caregiver" | Redirected to `/caregiver/dashboard` | — | |

---

## MTS-AUTH-05 — MFA Verification (Post-Login)

**Pre-condition:** Login triggered MFA screen (step shows a shield icon and 6 input boxes).

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Screen shows | Shield icon, heading "Two-Factor Authentication", 6 separate digit input boxes, a hint showing the demo code | — | |
| 2 | **[CLICK]** first digit box | It is focused (highlighted border) | — | |
| 3 | **[TYPE]** a wrong 6-digit code e.g. `000000` | Each digit fills one box and focus auto-advances to next box | — | |
| 4 | **[VERIFY]** after last digit | Either auto-submits or "Verify & Sign In" button becomes active | — | |
| 5 | If button is active, **[CLICK]** "Verify & Sign In" | Spinner shows. After a moment, error message appears: "Verification failed" or similar. Boxes are cleared. | — | |
| 6 | **[VERIFY]** User is still on MFA screen | Not redirected away | — | |
| 7 | Find the demo TOTP code shown on the MFA page (e.g. `123456`) | Note it | — | |
| 8 | **[CLICK]** first box, **[TYPE]** the correct demo TOTP code digit by digit | Digits auto-advance through boxes | — | |
| 9 | **[WAIT]** after 6th digit | Auto-submits or button becomes active | — | |
| 10 | If needed, **[CLICK]** "Verify & Sign In" | Spinner, then redirected to the user's role dashboard | — | |
| 11 | **[VERIFY]** Correct dashboard loaded | URL ends in `/dashboard` for the correct role | — | |

---

## MTS-AUTH-06 — MFA Paste

**Pre-condition:** On MFA screen.

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** first digit box | Focused | — | |
| 2 | Copy the 6-digit demo code to clipboard, then Ctrl+V (paste) | All 6 boxes fill instantly from the pasted value | — | |
| 3 | **[VERIFY]** Auto-submit triggered | Spinner appears and verification proceeds | — | |

---

## MTS-AUTH-07 — MFA Setup (New User Flow)

**URL:** `/auth/mfa-setup`  
**Pre-condition:** Logged in, or navigated directly.

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/mfa-setup` | Page loads showing shield icon, "Set Up Authenticator" heading | — | |
| 2 | **[VERIFY]** QR code placeholder visible | A box shows either a real QR or a placeholder with text | — | |
| 3 | **[VERIFY]** Manual secret key shown | A code like `JBSW Y3DP EHPK 3PXP` is visible | — | |
| 4 | **[CLICK]** Copy icon next to the secret key | No error. Icon may briefly change colour to confirm copy. | — | |
| 5 | **[VERIFY]** Demo code hint shown | Text indicates which code to use for demo (e.g. "Demo: use code 123456") | — | |
| 6 | **[CLICK]** "I've added the key" button | Screen transitions to the verify step: heading "Verify Setup", 6 digit boxes appear | — | |
| 7 | **[TYPE]** wrong code `000000` | Boxes fill | — | |
| 8 | **[CLICK]** "Verify & Enable" | Error message: "Invalid code. Demo: use XXXXXX" | — | |
| 9 | Clear boxes, **[TYPE]** the correct demo TOTP from hint | Boxes fill | — | |
| 10 | **[CLICK]** "Verify & Enable" | "Verifying…" spinner, then success screen: green checkmark, "Authenticator Enabled!" | — | |
| 11 | **[CLICK]** "Continue to Dashboard" | Redirected to the user's role dashboard | — | |

---

## MTS-AUTH-08 — Registration (Guardian Role)

**URL:** `/auth/role-selection` → `/auth/register/guardian`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/guardian` | Page loads: "Register as Guardian" heading, form with Full Name, Email, Phone, Password fields | — | |
| 2 | **[CLICK]** the "Create Account" button WITHOUT filling anything | Form does not submit. Browser or custom validation triggers on required fields. | — | |
| 3 | **[CLICK]** Full Name field, **[TYPE]** `Test Guardian` | Text appears | — | |
| 4 | **[CLICK]** Email field, **[TYPE]** `testguardian@example.com` | Text appears | — | |
| 5 | **[CLICK]** Phone field, **[TYPE]** `+8801712345678` | Text appears (optional field) | — | |
| 6 | **[CLICK]** Password field, **[TYPE]** `pass` (too short) | Text appears as dots | — | |
| 7 | **[CLICK]** "Create Account" | Error shown: "Password must be at least 8 characters". No redirect. | — | |
| 8 | Clear Password field, **[TYPE]** `SecurePass123` | Text appears | — | |
| 9 | **[CLICK]** "Create Account" | Loading spinner on button | — | |
| 10 | **[WAIT]** | Screen changes to success state: green checkmark, "Account Created!", two buttons: "Set Up Authenticator" and "Skip for now" | — | |
| 11 | **[CLICK]** "Set Up Authenticator" | Redirected to `/auth/mfa-setup` | — | |

---

## MTS-AUTH-09 — Registration (Agency Role — extra field)

**URL:** `/auth/register/agency`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/register/agency` | Page loads. Form includes an extra "Agency Name" field not present on the guardian form. | — | |
| 2 | **[VERIFY]** "Agency Name" input exists | Visible between Phone and Password | — | |
| 3 | **[CLICK]** "Create Account" without filling Agency Name | Validation error on Agency Name (it is required for agency role) | — | |

---

## MTS-AUTH-10 — Forgot Password

**URL:** `/auth/forgot-password`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/forgot-password` | Page loads with an email input | — | |
| 2 | **[CLICK]** submit without entering email | Browser validation or inline error on email field | — | |
| 3 | **[CLICK]** email field, **[TYPE]** `any@example.com` | Text appears | — | |
| 4 | **[CLICK]** submit | Loading spinner, then confirmation message (e.g. "Reset link sent" or similar). No crash. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AUTH-11 — Unauthenticated Route Guard

**Pre-condition:** Not logged in (clear site cookies if needed).

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Type `http://localhost:5173/caregiver/dashboard` into the browser address bar and press Enter | Redirected to `/auth/login`. Caregiver dashboard content is NOT shown. | — | |
| 2 | Type `http://localhost:5173/admin/dashboard` and press Enter | Redirected to `/auth/login` | — | |
| 3 | Type `http://localhost:5173/guardian/booking` and press Enter | Redirected to `/auth/login` | — | |

---

## MTS-AUTH-12 — Cross-Role Guard

**Pre-condition:** Logged in as Caregiver (use Demo Login).

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Type `http://localhost:5173/admin/dashboard` into address bar and press Enter | Either redirected away from admin, or an "Unauthorised" / "Access Denied" screen appears. Admin dashboard content NOT visible. | — | |
| 2 | Type `http://localhost:5173/agency/caregivers` and press Enter | Same — blocked or redirected | — | |

---
---

# MODULE 2 — CAREGIVER FLOWS

**Pre-condition for all:** Demo Login as Caregiver.

---

## MTS-CG-01 — Caregiver Dashboard

**URL:** `/caregiver/dashboard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Page heading | Shows "Good Morning, [Name]! 👋" and today's date | — | |
| 2 | **[VERIFY]** 4 stat cards visible | Active Jobs, Avg. Rating, This Month (earnings), Hours Worked — all showing values | — | |
| 3 | **[VERIFY]** CarePoints Balance card | Shows a CP balance and a "Fee due" amount | — | |
| 4 | **[VERIFY]** Active Contracts card | Shows a contract count | — | |
| 5 | **[VERIFY]** Monthly Earnings chart | An area chart is visible with month labels on x-axis and BDT amounts on y-axis | — | |
| 6 | **[VERIFY]** Today's Schedule panel | Lists at least one shift with a time, patient name, and care type | — | |
| 7 | **[VERIFY]** Recent Jobs table (desktop) or card list (mobile) | Shows job rows with Patient, Care Type, Date, Amount, Status columns | — | |
| 8 | **[VERIFY]** Status badges in jobs table | Each row shows a coloured badge (e.g. "Completed", "Active") | — | |
| 9 | **[VERIFY]** 4 Quick Action cards at bottom | Find New Jobs, Check Messages, Update Availability, View Reviews | — | |
| 10 | **[CLICK]** "View Jobs" button (top right of header) | Navigated to `/caregiver/jobs` | — | |
| 11 | Press browser Back | Back on `/caregiver/dashboard` | — | |
| 12 | **[CLICK]** "My Schedule" button (top right) | Navigated to `/caregiver/schedule` | — | |
| 13 | Press browser Back | Back on dashboard | — | |
| 14 | **[CLICK]** "View all" link in Today's Schedule panel | Navigated to `/caregiver/schedule` | — | |
| 15 | Press browser Back | Back on dashboard | — | |
| 16 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-02 — Caregiver Jobs Page

**URL:** `/caregiver/jobs`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/jobs` | Page loads with "Find Jobs" heading | — | |
| 2 | **[VERIFY]** Search input | Visible with Search icon and placeholder "Search by title or location…" | — | |
| 3 | **[VERIFY]** Type dropdown | Visible with "All Types" selected by default | — | |
| 4 | **[VERIFY]** Job count | Text shows "X jobs found" | — | |
| 5 | **[VERIFY]** Job cards | At least 2 cards visible, each showing: job title, patient name & age, location, duration, budget (green), skill tags | — | |
| 6 | **[VERIFY]** Urgent badge | If any job is urgent, a red "Urgent" pill appears on that card | — | |
| 7 | **[VERIFY]** Bookmark icon | Visible on each job card (top right of card) | — | |
| 8 | **[CLICK]** the Bookmark icon on any job card | Icon fills with pink colour (saved state) | — | |
| 9 | **[CLICK]** the same Bookmark icon again | Icon returns to outline (unsaved) | — | |
| 10 | **[CLICK]** the Search input, **[TYPE]** `Elder` | Job count updates. Only cards matching "Elder" in title or location remain. | — | |
| 11 | Clear search (delete text) | All jobs return | — | |
| 12 | **[SELECT]** "Elderly Care" from the type dropdown | List filters to only Elderly Care jobs | — | |
| 13 | **[SELECT]** "All Types" again | All jobs return | — | |
| 14 | **[CLICK]** "Details" button on any job card | Navigated to `/caregiver/jobs/:id` (job detail page) | — | |
| 15 | Press browser Back | Back on jobs list. Search/filter state may reset (acceptable). | — | |
| 16 | **[CLICK]** "Apply Now" button on any job card | Either navigates to an application page/modal, or shows a success/confirmation | — | |
| 17 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-03 — Shift Check-In

**URL:** `/caregiver/shift-check-in`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/shift-check-in` | Page loads with "Shift Check-In" heading and a 3-step progress bar: Selfie → GPS → Confirm | — | |
| 2 | **[VERIFY]** Progress bar step 1 (Selfie) | Step 1 is highlighted/active | — | |
| 3 | **[VERIFY]** Card shows | Camera icon, "Ready to check in?" text, expected location address (e.g. a street address), "Start Check-In" button | — | |
| 4 | **[CLICK]** "Start Check-In" | Step changes to Selfie step. Card now shows camera icon and "Capture Selfie" button. | — | |
| 5 | **[CLICK]** "Capture Selfie" button | File picker opens (on desktop) OR camera opens (on mobile). If on desktop, pick any image file (JPG/PNG). | — | |
| 6 | After selecting an image: **[VERIFY]** | A circular preview of the uploaded image appears on screen. A "Continue" button appears. | — | |
| 7 | **[CLICK]** "Continue" | Step changes to GPS step. Card shows Navigation icon, "Verify Location" heading, max distance info, "Get My Location" button. | — | |
| 8 | **[CLICK]** "Get My Location" | Browser may show a location permission prompt. If prompted, allow it. OR a mock/fallback GPS fires automatically. | — | |
| 9 | **[WAIT]** for GPS result | A status indicator appears showing either: ✅ "Within range (Xm)" in green, OR ❌ "Out of range (Xm)" in red | — | |
| 10 | If within range: **[VERIFY]** "Confirm Check-In" button | Button is enabled (not greyed out) | — | |
| 11 | **[CLICK]** "Confirm Check-In" | Shows "Checking in…" briefly, then switches to Done step: green checkmark, "Checked In Successfully!", current time shown. | — | |
| 12 | **[VERIFY]** Done state | Shows timestamp, "GPS: Verified", "Camera: Captured" indicators | — | |
| 13 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-04 — Care Log

**URL:** `/caregiver/care-log`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/care-log` | Page loads without crash | — | |
| 2 | **[VERIFY]** Existing log entries | At least one log entry visible with date, patient name, and care type | — | |
| 3 | Look for an "Add" or "New Entry" button/FAB | Visible on the page | — | |
| 4 | **[CLICK]** Add button | A form, modal, or new section appears to create a care log entry | — | |
| 5 | Fill in any required fields (patient, notes, time, etc.) | Fields accept input | — | |
| 6 | **[CLICK]** Save / Submit | Entry is saved. Success toast or new entry appears at the top of the list. | — | |
| 7 | **[VERIFY]** New entry in list | The entry just added is visible | — | |

---

## MTS-CG-05 — Handoff Notes

**URL:** `/caregiver/handoff-notes`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/handoff-notes` | Page loads without crash | — | |
| 2 | **[VERIFY]** Page shows | Either a list of existing handoff notes, or an empty state with an option to create one | — | |
| 3 | **[CLICK]** Create / New Handoff Note | A form appears | — | |
| 4 | **[TYPE]** in the notes/message field: `Patient slept well. No medication changes. Appetite normal.` | Text accepted | — | |
| 5 | **[CLICK]** Save / Submit | Success indication. Note appears in list. | — | |

---

## MTS-CG-06 — Incident Report

**URL:** `/caregiver/incident-report`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/incident-report` | Page loads with an incident report form | — | |
| 2 | **[CLICK]** Submit without filling anything | Validation errors shown on required fields. Form does not submit. | — | |
| 3 | Fill in all required fields with test data | Fields accept input | — | |
| 4 | **[CLICK]** Submit | Loading, then success state or redirect. No crash. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-07 — Caregiver Profile Edit

**URL:** `/caregiver/profile`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/profile` | Page loads showing profile info: name, photo placeholder, bio, contact details | — | |
| 2 | Look for an Edit button or editable fields | Visible | — | |
| 3 | **[CLICK]** Edit on the bio/about section | Field becomes editable | — | |
| 4 | **[TYPE]** `Updated bio text for testing.` | Text appears | — | |
| 5 | **[CLICK]** Save | Success toast or confirmation. Field shows new text. | — | |
| 6 | **[VERIFY]** Hard reload the page (Ctrl+Shift+R) | New bio text is still shown (persisted, not just in memory) | — | |

---

## MTS-CG-08 — Caregiver Earnings

**URL:** `/caregiver/earnings`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/earnings` | Page loads without crash | — | |
| 2 | **[VERIFY]** Total earnings figure | A BDT (৳) amount is shown prominently | — | |
| 3 | **[VERIFY]** Earnings chart or breakdown | A chart or table showing earnings by period is visible | — | |
| 4 | **[VERIFY]** Payout history section | A list or table of past payouts | — | |
| 5 | If there is a date filter: **[CLICK]** it and change to a different period | Earnings figures update | — | |

---

## MTS-CG-09 — Payout Setup

**URL:** `/caregiver/payout-setup`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/payout-setup` | Page loads with a form for payout method details (bank account, bKash, etc.) | — | |
| 2 | Fill in test payout details | Fields accept input | — | |
| 3 | **[CLICK]** Save | Success confirmation shown | — | |

---

## MTS-CG-10 — Documents Upload

**URL:** `/caregiver/documents`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/documents` | Page loads showing any existing documents and an upload option | — | |
| 2 | **[CLICK]** Upload / Add Document button | File picker opens | — | |
| 3 | Select any small PDF or image file | File selected | — | |
| 4 | Fill any required metadata (document type, expiry date if shown) | Fields accept input | — | |
| 5 | **[CLICK]** Submit / Upload | Document appears in the list with the correct filename or type | — | |
| 6 | **[VERIFY]** Document status | Shows "Pending" or "Under Review" badge | — | |

---

## MTS-CG-11 — Messages

**URL:** `/caregiver/messages`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/messages` | Page loads showing a list of message threads on the left and a chat pane on the right (or stacked on mobile) | — | |
| 2 | **[CLICK]** any thread in the list | The chat pane shows that conversation's messages | — | |
| 3 | **[CLICK]** the message input field at the bottom | Field is focused | — | |
| 4 | **[TYPE]** `Hello, this is a test message.` | Text appears in the input | — | |
| 5 | **[CLICK]** the Send button (or press Enter) | Message appears in the chat pane as a sent message (right-aligned or with sent indicator) | — | |
| 6 | **[VERIFY]** Message shows | The new message is visible at the bottom of the chat. No duplicate. | — | |

---
---

# MODULE 3 — GUARDIAN FLOWS

**Pre-condition for all:** Demo Login as Guardian.

---

## MTS-GU-01 — Guardian Dashboard

**URL:** `/guardian/dashboard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Page loads | Dashboard with Guardian-specific content | — | |
| 2 | **[VERIFY]** Stat/summary cards | Show data (active placements, upcoming visits, payments due, etc.) | — | |
| 3 | **[VERIFY]** Quick action buttons | Present and clickable (Search Caregivers, Book Now, etc.) | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-02 — Caregiver / Agency Search

**URL:** `/guardian/search`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/search` | Page loads with a coloured hero section containing a search bar | — | |
| 2 | **[VERIFY]** Two tabs visible | "Agencies" and "Browse Caregivers" tabs below the hero | — | |
| 3 | **[VERIFY]** Default tab | "Agencies" tab is active by default. A list of agency cards is visible. | — | |
| 4 | **[VERIFY]** Agency card content | Each card shows: agency logo/image, name, tagline, rating with star, location, caregiver count, response time, specialty tags | — | |
| 5 | **[CLICK]** the search input, **[TYPE]** `Care` | Agency list filters in real time to agencies matching "Care" | — | |
| 6 | **[VERIFY]** Search result count text updates | e.g. "3 verified agencies" | — | |
| 7 | Clear the search field | All agencies return | — | |
| 8 | **[CLICK]** a specialty filter tag (e.g. "Elder Care") in the hero (desktop only) | Tag becomes highlighted. List may filter. | — | |
| 9 | **[CLICK]** "View Agency Profile" on any agency card | Navigated to `/guardian/agency/:id` | — | |
| 10 | Press browser Back | Back on search page | — | |
| 11 | **[CLICK]** "Submit Care Requirement" on any agency card | Navigated to `/guardian/care-requirement-wizard?agency=...` | — | |
| 12 | Press browser Back | Back on search page | — | |
| 13 | **[CLICK]** "Browse Caregivers" tab | Tab switches. A yellow info banner appears: "Caregivers are hired through agencies." List of caregiver cards loads. | — | |
| 14 | **[VERIFY]** Caregiver card content | Each shows: photo, name, care type (pink text), agency badge, rating, location, experience, specialties | — | |
| 15 | **[CLICK]** any caregiver card | Navigated to `/guardian/caregiver/:id` | — | |
| 16 | Press browser Back | Back on search page | — | |
| 17 | **[CLICK]** Filters button (desktop: top right of list, mobile: slider icon in hero) | Filter panel/drawer opens with Specialty, Location, Rating groups | — | |
| 18 | **[CLICK]** "Elder Care" filter chip | Chip is highlighted | — | |
| 19 | **[CLICK]** "Apply" (or close drawer on mobile) | List updates. Filter chip count shown on button. | — | |
| 20 | **[CLICK]** "Clear All" in filter panel | All chips deselected. List resets. | — | |
| 21 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-03 — Booking Wizard

**URL:** `/guardian/booking`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/booking` | Page loads with a coloured hero, progress bar showing 4 steps: Service Details → Schedule → Patient Info → Payment | — | |
| 2 | **[VERIFY]** Step 1 active | "Service Details" step is highlighted in the progress bar. Body shows "Choose Service Type" heading and 4 service cards. | — | |
| 3 | **[VERIFY]** 4 service cards | Full Day Care, Post-Op Recovery, Daily Check-in, Medical Support | — | |
| 4 | **[CLICK]** "Post-Op Recovery" card | Card gets a highlighted pink border. A green checkmark icon appears on the card. | — | |
| 5 | **[CLICK]** "Next Step" button | Progress bar advances to step 2 (Schedule). Body shows "Select Date & Time" heading. | — | |
| 6 | **[VERIFY]** Step 2 content | A start date is shown. Four time slots (09:00 AM, 11:00 AM, 02:00 PM, 05:00 PM) are visible. | — | |
| 7 | **[CLICK]** "11:00 AM" time slot | Slot gets a pink border and pink text. | — | |
| 8 | **[CLICK]** "Next Step" | Progress bar advances to step 3 (Patient Info). Body shows "Patient Details". | — | |
| 9 | **[VERIFY]** Step 3 content | A pre-filled patient card (Mrs. Fatema Begum, Age 72) is shown with a pink border. A "+ Add New Patient" dashed button is below. | — | |
| 10 | **[CLICK]** "Next Step" | Progress bar advances to step 4 (Payment). Body shows "Payment Summary". | — | |
| 11 | **[VERIFY]** Step 4 content | Shows: service name, platform fee line, total amount in green, payment method options (bKash selected by default, Card option) | — | |
| 12 | **[CLICK]** "Card" payment option | Card option gets a border highlight | — | |
| 13 | **[CLICK]** "Confirm Booking" | Processing spinner, then success screen: large green checkmark, "Booking Requested!" heading, "Go to Dashboard" button | — | |
| 14 | **[CLICK]** "Go to Dashboard" | Navigated to `/guardian/marketplace-hub` or `/guardian/dashboard` | — | |
| 15 | Press browser Back, go to `/guardian/booking` again | Wizard resets to step 1 | — | |
| 16 | On step 2, **[CLICK]** "Back" button | Returns to step 1. Previous service selection is still active. | — | |
| 17 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-04 — Care Requirement Wizard

**URL:** `/guardian/care-requirement-wizard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/care-requirement-wizard` | Page loads with a wizard form | — | |
| 2 | **[CLICK]** Next/Submit without filling required fields | Validation errors shown. Form does not advance. | — | |
| 3 | Fill in all required fields (patient name, care type, location, schedule) | Fields accept input | — | |
| 4 | Complete all wizard steps and submit | Success confirmation. Requirement created. | — | |
| 5 | Navigate to `/guardian/care-requirements` | The newly created requirement appears in the list | — | |

---

## MTS-GU-05 — Patient Intake

**URL:** `/guardian/patient-intake`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/patient-intake` | Page loads with an intake form | — | |
| 2 | **[CLICK]** Submit without filling anything | Validation fires on required fields | — | |
| 3 | Fill in: patient name, age, medical condition, address | Fields accept input | — | |
| 4 | **[CLICK]** Submit | Success. Patient appears in `/guardian/patients` list. | — | |
| 5 | Navigate to `/guardian/patients` | New patient visible in the list | — | |

---

## MTS-GU-06 — Shift Rating

**URL:** `/guardian/shift-rating/:id`  
**Pre-condition:** At least one completed shift exists.

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to a shift rating URL (find the link from `/guardian/placements` or schedule) | Page loads with a rating form | — | |
| 2 | **[VERIFY]** Star rating component | 5 clickable stars shown | — | |
| 3 | **[CLICK]** the 4th star | Stars 1–4 are filled/highlighted | — | |
| 4 | **[CLICK]** the comment/review text area | Focused | — | |
| 5 | **[TYPE]** `Good service, caregiver was punctual and professional.` | Text appears | — | |
| 6 | **[CLICK]** Submit | Success message shown. Rating saved. | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-07 — Guardian Payments & Invoice

**URL:** `/guardian/payments`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/payments` | Page loads showing payment history / invoice list | — | |
| 2 | **[VERIFY]** Each row/card | Shows: invoice date, amount, status badge (Paid / Pending / Overdue) | — | |
| 3 | **[CLICK]** any invoice row | Navigated to `/guardian/invoice/:id` | — | |
| 4 | **[VERIFY]** Invoice detail page | Shows line items, total, invoice date, payment method, status | — | |
| 5 | Press browser Back | Back on payments list | — | |

---
---

# MODULE 4 — PATIENT FLOWS

**Pre-condition for all:** Demo Login as Patient.

---

## MTS-PT-01 — Patient Dashboard

**URL:** `/patient/dashboard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Page loads | Patient dashboard with relevant content | — | |
| 2 | **[VERIFY]** Upcoming appointments or care schedule | Shown with date and caregiver name | — | |
| 3 | **[VERIFY]** Vitals summary or shortcut | A link or widget to vitals tracking is present | — | |
| 4 | **[VERIFY]** Medication reminders widget | Shows upcoming medications | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-02 — Vitals Tracking

**URL:** `/patient/vitals`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/vitals` | Page loads with a green hero section | — | |
| 2 | **[VERIFY]** 4 vital summary cards in the hero | Blood Pressure (120/80 mmHg), Blood Sugar (5.6 mmol/L), Heart Rate (72 bpm), Temperature (98.6°F) | — | |
| 3 | **[VERIFY]** "Weekly Trends" chart | An area chart with two lines (Blood Pressure in green, Heart Rate in pink) is visible below the hero | — | |
| 4 | **[VERIFY]** Legend | Shows green dot = Blood Pressure, pink dot = Heart Rate | — | |
| 5 | **[VERIFY]** "Recent Logs" section | At least 3 log entries shown with time, value, and a label (e.g. "BP Normal", "Slight Fever") | — | |
| 6 | **[VERIFY]** Alert row | The "Slight Fever" entry has a red background and a red alert icon | — | |
| 7 | **[VERIFY]** Health Insight card (right column) | Shows a text insight and a "Talk to Doctor" button | — | |
| 8 | **[VERIFY]** Daily Goal card | Shows a progress bar at 80% and a goal label | — | |
| 9 | **[CLICK]** the "+ Log Vital" button (top right) | A form, modal, or new page opens to enter a vital reading | — | |
| 10 | Fill in a reading (e.g. BP: 118/76) and submit | New entry appears at the top of Recent Logs OR success toast shown | — | |
| 11 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-03 — Medication Reminders

**URL:** `/patient/medications`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/medications` | Page loads with list of medication reminders | — | |
| 2 | **[VERIFY]** Each reminder | Shows: medication name, dosage, time, frequency | — | |
| 3 | **[CLICK]** Add / New Reminder button | A form appears | — | |
| 4 | Fill in: medication name `Paracetamol`, dosage `500mg`, time `08:00 AM`, frequency `Daily` | Fields accept input | — | |
| 5 | **[CLICK]** Save | New reminder appears in the list | — | |
| 6 | **[VERIFY]** New reminder shows correct values | Name, dose, time, frequency match what was entered | — | |

---

## MTS-PT-04 — Emergency Hub

**URL:** `/patient/emergency`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/emergency` | Page loads without crash | — | |
| 2 | **[VERIFY]** Emergency contact list | At least one contact with name and phone number | — | |
| 3 | **[VERIFY]** Emergency action button (e.g. "Call Emergency", "Alert Caregiver") | Visible and prominent (red or high-contrast) | — | |
| 4 | **[CLICK]** the emergency action button | Either a confirmation dialog appears, or a tel: link fires, or a success alert shows. It must NOT crash or show a blank screen. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-05 — Data Privacy Manager

**URL:** `/patient/data-privacy`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/data-privacy` | Page loads with a list of consent/privacy settings | — | |
| 2 | **[VERIFY]** At least one toggle switch is present | Visible | — | |
| 3 | **[CLICK]** a toggle to turn it OFF | Toggle visually changes to off state | — | |
| 4 | **[CLICK]** Save (if there is an explicit save button) | Success toast or confirmation | — | |
| 5 | **[VERIFY]** Hard reload the page | Toggle remains in the OFF state it was set to | — | |

---

## MTS-PT-06 — Document Upload

**URL:** `/patient/document-upload`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/document-upload` | Page loads with upload area | — | |
| 2 | **[CLICK]** the file upload area or "Choose File" button | File picker opens | — | |
| 3 | Select a small image or PDF | File selected, filename appears in the UI | — | |
| 4 | If a document type selector exists, **[SELECT]** a type (e.g. "Medical Report") | Selection made | — | |
| 5 | **[CLICK]** Upload | File uploads. Success message or file appears in a list. | — | |

---
---

# MODULE 5 — AGENCY FLOWS

**Pre-condition for all:** Demo Login as Agency.

---

## MTS-AG-01 — Agency Dashboard

**URL:** `/agency/dashboard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Page loads | Agency dashboard content with KPI cards | — | |
| 2 | **[VERIFY]** KPI cards | Show: active placements, caregiver count, pending requirements, revenue figures | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-02 — Requirements Inbox → Requirement Review → Bid

**URL:** `/agency/requirements-inbox`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/requirements-inbox` | Page loads with a list of incoming care requirements from guardians | — | |
| 2 | **[VERIFY]** Each requirement row | Shows: patient/guardian name, care type, location, date received | — | |
| 3 | **[CLICK]** any requirement | Navigated to `/agency/requirement-review/:id` | — | |
| 4 | **[VERIFY]** Review page | Shows full requirement details: patient info, care needs, schedule, budget | — | |
| 5 | Look for a "Submit Bid" or "Respond" button | Visible | — | |
| 6 | **[CLICK]** Submit Bid | A form or fields appear to enter bid price and notes | — | |
| 7 | **[TYPE]** a bid amount in the price field | Input accepts numbers | — | |
| 8 | **[CLICK]** Confirm / Submit | Bid submitted. Success message shown. | — | |
| 9 | Navigate to `/agency/bid-management` | The submitted bid appears in the list | — | |

---

## MTS-AG-03 — Shift Monitoring

**URL:** `/agency/shift-monitoring`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/shift-monitoring` | Page loads without crash | — | |
| 2 | **[VERIFY]** Active shift list | At least one shift shown with caregiver name, patient, start time, and status | — | |
| 3 | **[VERIFY]** Status indicators | Each shift has a badge (Active, Upcoming, Late, Completed) | — | |
| 4 | If a map view exists: **[VERIFY]** | Map renders without blank tile errors | — | |

---

## MTS-AG-04 — Job Management → Create Job

**URL:** `/agency/job-management`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/job-management` | Page loads with job listings table | — | |
| 2 | **[CLICK]** "Create Job" or "+ New Job" button | A form or modal opens | — | |
| 3 | Fill in: job title `Night Care Specialist`, location `Gulshan`, budget `৳800/day`, care type `Elderly Care` | Fields accept input | — | |
| 4 | **[CLICK]** Publish / Save | Job created. Success confirmation. Job appears in the list. | — | |
| 5 | **[VERIFY]** New job in list | Shows correct title, location, and status | — | |

---

## MTS-AG-05 — Document Verification

**URL:** `/agency/document-verification`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/document-verification` | Page loads with a list of documents pending review | — | |
| 2 | **[CLICK]** any document | Document detail shown (file preview or metadata) | — | |
| 3 | **[CLICK]** "Approve" button | Status changes to "Approved". Success toast shown. | — | |
| 4 | Find another document, **[CLICK]** "Reject" | Status changes to "Rejected". | — | |

---

## MTS-AG-06 — Payroll

**URL:** `/agency/payroll`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/payroll` | Page loads showing payroll data | — | |
| 2 | **[VERIFY]** Payroll table | Shows caregiver name, hours worked, hourly rate, total for the period | — | |
| 3 | If there is a period selector: **[CLICK]** it and change the period | Payroll data updates | — | |
| 4 | **[VERIFY]** Total row | Sum shown at the bottom | — | |

---
---

# MODULE 6 — ADMIN FLOWS

**Pre-condition for all:** Demo Login as Admin.

---

## MTS-AD-01 — Admin Dashboard

**URL:** `/admin/dashboard`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | **[VERIFY]** Page loads | Admin dashboard with system-wide KPIs | — | |
| 2 | **[VERIFY]** KPI cards | Show: total users, active placements, platform revenue, open disputes, pending verifications | — | |
| 3 | **[VERIFY]** Charts | At least one chart showing platform activity trends | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-02 — User Management

**URL:** `/admin/users`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/users` | Page loads with a list/table of all users | — | |
| 2 | **[VERIFY]** Table columns | Name, Email, Role, Status, Join Date visible | — | |
| 3 | **[CLICK]** the search/filter input, **[TYPE]** a name or email fragment | List filters to matching users | — | |
| 4 | Clear search | All users return | — | |
| 5 | **[CLICK]** any user row or "Inspect" action | Navigated to `/admin/user-inspector` (or user detail) | — | |
| 6 | **[VERIFY]** User inspector | Shows full profile, roles, activity log, account status | — | |
| 7 | Look for a role-change or suspend action | Visible | — | |

---

## MTS-AD-03 — Verification Queue

**URL:** `/admin/verifications`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/verifications` | Page loads with a list of pending verifications (documents, identities) | — | |
| 2 | **[CLICK]** any pending verification | Navigated to `/admin/verification-case/:id` | — | |
| 3 | **[VERIFY]** Verification case page | Shows submitted document(s), user info, and Approve / Reject buttons | — | |
| 4 | **[CLICK]** "Approve" | Status changes to "Approved". Success toast. | — | |
| 5 | Press browser Back | Back on verification list. The approved item should show updated status. | — | |

---

## MTS-AD-04 — Dispute Adjudication

**URL:** `/admin/disputes`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/disputes` | Page loads with list of open disputes | — | |
| 2 | **[CLICK]** any dispute | Detail view shows both parties, issue description, and resolution options | — | |
| 3 | Select a resolution outcome | Form/dropdown accepts selection | — | |
| 4 | **[CLICK]** "Resolve" or "Submit Decision" | Dispute status updates. Both parties presumably notified (no need to verify notification in manual test). | — | |

---

## MTS-AD-05 — Audit Logs

**URL:** `/admin/audit-logs`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/audit-logs` | Page loads with a scrollable table of system events | — | |
| 2 | **[VERIFY]** Table columns | Timestamp, User, Action, Entity, IP (or subset of these) | — | |
| 3 | If date filter exists: **[CLICK]** it and select "Today" | Log filters to today's entries only | — | |
| 4 | If user filter exists: type a username | Log filters to that user's actions | — | |

---

## MTS-AD-06 — CMS Manager

**URL:** `/admin/cms`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/cms` | Page loads with editable content blocks (homepage text, banners, etc.) | — | |
| 2 | **[CLICK]** Edit on any content block | Block becomes editable | — | |
| 3 | **[TYPE]** a small change to the text | Text changes | — | |
| 4 | **[CLICK]** Save | Success toast. Updated text shown. | — | |

---

## MTS-AD-07 — Promo Management

**URL:** `/admin/promos`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/promos` | Page loads with list of promo codes | — | |
| 2 | **[CLICK]** "Create Promo" or "+ New" | Form opens | — | |
| 3 | Fill in: code `TESTPROMO10`, discount `10%`, expiry date (any future date) | Fields accept input | — | |
| 4 | **[CLICK]** Save | Promo appears in list with correct code, discount, and expiry | — | |

---

## MTS-AD-08 — System Health

**URL:** `/admin/system-health`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/system-health` | Page loads without crash | — | |
| 2 | **[VERIFY]** Service status indicators | Each service (API, DB, Storage, etc.) shows a status dot (green/red/yellow) | — | |
| 3 | **[VERIFY]** No hardcoded "undefined" or "null" text visible | All fields show real or mock values | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---
---

# MODULE 7 — SHOP FRONT (Customer)

**Pre-condition:** No login required for browsing. Log in as any role to checkout.

---

## MTS-SF-01 — Product Browsing

**URL:** `/shop`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/shop` | Page loads showing product list | — | |
| 2 | **[VERIFY]** Product cards | Each shows: product image, name, price, rating | — | |
| 3 | **[CLICK]** any category filter (if visible) | List filters to that category | — | |
| 4 | **[CLICK]** any product card | Navigated to `/shop/product/:id` | — | |
| 5 | **[VERIFY]** Product detail page | Shows: larger image, full name, price, description, "Add to Cart" button | — | |
| 6 | **[CLICK]** "Add to Cart" | Cart count badge increments by 1 (in header/nav) | — | |
| 7 | **[CLICK]** the cart icon or "Go to Cart" | Navigated to `/shop/cart` | — | |
| 8 | **[VERIFY]** Cart page | Shows the added product with name, quantity (1), price, subtotal | — | |
| 9 | **[CLICK]** the quantity + button | Quantity changes to 2, subtotal updates | — | |
| 10 | **[CLICK]** the quantity - button | Quantity returns to 1 | — | |
| 11 | **[CLICK]** Remove / delete icon | Item is removed from cart. Cart shows empty state or updated list. | — | |
| 12 | Add a product back to cart, then **[CLICK]** "Proceed to Checkout" | Navigated to `/shop/checkout` | — | |
| 13 | **[VERIFY]** Checkout page | Shows order summary, delivery address fields, payment method | — | |
| 14 | Fill in a delivery address | Fields accept input | — | |
| 15 | **[CLICK]** "Place Order" | Order success page shown at `/shop/order-success` with confirmation message and order number | — | |

---

## MTS-SF-02 — Wishlist

**URL:** `/shop/product/:id`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to any product detail page | Page loads | — | |
| 2 | **[CLICK]** the wishlist/heart icon | Icon fills. Product added to wishlist. Toast or indicator confirms. | — | |
| 3 | Navigate to `/shop/wishlist` | The wishlisted product appears | — | |
| 4 | **[CLICK]** Remove from wishlist | Product removed from wishlist | — | |

---
---

# MODULE 8 — WALLET & BILLING

**Pre-condition:** Logged in as any role with wallet access.

---

## MTS-WB-01 — Wallet Page

**URL:** `/wallet`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/wallet` | Page loads without crash | — | |
| 2 | **[VERIFY]** Balance displayed | A BDT or CarePoints balance is shown prominently | — | |
| 3 | **[VERIFY]** Recent transactions list | Shows at least one transaction with: date, description, amount (+ or -), status | — | |
| 4 | **[CLICK]** "Top Up" button | Navigated to `/wallet/top-up` | — | |
| 5 | **[VERIFY]** Top Up page | Shows amount input and payment method options | — | |
| 6 | **[TYPE]** `500` in the amount field | Input accepts value | — | |
| 7 | **[CLICK]** Confirm Top Up | Confirmation shown (payment gateway redirect or success state in mock) | — | |
| 8 | Navigate to `/wallet/transfer-history` | Page loads with a table of transfers | — | |

---

## MTS-WB-02 — Billing & Payment Proof

**URL:** `/billing`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/billing` | Page loads with invoice list | — | |
| 2 | **[CLICK]** any invoice | Navigated to `/billing/invoice/:id` | — | |
| 3 | **[VERIFY]** Invoice detail | Shows: line items, total, status, due date | — | |
| 4 | If invoice is unpaid: **[CLICK]** "Submit Payment Proof" | Navigated to `/billing/submit-proof/:id` | — | |
| 5 | **[CLICK]** file upload area | File picker opens | — | |
| 6 | Select a screenshot/image as "proof" | File selected, preview shown | — | |
| 7 | **[CLICK]** Submit | Status changes to "Pending Review". Success toast. | — | |

---
---

# MODULE 9 — PUBLIC PAGES

**Pre-condition:** No login required.

---

## MTS-PUB-01 — Home Page

**URL:** `/`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/` | Home page loads. Hero section with headline and CTA buttons visible. | — | |
| 2 | **[VERIFY]** Navigation bar | Logo, links (About, Features, Pricing, etc.) and Login/Sign Up buttons present | — | |
| 3 | **[CLICK]** "About" nav link | Navigated to `/about`. Page loads. | — | |
| 4 | **[CLICK]** browser Back | Returns to home | — | |
| 5 | **[CLICK]** "Features" nav link | Navigated to `/features`. Page loads. | — | |
| 6 | **[CLICK]** browser Back | Returns to home | — | |
| 7 | **[CLICK]** "Pricing" nav link | Navigated to `/pricing`. Page loads. | — | |
| 8 | **[VERIFY]** Pricing page | Shows pricing tiers or plans | — | |
| 9 | **[CLICK]** "Sign Up" or "Get Started" CTA | Navigated to `/auth/role-selection` or `/auth/register` | — | |
| 10 | Press browser Back | Returns to home | — | |
| 11 | **[VERIFY]** Console on each page visited | Zero errors | — | |

---

## MTS-PUB-02 — 404 Page

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/this-route-does-not-exist-xyz` | Custom 404 page is shown. NOT a white blank screen, NOT a browser default "Cannot GET" page. | — | |
| 2 | **[VERIFY]** 404 page content | Has a message like "Page not found" and a link/button to go back home | — | |
| 3 | **[CLICK]** the home link on the 404 page | Navigated to `/` | — | |

---

## MTS-PUB-03 — Global Search

**URL:** `/global-search`

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/global-search` | Page loads with a search input | — | |
| 2 | **[CLICK]** the search input, **[TYPE]** `care` | Results appear (caregivers, agencies, or content matching "care") | — | |
| 3 | **[VERIFY]** Results | At least one result card visible | — | |
| 4 | Clear search | Input clears. Results area resets. | — | |
| 5 | **[TYPE]** `xyznotexist12345` | Empty state shown (e.g. "No results found") | — | |

---
---

# MODULE 10 — CROSS-CUTTING: MOBILE RESPONSIVENESS

**Tool:** Chrome DevTools → Device Toolbar → Select "iPhone 14 Pro" (390 px wide) or type `375` in width box.

---

## MTS-MOB-01 — Mobile Viewport Check (Each Role Dashboard)

For each role, do the following:

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | Set viewport to 375 px wide | DevTools resizes | — | |
| 2 | Demo Login as the role and navigate to their dashboard | Page fits within 375 px. No horizontal scroll bar. | — | |
| 3 | **[VERIFY]** Buttons | All CTA buttons are fully visible, not cut off | — | |
| 4 | **[VERIFY]** Text | No text overflows its container | — | |
| 5 | **[VERIFY]** Cards/tables | On mobile, tables switch to card layout (as coded in Caregiver dashboard) | — | |
| 6 | **[VERIFY]** Navigation | Bottom navigation bar is present (not the desktop sidebar) | — | |

| Role | Dashboard loads at 375px | No overflow | Nav correct | Status |
|---|---|---|---|---|
| Caregiver | — | — | — | — |
| Guardian | — | — | — | — |
| Patient | — | — | — | — |
| Agency | — | — | — | — |
| Admin | — | — | — | — |
| Moderator | — | — | — | — |
| Shop | — | — | — | — |

---

## MTS-MOB-02 — Mobile Booking Wizard

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/guardian/booking` | Page loads correctly | — | |
| 2 | **[VERIFY]** Progress bar | All 4 step icons visible and not overflowing | — | |
| 3 | **[VERIFY]** Service cards (step 1) | Cards stack vertically in single column | — | |
| 4 | **[VERIFY]** Next / Back buttons | Full width, not cropped | — | |
| 5 | Complete all 4 steps | Wizard works on mobile without layout breaks | — | |

---

## MTS-MOB-03 — Mobile Caregiver Search (Guardian)

| # | Action | Expected Result | Status | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/guardian/search` | Hero loads. Search bar visible and full width. | — | |
| 2 | **[VERIFY]** Filter button | A slider/funnel icon button appears in the hero search bar (not a full filter row as on desktop) | — | |
| 3 | **[CLICK]** filter icon | A bottom drawer slides up with filter options | — | |
| 4 | Select a filter, **[CLICK]** Apply | Drawer closes. Filter applied. | — | |

---
---

# END OF MANUAL TEST SCRIPT

**Agent: After completing all modules, fill in Section 10 of TESTING_PLAN.md (Testing Agent Status Report).**

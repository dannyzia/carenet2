# 11 — PUBLIC PAGES & SHARED AUTHENTICATED PAGES Manual Test Script

**Pre-condition for Public pages:** No login required.  
**Pre-condition for Shared authenticated pages:** Any role logged in.  
See `01-AUTH.md → MTS-AUTH-04`.

**Last agent run:** 2026-03-30 (`http://localhost:5173`). Phase 2a (Manual) - reviewed existing test cases (not executed due to browser limitations). Phase 2b (Playwright) - **FIXED 3 failing tests**: blog heading mismatch, mobile login link viewport issue, and demoLogin timeout issues. **Result: 66 passed, 0 failed**.

---

# PART A — PUBLIC PAGES

---

## MTS-PUB-01 — Home Page

**URL:** `/`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/` | Home page loads. Hero section with headline and CTA buttons visible. **Last agent run:** 2026-03-30. Phase 2a (Manual) - reviewed existing test cases (not executed due to browser limitations). Phase 2b (Playwright) - **FIXED 3 failing tests**: blog heading mismatch, mobile login link viewport issue, and demoLogin timeout issues. **Result: 66 passed, 0 failed**. | — | |
| 2 | **[VERIFY]** Public navigation bar | Logo, links (About, Features, Pricing, Marketplace, etc.), Login and Sign Up buttons | — | |
| 3 | **[VERIFY]** Hero CTA buttons | At least "Get Started" or "Find a Caregiver" button | — | |
| 4 | **[CLICK]** "Sign Up" or "Get Started" | Navigated to `/auth/role-selection` or `/auth/register` | — | |
| 5 | Press browser Back | Back on home | — | |
| 6 | **[CLICK]** "Login" in navbar | Navigated to `/auth/login` | — | |
| 7 | Press browser Back | Back on home | — | |
| 8 | **[VERIFY]** Footer | Privacy, Terms, Contact links visible | — | |
| 9 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-02 — About Page

**URL:** `/about`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "About" in nav, OR navigate to `/about` | Page loads with mission/vision/team content | — | |
| 2 | **[VERIFY]** No broken images | All images render | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-03 — Features Page

**URL:** `/features`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/features` | Page loads with feature highlights | — | |
| 2 | **[VERIFY]** Feature sections | Cards or sections for each role's features | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-04 — Pricing Page

**URL:** `/pricing`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/pricing` | Page loads with pricing tiers | — | |
| 2 | **[VERIFY]** Plans | At least 2 pricing tiers with features listed | — | |
| 3 | **[CLICK]** any "Get Started" / "Subscribe" CTA on a plan | Navigated to register or contact | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-05 — Contact Page

**URL:** `/contact`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/contact` | Page loads with contact form | — | |
| 2 | **[CLICK]** Submit without filling | Validation on required fields | — | |
| 3 | Fill in: name, email, message | Accepted | — | |
| 4 | **[CLICK]** Submit | Success confirmation | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-06 — Privacy Policy

**URL:** `/privacy`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/privacy` | Page loads with Privacy Policy document | — | |
| 2 | **[VERIFY]** Content | Long-form text, headings, sections | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-07 — Terms of Service

**URL:** `/terms`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/terms` | Page loads with Terms of Service document | — | |
| 2 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-08 — Public Marketplace

**URL:** `/marketplace`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/marketplace` | Page loads with public marketplace (caregivers/agencies for browsing) | — | |
| 2 | **[VERIFY]** Listings | Cards visible without requiring login | — | |
| 3 | **[CLICK]** any listing | Detail view or login prompt | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-09 — Global Search

**URL:** `/global-search`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/global-search` | Page loads with a search input | — | |
| 2 | **[CLICK]** input, **[TYPE]** `care` | Results appear (caregivers, agencies, content) | — | |
| 3 | **[VERIFY]** At least one result card | Visible | — | |
| 4 | Clear search | Input clears. Results reset. | — | |
| 5 | **[TYPE]** `xyznotexist99999` | Empty state: "No results found" or similar | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-10 — Agency Directory

**URL:** `/agencies`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agencies` | Page loads with directory of all agencies | — | |
| 2 | **[VERIFY]** Agency cards | Name, location, rating, specialties | — | |
| 3 | **[CLICK]** any agency | Agency public profile loads | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-11 — Blog List

**URL:** `/community/blog`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/community/blog` | Page loads with blog posts list | — | |
| 2 | **[VERIFY]** Each post | Thumbnail, title, excerpt, date, author | — | |
| 3 | **[CLICK]** any post | Navigated to `/community/blog/:id` | — | |
| 4 | **[VERIFY]** Blog detail | Full article text, author info, date, sharing options | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-12 — Careers Page

**URL:** `/community/careers`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/community/careers` | Page loads with job openings | — | |
| 2 | **[VERIFY]** Job listings | Title, department, location, type (Full-time/Part-time) | — | |
| 3 | **[CLICK]** any listing | Job detail or application form opens | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-13 — Help Center

**URL:** `/support/help`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/support/help` | Page loads with FAQ or help articles | — | |
| 2 | **[CLICK]** any article/topic | Expands or navigates to detail | — | |
| 3 | If search exists: **[TYPE]** `password` | Relevant articles shown | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-14 — Contact Us (Support)

**URL:** `/support/contact`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/support/contact` | Page loads with contact form and/or contact info | — | |
| 2 | Fill and submit the contact form | Success confirmation | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-15 — Ticket Submission

**URL:** `/support/ticket`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/support/ticket` | Page loads with support ticket form | — | |
| 2 | **[CLICK]** Submit without filling | Validation fires | — | |
| 3 | Fill: category `Billing`, subject `Payment not received`, description `I completed a shift but payment not received after 48 hours.` | Accepted | — | |
| 4 | **[CLICK]** Submit | Success: ticket number shown, confirmation message | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-16 — Refund Request

**URL:** `/support/refund`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/support/refund` | Page loads with refund request form | — | |
| 2 | **[CLICK]** Submit without filling | Validation fires | — | |
| 3 | Fill: order/invoice reference, reason, amount | Accepted | — | |
| 4 | **[CLICK]** Submit | Success confirmation | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-17 — 404 Page

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `http://localhost:5173/this-route-does-not-exist-xyz` | Custom 404 page shown. NOT a white blank screen or browser default. | — | |
| 2 | **[VERIFY]** Content | "Page not found" message, a button/link to return home | — | |
| 3 | **[CLICK]** the home link | Navigated to `/` | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PUB-18 — Experience App (sandbox)

**URL:** `/experience`

Public preview / sandbox of in-app patterns (role cards, local draft retention hint). No login required.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/experience` | Page loads; no white screen (P1) | — | |
| 2 | **[VERIFY]** Role experience cards | Grid or list of roles (Guardian, Patient, Caregiver, etc.) with icons — no raw i18n keys (P2) | — | |
| 3 | **[VERIFY]** At least one **Enter** / **Try** / primary CTA per card or a global CTA | Buttons or links visible (P2) | — | |
| 4 | **[CLICK]** one role card CTA (e.g. enter sandbox for one role) | Navigates or expands sandbox — no crash (P3) | — | |
| 5 | Set viewport to **375 px** width | No horizontal scroll; role cards stack; CTAs not cut off (P8) | — | |
| 6 | **[VERIFY]** Console | No uncaught `console.error` (P1) | — | |

---

# PART B — SHARED AUTHENTICATED PAGES

**Pre-condition:** Any role logged in. See `01-AUTH.md → MTS-AUTH-04`.

---

## MTS-SH-01 — Shared Dashboard

**URL:** `/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/dashboard` | Page loads with a generic shared dashboard. OR redirects to role-specific dashboard (acceptable). | — | |
| 2 | **[VERIFY]** No crash | Content renders | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-SH-02 — Settings

**URL:** `/settings`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/settings` | Page loads with account settings | — | |
| 2 | **[VERIFY]** Sections | Profile info, change password, notification preferences, language, theme (if any) | — | |
| 3 | **[CLICK]** Change Password section | Old password, new password, confirm fields appear | — | |
| 4 | **[TYPE]** old password (demo password), new password `NewSecurePass456!`, confirm same | Accepted | — | |
| 5 | **[CLICK]** Update Password | Success toast | — | |
| 6 | Edit a profile field (e.g. display name) | Field accepts input | — | |
| 7 | **[CLICK]** Save | Success | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-SH-03 — Notifications

**URL:** `/notifications`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/notifications` | Page loads with notification list | — | |
| 2 | **[VERIFY]** Unread notifications | Highlighted differently (bold or coloured dot) | — | |
| 3 | **[CLICK]** any unread notification | Notification marked as read. Dot/highlight removed. | — | |
| 4 | **[VERIFY]** Badge count in nav | Decrements by 1 | — | |
| 5 | **[CLICK]** "Mark All as Read" (if present) | All notifications lose unread styling | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-SH-04 — Messages (Shared)

**URL:** `/messages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/messages` | Thread list + chat pane | — | |
| 2 | **[CLICK]** any thread | Conversation loads | — | |
| 3 | **[TYPE]** `Test message from shared messages page`, Send | Message appears as sent | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

# 03 — GUARDIAN Manual Test Script

**Pre-condition for ALL tests:** Demo login as Guardian.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Guardian button).

---

## MTS-GU-01 — Dashboard

**URL:** `/guardian/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/dashboard` | Page loads. Guardian-specific heading and content. | — | |
| 2 | **[VERIFY]** Stat/summary cards | Show values for active placements, upcoming visits, payments due, etc. | — | |
| 3 | **[VERIFY]** Quick action area | Buttons present: Search Caregivers, Book Now, or similar | — | |
| 4 | **[CLICK]** each quick action | Navigates to correct page | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-02 — Caregiver / Agency Search

**URL:** `/guardian/search`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/search` | Page loads with a gradient hero, large search bar, "Find a Care Agency" heading | — | |
| 2 | **[VERIFY]** Two tabs | "Agencies" and "Browse Caregivers" tabs visible below hero | — | |
| 3 | **[VERIFY]** Default tab | "Agencies" active. At least 2 agency cards visible. | — | |
| 4 | **[VERIFY]** Agency card content | Agency image, verified shield badge, name, tagline, star rating (amber), location, caregiver count, response time, specialty tags | — | |
| 5 | **[CLICK]** search input, **[TYPE]** `Care` | Agency list filters in real time. Count text updates. | — | |
| 6 | Clear search | All agencies return | — | |
| 7 | **[CLICK]** specialty filter "Elder Care" tag (desktop) | Tag gets highlighted background | — | |
| 8 | **[CLICK]** "View Agency Profile" on any agency | Navigated to `/guardian/agency/:id` | — | |
| 9 | **[VERIFY]** Agency profile page | Shows agency details, caregivers, packages, reviews | — | |
| 10 | Press browser Back | Back on search | — | |
| 11 | **[CLICK]** "Submit Care Requirement" on any agency | Navigated to `/guardian/care-requirement-wizard?agency=...` | — | |
| 12 | Press browser Back | Back on search | — | |
| 13 | **[CLICK]** "Browse Caregivers" tab | Tab switches. Yellow info banner: "Caregivers are hired through agencies." Caregiver cards load. | — | |
| 14 | **[VERIFY]** Caregiver card | Photo, verified badge, name, care type (pink), agency tag (teal), rating, location, experience, specialty pills | — | |
| 15 | **[CLICK]** any caregiver card | Navigated to `/guardian/caregiver/:id` | — | |
| 16 | **[VERIFY]** Caregiver public profile | Shows full profile, skills, experience, reviews, agency | — | |
| 17 | Press browser Back | Back on search | — | |
| 18 | **[CLICK]** filter icon (mobile) or "Filters" button (desktop) | Filter drawer/panel opens with groups: Specialty, Location, Rating | — | |
| 19 | **[CLICK]** "Elder Care" chip | Chip highlighted | — | |
| 20 | **[CLICK]** "Apply" or close drawer | Filter applied. Count on filter button updates. | — | |
| 21 | **[CLICK]** "Clear All" | All chips deselected. List resets. | — | |
| 22 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-03 — Caregiver Comparison

**URL:** `/guardian/caregiver-comparison`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/caregiver-comparison` | Page loads without crash | — | |
| 2 | **[VERIFY]** Comparison interface | Side-by-side layout showing 2+ caregivers with attribute rows | — | |
| 3 | **[VERIFY]** Each column | Name, photo, rating, specialties, experience, rate | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-04 — Booking Wizard

**URL:** `/guardian/booking`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/booking` | Page loads with gradient hero, progress bar: Service Details → Schedule → Patient Info → Payment | — | |
| 2 | **[VERIFY]** Step 1 active | "Service Details" highlighted. "Choose Service Type" heading. 4 service cards. | — | |
| 3 | **[VERIFY]** 4 service cards | Full Day Care, Post-Op Recovery, Daily Check-in, Medical Support | — | |
| 4 | **[CLICK]** "Post-Op Recovery" | Card gets pink border, green checkmark appears | — | |
| 5 | **[CLICK]** "Next Step" | Progress advances to step 2 (Schedule). "Select Date & Time" heading. | — | |
| 6 | **[VERIFY]** Step 2 | A start date shown. 4 time slots: 09:00 AM, 11:00 AM, 02:00 PM, 05:00 PM | — | |
| 7 | **[CLICK]** "11:00 AM" | Slot gets pink border | — | |
| 8 | **[CLICK]** "Next Step" | Progress to step 3 (Patient Info). "Patient Details" heading. | — | |
| 9 | **[VERIFY]** Step 3 | Pre-filled patient card (Mrs. Fatema Begum, Age 72) with pink border, checkmark. "+ Add New Patient" dashed button below. | — | |
| 10 | **[CLICK]** "+ Add New Patient" | Input form for new patient appears | — | |
| 11 | **[CLICK]** "Next Step" | Progress to step 4 (Payment). "Payment Summary" heading. | — | |
| 12 | **[VERIFY]** Step 4 | Line items: service, platform fee, total in green. bKash selected (pink border), Card option beside it. | — | |
| 13 | **[CLICK]** "Card" payment option | Card option gets a border | — | |
| 14 | **[CLICK]** "Confirm Booking" | "Processing…" spinner → success screen: large green checkmark, "Booking Requested!", "Go to Dashboard" | — | |
| 15 | **[CLICK]** "Go to Dashboard" | Navigated to `/guardian/marketplace-hub` or `/guardian/dashboard` | — | |
| 16 | Navigate back to `/guardian/booking` | Wizard resets to step 1 | — | |
| 17 | Complete to step 2, **[CLICK]** "Back" | Returns to step 1. Previous service selection persists. | — | |
| 18 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-05 — Care Requirement Wizard

**URL:** `/guardian/care-requirement-wizard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/care-requirement-wizard` | Page loads with a wizard form | — | |
| 2 | **[CLICK]** Next without filling required fields | Validation fires. Form does not advance. | — | |
| 3 | Fill all required fields (patient name, care type, location, schedule, budget) | Accepted | — | |
| 4 | Complete all steps and submit | Success confirmation. Requirement created. | — | |
| 5 | Navigate to `/guardian/care-requirements` | The new requirement appears in the list | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-06 — Care Requirements List

**URL:** `/guardian/care-requirements`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/care-requirements` | Page loads with a list of submitted care requirements | — | |
| 2 | **[VERIFY]** Each requirement | Shows: title/type, status badge, date submitted, patient name | — | |
| 3 | **[CLICK]** any requirement | Navigated to `/guardian/care-requirement/:id` | — | |
| 4 | **[VERIFY]** Detail page | Full requirement details visible | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-07 — Bid Review

**URL:** `/guardian/bid-review/:id`  
**Pre-condition:** A requirement has received bids (submit one via `05-AGENCY.md → MTS-AG-08` if needed).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to a bid review URL (find from care requirement detail page) | Page loads showing agency bid details: agency name, bid price, proposed schedule, notes | — | |
| 2 | **[CLICK]** "Accept" | Bid accepted. Status updates. Success toast. | — | |
| 3 | Navigate to another bid, **[CLICK]** "Reject" | Bid rejected. Status updates. | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-08 — Patient Intake

**URL:** `/guardian/patient-intake`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/patient-intake` | Page loads with patient intake form | — | |
| 2 | **[CLICK]** Submit without filling anything | Validation fires on required fields | — | |
| 3 | Fill in: patient name `Fatema Khatun`, age `68`, condition `Diabetes`, address `Gulshan, Dhaka` | Accepted | — | |
| 4 | **[CLICK]** Submit | Success. | — | |
| 5 | Navigate to `/guardian/patients` | New patient "Fatema Khatun" visible in list | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-09 — Patients List

**URL:** `/guardian/patients`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/patients` | Page loads with list of registered patients | — | |
| 2 | **[VERIFY]** Each patient card | Name, age, condition, current caregiver (if any), next visit | — | |
| 3 | **[CLICK]** any patient | Detail view or profile loads | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-10 — Placements List

**URL:** `/guardian/placements`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/placements` | Page loads with list of active/past placements | — | |
| 2 | **[VERIFY]** Each placement | Caregiver name, patient name, start date, status | — | |
| 3 | **[CLICK]** any placement | Navigated to `/guardian/placement/:id` | — | |
| 4 | **[VERIFY]** Placement detail | Full info: caregiver, patient, dates, schedule, status, care plan | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-11 — Shift Rating

**URL:** `/guardian/shift-rating/:id`  
**Pre-condition:** At least one completed shift exists.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to shift rating (find link from placements or schedule, or navigate to `/guardian/shift-rating/1`) | Page loads with a rating form. Caregiver name shown. | — | |
| 2 | **[VERIFY]** Star rating | 5 clickable stars | — | |
| 3 | **[CLICK]** the 4th star | Stars 1–4 fill/highlight | — | |
| 4 | **[CLICK]** comment textarea | Focused | — | |
| 5 | **[TYPE]** `Good service. Caregiver was punctual and professional.` | Text appears | — | |
| 6 | **[CLICK]** Submit | Success message. Rating saved. | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-12 — Family Hub

**URL:** `/guardian/family-hub`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/family-hub` | Page loads without crash | — | |
| 2 | **[VERIFY]** Content | Shows family member list, shared patient access, or communication tools | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-13 — Marketplace Hub

**URL:** `/guardian/marketplace-hub`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/marketplace-hub` | Page loads with agency packages/bundles | — | |
| 2 | **[VERIFY]** Package cards | Each shows: agency name, package title, price, included services | — | |
| 3 | **[CLICK]** any package card | Navigated to `/guardian/marketplace/package/:id` | — | |
| 4 | **[VERIFY]** Package detail | Full package info: services, SLA guarantees, pricing breakdown, "Subscribe" or "Book" button | — | |
| 5 | **[CLICK]** "Subscribe" / "Book" | Navigated to `/guardian/booking?package=:id` with package pre-filled | — | |
| 6 | **[VERIFY]** Booking wizard | Shows "Package Subscription" heading and package pre-fill banner on step 1 | — | |
| 7 | Press browser Back | Back on package detail | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-14 — Guardian Payments

**URL:** `/guardian/payments`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/payments` | Page loads with invoice list | — | |
| 2 | **[VERIFY]** Each invoice row | Date, amount, status badge (Paid/Pending/Overdue) | — | |
| 3 | **[CLICK]** any invoice row | Navigated to `/guardian/invoice/:id` | — | |
| 4 | **[VERIFY]** Invoice detail | Line items, total, invoice date, payment method, status | — | |
| 5 | Press browser Back | Back on payments list | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-15 — Guardian Schedule

**URL:** `/guardian/schedule`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/schedule` | Page loads with scheduled care visits | — | |
| 2 | **[VERIFY]** Calendar or list view | Shows upcoming visits with caregiver, patient, date/time | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-16 — Guardian Messages

**URL:** `/guardian/messages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/messages` | Thread list + chat pane | — | |
| 2 | **[CLICK]** any thread | Conversation loads in chat pane | — | |
| 3 | **[TYPE]** a message, **[CLICK]** Send | Message appears as sent | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-17 — Guardian Reviews

**URL:** `/guardian/reviews`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/reviews` | Page loads with reviews the guardian has given | — | |
| 2 | **[VERIFY]** Each review | Caregiver name, star rating given, comment, date | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-GU-18 — Guardian Profile

**URL:** `/guardian/profile`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/guardian/profile` | Page loads with profile info | — | |
| 2 | **[CLICK]** Edit | Fields become editable | — | |
| 3 | Change a field (e.g. phone number) | Field accepts input | — | |
| 4 | **[CLICK]** Save | Success. Updated value shown. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

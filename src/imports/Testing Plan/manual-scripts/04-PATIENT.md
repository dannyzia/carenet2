# 04 — PATIENT Manual Test Script

**Pre-condition for ALL tests:** Demo login as Patient.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Patient button).

**Part A** — patient health and account screens (`/patient/dashboard` … `/patient/profile`).  
**Part B** — care-seeker flows registered only under `/patient/...` (see `TESTING_PLAN.md` §1.1).

---

# PART A — PATIENT HEALTH AND ACCOUNT

## MTS-PT-01 — Dashboard

**URL:** `/patient/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/dashboard` | Page loads with patient-specific content | — | |
| 2 | **[VERIFY]** Upcoming care visits | Shows caregiver name, date, time | — | |
| 3 | **[VERIFY]** Vitals shortcut | A link/widget to vitals tracking | — | |
| 4 | **[VERIFY]** Medication reminders widget | Upcoming medication names and times | — | |
| 5 | **[CLICK]** vitals shortcut | Navigated to `/patient/vitals` | — | |
| 6 | Press browser Back | Back on dashboard | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-02 — Vitals Tracking

**URL:** `/patient/vitals`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/vitals` | Green hero section loads. "Vitals Tracking" heading. | — | |
| 2 | **[VERIFY]** 4 vital cards in hero | Blood Pressure (120/80 mmHg), Blood Sugar (5.6 mmol/L), Heart Rate (72 bpm), Temperature (98.6°F) — each with icon | — | |
| 3 | **[VERIFY]** "Weekly Trends" chart | Area chart with two lines: BP (green fill), Heart Rate (pink line) | — | |
| 4 | **[VERIFY]** Chart legend | Green dot = Blood Pressure, pink dot = Heart Rate | — | |
| 5 | **[VERIFY]** "Recent Logs" section | At least 3 entries. Each shows: value, timestamp, label (BP Normal, Sugar stable, Slight Fever) | — | |
| 6 | **[VERIFY]** Alert row | "Slight Fever" entry has red background and AlertCircle icon | — | |
| 7 | **[VERIFY]** "Health Insight" card (right column) | Shows a text insight and "Talk to Doctor" button | — | |
| 8 | **[VERIFY]** "Daily Goal" card | Progress bar at 80%, "Goal: 30 mins light walking" | — | |
| 9 | **[CLICK]** "+ Log Vital" button (top right in hero) | A form, modal or new section appears to log a vital | — | |
| 10 | Fill in a reading (e.g. Blood Pressure: 118/76) | Fields accept input | — | |
| 11 | **[CLICK]** Submit/Save | New entry appears at top of Recent Logs OR success toast shown | — | |
| 12 | **[CLICK]** "Talk to Doctor" button | Navigates to messages or a contact form | — | |
| 13 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-03 — Medication Reminders

**URL:** `/patient/medications`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/medications` | Page loads with medication reminder list | — | |
| 2 | **[VERIFY]** Each reminder | Shows: medication name, dosage, scheduled time, frequency | — | |
| 3 | **[CLICK]** Add / New Reminder button | A form appears | — | |
| 4 | **[TYPE]** medication name: `Paracetamol` | Accepted | — | |
| 5 | **[TYPE]** dosage: `500mg` | Accepted | — | |
| 6 | **[SELECT]** time: `08:00 AM` | Accepted | — | |
| 7 | **[SELECT]** frequency: `Daily` | Accepted | — | |
| 8 | **[CLICK]** Save | New reminder appears in list with correct name, dosage, time, frequency | — | |
| 9 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-04 — Medical Records

**URL:** `/patient/medical-records`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/medical-records` | Page loads with medical records list | — | |
| 2 | **[VERIFY]** Record list | Each record shows: type (Lab Report, Prescription, etc.), date, doctor | — | |
| 3 | **[CLICK]** any record | Opens detail view or file preview | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-05 — Document Upload

**URL:** `/patient/document-upload`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/document-upload` | Page loads with upload area | — | |
| 2 | **[CLICK]** upload area or "Choose File" | File picker opens | — | |
| 3 | Select a small image or PDF | Filename appears | — | |
| 4 | **[SELECT]** document type if present (e.g. "Lab Report") | Selection made | — | |
| 5 | **[CLICK]** Upload/Submit | File appears in list. Success message or status. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-06 — Health Report

**URL:** `/patient/health-report`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/health-report` | Page loads with health summary | — | |
| 2 | **[VERIFY]** Content | Shows vitals history, medication adherence, care notes summary, charts | — | |
| 3 | If a "Download Report" button exists: **[CLICK]** it | PDF or file download triggers | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-07 — Care History

**URL:** `/patient/care-history`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/care-history` | Page loads with past care sessions | — | |
| 2 | **[VERIFY]** Each session | Caregiver name, date, type, duration, status | — | |
| 3 | **[CLICK]** any session | Expanded detail or visit summary | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-08 — Emergency Hub

**URL:** `/patient/emergency`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/emergency` | Page loads without crash. | — | |
| 2 | **[VERIFY]** Emergency contacts list | At least one contact with name and phone number visible | — | |
| 3 | **[VERIFY]** Emergency action button | Visible and prominent (red or high-contrast). e.g. "Call Emergency", "Alert Caregiver" | — | |
| 4 | **[CLICK]** emergency action button | Confirmation dialog appears OR tel: link fires OR success alert. Must NOT crash or show blank screen. | — | |
| 5 | **[VERIFY]** Add/edit emergency contact | A button to add a new contact exists | — | |
| 6 | **[CLICK]** Add Contact | Form appears with name, relationship, phone fields | — | |
| 7 | Fill in: `Dr. Karim`, `Primary Doctor`, `+8801711111111` | Accepted | — | |
| 8 | **[CLICK]** Save | Contact appears in the list | — | |
| 9 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-09 — Patient Schedule

**URL:** `/patient/schedule`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/schedule` | Page loads with upcoming care visits | — | |
| 2 | **[VERIFY]** Each visit | Caregiver name, date, time, care type, status | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-10 — Patient Messages

**URL:** `/patient/messages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/messages` | Thread list + chat pane | — | |
| 2 | **[CLICK]** any thread | Conversation loads | — | |
| 3 | **[TYPE]** a message, **[CLICK]** Send | Message appears as sent | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-11 — Data Privacy Manager

**URL:** `/patient/data-privacy`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/data-privacy` | Page loads with consent/privacy settings list | — | |
| 2 | **[VERIFY]** Toggle switches | At least 2 consent toggles visible (e.g. "Share data with caregiver", "Analytics") | — | |
| 3 | **[CLICK]** a toggle that is ON | Toggle visually switches to OFF | — | |
| 4 | **[CLICK]** Save (if explicit save button exists) | Success toast or confirmation | — | |
| 5 | Hard reload the page (Ctrl+Shift+R) | Toggle remains in OFF state | — | |
| 6 | **[CLICK]** the toggle back ON | Toggle switches to ON | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-PT-12 — Patient Profile

**URL:** `/patient/profile`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/profile` | Page loads with patient info | — | |
| 2 | **[VERIFY]** Fields | Name, age, blood group, allergies, conditions, address, emergency contact | — | |
| 3 | **[CLICK]** Edit | Fields become editable | — | |
| 4 | Change a field (e.g. add an allergy: `Penicillin`) | Accepted | — | |
| 5 | **[CLICK]** Save | Success. Updated value shown. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

# PART B — PATIENT CARE-SEEKER ROUTES (`/patient/*` URL parity)

These screens reuse **Guardian** page components but are registered under **`/patient/...`** in `src/app/routes.ts`. Each URL must be exercised as **Patient** so `useCareSeekerBasePath()` and deep links resolve under `/patient` (P7).

**Mock IDs (offline / mock services):** package `pkg-001` (`uccfMocks.ts` → `MOCK_AGENCY_PACKAGES`); care requirement `CR-2026-0042` (`guardianMocks.ts` → `MOCK_CARE_REQUIREMENTS`); marketplace bid review `req-001` (`uccfMocks.ts`); placement `PL-2026-0018` (`adminMocks.ts` → `MOCK_GUARDIAN_PLACEMENTS`); caregiver profile `1` (`caregiverMocks.ts` → `MOCK_CAREGIVER_PROFILES`); agency profile `a1` (`agencyMocks.ts` → `MOCK_AGENCIES`). If Supabase is enabled, use IDs that exist in your project or open the list page first and copy a real id from the UI.

---

## MTS-PT-13 — Care Requirements List (patient URL)

**URL:** `/patient/care-requirements`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/care-requirements` | Page loads; list or empty state; URL stays under `/patient` (P1, P7) | — | |
| 2 | **[VERIFY]** Heading | "Care Requirements" (or translated) — no raw i18n keys (P2) | — | |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-14 — Care Requirement Wizard (patient URL)

**URL:** `/patient/care-requirement-wizard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/care-requirement-wizard` | Wizard step 1 loads (P1) | — | |
| 2 | **[VERIFY]** Back or cancel control | Visible without overflow at 375 px (P8) | — | |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-15 — Care Requirement Detail (patient URL)

**URL:** `/patient/care-requirement/CR-2026-0042` (replace with a real id if using Supabase)

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Detail loads: timeline, summary, messages (P1, P2) | — | |
| 2 | **[CLICK]** Back to requirements | Navigates to `/patient/care-requirements` (P7) | — | |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-16 — Marketplace Hub (patient URL)

**URL:** `/patient/marketplace-hub`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/marketplace-hub` | Hub loads with packages or listings (P1) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-17 — Package Detail (patient URL)

**URL:** `/patient/marketplace/package/pkg-001`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Package detail loads OR graceful empty state (P1, P6) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-18 — Bid Review (patient URL)

**URL:** `/patient/bid-review/req-001`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Bid review loads OR "request not found" message — no white screen (P1, P6) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-19 — Placements List (patient URL)

**URL:** `/patient/placements`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/placements` | List loads (P1) | — | |
| 2 | **[VERIFY]** At least one placement card OR empty state (P2) | — | |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-20 — Placement Detail (patient URL)

**URL:** `/patient/placement/PL-2026-0018`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Detail loads OR not-found handling (P1, P6) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-21 — Booking Wizard (patient URL)

**URL:** `/patient/booking`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/booking` | Booking wizard step 1 loads (P1) | — | |
| 2 | **[VERIFY]** Progress UI | Visible at 375 px width (P8) | — | |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-22 — Caregiver Search (patient URL)

**URL:** `/patient/search`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/patient/search` | Search hero and tabs load (P1) | — | |
| 2 | **[CLICK]** a caregiver result → profile | URL under `/patient/caregiver/...` (P7) | — | Optional if list empty |
| 3 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-23 — Caregiver Public Profile (patient URL)

**URL:** `/patient/caregiver/1`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Profile loads with name, specialties, CTA (P1, P2) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

---

## MTS-PT-24 — Agency Public Profile (patient URL)

**URL:** `/patient/agency/a1`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to URL above | Agency profile loads (P1, P2) | — | |
| 2 | **[VERIFY]** Console | No `console.error` (P1) | — | |

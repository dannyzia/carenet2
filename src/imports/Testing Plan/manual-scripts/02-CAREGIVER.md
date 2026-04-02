# 02 — CAREGIVER Manual Test Script

**Pre-condition for ALL tests:** Demo login as Caregiver.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Caregiver button).

---

## MTS-CG-01 — Dashboard

**URL:** `/caregiver/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/dashboard` | Page loads. Heading: "Good Morning, [Name]! 👋" with today's date. | — | |
| 2 | **[VERIFY]** 4 stat cards | Active Jobs, Avg. Rating, This Month (৳ amount), Hours Worked — all show values | — | |
| 3 | **[VERIFY]** CarePoints Balance card | Shows CP balance and "Fee due: X CP" | — | |
| 4 | **[VERIFY]** Active Contracts card | Shows a number and "X offer pending" | — | |
| 5 | **[VERIFY]** Monthly Earnings chart | Area chart with month labels on x-axis and ৳ amounts on y-axis | — | |
| 6 | **[VERIFY]** Today's Schedule panel | At least one shift with time, patient name, care type | — | |
| 7 | **[VERIFY]** Recent Jobs — desktop | Table with columns: Patient, Care Type, Date, Amount, Status | — | |
| 8 | **[VERIFY]** Status badges | Each row has a coloured badge (e.g. "Completed", "Active") | — | |
| 9 | **[VERIFY]** 4 Quick Action cards | Find New Jobs, Check Messages, Update Availability, View Reviews | — | |
| 10 | **[VERIFY]** Document Expiry widget at bottom | Visible with at least one document entry or "No expiring documents" | — | |
| 11 | **[CLICK]** "View Jobs" button (top right) | Navigated to `/caregiver/jobs` | — | |
| 12 | Press browser Back | Back on `/caregiver/dashboard` | — | |
| 13 | **[CLICK]** "My Schedule" button | Navigated to `/caregiver/schedule` | — | |
| 14 | Press browser Back | Back on dashboard | — | |
| 15 | **[CLICK]** "View all" in Today's Schedule | Navigated to `/caregiver/schedule` | — | |
| 16 | Press browser Back | Back on dashboard | — | |
| 17 | **[CLICK]** CarePoints Balance card | Navigated to `/wallet` | — | |
| 18 | Press browser Back | Back on dashboard | — | |
| 19 | **[CLICK]** Active Contracts card | Navigated to `/contracts` | — | |
| 20 | Press browser Back | Back on dashboard | — | |
| 21 | **[CLICK]** "Find New Jobs" quick action | Navigated to `/caregiver/jobs` | — | |
| 22 | Press browser Back | Back on dashboard | — | |
| 23 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-02 — Jobs List

**URL:** `/caregiver/jobs`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/jobs` | Page loads. Heading: "Find Jobs". Subtitle: "Browse caregiving opportunities near you". | — | |
| 2 | **[VERIFY]** Search input | Visible with Search icon, placeholder "Search by title or location…" | — | |
| 3 | **[VERIFY]** Filter dropdown | Shows "All Types" by default. Contains: All Types, Elderly Care, Child Care, Post-Surgery, Physiotherapy, Dementia Care, Palliative Care | — | |
| 4 | **[VERIFY]** Jobs count | "X jobs found" text visible | — | |
| 5 | **[VERIFY]** Job cards (at least 2) | Each shows: job title, Urgent badge if applicable, patient name + age, location (MapPin), duration (Clock), budget in green (৳), skills as pink pills | — | |
| 6 | **[VERIFY]** Bookmark icon | Visible on each card, top-right corner | — | |
| 7 | **[CLICK]** Bookmark on any card | Icon fills pink (saved state) | — | |
| 8 | **[CLICK]** same Bookmark again | Icon returns to outline (unsaved) | — | |
| 9 | **[CLICK]** Search field, **[TYPE]** `Elder` | Job count updates. Only "Elder"-matching cards remain. | — | |
| 10 | Clear search text | All jobs return | — | |
| 11 | **[SELECT]** "Elderly Care" from dropdown | List filters to Elderly Care only | — | |
| 12 | **[SELECT]** "All Types" | All jobs return | — | |
| 13 | **[CLICK]** "Details" on any card | Navigated to `/caregiver/jobs/:id` (Job Detail page) | — | |
| 14 | **[VERIFY]** Job detail page | Shows: full job description, patient info, requirements, Apply button | — | |
| 15 | Press browser Back | Back on jobs list | — | |
| 16 | **[CLICK]** "Apply Now" on any card | Navigated to application page OR success/confirmation state | — | |
| 17 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-03 — Job Application Detail

**URL:** `/caregiver/job-application/:id`  
**Pre-condition:** Navigate from Jobs list → Details → Apply, or navigate directly.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/job-application/1` (use any valid ID) | Page loads with application detail | — | |
| 2 | **[VERIFY]** Content | Shows: job title, application status, applied date, any caregiver notes submitted | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-04 — Schedule: Week View

**URL:** `/caregiver/schedule`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/schedule` | Page loads. Heading: "My Schedule". Two toggle buttons: "week" and "list". "week" is active by default. | — | |
| 2 | **[VERIFY]** Week view grid | Shows hours (8 AM–7 PM) on the left column, days (Sun–Sat) across the top. At least one coloured event block visible. | — | |
| 3 | **[VERIFY]** Event block content | Shows a label (care type) and patient name, truncated | — | |
| 4 | **[CLICK]** the left chevron (previous week) | Week heading updates (e.g. "March 3–9, 2026") | — | |
| 5 | **[CLICK]** the right chevron (next week) | Week heading returns forward | — | |
| 6 | **[CLICK]** "Add Slot" button | A form, modal, or inline slot picker appears | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-05 — Schedule: List View

**URL:** `/caregiver/schedule` — list tab

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "list" toggle button | View switches to a list of upcoming bookings | — | |
| 2 | **[VERIFY]** Each booking row | Shows: patient name, care type, time (Clock icon), date, status badge (confirmed = green, else amber) | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-06 — Schedule: Availability

**URL:** `/caregiver/schedule` — availability section

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Scroll to "Weekly Availability" section | 7 day buttons visible (Mon–Sun), each showing pink border if available | — | |
| 2 | **[CLICK]** "Sat" button | If active: becomes inactive (border reverts to grey). If inactive: becomes pink. | — | |
| 3 | **[CLICK]** "Save Availability" | Success toast or confirmation shown | — | |

---

## MTS-CG-07 — Shift Detail

**URL:** `/caregiver/shift/:id`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/shift/1` | Page loads showing shift info | — | |
| 2 | **[VERIFY]** Content | Shows: patient name, shift date/time, location, status, care instructions | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-08 — Shift Check-In

**URL:** `/caregiver/shift-check-in`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/shift-check-in` | Page loads. Heading: "Shift Check-In". 3-step progress bar: Selfie → GPS → Confirm. Step 1 active. | — | |
| 2 | **[VERIFY]** Ready card | Camera icon, "Ready to check in?", expected location address, "Start Check-In" button | — | |
| 3 | **[CLICK]** "Start Check-In" | Progress moves to Selfie step. Card: camera icon, "Take a selfie", "Capture Selfie" button | — | |
| 4 | **[CLICK]** "Capture Selfie" | File picker opens (desktop) or camera opens (mobile) | — | |
| 5 | Select any image file | A circular preview of the image appears. "Continue" button appears. | — | |
| 6 | **[CLICK]** "Continue" | Progress moves to GPS step. Card: Navigation icon, "Verify Location", distance limit shown, "Get My Location" button | — | |
| 7 | **[CLICK]** "Get My Location" | Browser asks for location permission (allow it), OR mock GPS fires automatically | — | |
| 8 | **[WAIT]** | Status indicator appears: green "Within range (Xm)" OR red "Out of range (Xm)" | — | |
| 9 | If within range: **[VERIFY]** "Confirm Check-In" button | Enabled | — | |
| 10 | **[CLICK]** "Confirm Check-In" | "Checking in…" → Done step: green checkmark, "Checked In Successfully!", current timestamp shown | — | |
| 11 | **[VERIFY]** Done state | Shows time, "GPS: Verified", "Camera: Captured" | — | |
| 12 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-09 — Shift Planner

**URL:** `/caregiver/shift-planner`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/shift-planner` | Page loads without crash | — | |
| 2 | **[VERIFY]** Planned shifts | A calendar or list showing planned shifts with patient and time | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-10 — Care Log

**URL:** `/caregiver/care-log`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/care-log` | Page loads with a list of care log entries | — | |
| 2 | **[VERIFY]** Each entry | Shows date, patient name, care type/activity | — | |
| 3 | **[CLICK]** Add / New Entry button | Form or inline section appears | — | |
| 4 | Fill required fields (patient, activity, notes) | Fields accept input | — | |
| 5 | **[CLICK]** Save | Success. New entry appears at top. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-11 — Care Notes

**URL:** `/caregiver/care-notes`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/care-notes` | Page loads. Heading: "Care Notes & Remarks". 4 stat mini-cards: Observations, Incidents, Progress Notes, Pinned. | — | |
| 2 | **[VERIFY]** Note list | Notes visible, each with: coloured left border, category icon, title, patient, date, time, mood emoji (if set) | — | |
| 3 | **[VERIFY]** Pinned notes | Appear first with a Pin icon | — | |
| 4 | **[CLICK]** any note card | Expands to show full content, tags, and attachment count | — | |
| 5 | **[CLICK]** same card | Collapses back | — | |
| 6 | **[CLICK]** "New Note" button | Add form slides in with pink left border | — | |
| 7 | **[VERIFY]** Add form fields | Patient dropdown, Category dropdown, Patient Mood dropdown, Title input, Detailed Notes textarea, Tags input, Photo button, Voice Note button | — | |
| 8 | **[SELECT]** a patient from dropdown | Selection made | — | |
| 9 | **[SELECT]** Category = "Incident" | A Severity row (Low / Medium / High) appears | — | |
| 10 | **[CLICK]** "High" severity | High button gets red border | — | |
| 11 | **[SELECT]** Category back to "General" | Severity row disappears | — | |
| 12 | **[TYPE]** Title: `Test observation note` | Accepted | — | |
| 13 | **[TYPE]** in Notes textarea: `Patient was alert and cooperative during morning care.` | Accepted | — | |
| 14 | **[TYPE]** Tags: `morning, cooperative` | Accepted | — | |
| 15 | **[CLICK]** "Save Note" | Note appears in list with correct category icon and title | — | |
| 16 | **[CLICK]** search field, **[TYPE]** `Test observation` | Only the just-created note appears | — | |
| 17 | Clear search | All notes return | — | |
| 18 | **[SELECT]** Category filter = "Incident" | Only incident notes shown | — | |
| 19 | **[SELECT]** Category filter back to "All Categories" | All notes return | — | |
| 20 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-12 — Medication Schedule: Today View

**URL:** `/caregiver/med-schedule`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/med-schedule` | Page loads. Heading: "Medication Schedule". Subtitle shows today's taken/pending/missed counts. | — | |
| 2 | **[VERIFY]** 3 tabs | "today", "week", "Setup" | — | |
| 3 | **[VERIFY]** Progress bar | Shows "X/Y administered" with a filled pink bar | — | |
| 4 | **[VERIFY]** Today view | Medications grouped by timing: Morning, Afternoon, Evening, Night — each with an icon and colour | — | |
| 5 | **[VERIFY]** Each medication row | Shows: medicine name + dosage, patient name, scheduled time, instructions. Pending items have ✅ and ❌ buttons. | — | |
| 6 | **[CLICK]** ✅ (checkmark) on any pending medication | Row shows "Administered at [time]". Left border turns green. Medication name gets strikethrough. | — | |
| 7 | **[VERIFY]** Progress bar | Increments by 1 | — | |
| 8 | **[CLICK]** ❌ (X) on another pending medication | Row shows "Missed" in red. Left border turns red. | — | |
| 9 | **[VERIFY]** Subtitle counters update | Taken+1, Missed+1, Pending-2 | — | |
| 10 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-13 — Medication Schedule: Week View

**URL:** `/caregiver/med-schedule` — week tab

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "week" tab | Week grid loads. Columns: Medicine name, Sun–Sat. | — | |
| 2 | **[VERIFY]** Grid rows | Each row shows a medicine name + patient + green checkmarks or dashes per day | — | |
| 3 | **[CLICK]** left chevron | Week heading moves back | — | |
| 4 | **[CLICK]** right chevron | Returns forward | — | |

---

## MTS-CG-14 — Medication Schedule: Setup View

**URL:** `/caregiver/med-schedule` — Setup tab

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** "Setup" tab | Shows "Add Recurring Schedule" button and list of active schedules | — | |
| 2 | **[VERIFY]** Active schedules list | Each entry shows: medicine name, patient, time, days, reminder interval | — | |
| 3 | **[CLICK]** "Add Recurring Schedule" | Form slides in with pink border | — | |
| 4 | **[SELECT]** patient from dropdown | Selection made | — | |
| 5 | **[CLICK]** medicine search field, **[TYPE]** `Amlo` | Suggestions appear (medicine search combobox) | — | |
| 6 | **[SELECT]** a medicine from suggestions | Medicine fills in with generic name | — | |
| 7 | **[TYPE]** Dosage: `5mg` | Accepted | — | |
| 8 | **[TYPE]** Time: `08:00` | Accepted | — | |
| 9 | **[CLICK]** "Sat" day button to toggle it off | Button loses pink border | — | |
| 10 | **[CLICK]** reminder "30 min" button | 30 min selected, others deselected | — | |
| 11 | **[TYPE]** Instructions: `Take with food` | Accepted | — | |
| 12 | **[CLICK]** "Save Schedule" | New schedule appears in active schedules list | — | |

---

## MTS-CG-15 — Handoff Notes

**URL:** `/caregiver/handoff-notes`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/handoff-notes` | Page loads without crash | — | |
| 2 | **[VERIFY]** Existing notes or empty state | Either a list of handoff notes, or "No handoff notes" | — | |
| 3 | **[CLICK]** Create / New Handoff Note | Form appears | — | |
| 4 | **[TYPE]** in notes field: `Patient slept well. Appetite normal. No medication changes.` | Text accepted | — | |
| 5 | **[CLICK]** Save | Note appears in list. Success toast. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-16 — Incident Report

**URL:** `/caregiver/incident-report`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/incident-report` | Page loads with an incident report form | — | |
| 2 | **[CLICK]** Submit without filling anything | Validation fires on required fields | — | |
| 3 | Fill in all required fields (type, patient, description, date/time) | Fields accept input | — | |
| 4 | **[CLICK]** Submit | Loading → success state or redirect. No crash. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-17 — Assigned Patients

**URL:** `/caregiver/assigned-patients`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/assigned-patients` | Page loads with a list of currently assigned patients | — | |
| 2 | **[VERIFY]** Each patient card | Name, age, condition, address, next shift | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-18 — Prescription View

**URL:** `/caregiver/prescription`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/prescription` | Page loads showing patient prescription(s) | — | |
| 2 | **[VERIFY]** Content | Doctor name, prescribed medicines, dosages, instructions | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-19 — Earnings

**URL:** `/caregiver/earnings`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/earnings` | Page loads. Heading: "Earnings". 4 stat cards: Available Balance (green), This Month (pink), Total Earned (purple), Hours This Month (amber). | — | |
| 2 | **[VERIFY]** Export button | Top-right, pink gradient | — | |
| 3 | **[CLICK]** Export | Download triggers OR confirmation shown | — | |
| 4 | **[VERIFY]** "Earnings vs Withdrawals" bar chart | Two-colour bar chart (pink = earned, dark pink = withdrawn) with month labels | — | |
| 5 | **[VERIFY]** "Withdraw Earnings" panel | Available balance card, payment methods list (bKash shown as "Primary"), amount input field, "Withdraw Now" button | — | |
| 6 | **[CLICK]** the amount input, **[TYPE]** `200` | Input accepts number | — | |
| 7 | **[CLICK]** "Withdraw Now" | Success confirmation or minimum-amount error shown | — | |
| 8 | **[TYPE]** `500` in amount field (minimum) | Accepted | — | |
| 9 | **[CLICK]** "Withdraw Now" | Success toast or payment flow | — | |
| 10 | **[VERIFY]** Transaction history | List of transactions with: description, date, amount in green (credit) or red (debit), arrow icons | — | |
| 11 | **[CLICK]** "View all" link in transactions | Either expands list or navigates | — | |
| 12 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-20 — Daily Earnings Detail

**URL:** `/caregiver/daily-earnings`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/daily-earnings` | Page loads with a daily earnings breakdown | — | |
| 2 | **[VERIFY]** Content | Shows per-shift earnings for a given day with patient, hours, rate, total | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-21 — Payout Setup

**URL:** `/caregiver/payout-setup`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/payout-setup` | Page loads with payout method form (bank/bKash fields) | — | |
| 2 | Fill in test payout details | Fields accept input | — | |
| 3 | **[CLICK]** Save | Success confirmation | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-22 — Tax Reports

**URL:** `/caregiver/tax-reports`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/tax-reports` | Page loads with tax summary | — | |
| 2 | **[VERIFY]** Content | Annual income summary, deductions, downloadable report button | — | |
| 3 | **[CLICK]** download report | PDF or confirmation triggered | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-23 — Profile

**URL:** `/caregiver/profile`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/profile` | Page loads. Pink gradient banner at top. Avatar with initial, "Verified" badge. Name, title, location, experience, rating shown. | — | |
| 2 | **[VERIFY]** Edit Profile button | Top-right of the card, pink border/text | — | |
| 3 | **[CLICK]** "Edit Profile" | Button changes to "Cancel". Bio field becomes an editable textarea. A "Save Changes" + "Cancel" button row appears at bottom. | — | |
| 4 | **[CLICK]** in bio textarea | Focused | — | |
| 5 | Clear bio, **[TYPE]** `Experienced caregiver specialising in elderly care. Updated bio.` | Text appears | — | |
| 6 | **[CLICK]** Camera icon on avatar | File picker opens | — | |
| 7 | (optional) Select an image file | Preview updates | — | |
| 8 | **[CLICK]** "Save Changes" | Editing mode exits. New bio text is shown. | — | |
| 9 | **[VERIFY]** Contact Info card | Shows Phone, Email, Location with icons | — | |
| 10 | **[VERIFY]** Rate & Availability card | Shows daily rate and day pills (Mon–Fri pink, Sat–Sun grey) | — | |
| 11 | **[VERIFY]** Skills section | Pink pill tags | — | |
| 12 | **[VERIFY]** Languages section | Grey pill tags | — | |
| 13 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-24 — Portfolio Editor

**URL:** `/caregiver/portfolio`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/portfolio` | Page loads with existing portfolio items or empty state | — | |
| 2 | **[CLICK]** Add item / "+" button | Form appears | — | |
| 3 | Fill in: title, description, (optional image) | Fields accept input | — | |
| 4 | **[CLICK]** Save | Item appears in portfolio list | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-25 — Reference Manager

**URL:** `/caregiver/references`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/references` | Page loads with list of references or empty state | — | |
| 2 | **[CLICK]** Add Reference | Form appears: name, relationship, phone/email, notes | — | |
| 3 | Fill in: `Dr. Ahmed`, `Supervisor`, `drahmad@hospital.com` | Accepted | — | |
| 4 | **[CLICK]** Save | Reference appears in list | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-26 — Skills Assessment

**URL:** `/caregiver/skills-assessment`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/skills-assessment` | Page loads with a green hero, "Skills Certification" heading, progress bar showing "0%", "Question 1/5" | — | |
| 2 | **[VERIFY]** Question 1 | A multiple-choice clinical question with 4 answer buttons (A, B, C, D) | — | |
| 3 | **[CLICK]** any answer (e.g. B) | Moves to question 2. Progress bar updates to 20%. | — | |
| 4 | Answer questions 2–5 | Progress bar reaches 100% after question 5 | — | |
| 5 | **[VERIFY]** After question 5 | Success screen: Award icon, "Certification Passed!", score shown (5/5, 100%), "+150 XP", two buttons: "Back to Training Hub" and "Share Certificate" | — | |
| 6 | **[CLICK]** "Back to Training Hub" | Navigated to `/caregiver/training` | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-27 — Training Portal

**URL:** `/caregiver/training`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/training` | Page loads with a pink hero. "Learning Hub" heading. Search input visible. | — | |
| 2 | **[VERIFY]** 3 stat cards in hero | Active Courses (4), Certificates (12), Reward Points (450) | — | |
| 3 | **[VERIFY]** "In Progress" section | 2 course cards with thumbnail, title, lesson count, progress bar (%) | — | |
| 4 | **[CLICK]** a Play icon on a course card | Video player or course content loads | — | |
| 5 | Press browser Back | Back on training portal | — | |
| 6 | **[VERIFY]** "Recommended for You" grid | 4 course cards with BookOpen icon, title, duration, XP reward | — | |
| 7 | **[VERIFY]** Leaderboard card (right column) | Shows 3 entries: Rank 1, Rank 2, and "You" at rank 12 with 450 XP | — | |
| 8 | **[CLICK]** "View Global Rankings" button | Either expands or navigates | — | |
| 9 | **[VERIFY]** Unlocked Badges card | Shows 5 badge slots: first is a green Award badge, rest are locked | — | |
| 10 | **[CLICK]** search field, **[TYPE]** `Infection` | Search results filter | — | |
| 11 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-28 — Documents

**URL:** `/caregiver/documents`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/documents` | Page loads with existing documents list and upload option | — | |
| 2 | **[VERIFY]** Document list | Each item shows: document type, expiry date, status badge (Verified/Pending/Expired) | — | |
| 3 | **[CLICK]** Upload / Add Document | File picker opens | — | |
| 4 | Select any small PDF or image | File selected | — | |
| 5 | Fill metadata (document type, expiry date if shown) | Accepted | — | |
| 6 | **[CLICK]** Submit/Upload | Document appears in list with "Pending" status | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-29 — Messages

**URL:** `/caregiver/messages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/messages` | Page loads with thread list left + chat pane right (or stacked on mobile) | — | |
| 2 | **[CLICK]** any thread | Chat pane shows conversation messages | — | |
| 3 | **[CLICK]** message input at bottom | Focused | — | |
| 4 | **[TYPE]** `Hello, this is a test message.` | Text appears | — | |
| 5 | **[CLICK]** Send or press Enter | Message appears right-aligned (sent) in chat pane | — | |
| 6 | **[VERIFY]** No duplicate message | Only one copy | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CG-30 — Reviews

**URL:** `/caregiver/reviews`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/caregiver/reviews` | Page loads with caregiver's received reviews | — | |
| 2 | **[VERIFY]** Each review | Shows: reviewer name/role, star rating, comment text, date | — | |
| 3 | **[VERIFY]** Overall rating | An aggregate star rating shown at the top | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

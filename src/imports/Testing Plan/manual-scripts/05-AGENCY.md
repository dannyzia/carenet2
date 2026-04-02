# 05 — AGENCY Manual Test Script

**Pre-condition for ALL tests:** Demo login as Agency.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Agency button).

---

## MTS-AG-01 — Dashboard

**URL:** `/agency/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/dashboard` | Page loads with agency KPI cards | — | |
| 2 | **[VERIFY]** KPI cards | Active placements, caregiver count, pending requirements, revenue | — | |
| 3 | **[VERIFY]** Quick links/actions | Navigate to caregivers, clients, placements, etc. | — | |
| 4 | **[CLICK]** each quick action | Correct page loads | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-02 — Caregivers List

**URL:** `/agency/caregivers`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/caregivers` | Page loads with a list/table of agency's caregivers | — | |
| 2 | **[VERIFY]** Each row | Name, speciality, status (Active/Inactive), rating, current assignment | — | |
| 3 | **[CLICK]** search/filter input, **[TYPE]** a name | List filters | — | |
| 4 | Clear search | All caregivers return | — | |
| 5 | **[CLICK]** any caregiver | Caregiver detail or profile opens | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-03 — Clients List

**URL:** `/agency/clients`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/clients` | Page loads with client list | — | |
| 2 | **[VERIFY]** Each client row | Patient/guardian name, condition, active placement status | — | |
| 3 | **[CLICK]** any client | Client detail or profile opens | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-04 — Client Intake

**URL:** `/agency/client-intake`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/client-intake` | Page loads with intake form | — | |
| 2 | **[CLICK]** Submit without filling | Validation fires on required fields | — | |
| 3 | Fill in: patient name, age, condition, guardian name, contact, address | Accepted | — | |
| 4 | **[CLICK]** Submit | Success. Client appears in `/agency/clients` list. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-05 — Client Care Plan

**URL:** `/agency/care-plan/:id`  
**Pre-condition:** A client exists. Find ID from `/agency/clients`.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/care-plan/1` (or find from clients list) | Page loads with care plan for that client | — | |
| 2 | **[VERIFY]** Content | Patient info, care goals, medications, dietary needs, daily routine | — | |
| 3 | **[CLICK]** Edit any section | Section becomes editable | — | |
| 4 | Make a change and Save | Success. Changes reflected. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-06 — Care Plan Template

**URL:** `/agency/care-plan-template`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/care-plan-template` | Page loads with existing templates or empty state | — | |
| 2 | **[CLICK]** Create Template | Form opens | — | |
| 3 | Fill: name `Standard Elderly Care Template`, add care goals and routine items | Accepted | — | |
| 4 | **[CLICK]** Save | Template appears in list | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-07 — Requirements Inbox

**URL:** `/agency/requirements-inbox`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/requirements-inbox` | Page loads with incoming care requirements from guardians | — | |
| 2 | **[VERIFY]** Each requirement | Guardian name, patient info, care type, location, submitted date, status | — | |
| 3 | **[CLICK]** any requirement | Navigated to `/agency/requirement-review/:id` | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-08 — Requirement Review & Bid Submission

**URL:** `/agency/requirement-review/:id`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate from requirements inbox or directly to `/agency/requirement-review/1` | Page loads with full requirement detail | — | |
| 2 | **[VERIFY]** Requirement detail | Patient info, care needs, schedule, location, guardian budget | — | |
| 3 | **[CLICK]** "Submit Bid" / "Respond" | Bid form appears with price and notes fields | — | |
| 4 | **[TYPE]** bid price: `25000` | Accepted | — | |
| 5 | **[TYPE]** notes: `We can provide a dedicated caregiver 7 days a week.` | Accepted | — | |
| 6 | **[CLICK]** Confirm/Submit | Success message. | — | |
| 7 | Navigate to `/agency/bid-management` | The submitted bid appears in the list | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-09 — Bid Management

**URL:** `/agency/bid-management`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/bid-management` | Page loads with list of submitted bids | — | |
| 2 | **[VERIFY]** Each bid | Guardian/patient name, bid amount, status (Pending/Accepted/Rejected), submitted date | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-10 — Placements List

**URL:** `/agency/placements`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/placements` | Page loads with active and past placements | — | |
| 2 | **[VERIFY]** Each placement | Caregiver name, client name, start date, status, shift type | — | |
| 3 | **[CLICK]** any placement | Navigated to `/agency/placement/:id` | — | |
| 4 | **[VERIFY]** Placement detail | Full info: caregiver, client, schedule, contract, status | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-11 — Shift Monitoring

**URL:** `/agency/shift-monitoring`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/shift-monitoring` | Page loads with live/upcoming shift list | — | |
| 2 | **[VERIFY]** Each shift | Caregiver name, patient name, start time, status badge (Active/Upcoming/Late/Completed) | — | |
| 3 | **[VERIFY]** Late or missed shifts | Highlighted in red or with alert indicator | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-12 — Job Management

**URL:** `/agency/job-management`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/job-management` | Page loads with job postings list | — | |
| 2 | **[VERIFY]** Each job | Title, care type, location, budget, number of applicants, status | — | |
| 3 | **[CLICK]** "Create Job" / "+ New" | Form opens | — | |
| 4 | Fill: title `Night Care Specialist`, location `Gulshan`, budget `৳800/day`, type `Elderly Care` | Accepted | — | |
| 5 | **[CLICK]** Publish/Save | Job appears in list with status "Open" | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-13 — Job Applications

**URL:** `/agency/jobs/:id/applications`  
**Pre-condition:** A job has applications. Find job ID from `/agency/job-management`.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/jobs/1/applications` | Page loads with list of applicants for that job | — | |
| 2 | **[VERIFY]** Each applicant | Caregiver name, rating, experience, applied date, status | — | |
| 3 | **[CLICK]** "Shortlist" on any applicant | Status changes to "Shortlisted" | — | |
| 4 | **[CLICK]** "Reject" on another | Status changes to "Rejected" | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-14 — Staff Hiring

**URL:** `/agency/hiring`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/hiring` | Page loads with hiring pipeline | — | |
| 2 | **[VERIFY]** Stages | Applicants in stages: Applied, Interview, Offer, Hired | — | |
| 3 | **[CLICK]** any applicant | Detail view opens | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-15 — Staff Attendance

**URL:** `/agency/attendance`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/attendance` | Page loads with attendance records | — | |
| 2 | **[VERIFY]** Each row | Caregiver name, date, check-in time, check-out time, status (Present/Absent/Late) | — | |
| 3 | If date filter exists: **[SELECT]** today | Shows today's attendance only | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-16 — Payroll

**URL:** `/agency/payroll`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/payroll` | Page loads with payroll table | — | |
| 2 | **[VERIFY]** Payroll table | Caregiver name, hours worked, rate, total for period | — | |
| 3 | **[VERIFY]** Total row | Aggregate sum at bottom | — | |
| 4 | If period selector exists: change to previous month | Payroll data updates | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-17 — Payments

**URL:** `/agency/payments`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/payments` | Page loads with payment list | — | |
| 2 | **[VERIFY]** Transactions | Date, description, amount, status, payment method | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-18 — Document Verification

**URL:** `/agency/document-verification`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/document-verification` | Page loads with documents pending review | — | |
| 2 | **[VERIFY]** Each document | Caregiver name, document type, uploaded date, status | — | |
| 3 | **[CLICK]** any pending document | Document preview or metadata shown | — | |
| 4 | **[CLICK]** "Approve" | Status changes to "Approved". Success toast. | — | |
| 5 | Find another document, **[CLICK]** "Reject" | Status changes to "Rejected" | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-19 — Incident Report Wizard

**URL:** `/agency/incident-report`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/incident-report` | Page loads with wizard form | — | |
| 2 | **[CLICK]** Next without filling required fields | Validation fires | — | |
| 3 | Fill: incident type, caregiver involved, patient, date, description | Accepted | — | |
| 4 | Complete wizard and submit | Incident created. | — | |
| 5 | Navigate to `/agency/incidents` | New incident appears in list | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-20 — Incidents List

**URL:** `/agency/incidents`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/incidents` | Page loads with incident list | — | |
| 2 | **[VERIFY]** Each incident | Date, type, severity badge, caregiver, patient, status | — | |
| 3 | **[CLICK]** any incident | Detail view loads | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-21 — Backup Caregiver

**URL:** `/agency/backup-caregiver`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/backup-caregiver` | Page loads with backup assignment interface | — | |
| 2 | **[VERIFY]** Content | Shows primary caregiver + backup caregiver pairs, or an assignment form | — | |
| 3 | Assign a backup caregiver to a placement | Save succeeds | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-22 — Branch Management

**URL:** `/agency/branches`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/branches` | Page loads with branch list | — | |
| 2 | **[CLICK]** "Add Branch" | Form opens: branch name, location, contact | — | |
| 3 | Fill in: `Uttara Branch`, `Uttara, Dhaka`, `+8801900000001` | Accepted | — | |
| 4 | **[CLICK]** Save | Branch appears in list | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-23 — Package Create

**URL:** `/agency/package-create`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/package-create` | Page loads with package creation form | — | |
| 2 | Fill in: title `Premium Elder Care`, category `Elderly`, price `৳30000/month`, services | Accepted | — | |
| 3 | **[CLICK]** Publish | Package created. | — | |
| 4 | Navigate to `/agency/storefront` | New package visible in storefront | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-24 — Marketplace Browse

**URL:** `/agency/marketplace-browse`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/marketplace-browse` | Page loads showing guardian care requirements marketplace | — | |
| 2 | **[VERIFY]** Requirement listings | Each shows: care type, location, budget range, urgency | — | |
| 3 | **[CLICK]** any listing | Opens requirement detail | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-25 — Storefront

**URL:** `/agency/storefront`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/storefront` | Page loads with agency's public storefront editor | — | |
| 2 | **[VERIFY]** Fields | Agency name, description, specialities, contact, published packages | — | |
| 3 | **[CLICK]** Edit description | Field becomes editable | — | |
| 4 | **[TYPE]** an updated description | Accepted | — | |
| 5 | **[CLICK]** Save | Success. Changes reflected. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-26 — Reports

**URL:** `/agency/reports`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/reports` | Page loads with report types | — | |
| 2 | **[VERIFY]** Report options | Placement summary, payroll, incident, attendance | — | |
| 3 | **[CLICK]** Generate on any report | Report data loads or download triggers | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-27 — Messages

**URL:** `/agency/messages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/messages` | Thread list + chat pane | — | |
| 2 | **[CLICK]** any thread | Conversation loads | — | |
| 3 | **[TYPE]** a message, Send | Message appears as sent | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AG-28 — Settings

**URL:** `/agency/settings`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/agency/settings` | Page loads with agency settings | — | |
| 2 | **[VERIFY]** Settings sections | Notification preferences, billing settings, user management, API keys (if any) | — | |
| 3 | Toggle any setting | Toggle state changes | — | |
| 4 | **[CLICK]** Save | Success. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

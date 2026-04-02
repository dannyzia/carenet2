# 06 — ADMIN Manual Test Script

**Pre-condition for ALL tests:** Demo login as Admin.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Admin button).

---

## MTS-AD-01 — Dashboard

**URL:** `/admin/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/dashboard` | Page loads. "Admin Dashboard" heading. Date shown. | — | |
| 2 | **[VERIFY]** 4 KPI stat cards | Total Users (5,034), Active Caregivers (1,520), Revenue Mar (৳2.89L), Platform Growth (+18%) | — | |
| 3 | **[VERIFY]** Pending items row | Links to: Pending Verifications, Pending Approvals, Open Disputes, etc. — each with a count | — | |
| 4 | **[CLICK]** each pending item link | Navigates to the correct admin page | — | |
| 5 | Press browser Back each time | Returns to dashboard | — | |
| 6 | **[VERIFY]** CarePoints card | "10.2M CP in Circulation", pending dues shown | — | |
| 7 | **[CLICK]** CarePoints card | Navigated to `/admin/wallet-management` | — | |
| 8 | Press browser Back | Back on dashboard | — | |
| 9 | **[VERIFY]** Contracts card | Contract count and platform revenue | — | |
| 10 | **[CLICK]** Contracts card | Navigated to `/admin/contracts` | — | |
| 11 | Press browser Back | Back on dashboard | — | |
| 12 | **[VERIFY]** User Growth bar chart | Three-colour bars (Caregivers = pink, Guardians = green, Patients = purple) with month labels | — | |
| 13 | **[VERIFY]** Monthly Revenue line chart | Purple line with data points, ৳ y-axis | — | |
| 14 | **[VERIFY]** User Distribution donut chart | Donut + legend with user type and count | — | |
| 15 | **[VERIFY]** Recent Activity feed | Events with icons, text, and timestamps | — | |
| 16 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-02 — Users

**URL:** `/admin/users`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/users` | Page loads with a table of all platform users | — | |
| 2 | **[VERIFY]** Table columns | Name, Email, Role, Status, Join Date | — | |
| 3 | **[CLICK]** search input, **[TYPE]** a name fragment | Table filters to matching users | — | |
| 4 | Clear search | All users return | — | |
| 5 | If role filter exists: **[SELECT]** "Caregiver" | Only caregivers shown | — | |
| 6 | Reset filter | All return | — | |
| 7 | **[CLICK]** any user row or "Inspect" action | Navigated to `/admin/user-inspector` | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-03 — User Inspector

**URL:** `/admin/user-inspector`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/user-inspector` (or reach from users list) | Page loads with full user data profile | — | |
| 2 | **[VERIFY]** Content | Account details, roles, joined date, activity log, account status, linked placements | — | |
| 3 | **[VERIFY]** Action buttons | Suspend, Change Role, or similar admin actions visible | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-04 — Verifications Queue

**URL:** `/admin/verifications`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/verifications` | Page loads with list of pending ID/document verifications | — | |
| 2 | **[VERIFY]** Each item | User name, document type, submitted date, status badge | — | |
| 3 | **[CLICK]** any pending item | Navigated to `/admin/verification-case/:id` | — | |
| 4 | **[VERIFY]** Verification case | Document preview/metadata, user info, Approve and Reject buttons | — | |
| 5 | **[CLICK]** "Approve" | Status → "Approved". Success toast. | — | |
| 6 | Press browser Back | Verification list shows updated status | — | |
| 7 | **[CLICK]** another pending item, **[CLICK]** "Reject" | Status → "Rejected" | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-05 — Agency Approvals

**URL:** `/admin/agency-approvals`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/agency-approvals` | Page loads with pending agency registration requests | — | |
| 2 | **[VERIFY]** Each request | Agency name, owner, submitted date, status | — | |
| 3 | **[CLICK]** any pending request | Detail view: agency info, documents, Approve/Reject | — | |
| 4 | **[CLICK]** "Approve" | Status → "Approved" | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-06 — Placement Monitoring

**URL:** `/admin/placement-monitoring`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/placement-monitoring` | Page loads with all active placements across platform | — | |
| 2 | **[VERIFY]** Each placement | Caregiver, patient, agency, start date, status | — | |
| 3 | If filter by status exists: **[SELECT]** "Active" | Only active placements | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-07 — Admin Payments

**URL:** `/admin/payments`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/payments` | Page loads with platform-wide payment transaction log | — | |
| 2 | **[VERIFY]** Columns | Transaction ID, user, amount, type, date, status | — | |
| 3 | If date filter exists: **[SELECT]** "Last 7 days" | Transactions filter | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-08 — Wallet Management

**URL:** `/admin/wallet-management`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/wallet-management` | Page loads with wallet overview | — | |
| 2 | **[VERIFY]** Total CP in circulation | A large number shown | — | |
| 3 | **[VERIFY]** User wallet list | User name, CP balance, pending dues | — | |
| 4 | If balance adjustment is available: **[CLICK]** adjust on any user | Form or input appears | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-09 — Admin Contracts

**URL:** `/admin/contracts`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/contracts` | Page loads with platform contract list | — | |
| 2 | **[VERIFY]** Each contract | Parties involved, start date, value, status | — | |
| 3 | **[CLICK]** any contract | Contract detail/terms view | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-10 — Disputes

**URL:** `/admin/disputes`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/disputes` | Page loads with open disputes | — | |
| 2 | **[VERIFY]** Each dispute | Parties, issue type, submitted date, status | — | |
| 3 | **[CLICK]** any dispute | Detail: both parties' accounts, issue description, resolution form | — | |
| 4 | Select a resolution and submit | Dispute status updates | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-11 — Financial Audit

**URL:** `/admin/financial-audit`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/financial-audit` | Page loads with financial audit tools | — | |
| 2 | **[VERIFY]** Revenue summary | Total revenue, breakdowns by category | — | |
| 3 | **[VERIFY]** Export/download option | Button present | — | |
| 4 | **[CLICK]** export | File download or preview triggers | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-12 — Audit Logs

**URL:** `/admin/audit-logs`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/audit-logs` | Page loads with scrollable log table | — | |
| 2 | **[VERIFY]** Columns | Timestamp, User, Action, Entity/Target | — | |
| 3 | If date filter: **[SELECT]** "Today" | Filters to today's logs | — | |
| 4 | If user filter: type a username | Filters to that user's actions | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-13 — Admin Reports

**URL:** `/admin/reports`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/reports` | Page loads with report options | — | |
| 2 | **[CLICK]** Generate any report | Report data appears or download offered | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-14 — CMS Manager

**URL:** `/admin/cms`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/cms` | Page loads with editable content blocks (banners, homepage text, FAQ, etc.) | — | |
| 2 | **[CLICK]** Edit on any block | Block becomes editable | — | |
| 3 | **[TYPE]** a small change | Text updates | — | |
| 4 | **[CLICK]** Save | Success toast. Updated text shown. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-15 — Language Management

**URL:** `/admin/languages`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/languages` | Page loads with translation strings table | — | |
| 2 | **[VERIFY]** Table | Keys and their translations in each supported language | — | |
| 3 | **[CLICK]** Edit on any string | Inline edit or modal opens | — | |
| 4 | Change a translation value | Accepted | — | |
| 5 | **[CLICK]** Save | Saved. Success confirmation. | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-16 — Policy Manager

**URL:** `/admin/policy`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/policy` | Page loads with platform policies (Terms, Privacy, Refund, etc.) | — | |
| 2 | **[CLICK]** Edit on any policy | Rich text editor or textarea appears | — | |
| 3 | Make a small text change | Accepted | — | |
| 4 | **[CLICK]** Save | Saved. Success confirmation. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-17 — Promo Management

**URL:** `/admin/promos`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/promos` | Page loads with promo code list | — | |
| 2 | **[VERIFY]** Each promo | Code, discount %, expiry date, usage count, status | — | |
| 3 | **[CLICK]** "Create Promo" | Form opens | — | |
| 4 | Fill: code `TESTPROMO10`, discount `10%`, expiry (any future date) | Accepted | — | |
| 5 | **[CLICK]** Save | Promo appears in list with correct values | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-18 — Support Ticket Detail

**URL:** `/admin/support-ticket/:id`  
**Pre-condition:** A support ticket exists (submit one via `11-PUBLIC-SHARED.md → MTS-PUB-06`).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/support-ticket/1` | Page loads with ticket detail | — | |
| 2 | **[VERIFY]** Content | Submitter info, issue description, submitted date, current status, conversation thread | — | |
| 3 | **[CLICK]** reply input, **[TYPE]** `Thank you for reaching out. We are investigating this.` | Accepted | — | |
| 4 | **[CLICK]** Send Reply | Reply appears in thread | — | |
| 5 | **[SELECT]** status → "Resolved" | Status changes | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-19 — System Health

**URL:** `/admin/system-health`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/system-health` | Page loads without crash | — | |
| 2 | **[VERIFY]** Service status list | Each service (API, Database, Storage, Payment gateway, etc.) shows a status dot: green (online), red (down), yellow (degraded) | — | |
| 3 | **[VERIFY]** No "undefined" or "null" visible anywhere on page | All values populated | — | |
| 4 | **[VERIFY]** Uptime / response time metrics | Shown if available | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-20 — Sitemap

**URL:** `/admin/sitemap`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/sitemap` | Page loads showing a sitemap view of the platform | — | |
| 2 | **[VERIFY]** All major routes listed | No obvious missing sections | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-AD-21 — Admin Settings

**URL:** `/admin/settings`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/admin/settings` | Page loads with system-level settings | — | |
| 2 | **[VERIFY]** Sections | Platform fee %, notification settings, maintenance mode toggle, etc. | — | |
| 3 | Change any setting | Change accepted | — | |
| 4 | **[CLICK]** Save | Success. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

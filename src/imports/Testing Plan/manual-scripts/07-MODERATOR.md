# 07 — MODERATOR Manual Test Script

**Pre-condition for ALL tests:** Demo login as Moderator.  
See `01-AUTH.md → MTS-AUTH-04` (Demo Login → Moderator button).

---

## MTS-MOD-01 — Dashboard

**URL:** `/moderator/dashboard`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/dashboard` | Page loads. "Moderator Dashboard" heading. Date shown. | — | |
| 2 | **[VERIFY]** 4 stat cards | Pending Reviews (18 — amber), Open Reports (8 — red), Content Flags (5 — purple), Resolved Today (12 — green) | — | |
| 3 | **[CLICK]** "Pending Reviews" card | Navigated to `/moderator/reviews` | — | |
| 4 | Press browser Back | Back on dashboard | — | |
| 5 | **[CLICK]** "Open Reports" card | Navigated to `/moderator/reports` | — | |
| 6 | Press browser Back | Back on dashboard | — | |
| 7 | **[CLICK]** "Content Flags" card | Navigated to `/moderator/content` | — | |
| 8 | Press browser Back | Back on dashboard | — | |
| 9 | **[VERIFY]** "User Sanctions" quick link | Shield icon, "Manage warnings, mutes & bans" description | — | |
| 10 | **[CLICK]** User Sanctions link | Navigated to `/moderator/sanctions` | — | |
| 11 | Press browser Back | Back on dashboard | — | |
| 12 | **[VERIFY]** "Escalation Queue" quick link | ArrowUpRight icon, "Cases requiring admin review" | — | |
| 13 | **[CLICK]** Escalation Queue link | Navigated to `/moderator/escalations` | — | |
| 14 | Press browser Back | Back on dashboard | — | |
| 15 | **[VERIFY]** Moderation Queue table | Shows "31 items" badge. Each item has: type badge (Review/Report/Content), priority badge (low=green/medium=amber/high=red), content text, reporter + time, Review/Approve/Remove buttons | — | |
| 16 | **[CLICK]** "Approve" on any queue item | Item shows success state or is removed from queue | — | |
| 17 | **[CLICK]** "Remove" on any queue item | Item removed with confirmation | — | |
| 18 | **[CLICK]** "Review" on any queue item | Navigated to `/moderator/queue-detail/:id` | — | |
| 19 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-02 — Review Queue

**URL:** `/moderator/reviews`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/reviews` | Page loads with pending user reviews awaiting approval | — | |
| 2 | **[VERIFY]** Each review | Reviewer name, reviewee name, star rating, comment text, submission date, status | — | |
| 3 | **[CLICK]** "Approve" on any review | Review marked approved. Removed from pending queue OR status badge changes to "Approved". | — | |
| 4 | **[CLICK]** "Remove" / "Reject" on another | Removed or status changes to "Removed" | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-03 — Reports Queue

**URL:** `/moderator/reports`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/reports` | Page loads with user-submitted reports (e.g. inappropriate content, misconduct) | — | |
| 2 | **[VERIFY]** Each report | Reporter name, reported user/content, report category, date, status | — | |
| 3 | **[CLICK]** any report | Report detail loads | — | |
| 4 | Take an action (dismiss, warn, escalate) | Status updates | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-04 — Content Queue

**URL:** `/moderator/content`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/content` | Page loads with flagged content items (profile descriptions, blog posts, messages) | — | |
| 2 | **[VERIFY]** Each item | Content snippet, source (who posted it), reason flagged, date | — | |
| 3 | **[CLICK]** "Approve" on any item | Content approved. | — | |
| 4 | **[CLICK]** "Remove" on another | Content removed. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-05 — Queue Detail

**URL:** `/moderator/queue-detail/:id`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate from dashboard "Review" button, or go to `/moderator/queue-detail/1` | Page loads with full detail of the flagged item | — | |
| 2 | **[VERIFY]** Content | Full content text, reporter info, reported user profile, previous actions | — | |
| 3 | **[CLICK]** "Approve" | Item approved. Status updates. | — | |
| 4 | Navigate to a different queue item, **[CLICK]** "Remove" | Item removed | — | |
| 5 | Navigate to another, **[CLICK]** "Escalate" | Item sent to escalation queue | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-06 — Sanctions

**URL:** `/moderator/sanctions`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/sanctions` | Page loads with history of issued sanctions | — | |
| 2 | **[VERIFY]** Each sanction | User name, sanction type (Warning/Mute/Ban), issued date, expiry (if any), reason | — | |
| 3 | **[CLICK]** "Issue Sanction" or "+ New" | Form opens: user search, sanction type, reason, duration | — | |
| 4 | Search for a user, select a type `Warning`, enter reason `Inappropriate profile text` | Accepted | — | |
| 5 | **[CLICK]** Issue | Warning appears in sanctions history | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-MOD-07 — Escalations

**URL:** `/moderator/escalations`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/moderator/escalations` | Page loads with cases escalated for admin review | — | |
| 2 | **[VERIFY]** Each case | Case ID, original report type, escalated by, escalation reason, date | — | |
| 3 | **[CLICK]** any case | Detail view opens | — | |
| 4 | If "Resolve Escalation" available: **[CLICK]** it | Case marked resolved. | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

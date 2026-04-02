# 10 — WALLET, BILLING & CONTRACTS Manual Test Script

**Pre-condition:** Logged in as any role with wallet access (Caregiver or Guardian recommended).  
See `01-AUTH.md → MTS-AUTH-04`.

---

## MTS-WB-01 — Wallet Overview

**URL:** `/wallet`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/wallet` | Page loads without crash | — | |
| 2 | **[VERIFY]** Balance displayed | A BDT or CarePoints amount prominently shown | — | |
| 3 | **[VERIFY]** Recent transactions list | At least one entry with: date, description, amount (+ green or - red), status | — | |
| 4 | **[VERIFY]** Transaction type icons | Green downward arrow = credit, red upward arrow = debit | — | |
| 5 | **[CLICK]** "Top Up" button or link | Navigated to `/wallet/top-up` | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-02 — Top Up

**URL:** `/wallet/top-up`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/wallet/top-up` | Page loads with top-up form | — | |
| 2 | **[VERIFY]** Amount input and payment method options (bKash, Card) | Visible | — | |
| 3 | **[CLICK]** amount field, **[TYPE]** `50` (below minimum if any) | Input accepts value | — | |
| 4 | **[CLICK]** Confirm | Either success, or a minimum amount error is shown | — | |
| 5 | Clear and **[TYPE]** `500` | Accepted | — | |
| 6 | **[SELECT]** bKash payment method | bKash selected | — | |
| 7 | **[CLICK]** Confirm Top Up | Redirect to payment gateway OR mock success confirmation shown | — | |
| 8 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-03 — Transfer History

**URL:** `/wallet/transfer-history`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/wallet/transfer-history` | Page loads with transfer log | — | |
| 2 | **[VERIFY]** Each entry | Date, sender, receiver, amount, type, status | — | |
| 3 | If date filter exists: filter by "Last 30 days" | List updates | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-04 — Billing Overview

**URL:** `/billing`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/billing` | Page loads with invoice list | — | |
| 2 | **[VERIFY]** Each invoice | Invoice number, date, amount, status badge (Paid=green/Pending=amber/Overdue=red) | — | |
| 3 | If filter exists: **[SELECT]** "Unpaid" | Only unpaid invoices shown | — | |
| 4 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-05 — Invoice Detail

**URL:** `/billing/invoice/:invoiceId`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** any invoice from billing overview | Navigated to `/billing/invoice/:id` | — | |
| 2 | **[VERIFY]** Content | Line items (service, hours, rate), subtotal, platform fee, total, invoice date, due date, payment status | — | |
| 3 | **[VERIFY]** Download/Print button | Visible | — | |
| 4 | **[CLICK]** Download | PDF download or print dialog | — | |
| 5 | If invoice is unpaid: **[CLICK]** "Submit Payment Proof" | Navigated to `/billing/submit-proof/:id` | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-06 — Submit Payment Proof

**URL:** `/billing/submit-proof/:invoiceId`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/billing/submit-proof/1` | Page loads with payment proof upload form | — | |
| 2 | **[VERIFY]** Invoice summary shown | Amount due, invoice number, deadline | — | |
| 3 | **[CLICK]** file upload area | File picker opens | — | |
| 4 | Select a screenshot or image as proof | Filename and preview shown | — | |
| 5 | If transaction reference field exists: **[TYPE]** `TXN123456789` | Accepted | — | |
| 6 | **[CLICK]** Submit | Invoice status changes to "Pending Review". Success toast. | — | |
| 7 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-WB-07 — Verify Payment (Admin/Finance role)

**URL:** `/billing/verify/:proofId`  
**Pre-condition:** A payment proof has been submitted (MTS-WB-06). Admin login preferred.  
See `01-AUTH.md → MTS-AUTH-04` (Admin).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/billing/verify/1` | Page loads showing the submitted payment proof | — | |
| 2 | **[VERIFY]** Proof content | Uploaded image, transaction reference, submitter name, submitted date | — | |
| 3 | **[CLICK]** "Approve" / "Mark Paid" | Invoice status → "Paid". Success. | — | |
| 4 | Navigate to `/billing/invoice/:id` | Invoice shows "Paid" status | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CON-01 — Contract List

**URL:** `/contracts`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/contracts` | Page loads with contract list | — | |
| 2 | **[VERIFY]** Each contract | Contract ID, parties (caregiver + guardian/agency), start date, status (Active/Pending/Expired) | — | |
| 3 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CON-02 — Contract Detail

**URL:** `/contracts/:id`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | **[CLICK]** any contract from list | Navigated to `/contracts/:id` | — | |
| 2 | **[VERIFY]** Terms | Full contract terms, payment schedule, obligations, SLA | — | |
| 3 | If contract is pending signature: **[CLICK]** "Sign Contract" | Signature input or confirmation dialog appears | — | |
| 4 | Sign/confirm | Contract status → "Active" | — | |
| 5 | **[VERIFY]** Console | Zero errors | — | |

---

## MTS-CON-03 — Contract Dispute

**URL:** `/contracts/disputes`

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/contracts/disputes` | Page loads with list of contract disputes | — | |
| 2 | **[VERIFY]** Each dispute | Contract ID, parties, issue type, status, submitted date | — | |
| 3 | **[CLICK]** "Open New Dispute" or "+ Dispute" | Form opens: select contract, issue type, description | — | |
| 4 | Fill in: select a contract, type `Payment dispute`, description `Payment was not received after completed shift.` | Accepted | — | |
| 5 | **[CLICK]** Submit | Dispute appears in list with "Open" status | — | |
| 6 | **[VERIFY]** Console | Zero errors | — | |

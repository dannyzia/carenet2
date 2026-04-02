# Manual Test Scripts — Index

## For testing agents (start here)

1. Read **`../TESTING_AGENT_PROMPT.md`** from top through **AGENT PLAYBOOK** — that is the execution contract.  
2. Read **`e2e/carenet/PLAYWRIGHT_AGENT_PROMPT.md`** — credentials, selector strategy, timing patterns, fixing rules.  
3. Read **`../TESTING_PLAN.md`** §1.1 (route inventory), §2 (P1-P10), §3.1-**3.3** (auth modes, mock ids, Playwright integration + gap table + commands).  
4. Run **Phase 0 Playwright baseline** (`npx playwright test e2e/carenet/`) before any manual work.  
5. Execute manual files in the **exact order** listed in `TESTING_AGENT_PROMPT.md` → **EXECUTION ORDER**. After each manual file, run the matching Playwright spec(s).  
6. After **each** `MTS-*` block, write ✅/❌/⚠️ to the script file **immediately**; after **each** manual file, update **`TESTING_PLAN.md` Section 10** Module Summary + Playwright per-spec row.  
7. After all modules, run **Phase 2 Playwright regression sweep** and fill in Section 10 Playwright results.

---

## Structure

Each file covers one role or domain. Tests within a file are numbered `MTS-[CODE]-NN`.  
Any test that requires a pre-condition from another file cites it as:  
> **Pre-condition:** See `[filename] → [test ID]`

## Files

| File | Role / Domain | Screens Covered |
|---|---|---|
| `01-AUTH.md` | Auth (all roles) | Login, MFA Setup, MFA Verify, Register, Forgot Password, Reset Password, Role Selection, Route Guards, **real (Supabase) login smoke** |
| `02-CAREGIVER.md` | Caregiver | Dashboard, Jobs, Job Detail, Job Application, Schedule, Shift Detail, Shift Check-In, Care Log, Care Notes, Med Schedule, Handoff Notes, Incident Report, Assigned Patients, Prescription, Shift Planner, Earnings, Daily Earnings, Payout Setup, Tax Reports, Profile, Portfolio, References, Skills Assessment, Training Portal, Documents, Messages, Reviews |
| `03-GUARDIAN.md` | Guardian | Dashboard, Search, Caregiver Profile, Agency Profile, Caregiver Comparison, Booking Wizard, Care Requirement Wizard, Care Requirements List, Care Requirement Detail, Bid Review, Patient Intake, Patients List, Placements List, Placement Detail, Shift Rating, Family Hub, Marketplace Hub, Package Detail, Payments, Invoice Detail, Schedule, Messages, Reviews, Profile |
| `04-PATIENT.md` | Patient | **Part A:** Dashboard, Vitals, Medications, Medical Records, Document Upload, Health Report, Care History, Emergency Hub, Schedule, Messages, Data Privacy, Profile. **Part B:** `/patient/*` care-seeker routes (care requirements, marketplace, bids, placements, booking, search, caregiver/agency profiles) — see `TESTING_PLAN.md` §1.1 |
| `05-AGENCY.md` | Agency | Dashboard, Caregivers, Clients, Client Intake, Care Plan, Care Plan Template, Requirements Inbox, Requirement Review, Bid Management, Placements, Placement Detail, Shift Monitoring, Job Management, Job Applications, Payroll, Payments, Staff Hiring, Staff Attendance, Document Verification, Incident Report Wizard, Incidents List, Backup Caregiver, Branch Management, Package Create, Marketplace Browse, Storefront, Reports, Messages, Settings |
| `06-ADMIN.md` | Admin | Dashboard, Users, User Inspector, Verifications, Verification Case, Agency Approvals, Placement Monitoring, Payments, Wallet Management, Contracts, Disputes, Financial Audit, Audit Logs, Reports, CMS Manager, Language Management, Policy Manager, Promo Management, Support Ticket Detail, System Health, Sitemap, Settings |
| `07-MODERATOR.md` | Moderator | Dashboard, Review Queue, Reports, Content Queue, Queue Detail, Sanctions, Escalations |
| `08-09-SHOP.md` | Shop Merchant **and** Shop Front (customer) | **Merchant:** Dashboard, Onboarding, Product Editor, Products, Orders, Fulfillment, Inventory, Analytics, Merchant Analytics. **Customer (public):** Product List, Category, Product Detail, Reviews, Cart, Checkout, Order Success, Order Tracking, Order History, Wishlist — URLs under `/shop/…` with ShopFrontLayout (see `TESTING_PLAN.md` §1.1) |
| `10-WALLET-BILLING-CONTRACTS.md` | Wallet / Billing / Contracts | Wallet, Top Up, Transfer History, Billing Overview, Invoice Detail, Submit Payment Proof, Verify Payment, Contract List, Contract Detail, Contract Dispute |
| `11-PUBLIC-SHARED.md` | Public + Shared | Home, **Experience (`/experience`)**, About, Features, Pricing, Contact, Privacy, Terms, Marketplace, Global Search, Agency Directory, Blog List, Blog Detail, Careers, Help Center, Contact Us, Ticket Submission, Refund Request, Shared Dashboard, Settings, Notifications, Messages, 404 |
| `12-CROSS-CUTTING.md` | Cross-cutting | Mobile responsiveness (all roles), i18n, Offline/SW, Console errors; **optional** `/dev/connectivity` (non-release) |

**Note:** There is no `/shop-front/*` route prefix in the app. Customer shop and merchant shop both use `/shop/…` with different layouts.

## Conventions

| Symbol | Meaning |
|---|---|
| **[CLICK]** | Click this element |
| **[TYPE]** | Type into the focused field |
| **[SELECT]** | Choose from dropdown |
| **[VERIFY]** | Check the screen — no action needed |
| **[WAIT]** | Wait for this before continuing |
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Partial |
| — | Not yet tested |

## Before Starting Any File

1. App running at `http://localhost:5173`
2. Chrome DevTools → Console tab open
3. Keep a bug log open (or use Section 9 of TESTING_PLAN.md)
4. Open `TESTING_PLAN.md` §1.1 for the full route ↔ MTS inventory

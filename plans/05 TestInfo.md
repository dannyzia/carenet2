# CareNet 2 - Comprehensive Test Information Document

## 1. Application Overview

**App Name:** CareNet  
**Base URL:** http://localhost:5173 (or http://localhost:5174 when PW_TEST_PORT is set)  
**Environment:** Development (uses Vite dev server with `VITE_PLAYWRIGHT_E2E=true` for mock Supabase)

**Tech Stack:**
- **Frontend:** React 18 with TypeScript, Vite, Tailwind CSS v4, Radix UI, Motion (Framer Motion), Material UI (MUI) components
- **Backend:** Supabase (PostgreSQL, Authentication, Storage, Realtime subscriptions)
- **Mobile:** Capacitor for Android/iOS (app ID: com.carenet.app)
- **Auth Type:** JWT-based authentication via Supabase (Email + Password). For E2E testing, use the repository test helpers (e.g., `loginAs(page, role)`) with credentials from `plans/00 Test Credentials.md`.
- **Offline Storage:** Dexie (IndexedDB wrapper) with sync engine
- **Testing:** Playwright (E2E), Vitest (unit/integration)
- **Build Tool:** Vite with PWA support (Vite PWA plugin)

### Playwright in this repository (read before writing specs)

- **Spec location:** `e2e/` (most CareNet flows live under `e2e/carenet/`).
- **Shared helpers:** `e2e/carenet/helpers.ts` — from specs in `e2e/carenet/`, use `import { ... } from "./helpers"`.
- **Key helpers:** `loginAs(page, role)` (email + password login using credentials from `plans/00 Test Credentials.md`); `goto(page, path)`; `mainLandmark(page)` and `expectMainHeading(page, name)` (target `<main>` so sidebar/nav duplicate titles do not break assertions); `loginSubmitButton(page)` (the **Log In** submit scoped to the password form — avoids the duplicate **Log In** control in the public header); `captureConsoleErrors(page)`; `assertToast(page, text?)`; `assertInlineError(page, text?)`; `assertTitle(page, expected)`.
- **Selector priority:** Prefer `getByRole` / accessible name, then labels, then `data-testid` / `data-role` where the UI exposes them. Avoid `waitForLoadState("networkidle")` and `page.waitForTimeout()` for readiness; use `expect(locator).toBeVisible()` (and similar) with explicit timeouts.
- **Parallelism + IndexedDB:** `playwright.config.ts` uses `fullyParallel: true`. All workers share the same `baseURL` origin, so Dexie/IndexedDB can race or leak state across tests. Use `test.describe.configure({ mode: "serial" })` for offline/sync-heavy suites, keep tests idempotent, or introduce per-worker `storageState` / isolated profiles if you expand auth reuse.
- **Accessibility (axe):** Follow `e2e/carenet/a11y-smoke.spec.ts`: `@axe-core/playwright` with **color-contrast** disabled (themed tokens) and assert only **critical** + **serious** violations (use `expect.soft` if mirroring that file).
- **Capacitor vs browser E2E:** `chromium` and `mobile-chrome` projects validate **web** behavior (viewport, touch). They do **not** replace native tests for camera, push, URL schemes, Android back, or plugin lifecycles — call those out of scope for Playwright unless you add a separate native harness.

## 2. Authentication Details

**Login URL:** `/auth/login`

**Login Method:** 
- Email + Password (primary)
- The credential list in `plans/00 Test Credentials.md` is not configured with MFA/TOTP; follow the repo test helpers for E2E behaviour.

**Input Selectors (VERY IMPORTANT):**

- **Email field selector:** `input[type="email"]` or `input[autocomplete="email"]`
- **Password field selector:** `input[type="password"]` or `input[autocomplete="current-password"]`
- **Submit button:** Prefer `loginSubmitButton(page)` from `e2e/carenet/helpers.ts` (form that contains the password field + role button **Log In**). A bare `button[type="submit"]` or global **Log In** match can hit the wrong control because the public nav also exposes login actions.
- **Forgot Password link:** `a` with text containing "forgot password" (case-insensitive)
- **Password toggle eye button:** `button[type="button"]` inside login form (reveals/hides password)

**Test Credentials:**

**Test Accounts:** All test credentials (emails and password) are maintained in `plans/00 Test Credentials.md`. That file is the single source of truth for E2E test accounts. Do **not** duplicate passwords in this document or in git. Rotate credentials if they were ever pasted into shared docs.

**Account-to-Role Mapping (from `plans/00 Test Credentials.md`):**

| Role | Email | Notes |
|------|-------|-------|
| Caregiver | `caregiver1@indigobangladesh.xyz` | Primary caregiver account |
| Caregiver (alt) | `caregiver2@indigobangladesh.xyz` | Second caregiver account |
| Guardian | `guardian1@indigobangladesh.xyz` | Primary guardian account |
| Guardian (alt) | `guardian2@indigobangladesh.xyz` | Second guardian account |
| Patient | `patient1@indigobangladesh.xyz` | Primary patient account |
| Patient (alt) | `patient2@indigobangladesh.xyz` | Second patient account |
| Agency | `agent@indigobangladesh.xyz` | Agency account |
| Admin | `agent1@indigobangladesh.xyz` | Admin account |
| Shop Owner | `shopowner1@indigobangladesh.xyz` | Primary shop owner account |
| Shop Owner (alt) | `shopowner2@indigobangladesh.xyz` | Second shop owner account |

**Password:** See `plans/00 Test Credentials.md` (all accounts share the same password).

**Moderator:** No dedicated moderator test account is currently listed. If moderator access is needed, coordinate with the team to provision one or use the admin account for role-switching tests.

**Post-login redirect URL (expected):** `/{role}/dashboard` (e.g., `/caregiver/dashboard`, `/guardian/dashboard`)

**Any CAPTCHA / 2FA?**
- Authentication: Email + Password only. The credential set listed in `plans/00 Test Credentials.md` does not require any additional verification codes, CAPTCHA, or 2FA.

**How to log in (for testing):**
- Use the `loginAs(page, role)` helper from `e2e/carenet/helpers.ts` to log in with real test credentials.
- Credentials are sourced from `plans/00 Test Credentials.md` — do NOT hardcode them in this document.
- Keep any sensitive test secrets in a secure, private credential store or in local-only files that are not committed.

## 3. User Roles

CareNet supports **7 distinct user roles**, each with unique dashboards and capabilities:

### **Role 1: Caregiver**
- **Name:** Caregiver
- **Unique dashboard URL:** `/caregiver/dashboard`
- **What makes it different:**
  - Browse and apply for caregiving jobs
  - Manage work schedule and shifts
  - Track earnings and daily wages
  - Submit care logs and incident reports
  - View assigned patients and care plans
  - Manage portfolio, skills, and certifications
  - Access training resources
  - Check in/out of shifts
  - View job applications and offers
  - Manage payout setup (bank account, mobile wallet)
  - Submit references and background verification

### **Role 2: Guardian**
- **Name:** Guardian (family member who manages care for a patient)
- **Dashboard URL:** `/guardian/dashboard`
- **Differences:**
  - Search and browse caregiving agencies and caregivers
  - Create and manage care requests/requirements
  - Book caregiving services via wizard
  - Manage patient profiles and care plans
  - View placement history and active caregivers
  - Rate and review caregivers and agencies
  - View care logs and diaries
  - Track payments and invoices
  - View live tracking of caregiver arrivals
  - Manage care requirements and bids
  - Access emergency hub and SOS features

### **Role 3: Patient**
- **Name:** Patient (care recipient)
- **Dashboard URL:** `/patient/dashboard`
- **Differences:**
  - View personal care history and medical records
  - Access health reports and vital tracking
  - Manage medication reminders
  - View daily schedule of caregivers
  - Access emergency SOS button
  - View care plans and requirements
  - Track symptoms and rehabilitation progress
  - View care diary and logs
  - Manage data privacy settings
  - Access telehealth consultations (if available)
  - Upload documents and photos

### **Role 4: Agency**
- **Name:** Agency (caregiving service provider)
- **Dashboard URL:** `/agency/dashboard`
- **Differences:**
  - Manage caregiver roster and applications
  - View and manage client relationships
  - Handle job postings and applications
  - Manage placements and assignments
  - Track payments and payroll
  - View operational reports and analytics
  - Monitor shift activities
  - Manage care plan templates
  - Create and sell care packages
  - Browse marketplace for care requirements
  - Submit bids on care requests
  - Manage branches and staff attendance
  - Handle incident reports and care scorecards
  - Manage document verifications

### **Role 5: Admin**
- **Name:** Admin (platform administrator)
- **Dashboard URL:** `/admin/dashboard`
- **Differences:**
  - Full platform oversight and control
  - Manage all users (view, edit, suspend, delete)
  - Handle verifications and approvals
  - Monitor system health and performance
  - View financial audits and reports
  - Manage disputes and support tickets
  - Configure system settings and policies
  - Manage languages and CMS content
  - View audit logs and user activity
  - Manage agency approvals
  - Monitor placements and wallet transactions
  - Manage contracts and agreements
  - Access verification cases

### **Role 6: Moderator**
- **Name:** Moderator (content and community moderator)
- **Dashboard URL:** `/moderator/dashboard`
- **Differences:**
  - Review and moderate user-generated content
  - Handle flagged reviews and reports
  - Apply sanctions and warnings
  - Review disputes and escalations
  - Monitor community guidelines compliance
  - Review queue for pending content
  - View moderator-specific analytics

### **Role 7: Shop / Shop Owner**
- **Name:** Shop Owner (medical supplies/e-commerce merchant)
- **Dashboard URL:** `/shop/dashboard`
- **Differences:**
  - Manage product catalog and inventory
  - Create and edit products
  - Process and fulfill orders
  - View merchant analytics and performance
  - Manage onboarding and store settings
  - Handle product reviews and ratings
  - Track order history and fulfillment status
  - View sales and revenue reports

## 4. Core Modules / Navigation Map

### **Public Pages (No Authentication Required)**

**Public Routes:**
- `/` - Home page (redirects to login)
- `/privacy` - Privacy Policy page
- `/terms` - Terms of Service page
- `/marketplace` - Public marketplace page
- `/global-search` - Global search page
- `/agencies` - Agency directory page
- `/support/help` - Help Center page
- `/support/ticket` - Support ticket submission page
- `/support/refund` - Refund request page
- `*` - 404 Not Found page

**Authentication Routes:**
- `/auth/login` - Login page
- `/auth/callback` - OAuth callback page
- `/auth/register` - Registration page
- `/auth/register/:role` - Registration page with pre-selected role
- `/auth/role-selection` - Role selection page (for multi-role users)
- `/auth/forgot-password` - Forgot password page
- `/auth/reset-password` - Reset password page (after email link)
- `/auth/verification-result` - Email verification result page


**Shop Front (Customer-facing, No Auth):**
- `/shop` - Product list page
- `/shop/category/:category` - Product category page (e.g., `/shop/category/equipment`)
- `/shop/product/:id` - Product details page (e.g., `/shop/product/123`)
- `/shop/product/:id/reviews` - Product reviews page
- `/shop/cart` - Shopping cart page
- `/shop/checkout` - Checkout page
- `/shop/order-success` - Order success page
- `/shop/order-tracking/:id` - Order tracking page
- `/shop/order-history` - Customer order history page
- `/shop/wishlist` - Wishlist page

### **Shared Authenticated Pages (All Roles)**

- `/dashboard` - Shared dashboard page
- `/schedule/daily` - Daily schedule page
- `/documents/view/:id` - Medical document viewer page
- `/settings` - Settings page
- `/notifications` - Notifications page
- `/messages` - Messages page

### **Caregiver Routes**

**Dashboard & Overview:**
- `/caregiver/dashboard` - Caregiver main dashboard

**Jobs & Applications:**
- `/caregiver/jobs` - Browse available jobs
- `/caregiver/jobs/:id` - Job detail page
- `/caregiver/job-application/:id` - Job application detail page
- `/caregiver/marketplace-hub` - Marketplace hub for finding jobs
- `/caregiver/marketplace/package/:id` - Package detail page

**Schedule & Shifts:**
- `/caregiver/schedule` - Work schedule calendar
- `/caregiver/shift/:id` - Shift detail page
- `/caregiver/shift-planner` - Shift planner page
- `/caregiver/shift-check-in` - Shift check-in page
- `/caregiver/shift-check-in/:id` - Shift check-in page for specific shift
- `/caregiver/shift-checkout/:id` - Shift check-out page

**Care & Patients:**
- `/caregiver/assigned-patients` - List of assigned patients
- `/caregiver/care-log` - Care log submission page
- `/caregiver/care-notes` - Care notes page
- `/caregiver/prescription` - Prescription management page
- `/caregiver/med-schedule` - Medication schedule page
- `/caregiver/incident-report` - Incident report submission page
- `/caregiver/handoff-notes` - Handoff notes page
- `/caregiver/handoff` - Handoff notes page (alias)
- `/caregiver/alerts` - Caregiver alerts page

**Financial:**
- `/caregiver/earnings` - Earnings overview
- `/caregiver/daily-earnings` - Daily earnings detail page
- `/caregiver/payout-setup` - Payout setup page (bank/wallet)

**Professional:**
- `/caregiver/profile` - Caregiver profile page
- `/caregiver/portfolio` - Portfolio editor page
- `/caregiver/references` - Reference manager page
- `/caregiver/skills-assessment` - Skills assessment page
- `/caregiver/training` - Training portal page
- `/caregiver/documents` - Documents management page
- `/caregiver/reviews` - Reviews page
- `/caregiver/tax-reports` - Tax reports page

**Communication:**
- `/caregiver/messages` - Messages page (role-specific)

### **Guardian Routes**

**Dashboard & Overview:**
- `/guardian/dashboard` - Guardian main dashboard

**Search & Booking:**
- `/guardian/search` - Search caregivers and agencies
- `/guardian/caregiver/:id` - Caregiver public profile page
- `/guardian/agency/:id` - Agency public profile page
- `/guardian/caregiver-comparison` - Compare caregivers page
- `/guardian/booking` - Booking wizard page
- `/guardian/family-hub` - Family hub page

**Patients & Care:**
- `/guardian/patients` - List of managed patients
- `/guardian/patient/:id` - Patient detail page
- `/guardian/patient-intake` - Patient intake form page
- `/guardian/care-log` - Guardian care diary page
- `/guardian/alerts` - Guardian alerts page
- `/guardian/live-tracking` - Live caregiver tracking page
- `/guardian/live-monitor` - Live monitor page
- `/guardian/care-scorecard` - Care scorecard page
- `/guardian/family-board` - Family board page
- `/guardian/incident-report` - Guardian incident report page
- `/guardian/emergency` - Emergency hub page

**Care Requirements & Marketplace:**
- `/guardian/care-requirements` - List care requirements
- `/guardian/care-requirement-wizard` - Create care requirement wizard
- `/guardian/care-requirement/:id` - Care requirement detail page
- `/guardian/marketplace-hub` - Marketplace hub
- `/guardian/marketplace/package/:id` - Package detail page
- `/guardian/bid-review/:id` - Bid review page
- `/guardian/placements` - List placements
- `/guardian/placement/:id` - Placement detail page
- `/guardian/shift-rating/:id` - Shift rating page

**Financial:**
- `/guardian/payments` - Payments overview
- `/guardian/invoice/:id` - Invoice detail page
- `/guardian/reviews` - Reviews page

**Communication:**
- `/guardian/messages` - Messages page (role-specific)
- `/guardian/schedule` - Schedule page

### **Patient Routes**

**Dashboard & Health:**
- `/patient/dashboard` - Patient main dashboard
- `/patient/health-report` - Health report page
- `/patient/vitals` - Vitals tracking page
- `/patient/symptoms` - Symptoms tracking page

**Medical & Care:**
- `/patient/care-history` - Care history page
- `/patient/medical-records` - Medical records page
- `/patient/care-plan` - Care plan page
- `/patient/care-log` - Patient care diary page
- `/patient/medications` - Medication reminders page
- `/patient/alerts` - Patient alerts page

**Profile & Settings:**
- `/patient/profile` - Patient profile page
- `/patient/data-privacy` - Data privacy manager page
- `/patient/document-upload` - Document upload page

**Emergency:**
- `/patient/emergency` - Emergency hub page
- `/patient/emergency-sos` - Emergency SOS page

**Daily Living:**
- `/patient/schedule` - Patient schedule page
- `/patient/photo-journal` - Photo journal page
- `/patient/nutrition` - Nutrition page
- `/patient/rehab` - Rehabilitation page
- `/patient/insurance` - Insurance page
- `/patient/telehealth` - Telehealth page

**Marketplace (patient-side):**
- `/patient/care-requirements` - List care requirements
- `/patient/care-requirement-wizard` - Create care requirement wizard
- `/patient/care-requirement/:id` - Care requirement detail page
- `/patient/marketplace-hub` - Marketplace hub
- `/patient/marketplace/package/:id` - Package detail page
- `/patient/bid-review/:id` - Bid review page
- `/patient/placements` - List placements
- `/patient/placement/:id` - Placement detail page
- `/patient/booking` - Booking wizard page
- `/patient/search` - Search caregivers and agencies
- `/patient/caregiver/:id` - Caregiver public profile page
- `/patient/agency/:id` - Agency public profile page

### **Agency Routes**

**Dashboard & Overview:**
- `/agency/dashboard` - Agency main dashboard
- `/agency/settings` - Agency settings page
- `/agency/storefront` - Agency storefront page

**Caregivers:**
- `/agency/caregivers` - List caregivers
- `/agency/attendance` - Staff attendance page
- `/agency/hiring` - Staff hiring page
- `/agency/backup-caregiver` - Backup caregiver page
- `/agency/reassignment-history` - Reassignment history page
- `/agency/document-verification` - Document verification page

**Clients & Jobs:**
- `/agency/clients` - List clients
- `/agency/client-intake` - Client intake form page
- `/agency/care-plan/:id` - Client care plan page
- `/agency/care-plan-template` - Care plan template page
- `/agency/job-management` - Job management page
- `/agency/jobs/:id/applications` - Job applications page
- `/agency/caregiving-jobs` - Caregiving jobs page
- `/agency/requirements-inbox` - Requirements inbox page
- `/agency/requirement-review/:id` - Requirement review page

**Placements & Monitoring:**
- `/agency/placements` - List placements
- `/agency/placement/:id` - Placement detail page
- `/agency/shift-monitoring` - Shift monitoring page
- `/agency/care-scorecard` - Care scorecard page
- `/agency/incidents` - Incidents page
- `/agency/incident-report` - Incident report wizard page

**Marketplace & Packages:**
- `/agency/marketplace-browse` - Marketplace browse (legacy redirect)
- `/agency/care-requirement-board` - Care requirement board page
- `/agency/care-packages` - Care packages catalog page
- `/agency/package-create` - Create package page
- `/agency/bid-management` - Bid management page
- `/agency/package-leads` - Package leads page

**Financial & Reports:**
- `/agency/payments` - Payments overview
- `/agency/payroll` - Payroll page
- `/agency/reports` - Reports page

**Communication:**
- `/agency/messages` - Messages page (role-specific)

### **Admin Routes**

**Dashboard & System:**
- `/admin/dashboard` - Admin main dashboard
- `/admin/system-health` - System health page
- `/admin/settings` - Admin settings page
- `/admin/sitemap` - Sitemap management page

**User Management:**
- `/admin/users` - User management page
- `/admin/user-inspector` - User inspector page
- `/admin/verifications` - Verifications queue page
- `/admin/verification-case/:id` - Verification case detail page
- `/admin/agency-approvals` - Agency approvals page

**Financial & Operations:**
- `/admin/payments` - Payments overview page
- `/admin/financial-audit` - Financial audit page
- `/admin/wallet-management` - Wallet management page
- `/admin/contracts` - Contracts management page

**Content & Moderation:**
- `/admin/cms` - CMS manager page
- `/admin/languages` - Language management page
- `/admin/promos` - Promo management page
- `/admin/policy` - Policy manager page

**Support & Disputes:**
- `/admin/reports` - Reports page
- `/admin/disputes` - Dispute adjudication page
- `/admin/support-ticket/:id` - Support ticket detail page
- `/admin/audit-logs` - Audit logs page

**Monitoring:**
- `/admin/placement-monitoring` - Placement monitoring page

### **Moderator Routes**

**Dashboard & Queue:**
- `/moderator/dashboard` - Moderator main dashboard
- `/moderator/reviews` - Reviews moderation page
- `/moderator/reports` - Reports moderation page
- `/moderator/content` - Content moderation page
- `/moderator/queue-detail/:id` - Queue detail page

**Enforcement:**
- `/moderator/sanctions` - Sanctions page
- `/moderator/escalations` - Escalations page

### **Shop / Shop Owner Routes**

**Dashboard & Overview:**
- `/shop/dashboard` - Shop owner dashboard
- `/shop/onboarding` - Merchant onboarding page

**Products:**
- `/shop/products` - Product list page
- `/shop/product-editor` - Create new product page
- `/shop/product-editor/:id` - Edit product page (e.g., `/shop/product-editor/123`)

**Orders & Fulfillment:**
- `/shop/orders` - Orders list page
- `/shop/fulfillment` - Order fulfillment page

**Inventory & Analytics:**
- `/shop/inventory` - Inventory management page
- `/shop/analytics` - Analytics page
- `/shop/merchant-analytics` - Merchant analytics page

### **Wallet & Contracts (All Roles)**

- `/wallet` - Wallet overview page
- `/wallet/transfer-history` - Transfer history page
- `/wallet/top-up` - Wallet top-up page
- `/contracts` - Contracts list page
- `/contracts/:id` - Contract detail page
- `/contracts/disputes` - Disputes list page
- `/contracts/disputes/:id` - Dispute detail page

### **Billing (All Roles)**

- `/billing` - Billing overview page
- `/billing/invoice/:invoiceId` - Invoice detail page
- `/billing/submit-proof/:invoiceId` - Submit payment proof page
- `/billing/verify/:proofId` - Verify payment page

### **Development & Testing**

- `/dev/connectivity` - Connectivity demo page (development only)

### **Hidden Pages / Modal-based Screens**

While not separate routes, these are important UI components to test:
- **Role Selection Modal:** Appears for users with multiple roles (accessible via `/auth/role-selection`)
- **Care Requirement Wizard Modal:** Can be triggered from dashboard
- **Booking Wizard Modal:** 4-step wizard for booking care
- **Shift Check-in Modal:** Appears when starting a shift
- **Shift Check-out Modal:** Appears when ending a shift
- **Review/Rating Modal:** Appears after shift completion
- **Support Chat Widget:** Floating chat button (if implemented)
- **Notification Dropdown:** Bell icon with notifications
- **User Menu Dropdown:** Avatar/profile dropdown with logout and settings
- **Search Modal:** Global search modal
- **Filter Modals:** Various filter modals for job/agency/caregiver search
- **Image Upload Modal:** For profile pictures, documents, product images

### **Dynamic Routes (with Parameters)**

- `/auth/register/:role` - Role parameter (caregiver, guardian, patient, agency, admin, moderator, shop)
- `/caregiver/jobs/:id` - Job ID
- `/caregiver/job-application/:id` - Application ID
- `/caregiver/shift/:id` - Shift ID
- `/caregiver/shift-check-in/:id` - Shift ID
- `/caregiver/shift-checkout/:id` - Shift ID
- `/guardian/patient/:id` - Patient ID
- `/guardian/caregiver/:id` - Caregiver ID
- `/guardian/agency/:id` - Agency ID
- `/guardian/care-requirement/:id` - Care requirement ID
- `/guardian/placement/:id` - Placement ID
- `/guardian/shift-rating/:id` - Shift ID for rating
- `/guardian/bid-review/:id` - Bid ID
- `/guardian/invoice/:id` - Invoice ID
- `/guardian/marketplace/package/:id` - Package ID
- `/patient/care-requirement/:id` - Care requirement ID
- `/patient/placement/:id` - Placement ID
- `/patient/booking` - Booking wizard (may have query params)
- `/agency/care-plan/:id` - Care plan ID
- `/agency/requirement-review/:id` - Requirement ID
- `/agency/placement/:id` - Placement ID
- `/agency/jobs/:id/applications` - Job ID
- `/admin/verification-case/:id` - Case ID
- `/admin/support-ticket/:id` - Ticket ID
- `/moderator/queue-detail/:id` - Queue item ID
- `/shop/product-editor/:id` - Product ID
- `/shop/category/:category` - Category name
- `/shop/product/:id` - Product ID
- `/shop/product/:id/reviews` - Product ID
- `/shop/order-tracking/:id` - Order ID
- `/documents/view/:id` - Document ID
- `/contracts/:id` - Contract ID
- `/contracts/disputes/:id` - Dispute ID
- `/billing/invoice/:invoiceId` - Invoice ID
- `/billing/submit-proof/:invoiceId` - Invoice ID
- `/billing/verify/:proofId` - Proof ID

## 5. Critical Workflows (Most Important Section)

### **Workflow 1: Login (Email + Password)**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email field: `caregiver1@indigobangladesh.xyz` (or the appropriate email from `plans/00 Test Credentials.md`)
   - Password field: *(see `plans/00 Test Credentials.md` for password)*
3. **Click:** "Log In" button (submit button)
4. **Expected result:** 
   - If valid credentials: Redirect to role dashboard (e.g., `/caregiver/dashboard`)
   - If invalid: Error message displayed; fields remain populated

**Critical Elements to Verify:**
- Email field validation (valid email format)
- Password field shows/hides with eye toggle
- "Log In" button disabled when fields empty
- Error messages for invalid credentials
- Correct redirect after successful login
- Session persistence across pages
- Logout functionality

---

### **Workflow 2: Role Selection (Multi-role Users)**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email field: `caregiver1@indigobangladesh.xyz`
   - Password field: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Redirect to `/caregiver/dashboard`
5. **Navigate:** Click user menu (avatar/profile)
6. **Click:** "Switch Role" or role selection option
7. **Expected result:** Role selection modal/page appears with available roles
8. **Click:** Different role (e.g., "Guardian")
9. **Expected result:** Redirect to new role dashboard (`/guardian/dashboard`)
10. **Verify:** Dashboard content updates to reflect new role

**Critical Elements to Verify:**
- Role selection displays all user's roles
- Active role highlighted
- Successful role switch
- Dashboard content changes appropriately
- URL updates to new role path

---

### **Workflow 3: Caregiver - Job Application Flow**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `caregiver1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Click "Jobs" in sidebar or dashboard "View Jobs" button
5. **Expected result:** Navigate to `/caregiver/jobs`
6. **Fill (optional):** Search input: "Post-Op"
7. **Click:** Search button or press Enter
8. **Expected result:** Job list filtered by search term
9. **Click:** Job card or "View Details" button on a job
10. **Expected result:** Navigate to `/caregiver/jobs/{jobId}`
11. **Click:** "Apply" or "Apply for Job" button
12. **Expected result:** Application confirmation message or modal
13. **Navigate:** Go to `/caregiver/job-application/{applicationId}` (from dashboard or jobs page)
14. **Expected result:** Application detail page shows status and job details

**Critical Elements to Verify:**
- Job list displays with filters
- Search functionality works
- Job detail page loads correctly
- Apply button enabled/disabled appropriately
- Application submission success message
- Application status visible in application list
- Duplicate application prevention

---

### **Workflow 4: Guardian - Booking Wizard (4 Steps)**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `guardian1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Click "Booking" in sidebar or dashboard "Book Care" button
5. **Expected result:** Navigate to `/guardian/booking`
6. **Step 1 - Service Type:**
   - **Verify:** Service type cards visible: "Full Day Care", "Post-Op Recovery", "Daily Check-in", "Medical Support"
   - **Click:** "Post-Op Recovery" card
   - **Expected result:** Card becomes highlighted/selected, "Next Step" button enabled
7. **Click:** "Next Step" button
8. **Expected result:** Navigate to Step 2
9. **Step 2 - Schedule:**
   - **Verify:** Calendar or date picker visible, time slots visible
   - **Click:** Select a date (e.g., tomorrow)
   - **Click:** Select a time slot (e.g., "11:00 AM")
   - **Click:** "Next Step" button
10. **Expected result:** Navigate to Step 3
11. **Step 3 - Patient Info:**
    - **Fill:** Patient name: "Test Patient"
    - **Fill:** Patient age: `72` (number input)
    - **Fill:** Additional info (if present): "Post-surgery care needed"
    - **Click:** "Next Step" button
12. **Expected result:** Navigate to Step 4
13. **Step 4 - Review:**
    - **Verify:** All entered information displayed for review
    - **Click:** "Submit Booking" or "Confirm Booking" button
14. **Expected result:** 
    - Success message or confirmation modal
    - Redirect to `/guardian/dashboard` or booking confirmation page
    - New booking visible in dashboard

**Critical Elements to Verify:**
- Step navigation works (Next/Back buttons)
- Service type selection highlights correctly
- Date/time selection functional
- Patient info form validation
- Review step shows all correct information
- Submission creates booking successfully
- Error handling for missing required fields
- Progress indicator shows current step

---

### **Workflow 5: Guardian - Care Requirement Wizard (6 Steps)**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `guardian1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Click "Care Requirements" in sidebar or go to `/guardian/care-requirement-wizard`
5. **Expected result:** Navigate to care requirement wizard
6. **Step 1 - Agency Selection:**
   - **Verify:** Agency cards/list visible
   - **Click:** Select an agency (e.g., "HealthCare Pro BD")
   - **Click:** "Next" button
7. **Expected result:** Navigate to Step 2
8. **Step 2 - Patient Information:**
   - **Fill:** Patient full name: "E2E Patient"
   - **Fill:** Patient age: `72` (number input)
   - **Click:** "Next" button
9. **Expected result:** Navigate to Step 3
10. **Step 3 - Care Requirements:**
    - **Verify:** Care type checkboxes/buttons visible: "Elderly Care", "Post-Op Recovery", "Chronic Disease Management", etc.
    - **Click:** Select care types (e.g., "Elderly Care", "Post-Op Recovery")
    - **Click:** "Next" button
11. **Expected result:** Navigate to Step 4
12. **Step 4 - Schedule Preferences:**
    - **Fill:** Start date: Date 7 days from now (e.g., `2025-01-15`)
    - **Fill:** Duration: "1 month" or select from dropdown
    - **Click:** "Next" button
13. **Expected result:** Navigate to Step 5
14. **Step 5 - Budget Range:**
    - **Fill:** Minimum budget: `20000` (BDT)
    - **Fill:** Maximum budget: `30000` (BDT)
    - **Click:** "Next" button
15. **Expected result:** Navigate to Step 6
16. **Step 6 - Review:**
    - **Verify:** All information displayed for review
    - **Click:** "Submit Requirement" button
17. **Expected result:**
    - Success message
    - Redirect to `/guardian/dashboard`
    - New care requirement visible in dashboard

**Critical Elements to Verify:**
- All 6 steps accessible
- Agency selection functional
- Patient info validation
- Care type selection (multiple selections allowed)
- Date and duration input
- Budget range validation (min <= max)
- Review step accuracy
- Successful submission creates requirement
- Error handling at each step

---

### **Workflow 6: Caregiver - Shift Check-In and Check-Out**

**Steps (Check-In):**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `caregiver1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/caregiver/dashboard`
5. **Expected result:** Dashboard shows "Today's Schedule" with upcoming shifts
6. **Click:** On a scheduled shift or "Check In" button
7. **Expected result:** Navigate to `/caregiver/shift-check-in/{shiftId}`
8. **Verify:** Shift details displayed (patient, time, location)
9. **Fill (if required):** Initial notes or vitals (if form present)
10. **Click:** "Check In" or "Start Shift" button
11. **Expected result:**
    - Success message
    - Shift status changes to "In Progress"
    - Redirect to dashboard or shift detail page
12. **Navigate:** Go to `/caregiver/schedule`
13. **Expected result:** Shift shows as "In Progress" or "Checked In"

**Steps (Check-Out):**

14. **Navigate:** Go to `/caregiver/shift-checkout/{shiftId}` (direct URL or via schedule)
15. **Verify:** Shift details and check-out form displayed
16. **Fill:** Care activities performed (checkboxes or text)
17. **Fill:** Final notes: "Shift completed successfully"
18. **Fill:** Hours worked (if not auto-calculated): `8`
19. **Click:** "Check Out" or "End Shift" button
20. **Expected result:**
    - Success message
    - Shift status changes to "Completed"
    - Redirect to dashboard or earnings page
    - Hours added to earnings

**Critical Elements to Verify:**
- Check-in only available at or after scheduled time
- Check-out only available after check-in
- Form fields populate correctly
- Validation for required fields
- Status updates immediately
- Earnings calculated correctly
- Cannot check-in to same shift twice
- Cannot check-out without checking in

---

### **Workflow 7: Caregiver - Submit Care Log**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `caregiver1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/caregiver/care-log`
5. **Expected result:** Care log submission page loads
6. **Fill:** Select patient from dropdown (if multiple): "Patient A"
7. **Fill:** Date and time (auto-populated, editable)
8. **Fill:** Care activities:
   - Checkbox: "Medication administered"
   - Checkbox: "Vitals checked"
   - Checkbox: "Personal hygiene assistance"
9. **Fill:** Notes/observations: "Patient stable, vitals normal. Medication given on time."
10. **Fill:** Vitals (if fields present):
    - Blood pressure: `120/80`
    - Heart rate: `72`
    - Temperature: `98.6`
    - Oxygen: `98%`
11. **Click:** "Submit Care Log" or "Save" button
12. **Expected result:**
    - Success message
    - Care log saved
    - Redirect to care log list or dashboard

**Critical Elements to Verify:**
- Patient selection functional
- Date/time defaults to current
- Activity checkboxes work
- Notes field accepts text
- Vitals fields accept numbers
- Validation for required fields
- Successful submission saves log
- Log appears in history
- Can submit multiple logs for same patient

---

### **Workflow 8: Guardian - Review and Rate Caregiver**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `guardian1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/guardian/dashboard`
5. **Click:** On a completed shift or placement that needs review
6. **Expected result:** Navigate to `/guardian/shift-rating/{shiftId}`
7. **Verify:** Caregiver information and shift details displayed
8. **Fill:** Rating stars: Click 4th star (4 out of 5)
9. **Fill:** Review text: "Great care, very professional. Would recommend."
10. **Fill:** (Optional) Additional categories if present:
    - Punctuality: 5 stars
    - Quality of care: 4 stars
    - Communication: 5 stars
11. **Click:** "Submit Review" button
12. **Expected result:**
    - Success message
    - Review submitted
    - Redirect to dashboard
13. **Navigate:** Go to `/guardian/reviews`
14. **Expected result:** New review visible in reviews list

**Critical Elements to Verify:**
- Rating stars interactive
- Star selection highlights correctly
- Review text required
- Cannot submit without rating
- Review appears in history
- Cannot review same shift twice
- Reviews visible to others (public/agency)

---

### **Workflow 9: Shop Owner - Create Product**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `shopowner1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Navigate to `/shop/dashboard`
5. **Navigate:** Click "Products" in sidebar
6. **Expected result:** Navigate to `/shop/products`
7. **Click:** "Add Product" or "Create Product" button
8. **Expected result:** Navigate to `/shop/product-editor`
9. **Fill:** Product name: "Medical Gauze - Sterile"
10. **Fill:** Description: "Sterile gauze pads for wound care. 10cm x 10cm, 100 pieces per pack."
11. **Fill:** Price: `150` (BDT)
12. **Fill:** Quantity: `500`
13. **Fill:** Category: Select from dropdown (e.g., "Medical Supplies")
14. **Fill:** (If present) SKU: `MED-GAUZE-001`
15. **Upload:** Product image (if field present): Click upload area, select image file
16. **Click:** "Save Product" or "Create Product" button
17. **Expected result:**
    - Success message
    - Product created
    - Redirect to `/shop/products` or `/shop/product-editor/{newId}`
18. **Verify:** New product visible in product list

**Critical Elements to Verify:**
- All required fields validated
- Price accepts decimal/numbers
- Quantity accepts integers
- Image upload functional
- Category selection works
- Product appears in list immediately
- Can edit product after creation
- Cannot create duplicate products (if constraint exists)

---

### **Workflow 10: Admin - Verify User**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `agent1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Navigate to `/admin/dashboard`
5. **Navigate:** Click "Verifications" in sidebar
6. **Expected result:** Navigate to `/admin/verifications`
7. **Verify:** Verification queue displays pending verifications
8. **Click:** On a verification case or "Review" button
9. **Expected result:** Navigate to `/admin/verification-case/{caseId}`
10. **Verify:** User information and documents displayed
11. **Click:** "Approve" button (or "Reject" if testing rejection flow)
12. **Expected result (if approve):**
    - Confirmation modal: "Are you sure you want to approve this user?"
    - Click "Confirm" or "Yes"
    - Success message: "User verified successfully"
    - User status changes to "Verified"
    - Case moves to completed
13. **Expected result (if reject):**
    - Reason input appears
    - Fill reason: "Documents unclear"
    - Click "Confirm"
    - User notified of rejection

**Critical Elements to Verify:**
- Verification queue loads
- Case detail page shows all info
- Documents visible/downloadable
- Approve/Reject buttons work
- Confirmation modal for approval
- Reason required for rejection
- Status updates correctly
- User notified (email/notification)
- Case moves to completed/appropriate status

---

### **Workflow 11: Agency - Submit Bid on Care Requirement**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `agent@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Navigate to `/agency/dashboard`
5. **Navigate:** Click "Care Requirements" or go to `/agency/care-requirement-board`
6. **Expected result:** Care requirement board displays open requirements
7. **Click:** On a care requirement or "View Details" button
8. **Expected result:** Navigate to `/agency/requirement-review/{requirementId}`
9. **Verify:** Care requirement details displayed (patient needs, schedule, budget)
10. **Click:** "Submit Bid" or "Make Offer" button
11. **Fill:** Bid amount: `25000` (BDT)
12. **Fill:** Proposal message: "We have experienced caregivers available for post-op recovery care. Includes 24/7 support."
13. **Fill:** (Optional) Caregiver profiles to assign: Select from list
14. **Click:** "Submit Bid" button
15. **Expected result:**
    - Success message
    - Bid submitted
    - Redirect to bid management or requirements board
16. **Navigate:** Go to `/agency/bid-management`
17. **Expected result:** New bid visible with status "Pending"

**Critical Elements to Verify:**
- Requirement details load correctly
- Bid amount numeric validation
- Proposal text required
- Caregiver selection functional (if present)
- Bid appears in management
- Status updates (Pending → Accepted/Rejected)
- Cannot submit duplicate bids
- Guardian receives notification of new bid

---

### **Workflow 12: Patient - Emergency SOS**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `patient1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Navigate to `/patient/dashboard`
5. **Navigate:** Go to `/patient/emergency-sos` (or click SOS button on dashboard)
6. **Expected result:** Emergency SOS page loads
7. **Verify:** Emergency contacts displayed (guardian, caregiver, agency)
8. **Click:** Large red "SOS" or "Emergency" button
9. **Expected result:**
    - Confirmation modal: "Are you sure you want to trigger emergency alert?"
    - Click "Confirm" or "Yes"
    - Emergency alert triggered
    - Success message: "Emergency alert sent to your contacts"
    - Notifications sent to guardian, assigned caregiver, agency
10. **Verify:** Alert status visible
11. **Navigate:** Go to `/patient/emergency` (Emergency Hub)
12. **Expected result:** Emergency hub shows active alert and recent activity

**Critical Elements to Verify:**
- SOS button prominent and accessible
- Confirmation modal prevents accidental triggers
- Emergency contacts displayed
- Alert sends notifications successfully
- Alert status updates in real-time
- Guardian/caregiver receives notification
- Can cancel alert (if triggered accidentally)
- Location included in alert (if geolocation enabled)

---

### **Workflow 13: Shop Customer - Purchase Product**

**Steps:**

1. **Go to:** `/shop` (public, no login required, or login first for better experience)
2. **Expected result:** Product list page loads
3. **Click:** On a product card or "View Details" button
4. **Expected result:** Navigate to `/shop/product/{productId}`
5. **Verify:** Product details displayed (name, description, price, images)
6. **Fill:** Quantity: `2` (default 1)
7. **Click:** "Add to Cart" button
8. **Expected result:**
    - Success message: "Added to cart"
    - Cart count updates (if visible)
9. **Click:** "Cart" icon or go to `/shop/cart`
10. **Expected result:** Cart page displays added product
11. **Verify:** Product, quantity, price correct
12. **Click:** "Checkout" button
13. **Expected result:** Navigate to `/shop/checkout`
14. **Fill (if not logged in):** Email, shipping address, phone number
15. **Fill (if logged in):** Verify shipping address or edit if needed
16. **Select:** Payment method (e.g., "Cash on Delivery", "Mobile Banking")
17. **Click:** "Place Order" or "Complete Purchase" button
18. **Expected result:**
    - Order processing
    - Navigate to `/shop/order-success`
    - Order confirmation displayed with order ID
    - Order confirmation email sent (if configured)
19. **Navigate:** Go to `/shop/order-history`
20. **Expected result:** New order visible in order history

**Critical Elements to Verify:**
- Product details load correctly
- Add to cart functional
- Cart updates quantity and total
- Checkout form validation
- Payment method selection works
- Order creates successfully
- Order confirmation page shows details
- Order appears in history
- Email confirmation sent (if configured)

---

### **Workflow 14: All Roles - Update Profile**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `guardian1@indigobangladesh.xyz` (or any role-specific email)
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Expected result:** Navigate to role dashboard
5. **Navigate:** Click user avatar/menu → "Profile" or go to `/{role}/profile`
6. **Expected result:** Profile page loads with current information
7. **Fill:** Full name: Update if needed
8. **Fill:** Phone number: `+8801700000000`
9. **Fill:** Address: "123 Main Street, Dhaka, Bangladesh"
10. **Fill:** (If present) Bio/About: "Looking for experienced caregivers for elderly parent."
11. **Upload:** (Optional) Profile picture: Click upload area, select image
12. **Click:** "Save Profile" or "Update" button
13. **Expected result:**
    - Success message: "Profile updated successfully"
    - Changes saved
    - Profile page refreshes with new info
14. **Verify:** Updated information visible across the app

**Critical Elements to Verify:**
- Profile loads with current data
- All fields editable
- Phone number format validation
- Image upload works
- Save button functional
- Success message displays
- Changes persist across pages
- Profile picture updates in avatar

---

### **Workflow 15: Caregiver - Submit Incident Report**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `caregiver1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/caregiver/incident-report`
5. **Expected result:** Incident report form loads
6. **Fill:** Date and time of incident: Auto-populated or select from date picker
7. **Fill:** Location: "Patient's bedroom"
8. **Fill:** Incident type: Select from dropdown (e.g., "Fall", "Medication Error", "Equipment Malfunction", "Other")
9. **Fill:** Description: "Patient slipped in bathroom while attempting to use walker alone. Minor bruise on left arm, no loss of consciousness. Assisted patient to bed, checked vitals (normal)."
10. **Fill:** Witnesses: "Family member present in hallway"
11. **Fill:** Actions taken: "Assisted patient to bed, applied ice pack, checked vitals, notified guardian"
12. **Click:** "Submit Report" button
13. **Expected result:**
    - Success message
    - Report submitted
    - Guardian notified
    - Agency notified
    - Report appears in incident history

**Critical Elements to Verify:**
- Date/time selector works
- Incident type dropdown functional
- Description field required
- Actions taken field required
- Submit button works
- Notifications sent to appropriate parties
- Report saved and accessible
- Cannot submit empty form

---

### **Workflow 16: All Roles - Submit Support Ticket**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `patient1@indigobangladesh.xyz` (or any role-specific email)
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/support/ticket` (or via Help Center)
5. **Expected result:** Support ticket submission page loads
6. **Fill:** Ticket subject/title: "Unable to view my medication schedule"
7. **Fill:** Category: Select from dropdown (e.g., "Technical Issue", "Billing", "Account", "Feature Request")
8. **Fill:** Description: "When I go to the medications page, it shows a blank screen. I've tried refreshing and logging out and back in, but the issue persists."
9. **Fill:** (If present) Priority: Select (e.g., "Low", "Medium", "High", "Urgent")
10. **Upload:** (Optional) Screenshot: Click upload, select image file
11. **Click:** "Submit Ticket" button
12. **Expected result:**
    - Success message
    - Ticket created with ticket number
    - Redirect to ticket detail or confirmation page
    - Confirmation email sent (if configured)
13. **Navigate:** Go to `/admin/support-ticket/{ticketId}` (as admin) or check ticket status
14. **Expected result:** Ticket visible in support queue

**Critical Elements to Verify:**
- Subject/title required
- Category selection functional
- Description required
- Priority selection works (if present)
- Image upload functional (if present)
- Ticket created successfully
- Ticket number assigned
- Ticket visible to admin/moderator
- Confirmation sent to user

---

### **Workflow 17: Guardian - Request Refund**

**Steps:**

1. **Go to:** `/auth/login`
2. **Fill:**
   - Email: `guardian1@indigobangladesh.xyz`
   - Password: *(see `plans/00 Test Credentials.md`)*
3. **Click:** "Log In" button
4. **Navigate:** Go to `/guardian/payments` or billing section
5. **Expected result:** Payments/invoice page loads
6. **Click:** On an invoice or payment to request refund for
7. **Expected result:** Invoice detail page
8. **Click:** "Request Refund" button (if available)
9. **Expected result:** Navigate to `/support/refund` or refund request form
10. **Fill:** Order/Invoice ID: Auto-populated from selected invoice
11. **Fill:** Reason for refund: Select from dropdown (e.g., "Service not provided", "Cancelled service", "Partial service", "Other")
12. **Fill:** Detailed explanation: "Caregiver only worked 4 hours instead of 8. Patient was discharged early from hospital."
13. **Fill:** Refund amount: `4000` (BDT) - may auto-calculate based on explanation
14. **Upload:** (Optional) Supporting documents: Click upload, select file(s)
15. **Click:** "Submit Refund Request" button
16. **Expected result:**
    - Success message
    - Refund request created
    - Request number assigned
    - Admin notified
    - Request status: "Pending Review"
17. **Navigate:** Check refund request status in billing or support section
18. **Expected result:** Request visible with status

**Critical Elements to Verify:**
- Invoice ID auto-populated or selectable
- Reason dropdown functional
- Detailed explanation required
- Refund amount validation
- Document upload works (if present)
- Submit button functional
- Request created successfully
- Admin receives notification
- Status updates appropriately (Pending → Approved/Rejected)
- User receives notification of decision

---

## 6. Forms Inventory

### **Form 1: Login Form**
**URL:** `/auth/login`

**Fields:**
- `email` (type: email, required, placeholder: "Email address" or "your@email.com")
- `password` (type: password, required, placeholder: "Password" or "••••••••")

**Buttons:**
- "Log In" or "Sign In" (submit button, type: submit)
- "Forgot Password?" (link)
- Eye toggle (button, shows/hides password)

**Required fields:** Email, Password

**Validation rules:**
- Email: Must be valid email format
- Password: Minimum 8 characters
- Submit button disabled when fields empty

**What success looks like:**
- Form submits without errors
- Redirects to role dashboard (e.g., `/{role}/dashboard`) if credentials valid
- Shows error message if credentials invalid
- Fields remain populated on error

**Can it be submitted twice?** N/A (login is a one-time action per session)

**Sample Data 1:**
```
Email: caregiver1@indigobangladesh.xyz
Password: *(see plans/00 Test Credentials.md)*
```

**Sample Data 2:**
```
Email: guardian1@indigobangladesh.xyz
Password: *(see plans/00 Test Credentials.md)*
```

---

### **Form 3: Registration Form**
**URL:** `/auth/register` or `/auth/register/:role`

**Fields:**
- `name` (type: text, required, placeholder: "Full Name")
- `email` (type: email, required, placeholder: "Email Address")
- `password` (type: password, required, placeholder: "Password")
- `confirm_password` (type: password, required, placeholder: "Confirm Password")
- `phone` (type: tel, required, placeholder: "Phone Number")
- `role` (type: select or radio, required - if not pre-selected from URL)
- `district` (type: select or text, optional, placeholder: "District")
- Role-specific fields (see below)

**Role-Specific Fields:**

**Caregiver:**
- `experience_years` (type: number, optional)
- `skills` (type: checkboxes or multiselect, optional)
- `availability` (type: checkboxes, optional)

**Guardian:**
- `relationship_to_patient` (type: select, optional)
- `number_of_patients` (type: number, optional)

**Patient:**
- `date_of_birth` (type: date, optional)
- `medical_condition` (type: text, optional)

**Agency:**
- `agency_name` (type: text, required, placeholder: "Your agency name")
- `license_number` (type: text, required)
- `business_address` (type: text, required)

**Shop Owner:**
- `shop_name` (type: text, required, placeholder: "Your shop name")
- `business_address` (type: text, required)
- `business_type` (type: select, optional)

**Buttons:**
- "Register" or "Create Account" (submit button, type: submit)
- "Already have an account? Sign In" (link to login)
- Eye toggles for password fields

**Required fields:** Name, Email, Password, Confirm Password, Phone, Role, plus role-specific required fields

**Validation rules:**
- Name: Required
- Email: Valid email format, unique
- Password: Minimum 8 characters, matches confirm password
- Confirm Password: Must match password
- Phone: Valid phone number format (Bangladesh: +880xxxxxxxxxx)
- Role: Required
- Agency Name: Required for agency role
- Shop Name: Required for shop owner role
- Password mismatch shows error

**What success looks like:**
- Form submits without errors
- User created in system
- Redirects to email verification page or login page
- Success message: "Registration successful. Please verify your email." or "Registration successful. You can now log in."
- Email verification sent (if email confirmation enabled)

**Can it be submitted twice?** Y (can register multiple different users with different emails)

**Sample Data 1 (Caregiver):**
```
Name: Rahim Ahmed
Email: rahim.ahmed@example.com
Password: Test1234
Confirm Password: Test1234
Phone: +8801712345678
Role: Caregiver
District: Dhaka
Experience Years: 5
Skills: Elderly Care, Post-Op Recovery
Availability: Full-time
```

**Sample Data 2 (Guardian):**
```
Name: Fatima Begum
Email: fatima.begum@example.com
Password: Test1234
Confirm Password: Test1234
Phone: +8801812345678
Role: Guardian
District: Chittagong
Relationship to Patient: Daughter
Number of Patients: 1
```

---

### **Form 4: Forgot Password Form**
**URL:** `/auth/forgot-password`

**Fields:**
- `email` (type: email, required, placeholder: "Email Address")

**Buttons:**
- "Send Reset Link" or "Submit" (submit button, type: submit)
- "Back to Login" (link)

**Required fields:** Email

**Validation rules:**
- Email: Valid email format, required
- Email must exist in system

**What success looks like:**
- Form submits without errors
- Success message: "Password reset link sent to your email"
- Email sent with reset link
- Redirect to login page or stays on page with success message

**Can it be submitted twice?** Y (can request multiple reset links, but rate-limited)

**Sample Data 1:**
```
Email: caregiver1@indigobangladesh.xyz
```

**Sample Data 2:**
```
Email: guardian1@indigobangladesh.xyz
```

---

### **Form 5: Reset Password Form**
**URL:** `/auth/reset-password` (accessed via email link)

**Fields:**
- `password` (type: password, required, placeholder: "New Password")
- `confirm_password` (type: password, required, placeholder: "Confirm New Password")

**Buttons:**
- "Reset Password" or "Update Password" (submit button, type: submit)
- Eye toggles for password fields

**Required fields:** Password, Confirm Password

**Validation rules:**
- Password: Minimum 8 characters
- Confirm Password: Must match password
- Password mismatch shows error

**What success looks like:**
- Form submits without errors
- Password updated successfully
- Redirect to login page
- Success message: "Password reset successfully. Please log in with your new password."

**Can it be submitted twice?** N/A (one-time reset link)

**Sample Data 1:**
```
Password: NewPass123
Confirm Password: NewPass123
```

**Sample Data 2:**
```
Password: AnotherPass456
Confirm Password: AnotherPass456
```

---

### **Form 6: Booking Wizard (Guardian)**
**URL:** `/guardian/booking`

This is a multi-step form with 4 steps.

**Step 1: Service Type**

**Fields:**
- `service_type` (type: radio or card selection, required)

**Options:**
- "Full Day Care"
- "Post-Op Recovery"
- "Daily Check-in"
- "Medical Support"

**Buttons:**
- "Next Step" or "Next" (submit button, disabled until selection made)

**Required fields:** Service Type

**Sample Data 1:**
```
Service Type: Post-Op Recovery
```

**Sample Data 2:**
```
Service Type: Full Day Care
```

---

**Step 2: Schedule**

**Fields:**
- `date` (type: date, required)
- `time` (type: time or time slot selection, required)
- `duration` (type: select or text, optional)

**Buttons:**
- "Back" (button, goes to previous step)
- "Next Step" or "Next" (submit button)

**Required fields:** Date, Time

**Sample Data 1:**
```
Date: 2025-01-15 (7 days from now)
Time: 11:00 AM
Duration: 8 hours
```

**Sample Data 2:**
```
Date: 2025-01-20 (12 days from now)
Time: 9:00 AM
Duration: 24 hours
```

---

**Step 3: Patient Info**

**Fields:**
- `patient_name` (type: text, required, placeholder: "Patient Name")
- `patient_age` (type: number, required, placeholder: "Age")
- `patient_gender` (type: select, optional)
- `medical_condition` (type: textarea, optional, placeholder: "Any medical conditions or special requirements")
- `care_instructions` (type: textarea, optional, placeholder: "Specific care instructions")

**Buttons:**
- "Back" (button)
- "Next Step" or "Next" (submit button)

**Required fields:** Patient Name, Patient Age

**Sample Data 1:**
```
Patient Name: Abdul Karim
Patient Age: 72
Patient Gender: Male
Medical Condition: Post-hip replacement surgery, needs mobility assistance
Care Instructions: Help with walking exercises, medication reminders, light meal prep
```

**Sample Data 2:**
```
Patient Name: Rahela Begum
Patient Age: 68
Patient Gender: Female
Medical Condition: Dementia, occasional confusion
Care Instructions: Patient needs supervision, medication reminders, assistance with daily activities
```

---

**Step 4: Review**

**Fields:**
- (Display only - shows all information entered in previous steps)

**Buttons:**
- "Back" (button, allows editing previous steps)
- "Submit Booking" or "Confirm Booking" (submit button)

**Required fields:** None (display only)

**What success looks like:**
- All information displayed correctly
- Submit button enabled
- Successful submission creates booking
- Redirect to dashboard or booking confirmation
- Success message: "Booking submitted successfully"

**Can it be submitted twice?** Y (can create multiple bookings)

---

### **Form 7: Care Requirement Wizard (Guardian/Patient)**
**URL:** `/guardian/care-requirement-wizard` or `/patient/care-requirement-wizard`

Multi-step form with 6 steps.

**Step 1: Agency Selection**

**Fields:**
- `agency_id` (type: select or card selection, required)

**Options:** List of available agencies (e.g., "HealthCare Pro BD", "CareFirst Services", "Compassionate Care Agency")

**Buttons:**
- "Next" (submit button, disabled until selection)

**Required fields:** Agency

**Sample Data 1:**
```
Agency: HealthCare Pro BD
```

**Sample Data 2:**
```
Agency: CareFirst Services
```

---

**Step 2: Patient Information**

**Fields:**
- `patient_name` (type: text, required, placeholder: "Full name of care recipient")
- `patient_age` (type: number, required, placeholder: "Age")
- `patient_gender` (type: select, optional)
- `medical_history` (type: textarea, optional, placeholder: "Brief medical history")

**Buttons:**
- "Back" (button)
- "Next" (submit button)

**Required fields:** Patient Name, Patient Age

**Sample Data 1:**
```
Patient Name: E2E Patient 1
Patient Age: 72
Patient Gender: Male
Medical History: Diabetes, hypertension, post-stroke recovery
```

**Sample Data 2:**
```
Patient Name: E2E Patient 2
Patient Age: 65
Patient Gender: Female
Medical History: Alzheimer's, needs 24/7 supervision
```

---

**Step 3: Care Requirements**

**Fields:**
- `care_types` (type: checkboxes or multi-select, required)

**Options:**
- "Elderly Care"
- "Post-Op Recovery"
- "Chronic Disease Management"
- "Dementia Care"
- "Palliative Care"
- "Respite Care"
- "Other" (with text input for specification)

**Additional Fields (may appear based on selection):**
- `specific_needs` (type: textarea, optional)

**Buttons:**
- "Back" (button)
- "Next" (submit button)

**Required fields:** At least one care type

**Sample Data 1:**
```
Care Types: Elderly Care, Post-Op Recovery
Specific Needs: Assistance with mobility, medication management, light housekeeping
```

**Sample Data 2:**
```
Care Types: Dementia Care, Chronic Disease Management
Specific Needs: Patient needs supervision, monitoring of vitals, assistance with daily living activities
```

---

**Step 4: Schedule Preferences**

**Fields:**
- `start_date` (type: date, required, placeholder: "Start Date")
- `end_date` (type: date, optional, placeholder: "End Date" or "Ongoing")
- `duration` (type: text or select, optional, placeholder: "Duration" e.g., "1 month", "3 months", "Ongoing")
- `shift_type` (type: select, optional, options: "24/7", "Day Shift", "Night Shift", "Flexible")
- `preferred_hours` (type: text, optional, placeholder: "Preferred hours")

**Buttons:**
- "Back" (button)
- "Next" (submit button)

**Required fields:** Start Date, Duration (or End Date)

**Sample Data 1:**
```
Start Date: 2025-01-15
End Date: (leave blank for ongoing)
Duration: 1 month
Shift Type: Day Shift (8 AM - 8 PM)
Preferred Hours: 8 hours per day, 6 days per week
```

**Sample Data 2:**
```
Start Date: 2025-01-20
End Date: 2025-04-20
Duration: 3 months
Shift Type: 24/7
Preferred Hours: Round-the-clock care
```

---

**Step 5: Budget Range**

**Fields:**
- `budget_min` (type: number, required, placeholder: "Minimum Budget (BDT)")
- `budget_max` (type: number, required, placeholder: "Maximum Budget (BDT)")
- `payment_frequency` (type: select, optional, options: "Monthly", "Weekly", "Daily", "Hourly")

**Buttons:**
- "Back" (button)
- "Next" (submit button)

**Required fields:** Minimum Budget, Maximum Budget

**Validation rules:**
- Minimum Budget must be <= Maximum Budget

**Sample Data 1:**
```
Minimum Budget: 20000
Maximum Budget: 30000
Payment Frequency: Monthly
```

**Sample Data 2:**
```
Minimum Budget: 15000
Maximum Budget: 25000
Payment Frequency: Monthly
```

---

**Step 6: Review**

**Fields:**
- (Display only - shows all information from previous steps)

**Buttons:**
- "Back" (button, allows editing)
- "Submit Requirement" (submit button)

**Required fields:** None (display only)

**What success looks like:**
- All information displayed correctly
- Submit button enabled
- Successful submission creates care requirement
- Redirect to guardian/patient dashboard
- Success message: "Care requirement submitted successfully"
- Agencies can view and bid on requirement

**Can it be submitted twice?** Y (can create multiple care requirements)

---

### **Form 8: Caregiver Profile Form**
**URL:** `/caregiver/profile`

**Fields:**
- `full_name` (type: text, required, placeholder: "Full Name")
- `phone` (type: tel, required, placeholder: "Phone Number")
- `email` (type: email, read-only or editable, placeholder: "Email Address")
- `date_of_birth` (type: date, optional)
- `gender` (type: select, optional)
- `address` (type: text, optional, placeholder: "Address")
- `district` (type: select or text, optional)
- `bio` (type: textarea, optional, placeholder: "Tell us about yourself")
- `experience_years` (type: number, optional, placeholder: "Years of Experience")
- `hourly_rate` (type: number, optional, placeholder: "Hourly Rate (BDT)")
- `availability` (type: checkboxes, optional)
- `skills` (type: checkboxes or multi-select, optional)
- `languages` (type: checkboxes or multi-select, optional)
- `education` (type: text, optional, placeholder: "Education/Qualifications")
- `certifications` (type: text, optional, placeholder: "Certifications")
- `profile_picture` (type: file upload, optional)

**Availability Options:**
- "Full-time"
- "Part-time"
- "Live-in"
- "Hourly"
- "Weekends only"

**Skills Options:**
- "Elderly Care"
- "Post-Op Recovery"
- "Dementia Care"
- "Palliative Care"
- "Pediatric Care"
- "Physical Therapy Assistance"
- "Medication Management"
- "Personal Care"
- "Meal Preparation"
- "Light Housekeeping"

**Language Options:**
- "Bengali"
- "English"
- "Hindi"
- "Arabic"
- "Other"

**Buttons:**
- "Save Profile" or "Update Profile" (submit button)
- "Cancel" or "Reset" (button, discards changes)
- "Upload Photo" (button, triggers file upload)

**Required fields:** Full Name, Phone

**Validation rules:**
- Phone: Valid phone number format
- Hourly Rate: Must be positive number
- Experience Years: Must be non-negative number

**What success looks like:**
- Form submits without errors
- Profile updated successfully
- Success message: "Profile updated successfully"
- Changes visible immediately
- Profile picture updates if uploaded

**Can it be submitted twice?** Y (can update profile multiple times)

**Sample Data 1:**
```
Full Name: Karim Uddin
Phone: +8801712345678
Date of Birth: 1985-05-15
Gender: Male
Address: House 12, Road 5, Dhanmondi, Dhaka
District: Dhaka
Bio: Experienced caregiver specializing in elderly care and post-op recovery. Compassionate and reliable.
Experience Years: 8
Hourly Rate: 300
Availability: Full-time, Part-time
Skills: Elderly Care, Post-Op Recovery, Medication Management
Languages: Bengali, English
Education: SSC, HSC
Certifications: First Aid, Basic Nursing
```

**Sample Data 2:**
```
Full Name: Rahima Akter
Phone: +8801812345678
Date of Birth: 1990-08-20
Gender: Female
Address: Flat 3B, Building 10, Gulshan 1, Dhaka
District: Dhaka
Bio: Dedicated caregiver with experience in dementia care and palliative care. Patient and understanding.
Experience Years: 5
Hourly Rate: 350
Availability: Full-time, Live-in
Skills: Dementia Care, Palliative Care, Personal Care
Languages: Bengali, English, Hindi
Education: Bachelor of Arts
Certifications: Dementia Care Training, Palliative Care Certificate
```

---

### **Form 9: Caregiver Shift Check-In Form**
**URL:** `/caregiver/shift-check-in/:id` or `/caregiver/shift-check-in`

**Fields:**
- `shift_id` (type: hidden or read-only, auto-populated)
- `check_in_time` (type: datetime-local or time, auto-populated to current time, editable)
- `location` (type: text, optional, may auto-detect, placeholder: "Current Location")
- `initial_notes` (type: textarea, optional, placeholder: "Initial observations or notes")
- `vitals` (if present):
  - `blood_pressure` (type: text, placeholder: "e.g., 120/80")
  - `heart_rate` (type: number, placeholder: "BPM")
  - `temperature` (type: number, placeholder: "°F or °C")
  - `oxygen_saturation` (type: number, placeholder: "%")

**Buttons:**
- "Check In" or "Start Shift" (submit button)
- "Cancel" (button, goes back to dashboard)

**Required fields:** None (may have optional fields depending on implementation)

**Validation rules:**
- Check-in time must be at or after scheduled shift start time

**What success looks like:**
- Form submits without errors
- Shift status changes to "In Progress"
- Success message: "Checked in successfully"
- Redirect to dashboard or shift detail page
- Caregiver cannot check in again for same shift

**Can it be submitted twice?** N (cannot check in twice for same shift)

**Sample Data 1:**
```
Shift ID: sp-1 (auto-populated)
Check In Time: 2025-01-10 08:00 (auto-populated)
Location: Patient's home, Dhanmondi (auto-detected or manual)
Initial Notes: Patient resting comfortably. Vitals checked and normal.
Blood Pressure: 120/80
Heart Rate: 72
Temperature: 98.6
Oxygen Saturation: 98
```

**Sample Data 2:**
```
Shift ID: sp-2 (auto-populated)
Check In Time: 2025-01-11 09:00 (auto-populated)
Location: Hospital Room 305, Square Hospital
Initial Notes: Patient just returned from surgery. Will monitor closely.
Blood Pressure: 130/85
Heart Rate: 78
Temperature: 99.0
Oxygen Saturation: 97
```

---

### **Form 10: Caregiver Shift Check-Out Form**
**URL:** `/caregiver/shift-checkout/:id`

**Fields:**
- `shift_id` (type: hidden or read-only, auto-populated)
- `check_out_time` (type: datetime-local or time, auto-populated to current time, editable)
- `hours_worked` (type: number, may auto-calculate, placeholder: "Hours Worked")
- `care_activities` (type: checkboxes, optional)
- `tasks_completed` (type: textarea, optional, placeholder: "Tasks completed during shift")
- `final_notes` (type: textarea, optional, placeholder: "Final notes or observations")
- `patient_status` (type: select, optional, options: "Stable", "Improved", "Declined", "No Change")
- `handover_notes` (type: textarea, optional, placeholder: "Notes for next caregiver")
- `issues_reported` (type: textarea, optional, placeholder: "Any issues or concerns")

**Care Activities Options:**
- "Medication administered"
- "Vitals checked"
- "Personal hygiene assistance"
- "Meal preparation"
- "Light housekeeping"
- "Mobility assistance"
- "Companionship"
- "Other" (with text input)

**Buttons:**
- "Check Out" or "End Shift" (submit button)
- "Cancel" (button)

**Required fields:** None (may have optional fields)

**Validation rules:**
- Check-out time must be after check-in time
- Hours worked must be positive

**What success looks like:**
- Form submits without errors
- Shift status changes to "Completed"
- Success message: "Checked out successfully"
- Hours added to earnings
- Redirect to dashboard or earnings page
- Caregiver cannot check out twice for same shift

**Can it be submitted twice?** N (cannot check out twice for same shift)

**Sample Data 1:**
```
Shift ID: sp-1 (auto-populated)
Check Out Time: 2025-01-10 16:00 (auto-populated)
Hours Worked: 8 (auto-calculated)
Care Activities: Medication administered, Vitals checked, Meal preparation, Companionship
Tasks Completed: Administered morning and afternoon medications, checked vitals twice, prepared lunch and snacks, assisted patient with walking exercises
Final Notes: Patient stable, had a good day. No issues reported.
Patient Status: Stable
Handover Notes: Patient took all medications on time. Blood pressure slightly elevated in morning but normalized. Next caregiver should monitor.
```

**Sample Data 2:**
```
Shift ID: sp-2 (auto-populated)
Check Out Time: 2025-01-11 17:00 (auto-populated)
Hours Worked: 8 (auto-calculated)
Care Activities: Personal hygiene assistance, Light housekeeping, Mobility assistance
Tasks Completed: Helped patient with bathing and dressing, cleaned patient's room, assisted patient with mobility exercises
Final Notes: Patient tired but stable. Completed all assigned tasks.
Patient Status: Improved
Handover Notes: Patient's mobility seems to be improving. Should continue with physical therapy exercises.
```

---

### **Form 11: Care Log Form (Caregiver)**
**URL:** `/caregiver/care-log`

**Fields:**
- `patient_id` (type: select, required, if caregiver has multiple patients)
- `date` (type: date, auto-populated to today, editable)
- `time` (type: time, auto-populated to current time, editable)
- `care_activities` (type: checkboxes or multi-select, required)
- `notes` (type: textarea, required, placeholder: "Detailed notes and observations")
- `vitals` (optional section):
  - `blood_pressure` (type: text, placeholder: "e.g., 120/80")
  - `heart_rate` (type: number, placeholder: "BPM")
  - `temperature` (type: number, placeholder: "°F")
  - `respiratory_rate` (type: number, placeholder: "breaths/min")
  - `oxygen_saturation` (type: number, placeholder: "%")
  - `blood_sugar` (type: number, placeholder: "mg/dL")
- `medication_administered` (type: checkbox)
- `medication_notes` (type: textarea, optional, placeholder: "Medication details")
- `food_intake` (type: text, optional, placeholder: "Food/water intake")
- `elimination` (type: select, optional, options: "Normal", "Increased", "Decreased", "None")
- `pain_level` (type: select or number, optional, options: 0-10 scale or "None", "Mild", "Moderate", "Severe")
- `mood` (type: select, optional, options: "Happy", "Calm", "Anxious", "Sad", "Agitated", "Other")
- `concerns` (type: textarea, optional, placeholder: "Any concerns or issues")

**Care Activities Options:**
- "Medication administration"
- "Vitals monitoring"
- "Personal hygiene"
- "Meal assistance"
- "Mobility assistance"
- "Exercise assistance"
- "Companionship"
- "Light housekeeping"
- "Wound care"
- "Other" (with text input)

**Buttons:**
- "Submit Care Log" or "Save" (submit button)
- "Save as Draft" (button, if available)
- "Cancel" (button)

**Required fields:** Patient (if multiple), Care Activities, Notes

**Validation rules:**
- Date and time must be valid
- At least one care activity must be selected
- Notes field required

**What success looks like:**
- Form submits without errors
- Care log saved successfully
- Success message: "Care log submitted"
- Log visible in care log history
- Guardian/family can view the log

**Can it be submitted twice?** Y (can submit multiple logs for same patient)

**Sample Data 1:**
```
Patient: Patient A (selected from dropdown)
Date: 2025-01-10 (auto-populated)
Time: 10:30 (auto-populated)
Care Activities: Medication administration, Vitals monitoring, Meal assistance
Notes: Patient is in good spirits today. Took all medications on time. Ate lunch well. Blood pressure slightly elevated but within acceptable range.
Vitals:
  Blood Pressure: 135/85
  Heart Rate: 76
  Temperature: 98.4
  Oxygen Saturation: 97
Medication Administered: Yes
Medication Notes: Morning medications given at 8:00 AM as prescribed. No adverse reactions.
Food Intake: Ate full lunch, drank 500ml water
Pain Level: 1 (Mild)
Mood: Happy
Concerns: None
```

**Sample Data 2:**
```
Patient: Patient B (selected from dropdown)
Date: 2025-01-10 (auto-populated)
Time: 14:00 (auto-populated)
Care Activities: Personal hygiene, Mobility assistance, Companionship
Notes: Patient needed assistance with bathing. Helped with walking exercises. Patient seems more active today compared to yesterday.
Vitals:
  Blood Pressure: 125/80
  Heart Rate: 70
  Temperature: 98.2
  Oxygen Saturation: 98
Medication Administered: No (not scheduled)
Food Intake: Ate snacks, drank 300ml water
Pain Level: 0 (None)
Mood: Calm
Concerns: None
```

---

### **Form 12: Guardian/Patient - Review and Rating Form**
**URL:** `/guardian/shift-rating/:id` or `/patient/...` (after shift completion)

**Fields:**
- `shift_id` (type: hidden or read-only, auto-populated)
- `caregiver_id` (type: hidden or read-only, auto-populated)
- `overall_rating` (type: star rating, required, 1-5 stars)
- `rating_categories` (if present):
  - `punctuality` (type: star rating, 1-5 stars, optional)
  - `quality_of_care` (type: star rating, 1-5 stars, optional)
  - `communication` (type: star rating, 1-5 stars, optional)
  - `professionalism` (type: star rating, 1-5 stars, optional)
  - `reliability` (type: star rating, 1-5 stars, optional)
- `review_text` (type: textarea, required, placeholder: "Share your experience...")
- `would_recommend` (type: select or radio, optional, options: "Yes", "No", "Maybe")
- `would_hire_again` (type: select or radio, optional, options: "Yes", "No", "Maybe")
- `report_issue` (type: checkbox, optional, with reason textarea if checked)

**Buttons:**
- "Submit Review" (submit button)
- "Skip for Now" (button, if allowed)
- "Cancel" (button)

**Required fields:** Overall Rating, Review Text

**Validation rules:**
- Overall rating must be selected (1-5 stars)
- Review text required (minimum character count may apply)

**What success looks like:**
- Form submits without errors
- Review submitted successfully
- Success message: "Thank you for your review!"
- Review visible in caregiver's profile
- Caregiver notified of new review
- Cannot review same shift again

**Can it be submitted twice?** N (cannot review same shift twice)

**Sample Data 1:**
```
Shift ID: sh-123 (auto-populated)
Caregiver: Karim Uddin (auto-populated)
Overall Rating: 4 stars
Punctuality: 5 stars
Quality of Care: 4 stars
Communication: 5 stars
Professionalism: 4 stars
Reliability: 5 stars
Review Text: Karim was excellent. Arrived on time, was very professional, and took great care of my father. He was patient and understanding. Would definitely recommend.
Would Recommend: Yes
Would Hire Again: Yes
Report Issue: No
```

**Sample Data 2:**
```
Shift ID: sh-124 (auto-populated)
Caregiver: Rahima Akter (auto-populated)
Overall Rating: 3 stars
Punctuality: 3 stars
Quality of Care: 4 stars
Communication: 3 stars
Professionalism: 4 stars
Reliability: 3 stars
Review Text: Rahima provided good care overall. She was knowledgeable and attentive. However, she arrived 15 minutes late and communication could have been better. Still satisfied with the care provided.
Would Recommend: Maybe
Would Hire Again: Yes
Report Issue: No
```

---

### **Form 13: Shop Owner - Product Form (Create/Edit)**
**URL:** `/shop/product-editor` (create) or `/shop/product-editor/:id` (edit)

**Fields:**
- `product_name` (type: text, required, placeholder: "Product Name")
- `description` (type: textarea, required, placeholder: "Product Description")
- `price` (type: number, required, placeholder: "Price (BDT)", step="0.01")
- `compare_at_price` (type: number, optional, placeholder: "Original Price (BDT)", for discounts)
- `quantity` (type: number, required, placeholder: "Quantity in Stock", min="0")
- `sku` (type: text, optional, placeholder: "SKU")
- `category` (type: select, required)
- `subcategory` (type: select, optional)
- `brand` (type: text, optional, placeholder: "Brand")
- `weight` (type: number, optional, placeholder: "Weight (kg/g)")
- `dimensions` (type: text, optional, placeholder: "L x W x H")
- `product_images` (type: file upload, required, multiple images)
- `is_featured` (type: checkbox, optional)
- `is_active` (type: checkbox, optional, default: checked)
- `tags` (type: text, optional, placeholder: "Tags (comma-separated)")

**Category Options:**
- "Medical Supplies"
- "Mobility Aids"
- "Personal Care"
- "Nutrition & Supplements"
- "Diagnostic Equipment"
- "Orthopedic"
- "Daily Living Aids"
- "Other"

**Buttons:**
- "Save Product" or "Update Product" (submit button)
- "Cancel" (button)
- "Delete Product" (button, only for edit mode)
- "Add Image" (button, triggers file upload)
- "Remove Image" (button, for each uploaded image)

**Required fields:** Product Name, Description, Price, Quantity, Category, Product Images

**Validation rules:**
- Price must be positive number
- Quantity must be non-negative integer
- At least one product image required
- SKU must be unique (if provided)

**What success looks like:**
- Form submits without errors
- Product created/updated successfully
- Success message: "Product saved successfully"
- Redirect to product list or product detail
- Product visible in shop
- Images uploaded and displayed

**Can it be submitted twice?** Y (can create multiple products, or update same product multiple times)

**Sample Data 1 (Create):**
```
Product Name: Medical Gauze - Sterile
Description: Sterile gauze pads for wound care. 10cm x 10cm, 100 pieces per pack. Highly absorbent and suitable for all wound types. Individually wrapped for sterility.
Price: 150
Compare at Price: 200
Quantity: 500
SKU: MED-GAUZE-001
Category: Medical Supplies
Subcategory: Wound Care
Brand: CareNet Medical
Weight: 0.5
Product Images: (upload image file)
Is Featured: No
Is Active: Yes
Tags: gauze, wound care, sterile, medical
```

**Sample Data 2 (Create):**
```
Product Name: Digital Blood Pressure Monitor
Description: Fully automatic digital blood pressure monitor with large LCD display. Stores up to 60 readings. Includes cuff and batteries. Easy to use at home.
Price: 2500
Compare at Price: 3000
Quantity: 50
SKU: MED-BP-002
Category: Diagnostic Equipment
Subcategory: Blood Pressure
Brand: HealthTech
Weight: 1.2
Product Images: (upload image file)
Is Featured: Yes
Is Active: Yes
Tags: blood pressure, monitor, digital, health, diagnostic
```

---

### **Form 14: Shop Owner - Order Fulfillment Form**
**URL:** `/shop/fulfillment` or `/shop/orders` (with edit action)

**Fields:**
- `order_id` (type: hidden or read-only, auto-populated)
- `order_status` (type: select, required)

**Order Status Options:**
- "Pending"
- "Processing"
- "Shipped"
- "Delivered"
- "Cancelled"
- "Refunded"

- `tracking_number` (type: text, optional, placeholder: "Tracking Number")
- `shipping_carrier` (type: select, optional)
- `estimated_delivery` (type: date, optional)
- `notes` (type: textarea, optional, placeholder: "Notes to customer")
- `fulfillment_items` (if editable):
  - `item_id` (hidden)
  - `quantity_shipped` (type: number, placeholder: "Quantity to Ship")
  - `item_status` (type: select, options: "Pending", "Shipped", "Backordered")

**Shipping Carrier Options:**
- "Pathao"
- "RedX"
- "Steadfast"
- "Paperfly"
- "Other"

**Buttons:**
- "Update Order" or "Save" (submit button)
- "Cancel" (button)
- "Send Notification" (button, if available)

**Required fields:** Order Status

**Validation rules:**
- Tracking number required when status is "Shipped"
- Estimated delivery required when status is "Shipped"

**What success looks like:**
- Form submits without errors
- Order status updated
- Customer notified (if status changed)
- Tracking number saved
- Order visible in orders list with updated status

**Can it be submitted twice?** Y (can update order status multiple times)

**Sample Data 1 (Mark as Shipped):**
```
Order ID: ORD-001 (auto-populated)
Order Status: Shipped
Tracking Number: PKT123456789
Shipping Carrier: Pathao
Estimated Delivery: 2025-01-15
Notes: Your order has been shipped. You can track it using the tracking number provided.
```

**Sample Data 2 (Mark as Delivered):**
```
Order ID: ORD-002 (auto-populated)
Order Status: Delivered
Tracking Number: (already populated)
Shipping Carrier: (already populated)
Estimated Delivery: (already populated)
Notes: Thank you for your order! We hope you are satisfied with your purchase.
```

---

### **Form 15: Incident Report Form (Caregiver/Agency/Guardian/Patient)**
**URL:** `/caregiver/incident-report`, `/agency/incident-report`, or `/guardian/incident-report`

**Fields:**
- `incident_type` (type: select, required)

**Incident Type Options:**
- "Fall"
- "Medication Error"
- "Equipment Malfunction"
- "Patient Aggression"
- "Caregiver Injury"
- "Missing Patient"
- "Health Emergency"
- "Other" (with text input)

- `date_time` (type: datetime-local, required, auto-populated to current, editable)
- `location` (type: text, required, placeholder: "Location of incident")
- `patient_id` (type: select, required, if not pre-selected)
- `caregiver_id` (type: hidden or read-only, auto-populated)
- `description` (type: textarea, required, placeholder: "Detailed description of what happened")
- `immediate_actions` (type: textarea, required, placeholder: "Immediate actions taken")
- `injuries` (type: textarea, optional, placeholder: "Any injuries sustained")
- `witnesses` (type: textarea, optional, placeholder: "Names of any witnesses")
- `follow_up_required` (type: checkbox, optional)
- `follow_up_notes` (type: textarea, optional, placeholder: "Follow-up actions needed")
- `supporting_documents` (type: file upload, optional, multiple files)

**Buttons:**
- "Submit Incident Report" (submit button)
- "Save as Draft" (button, if available)
- "Cancel" (button)

**Required fields:** Incident Type, Date/Time, Location, Patient, Description, Immediate Actions

**Validation rules:**
- All required fields must be filled
- Date/time cannot be in the future (usually)
- Description and actions must have minimum character count

**What success looks like:**
- Form submits without errors
- Incident report created
- Success message: "Incident report submitted"
- Notifications sent to guardian, agency, and admin
- Report visible in incident history
- Appropriate follow-up initiated

**Can it be submitted twice?** Y (can submit multiple reports for different incidents)

**Sample Data 1:**
```
Incident Type: Fall
Date/Time: 2025-01-10 14:30
Location: Patient's bathroom
Patient: Patient A (selected from dropdown)
Caregiver: Karim Uddin (auto-populated)
Description: Patient attempted to use walker alone to go to bathroom. Slipped on wet floor near shower. Patient fell and hit left arm on sink. Minor bruise observed. Patient was conscious and able to communicate.
Immediate Actions: Assisted patient to standing position, checked for injuries, applied ice pack to bruised area, checked vitals (BP 130/85, HR 80, normal), notified guardian immediately, cleaned up wet floor to prevent further falls.
Injuries: Minor bruise on left arm. No loss of consciousness. No apparent fractures.
Witnesses: Family member (patient's daughter) was in hallway and heard the fall.
Follow Up Required: Yes
Follow Up Notes: Monitor for pain or swelling in left arm. Guardian will observe patient closely. Recommend reviewing bathroom safety (install grab bars, non-slip mat).
```

**Sample Data 2:**
```
Incident Type: Medication Error
Date/Time: 2025-01-11 09:15
Location: Patient's bedroom
Patient: Patient B (selected from dropdown)
Caregiver: Rahima Akter (auto-populated)
Description: Caregiver accidentally administered morning medication 1 hour late (scheduled for 8:00 AM, given at 9:00 AM). Error discovered when cross-checking medication log. Correct medication was given, but timing was off.
Immediate Actions: Documented the error in care log, notified guardian, monitored patient for any adverse effects, double-checked remaining medications for the day, reviewed medication schedule to prevent future errors.
Injuries: None
Witnesses: None
Follow Up Required: No
Follow Up Notes: Will ensure medications are given exactly on schedule going forward. Set phone alarm for medication times.
```

---

### **Form 16: Support Ticket Form (All Roles)**
**URL:** `/support/ticket`

**Fields:**
- `ticket_subject` (type: text, required, placeholder: "Subject or Title")
- `category` (type: select, required)

**Category Options:**
- "Technical Issue"
- "Billing"
- "Account"
- "Feature Request"
- "Bug Report"
- "Other"

- `priority` (type: select, optional, options: "Low", "Medium", "High", "Urgent")
- `description` (type: textarea, required, placeholder: "Describe your issue or request in detail...")
- `related_order_id` (type: text, optional, placeholder: "Related Order ID (if applicable)")
- `related_booking_id` (type: text, optional, placeholder: "Related Booking ID (if applicable)")
- `attachments` (type: file upload, optional, multiple files, accept images, PDFs)
- `contact_preference` (type: select, optional, options: "Email", "Phone", "App Notification")

**Buttons:**
- "Submit Ticket" (submit button)
- "Cancel" (button)

**Required fields:** Ticket Subject, Category, Description

**Validation rules:**
- Subject must have minimum character count (e.g., 10 characters)
- Description must have minimum character count (e.g., 50 characters)
- File size limit for attachments (e.g., 5MB per file)

**What success looks like:**
- Form submits without errors
- Ticket created successfully
- Ticket number assigned
- Success message: "Ticket created successfully. Your ticket number is #12345."
- Confirmation email sent (if email contact preferred)
- Ticket visible in user's ticket history
- Admin/moderator notified

**Can it be submitted twice?** Y (can submit multiple tickets)

**Sample Data 1:**
```
Ticket Subject: Unable to view medication schedule on caregiver app
Category: Technical Issue
Priority: High
Description: When I try to access the medication schedule page on the caregiver mobile app, the screen remains blank. I've tried refreshing the page, logging out and back in, and even reinstalling the app, but the issue persists. This is preventing me from checking medication times for my assigned patients. I'm using an Android phone, latest version of the app.
Related Booking ID: BK-001
Attachments: (screenshot of blank screen)
Contact Preference: Email
```

**Sample Data 2:**
```
Ticket Subject: Incorrect charge on invoice INV-2025-001
Category: Billing
Priority: Medium
Description: I received invoice INV-2025-001 for my recent care booking, but the amount charged is incorrect. The invoice shows 12,000 BDT for 8 hours of care at 1,500 BDT/hour, but the agreed rate was 1,200 BDT/hour, which should total 9,600 BDT. I have attached the booking confirmation showing the correct rate. Please adjust the invoice.
Related Order ID: ORD-002
Attachments: (booking confirmation PDF, invoice PDF)
Contact Preference: App Notification
```

---

### **Form 17: Refund Request Form (Guardian/Patient/Shop Customer)**
**URL:** `/support/refund` or from billing/invoice page

**Fields:**
- `invoice_id` or `order_id` (type: text or select, required, placeholder: "Invoice/Order ID")
- `refund_type` (type: select, required)

**Refund Type Options:**
- "Full Refund"
- "Partial Refund"
- "Service Credit"

- `reason` (type: select, required)

**Reason Options:**
- "Service not provided"
- "Service cancelled"
- "Partial service provided"
- "Quality issues"
- "Duplicate charge"
- "Other" (with text input)

- `refund_amount` (type: number, required, placeholder: "Refund Amount (BDT)")
- `detailed_explanation` (type: textarea, required, placeholder: "Please explain why you are requesting a refund...")
- `supporting_documents` (type: file upload, optional, multiple files)
- `refund_method` (type: select, optional, options: "Original Payment Method", "Bank Transfer", "Mobile Wallet", "Store Credit")
- `bank_details` (type: text, optional, placeholder: "Bank account details if requesting bank transfer")

**Buttons:**
- "Submit Refund Request" (submit button)
- "Cancel" (button)

**Required fields:** Invoice/Order ID, Refund Type, Reason, Refund Amount, Detailed Explanation

**Validation rules:**
- Refund amount cannot exceed invoice/order total
- Refund amount must be positive
- Detailed explanation must have minimum character count
- Bank details required if refund method is "Bank Transfer"

**What success looks like:**
- Form submits without errors
- Refund request created
- Request number assigned
- Success message: "Refund request submitted. Request #R12345. We will review and respond within 3-5 business days."
- Request visible in user's refund history
- Admin notified for review

**Can it be submitted twice?** Y (can submit multiple refund requests for different invoices/orders)

**Sample Data 1:**
```
Invoice ID: INV-2025-001
Refund Type: Partial Refund
Reason: Partial service provided
Refund Amount: 4000
Detailed Explanation: I booked 8 hours of caregiving service on January 10, 2025, but the caregiver only worked for 4 hours. The patient was discharged from the hospital early, so the remaining 4 hours were not needed. I was charged for the full 8 hours, but I only received 4 hours of service. I am requesting a refund for the unused 4 hours.
Supporting Documents: (booking confirmation, caregiver's shift report)
Refund Method: Original Payment Method
```

**Sample Data 2:**
```
Order ID: ORD-003
Refund Type: Full Refund
Reason: Product not received
Refund Amount: 2500
Detailed Explanation: I ordered a Digital Blood Pressure Monitor (Order #ORD-003) on January 5, 2025, but I have not received it yet. The tracking shows it was delivered on January 8, but I was home all day and no package arrived. I contacted the courier company but they couldn't locate the package. I'm requesting a full refund as I never received the product.
Supporting Documents: (order confirmation, tracking screenshot, courier correspondence)
Refund Method: Bank Transfer
Bank Details: Bank: Dutch-Bangla Bank, Account: 1234567890, Routing: 090270103
```

---

### **Form 18: Care Plan Form (Agency/Doctor/Healthcare Provider)**
**URL:** May be at `/agency/care-plan/:id` or similar

**Fields:**
- `patient_id` (type: select or hidden, required)
- `plan_name` (type: text, required, placeholder: "Care Plan Name")
- `start_date` (type: date, required)
- `end_date` (type: date, optional, for time-limited plans)
- `primary_goal` (type: textarea, required, placeholder: "Primary care goal")
- `care_tasks` (type: dynamic list, can add multiple tasks)

**For each care task:**
- `task_description` (type: text, required)
- `frequency` (type: select, required, options: "Daily", "Weekly", "Monthly", "As Needed", "PRN")
- `time_of_day` (type: text or time, optional, placeholder: "e.g., Morning, Evening, 8:00 AM")
- `assigned_to` (type: select, optional, options: "Caregiver", "Family", "Patient")
- `instructions` (type: textarea, optional)

- `medications` (type: dynamic list, optional)

**For each medication:**
- `medication_name` (type: text, required)
- `dosage` (type: text, required)
- `frequency` (type: text, required)
- `route` (type: select, options: "Oral", "Topical", "Injection", "Other")
- `instructions` (type: textarea, optional)

- `dietary_requirements` (type: textarea, optional)
- `mobility_assistance` (type: textarea, optional)
- `emergency_contacts` (type: textarea, optional)
- `special_instructions` (type: textarea, optional)
- `notes` (type: textarea, optional)

**Buttons:**
- "Add Task" (button, adds new care task)
- "Add Medication" (button, adds new medication)
- "Save Care Plan" (submit button)
- "Save as Template" (button, if available)
- "Cancel" (button)

**Required fields:** Patient, Plan Name, Start Date, Primary Goal, At least one Care Task

**Validation rules:**
- Start date must be valid
- End date must be after start date (if provided)
- At least one care task required
- Each care task must have description and frequency

**What success looks like:**
- Form submits without errors
- Care plan created/updated
- Success message: "Care plan saved successfully"
- Care plan visible to assigned caregivers
- Caregivers can view tasks and medications

**Can it be submitted twice?** Y (can update care plan multiple times)

**Sample Data 1:**
```
Patient: Patient A
Plan Name: Post-Hip Replacement Recovery Plan
Start Date: 2025-01-15
End Date: 2025-04-15
Primary Goal: Assist patient in recovery from hip replacement surgery, regain mobility, prevent complications, and ensure safe discharge home.

Care Tasks:
1. Task Description: Assist with walking exercises
   Frequency: Daily
   Time of Day: Morning and Evening
   Assigned To: Caregiver
   Instructions: Use walker as prescribed. 15-minute walks, gradually increasing duration. Monitor for pain or fatigue.

2. Task Description: Medication administration
   Frequency: Daily
   Time of Day: 8:00 AM, 2:00 PM, 8:00 PM
   Assigned To: Caregiver
   Instructions: Give prescribed medications as per medication list. Record any side effects.

3. Task Description: Wound care
   Frequency: Daily
   Time of Day: Morning
   Assigned To: Caregiver
   Instructions: Check surgical incision site for redness, swelling, or discharge. Keep area clean and dry. Report any changes immediately.

4. Task Description: Personal hygiene assistance
   Frequency: Daily
   Time of Day: As Needed
   Assigned To: Caregiver
   Instructions: Assist with bathing, dressing, toileting as needed. Ensure patient comfort and safety.

Medications:
1. Medication Name: Paracetamol 500mg
   Dosage: 1 tablet
   Frequency: Every 8 hours
   Route: Oral
   Instructions: Take with food for pain management.

2. Medication Name: Antibiotic (prescribed)
   Dosage: As prescribed
   Frequency: Twice daily
   Route: Oral
   Instructions: Complete full course as prescribed by doctor.

Dietary Requirements: High-protein diet to promote healing. Plenty of fluids. Limit sodium intake.

Mobility Assistance: Patient requires assistance with walking, transferring from bed to chair, and using bathroom. Walker should be within reach at all times.

Emergency Contacts: Guardian: +8801712345678, Doctor: +8801812345678

Special Instructions: Patient should not bend at the hip past 90 degrees. Use elevated toilet seat. Avoid crossing legs.

Notes: Monitor for signs of infection at incision site. Encourage patient to do breathing exercises to prevent pneumonia.
```

---

### **Form 19: Agency - Bid Form (Submit Bid on Care Requirement)**
**URL:** `/agency/requirement-review/:id` or `/agency/bid-management`

**Fields:**
- `requirement_id` (type: hidden or read-only, auto-populated)
- `bid_amount` (type: number, required, placeholder: "Bid Amount (BDT)", step="0.01")
- `currency` (type: text, read-only, default: "BDT")
- `proposal_message` (type: textarea, required, placeholder: "Describe your proposal...")
- `assigned_caregivers` (type: multiselect, optional, select from available caregivers)
- `start_date_availability` (type: date, optional, placeholder: "Earliest start date")
- `additional_services` (type: checkboxes, optional)

**Additional Services Options:**
- "24/7 Support"
- "Medical Equipment"
- "Transportation"
- "Meal Preparation"
- "Housekeeping"
- "Other" (with text input)

- `terms_and_conditions` (type: checkbox, required)
- `valid_until` (type: date, optional, placeholder: "Bid valid until")

**Buttons:**
- "Submit Bid" (submit button)
- "Save as Draft" (button, if available)
- "Cancel" (button)

**Required fields:** Bid Amount, Proposal Message, Terms and Conditions

**Validation rules:**
- Bid amount must be positive number
- Bid amount should be within care requirement budget range
- Proposal message must have minimum character count
- Terms must be accepted

**What success looks like:**
- Form submits without errors
- Bid submitted successfully
- Success message: "Bid submitted successfully"
- Guardian notified of new bid
- Bid visible in agency's bid management
- Bid visible to guardian for review

**Can it be submitted twice?** Y (can submit multiple bids on different requirements, or update bid if allowed)

**Sample Data 1:**
```
Requirement ID: CR-001 (auto-populated)
Bid Amount: 25000
Proposal Message: We at HealthCare Pro BD are pleased to submit a bid for your post-op recovery care requirement. We have experienced caregivers specializing in post-surgical care, including mobility assistance, wound care, and medication management. Our caregivers are trained, certified, and background-checked. We can provide 24/7 support or day shifts as needed. We have successfully cared for over 100 post-op patients with excellent outcomes.
Assigned Caregivers: Karim Uddin (ID: CG-001), Rahima Akter (ID: CG-002)
Start Date Availability: 2025-01-20
Additional Services: 24/7 Support, Meal Preparation
Terms and Conditions: Checked (required)
Valid Until: 2025-01-25
```

**Sample Data 2:**
```
Requirement ID: CR-002 (auto-populated)
Bid Amount: 18000
Proposal Message: CareFirst Services would like to offer our caregiving services for your elderly care requirement. We specialize in dementia care and have caregivers trained in managing patients with memory issues. Our approach focuses on patience, compassion, and creating a safe, comforting environment. We can provide companionship, assistance with daily activities, medication reminders, and light housekeeping.
Assigned Caregivers: (none specified yet, will assign after bid acceptance)
Start Date Availability: 2025-02-01
Additional Services: Housekeeping
Terms and Conditions: Checked (required)
Valid Until: 2025-02-05
```

---

### **Form 20: Admin - User Management Form (Create/Edit User)**
**URL:** `/admin/users` (with create or edit action)

**Fields:**
- `user_id` (type: hidden, auto-populated for edit)
- `name` (type: text, required, placeholder: "Full Name")
- `email` (type: email, required, placeholder: "Email Address")
- `phone` (type: tel, optional, placeholder: "Phone Number")
- `roles` (type: multiselect or checkboxes, required)

**Role Options:**
- "Caregiver"
- "Guardian"
- "Patient"
- "Agency"
- "Admin"
- "Moderator"
- "Shop Owner"

- `active_role` (type: select, required, options from selected roles)
- `status` (type: select, required, options: "Active", "Inactive", "Suspended", "Pending Verification")
- `district` (type: select or text, optional)
- `created_at` (type: datetime, read-only, auto-populated for existing users)
- `last_login` (type: datetime, read-only)
- `profile_data` (type: JSON or dynamic fields, role-specific)

**Role-Specific Profile Data:**

**For Caregiver:**
- `experience_years`, `hourly_rate`, `skills`, `availability`

**For Agency:**
- `agency_name`, `license_number`, `business_address`

**For Shop Owner:**
- `shop_name`, `business_address`

**Buttons:**
- "Save User" or "Update User" (submit button)
- "Send Password Reset" (button, for existing users)
- "Suspend User" (button, for active users)
- "Activate User" (button, for suspended/inactive users)
- "Delete User" (button, with confirmation)
- "Cancel" (button)

**Required fields:** Name, Email, Roles, Active Role, Status

**Validation rules:**
- Email must be valid format
- Email must be unique
- At least one role must be selected
- Active role must be one of the selected roles

**What success looks like:**
- Form submits without errors
- User created/updated successfully
- Success message: "User saved successfully"
- User visible in user list
- User receives email notification (for new users or password reset)

**Can it be submitted twice?** Y (can update user multiple times)

**Sample Data 1 (Create New Caregiver):**
```
Name: New Caregiver User
Email: new.caregiver@example.com
Phone: +8801912345678
Roles: Caregiver
Active Role: Caregiver
Status: Active
District: Dhaka

Profile Data (Caregiver):
  Experience Years: 3
  Hourly Rate: 250
  Skills: Elderly Care, Personal Care
  Availability: Full-time
```

**Sample Data 2 (Edit Existing User):**
```
User ID: USR-123 (auto-populated)
Name: Updated Name
Email: updated.email@example.com
Phone: +8801912345678 (unchanged)
Roles: Guardian, Patient (multiselect)
Active Role: Guardian
Status: Active
District: Chittagong

Profile Data (Guardian):
  Relationship to Patient: Son
  Number of Patients: 2
```

---

### **Form 21: Chat/Messaging Form (All Roles)**
**URL:** `/messages` or floating chat widget

**Fields:**
- `recipient_id` or `conversation_id` (type: select or hidden, auto-selected from conversation list)
- `message_text` (type: textarea or text, required, placeholder: "Type your message...")
- `attachments` (type: file upload, optional, multiple files, accept images, documents)

**Buttons:**
- "Send" (submit button)
- "Attach File" (button, triggers file upload)
- "Emoji" (button, if emoji picker available)
- "Voice Message" (button, if voice recording available)

**Required fields:** Message Text

**Validation rules:**
- Message text cannot be empty (whitespace only may be invalid)
- File size limit for attachments (e.g., 10MB per file)
- File type restrictions (images, PDFs, documents only)

**What success looks like:**
- Message sends successfully
- Message appears in chat history
- Recipient receives notification
- Timestamp added to message
- Attachments display correctly

**Can it be submitted twice?** Y (can send multiple messages)

**Sample Data 1:**
```
Recipient: Karim Uddin (Caregiver)
Message Text: Good morning Karim. Just wanted to confirm you'll be arriving at 8 AM today as scheduled. My father is ready for your visit. Please let me know if there are any changes.
Attachments: None
```

**Sample Data 2:**
```
Recipient: HealthCare Pro BD (Agency)
Message Text: Hello, I have a question about the invoice I received. The amount seems higher than what we agreed upon. Can you please review and let me know? Thank you.
Attachments: (invoice PDF)
```

---

## 7. Link Coverage Expectations

**Should ALL links be tested?**

✅ **Only defined routes** (NOT full crawl of all possible URLs)

**Rationale:**
- The app has extensive route structure (200+ routes)
- Full crawl would be time-consuming and may hit dynamic routes with invalid parameters
- Testing should focus on:
  - All static routes listed in Section 4
  - Representative samples of dynamic routes with valid IDs
  - All navigation menu items and sidebar links
  - All buttons that trigger navigation
  - Modal-based screens and workflows

**Any external links to ignore?**

Yes, ignore or mock these external links:
- **Social Media:** Facebook, Twitter, LinkedIn, Instagram links
- **Third-party Services:** Google Maps, payment gateways (unless testing payment flow)
- **External Documentation:** Links to PDFs or external help docs
- **Download Links:** App store downloads (Play Store, App Store)
- **Email Links:** `mailto:` links
- **Phone Links:** `tel:` links

**What to test:**
- ✅ All internal navigation links
- ✅ All sidebar menu items
- ✅ All header navigation links
- ✅ All buttons that navigate to internal pages
- ✅ All dashboard quick action links
- ✅ All "View Details" buttons on cards/lists
- ✅ All "Edit" buttons
- ✅ All "Create" or "Add" buttons
- ✅ All "Back" buttons in multi-step forms
- ✅ Pagination links (next/previous page)
- ✅ Filter and sort links (that change URL)
- ✅ Role-specific navigation for each of the 7 roles
- ✅ Footer links (privacy, terms, etc.)
- ✅ Logo/home button
- ✅ User profile/settings links
- ✅ Notification links
- ✅ Message links
- ✅ All modals that can be opened via links/buttons

---

## 8. Error Detection Requirements

**What should be flagged as "broken"?**

### ✅ Console Errors
- JavaScript errors (red text in console)
- Unhandled promise rejections
- React warnings (especially in development mode)
- Network errors
- Failed resource loading (404s for assets)
- Authentication/session errors
- Supabase/Backend API errors
- Type errors
- Reference errors
- Any error message in console

### ✅ Network Failures (4xx / 5xx)
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Page/resource not found
- **405 Method Not Allowed** - Wrong HTTP method
- **409 Conflict** - Duplicate resource, conflict
- **422 Unprocessable Entity** - Validation errors
- **429 Too Many Requests** - Rate limiting
- **500 Internal Server Error** - Server error
- **502 Bad Gateway** - Gateway/server error
- **503 Service Unavailable** - Service down
- **504 Gateway Timeout** - Timeout
- Any 4xx or 5xx status codes in network tab

### ✅ UI Not Rendering
- Blank pages (no content rendered)
- Components not appearing when they should
- Missing content (text, images, buttons)
- Layout broken (elements overlapping, not aligned)
- Loading spinners that never resolve
- Placeholder text that never loads
- Empty states where content should exist
- Charts/graphs not rendering (if present)
- Maps not loading (if present)
- Images broken (alt text visible instead of image)

### ✅ Buttons Not Clickable
- Buttons that don't respond to clicks
- Buttons that look clickable but have no handler
- Buttons covered by other elements (z-index issues)
- Buttons disabled when they shouldn't be
- Buttons that throw errors when clicked
- Submit buttons that don't submit forms
- Navigation buttons that don't navigate
- Buttons with incorrect pointer events

### ✅ Forms Not Submitting
- Submit buttons that don't submit
- Forms that don't validate properly
- Forms that validate but don't send data
- Forms that submit but show errors
- Forms that submit but don't update UI
- Required fields that don't show validation errors
- Forms that submit empty data
- Forms that don't clear after successful submission
- Forms that don't show success/error messages
- Multi-step forms that don't advance

### ✅ Duplicate Submission Issues
- Forms that can be submitted multiple times (should be prevented)
- Same action triggered multiple times from one click
- Double-click creating duplicate records
- Rapid clicking causing multiple API calls
- Race conditions in form submission
- Idempotency issues in API calls

### ✅ Slow Responses (> 3000 ms for user-facing actions)
- Page load times > 5 seconds
- API response times > 3 seconds
- Form submission taking > 5 seconds
- Navigation delays > 3 seconds
- Search results appearing slowly (> 2 seconds)
- Data loading spinners > 5 seconds
- Any action that feels sluggish

**Slow responses (> 5000 ms):** Critical performance issue, should be flagged

**Slow responses (> 10000 ms):** Severe performance issue, critical bug

### ✅ Additional Issues to Flag
- **Broken Images:** Image alt text visible, broken image icons
- **Broken Videos:** Video player errors, videos not playing
- **Broken Audio:** Audio player errors
- **Broken Downloads:** Download links that don't work
- **Broken PDFs:** PDFs that don't open or display
- **Accessibility Issues:**
  - Missing alt text on images
  - Missing labels on form inputs
  - Low contrast ratios
  - Keyboard navigation issues
  - Missing ARIA attributes
- **Responsive Design Issues:**
  - Layout broken on mobile
  - Horizontal scrolling on mobile
  - Touch targets too small (< 44x44px)
  - Overlapping elements on small screens
- **Internationalization Issues:**
  - Missing translations
  - Hard-coded English text
  - Date/time format issues
  - Currency format issues
- **Real-time Issues:**
  - WebSocket connections failing
  - Real-time updates not appearing
  - Sync issues (offline to online)
  - Stale data not refreshing
- **Session Issues:**
  - Unauthorized redirects to login
  - Session expiring unexpectedly
  - Login state not persisting
  - Multiple sessions conflicting
- **Data Issues:**
  - Incorrect data displayed
  - Data not saving
  - Data displaying incorrectly (formatting)
  - Calculations wrong (totals, averages)
  - Sorting/filtering not working

---

## 9. Data Strategy

**For form filling:**

### Use: ✅ Both (Static test data with some randomized elements)

**Approach:**
1. **Static test data** for:
   - Standard form fields (name, email, phone)
   - Dropdown selections (categories, roles, status)
   - Common values (districts, care types, service types)
   - Test credentials (see `plans/00 Test Credentials.md`)
   - Pre-defined sample data (as shown in Section 6)

2. **Random generated data** for:
   - Unique email addresses (when testing registration)
   - Random dates (within valid ranges)
   - Random numbers (within valid ranges for quantities, prices)
   - Random text for descriptions/notes (from pre-defined templates)
   - Random selections from valid option sets

**Why both?**
- Static data ensures consistency and predictability
- Random data tests for unique constraints and prevents duplicates
- Combining both gives comprehensive coverage

### Any Constraints?

**Yes, strict constraints:**

**Phone Numbers:**
- Must be valid Bangladesh format: `+880` followed by 10 digits
- Example: `+8801712345678`
- Cannot be empty or invalid format

**Email Addresses:**
- Must be valid email format
- Must be unique (for registration)
- Use different emails for each test registration
- Pattern: `user+{timestamp}@example.com` or use predefined test emails

**Dates:**
- Birth dates: Must be realistic (e.g., for caregiver: 18+ years ago)
- Start dates: Must be today or in the future
- End dates: Must be after start date
- Check-in times: Must be at or after scheduled time
- Cannot use future dates for historical records

**Numbers:**
- Ages: Must be positive integers (typically 0-120 for patients)
- Prices: Must be positive numbers (can have decimals)
- Quantities: Must be non-negative integers
- Hours worked: Must be positive, calculated correctly
- Ratings: Must be 1-5 (or 0-10 for pain scale)
- Budget: Minimum must be <= Maximum

**Text Fields:**
- Names: Cannot be empty, minimum 2 characters
- Descriptions: Minimum character count (e.g., 10-50 chars)
- Notes: Minimum character count (e.g., 20 chars)
- Cannot be whitespace only
- No special characters that break SQL (unless properly escaped)

**Unique Constraints:**
- Email addresses must be unique (for registration)
- SKUs must be unique (for products)
- Phone numbers should be unique (per user)
- Cannot submit duplicate reviews for same shift
- Cannot check in/out same shift twice
- Cannot submit duplicate care requirements (within time window)

**Business Logic Constraints:**
- Caregiver hourly rate: Minimum and maximum may apply
- Budget must be within reasonable range for services
- Cannot book past dates (usually)
- Cannot cancel completed shifts
- Cannot edit read-only fields
- Role-specific fields must match selected role

**File Uploads:**
- File size limits (e.g., 5MB per file)
- File type restrictions (images, PDFs only)
- Maximum number of files per upload
- Required vs optional uploads

**Multi-Select/Checkboxes:**
- At least one option must be selected (for required fields)
- Maximum number of selections (if applicable)
- Incompatible option combinations (if any)

**Password Constraints:**
- Minimum 8 characters
- May require uppercase, lowercase, number, special character
- Must match confirm password

**Session/Auth Constraints:**
- Must be authenticated to access protected routes
- Cannot access other roles' dashboards without role switch

- All tests use real credentials from `plans/00 Test Credentials.md`

**Supabase/Mock Constraints:**
- In mock mode (`VITE_PLAYWRIGHT_E2E=true`), use real test credentials from `plans/00 Test Credentials.md`
- Mock data may have predefined IDs (e.g., shift IDs like "sp-1")
- Some actions may be mocked (no real database operations)

**Sample Data Patterns for Randomization:**

```javascript
// Email generation
const email = `test${Date.now()}@example.com`;

// Date generation (future date)
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const startDate = futureDate.toISOString().split('T')[0];

// Random number within range
const randomPrice = Math.floor(Math.random() * (5000 - 1000) + 1000);

// Random selection from array
const careTypes = ['Elderly Care', 'Post-Op Recovery', 'Dementia Care'];
const randomCareType = careTypes[Math.floor(Math.random() * careTypes.length)];
```

---

## 10. Destructive Actions

**Should tests perform:**

### ✅ Updates (YES - Perform and Verify)
- Update profile information
- Update product details
- Update care plans
- Change settings
- Modify form data
- Edit existing records

**Why:** Updates are common operations that must work correctly. Tests should verify:
- Data persists after update
- Changes reflect in UI
- Update validation works
- Cannot update with invalid data
- Update history/audit logs (if applicable)

### ❌ Delete Actions (NO - Avoid)
- Delete users
- Delete products
- Delete care plans
- Delete orders
- Delete important records
- Cancel completed bookings

**Why:** Deleting data can break other tests and the test environment. Instead:
- Test delete UI and confirmation flow
- Verify delete button exists and works
- Verify confirmation modal appears
- **STOP** before actual delete (or mock the delete)
- Use soft deletes if available (mark as deleted instead of actual delete)

**Exception:** If test environment has automatic cleanup/reset, can perform deletes on test-specific data only.

### ❌ Re-submissions (NO - Avoid)
- Submit same form multiple times
- Create duplicate records
- Submit duplicate reviews
- Check in to same shift twice
- Register same email twice

**Why:** Duplicates can cause data integrity issues and break tests. Instead:
- Test duplicate prevention (should show error)
- Verify form disables after submission
- Verify error message for duplicates
- Test with different data for each submission

**Exception:** Testing duplicate prevention explicitly (verify error appears).

### ✅ Safe Destructive Actions (YES - With Caution)
- Cancel pending bookings (if allowed)
- Reject bids (as agency/guardian)
- Decline job applications (as caregiver/agency)
- Archive old records (if soft delete)
- Deactivate users (not delete)
- Mark notifications as read

**Why:** These are reversible or low-impact operations.

### ✅ Create Actions (YES - Perform)
- Create new users (with unique emails)
- Create products
- Create care requirements
- Submit support tickets
- Submit incident reports
- Create bookings

**Why:** Creation is essential functionality. Use unique data to avoid conflicts.

### ❌ Financial Transactions (NO - Avoid or Mock)
- Process real payments
- Transfer real money
- Process refunds (unless testing refund request flow only)
- Top up wallets with real money

**Why:** Financial operations should use mock/sandbox environments. Test the UI flow but don't execute real transactions.

### 🔄 Test Data Cleanup Strategy
Instead of destructive actions during tests:
1. **Use unique test data** (timestamps, random numbers)
2. **Clean up after test suite** (delete test-specific records)
3. **Use test database** that gets reset between runs
4. **Mock destructive operations** in E2E tests
5. **Soft deletes** where possible
6. **Archive** instead of delete

**Summary:**
- ✅ DO: Updates, Creates, Safe operations (cancel, reject, mark read)
- ❌ DON'T: Deletes, Duplicates, Real financial transactions
- 🔄 MOCK: Deletes, Payments, Refunds (test UI flow only)

---

## 11. Session Handling

**Should login happen:**

### ✅ Once and reused (faster) - PRIMARY APPROACH

**Recommended Strategy:**
1. **Login once at the beginning of each test suite** (describe block)
2. **Reuse the session for all tests within that suite**
3. **Use context storage** to persist authentication state across tests
4. **Refresh session if it expires** (add re-login logic if auth fails)

**Benefits:**
- ⚡ **Faster execution** - No repeated login overhead
- 🎯 **Focus on actual functionality** - Tests focus on features, not auth
- 💾 **State preservation** - User data, settings, role selection persist
- 🔧 **Simpler test code** - No repeated login setup in each test

**Implementation (Playwright):** `beforeEach` runs **before every test** in the describe block — so the snippet below logs in once **per test**, not once per file. That is still a valid pattern (fresh page + predictable state) and matches many specs in this repo; it is **not** the same as logging in once for the whole describe.

```typescript
test.describe("Caregiver Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "caregiver");
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/caregiver/dashboard");
    // ...
  });

  test("jobs page loads", async ({ page }) => {
    await page.goto("/caregiver/jobs");
    // ...
  });
});
```

**When to use "Before every test" login:**
- ⚠️ **Only when necessary:**
  - Testing authentication flows explicitly (login, logout)
  - Testing role switching behavior
  - Testing session expiration
  - Testing cross-user interactions
  - When tests modify authentication state

**Session Management Best Practices:**
- ✅ **Use browser context storage** for session persistence
- ✅ **Store auth tokens** (JWT, cookies) for reuse
- ✅ **Handle session expiration** gracefully (re-login if needed)
- ✅ **Use different browser contexts** for different roles (if testing multiple roles simultaneously)
- ✅ **Clear session between test suites** (avoid cross-contamination)
- ✅ **Test both authenticated and unauthenticated states**

**Logout Handling:**
- ✅ **Test logout functionality** at least once per role
- ✅ **Verify session cleared** after logout
- ✅ **Verify redirect to login** after logout
- ✅ **Verify protected routes inaccessible** after logout

**Session State to Monitor:**
- Authentication token/jwt presence
- Cookie storage (auth cookies, session cookies)
- Local storage (user data, preferences)
- Session storage (temporary data)
- Supabase session state
- Active role (for multi-role users)

**Example: one login per describe (shared `BrowserContext`)** — Use the **same** `page` (or `context`) from `beforeAll` in every test by **not** relying on the default `page` fixture for those tests, or use a **custom fixture** / `storageState` export. Mixing `beforeAll` manual `page` with `test.beforeEach(({ page }) => …)` is wrong: the fixture `page` is a **new** page and will **not** inherit the login from `beforeAll`.

```typescript
import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Guardian Flows (shared context)", () => {
  let context: import("@playwright/test").BrowserContext;
  let page: import("@playwright/test").Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await loginAs(page, "guardian");
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("dashboard", async () => {
    await page.goto("/guardian/dashboard");
    await expect(page.getByRole("main").first()).toBeVisible();
  });

  test("another page", async () => {
    await page.goto("/guardian/dashboard");
    // same `page`, same session
  });
});

// Auth-focused suites: use the built-in `page` per test
test.describe("Authentication Flows", () => {
  test("login with valid credentials", async ({ page }) => {
    // Full login flow on `page`
  });
});
```

**Recommendation for CareNet 2:**
- **Default in repo:** `loginAs` in `beforeEach` (per test) keeps isolation simple; cost is extra navigation/login per test.
- **Optimization:** Shared `BrowserContext` + single `loginAs` in `beforeAll` (pattern above), or generate `storageState` once and reference it from `playwright.config.ts` `project.use.storageState` for role-specific projects.
- **Exception:** Auth-specific tests should exercise the full login form and logout on a dedicated `page` per test when they mutate session.

---

## 12. Output Requirements

**Committed repo defaults (`playwright.config.ts` today):** `reporter: "html"`; `use.screenshot: "only-on-failure"`; `use.trace: "on-first-retry"`; **no** `video` setting (defaults to off unless you add one). Treat everything below as **capabilities you can add** — do not assume JSON, list, video, or Allure are already enabled.

### ✅ Console Logs
- **What:** Standard console.log, console.error, console.warn output
- **When:** During test execution
- **Use:** Debugging, understanding test flow, seeing data values
- **Implementation:** Playwright captures console automatically
- **Review:** Check test logs in CI/CD output

---

### ➕ JSON Report (optional — not in committed config)
- **What:** Structured JSON file with test results
- **When:** After test suite completes
- **Use:** CI/CD integration, automated analysis, test trend tracking
- **File:** e.g. `test-results/results.json`
- **Implementation:** Add to `reporter` array in `playwright.config.ts`, for example:
```typescript
reporter: [
  ["html"],
  ["json", { outputFile: "test-results/results.json" }],
],
```

---

### ✅ HTML Report
- **What:** Interactive HTML report with test results
- **When:** After test suite completes
- **Use:** Human-readable review, detailed analysis, sharing with team
- **File:** `playwright-report/index.html`
- **Features:**
  - Test list with status (pass/fail/skip)
  - Click to view test details
  - Screenshot previews (if failed)
  - Error messages and stack traces
  - Timeline of test execution
  - Video player (if recorded)
  - Network requests
  - Console logs
- **Implementation:** Enabled in committed `playwright.config.ts` (`reporter: "html"`)
- **View:** Run `npx playwright show-report` after tests

---

### ✅ Screenshots on Failure
- **What:** Screenshot captured when test fails
- **When:** Immediately on test failure
- **Use:** Debugging failed tests, seeing what user saw
- **File:** `test-results/{test-name}-failed.png`
- **Types:**
  - Full page screenshot (entire page)
  - Viewport screenshot (visible area only)
- **Implementation:** Already configured in `playwright.config.ts`:
```typescript
use: {
  screenshot: 'only-on-failure',
}
```
- **Benefits:** See exact state when failure occurred

---

### ➕ Video Recording (optional — not in committed config)
- **What:** Video of entire test execution (or from failure point)
- **When:** 
  - Option 1: Record entire test (more storage, full context)
  - Option 2: Record from failure point (less storage, focus on issue)
- **Use:** Debugging complex failures, seeing user interactions
- **File:** `test-results/{test-name}.webm`
- **Implementation:** Add under `use` in `playwright.config.ts`:
```typescript
use: {
  video: "retain-on-failure", // or "on", "off"
}
```
- **Features:** 
  - Shows all user actions (clicks, typing, navigation)
  - Shows page changes over time
  - Useful for flaky tests
- **Recommendation:** `retain-on-failure` for CI/CD, `on` for local debugging

---

### ✅ Trace Files
- **What:** Detailed trace of test execution (includes everything)
- **When:** On first retry (already configured)
- **Use:** Deep debugging, performance analysis, network analysis
- **File:** `test-results/{test-name}-trace.zip`
- **Contains:**
  - Screenshot before each action
  - DOM snapshots
  - Network requests/responses
  - Console logs
  - Source code locations
  - Timing information
- **View:** Load in Playwright Trace Viewer
- **Implementation:** Already configured in `playwright.config.ts`:
```typescript
use: {
  trace: 'on-first-retry',
}
```
- **Command to view:** `npx playwright show-trace test-results/trace.zip`

---

### ➕ Allure Report (optional — requires extra dependency and CI wiring)
- **What:** Advanced HTML report with rich features
- **When:** After test suite completes
- **Use:** Enhanced reporting, test history, trends
- **Features:**
  - Test history and trends
  - Screenshots and videos embedded
  - Test categories and tags
  - Test duration statistics
  - Environment information
  - Attachments
- **Installation:** `npm install -D @playwright/test-allure-reporter`
- **Configuration:**
```typescript
reporter: [
  ['allure-playwright'],
  ['html']
]
```
- **View:** `allure serve allure-results`

---

### Summary of Output Requirements:

| Output Format | In committed config? | When generated | Purpose |
|--------------|----------------------|----------------|---------|
| Console Logs | (terminal) | During execution | Debugging |
| JSON Report | No — add reporter | After suite | CI/CD integration |
| HTML Report | **Yes** | After suite | Human review |
| Screenshots | **Yes** (`only-on-failure`) | On failure | Debugging |
| Video | No — add `use.video` | Per policy | Debugging |
| Trace | **Yes** (`on-first-retry`) | First retry of failed test | Deep debugging |
| Allure | No — separate package/setup | After suite | Rich reporting |

**Baseline (matches repo today):**
```typescript
// Excerpt — see full file at playwright.config.ts
export default defineConfig({
  reporter: "html",
  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
});
```

**Optional “full CI” style (merge manually if desired):** add `["json", { outputFile: "test-results/results.json" }]`, `["list"]`, `video: "retain-on-failure"`, and/or Allure per Playwright docs.

**Output locations (typical):**
- HTML Report: `playwright-report/index.html`
- JSON (if enabled): `test-results/results.json`
- Screenshots / traces / videos: under `test-results/` (exact names vary by Playwright version)

**Viewing results:**
- HTML Report: `npx playwright show-report`
- Trace: `npx playwright show-trace` + path to the `.zip` Playwright prints on failure
- Allure: only after you wire `allure-playwright` and run `allure serve …`

---

## 13. Execution Preference

**Run locally only?**
### ❌ NO - Both local AND CI/CD

---

### 🖥️ Local Execution (Primary During Development)

**When:** 
- ✅ During active development
- ✅ Writing new tests
- ✅ Debugging failing tests
- ✅ Testing new features
- ✅ Manual test runs

**How:**
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- caregiver.spec.ts

# Run specific test
npm run test:e2e -- caregiver.spec.ts -g "dashboard loads"

# Run with UI (watch tests run)
npm run test:e2e -- --headed

# Run with Playwright Inspector (step-through debugging)
npm run test:e2e -- --debug

# Run in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome
```

**Benefits:**
- ⚡ Fast feedback loop
- 🐛 Easy debugging with Inspector
- 👁️ Visual verification
- 🔧 Quick iteration
- 💻 Full development environment

---

### 🤖 CI/CD Integration (Critical for Quality)

**When:**
- ✅ On every pull request
- ✅ On every merge to main branch
- ✅ On scheduled runs (daily/nightly)
- ✅ Before releases/deployments

**Platforms Supported:**
- ✅ GitHub Actions (recommended for this project)
- ✅ GitLab CI/CD
- ✅ Jenkins
- ✅ Azure Pipelines
- ✅ CircleCI

**Why CI/CD is Essential:**
- 🚫 Catches regressions before they reach production
- ✅ Ensures code quality across team
- 📊 Tracks test history and trends
- 🔄 Automated testing on every change
- 🎯 Prevents broken code from merging
- 📈 Builds confidence in deployments

---

### 📋 Recommended CI/CD Workflow

**GitHub Actions Example (for CareNet 2):**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
          retention-days: 7
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            // Add comment to PR with test results summary
```

---

### 🎯 Execution Strategy for CareNet 2

**Phase 0: CareNet specs only (`package.json`)**
- **What it runs:** `playwright test e2e/carenet/` — everything under `e2e/carenet/`, not a hand-picked smoke list.
- **Command:** `npm run test:e2e:phase0`
- **Note:** Duration depends on machine and suite size; treat time estimates as ballpark only.

**Phase 1: Entire Playwright suite**
- **What it runs:** All tests under `e2e/` (includes `e2e/carenet/` plus root-level specs such as `connectivity.spec.ts`, `wallet-offline.spec.ts`, etc.).
- **Command:** `npm run test:e2e`

**Phase 2: Subset by tag or path (only after you add tags)**
- **Today:** There is **no** shared tag like `@full-suite` in the repo — do not rely on `grep` filters until tests declare tags (see Playwright docs for **test tags** on your `@playwright/test` version).
- **When tagged:** e.g. `npm run test:e2e -- --grep @slow`
- **Path filter (works today):** `npm run test:e2e -- e2e/carenet/auth.spec.ts`

**Phase 3: Mobile Testing (Medium, Run Weekly)**
- **Tests:** Mobile-specific flows, responsive design
- **Duration:** ~20-30 minutes
- **When:** Weekly, before releases
- **Purpose:** Ensure mobile app works correctly
- **Command:** `npm run test:e2e -- --project=mobile-chrome`

---

### 🔄 Parallel Execution

**Playwright supports parallel execution out of the box:**

```typescript
// Excerpt — see playwright.config.ts for full config
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
});
```

**Benefits:**
- ⚡ **Faster execution** - Tests run simultaneously
- 🖥️ **Better resource utilization** - Use all CPU cores
- ⏱️ **Reduced CI time** - Critical for fast feedback

**Configuration:**
- Local: `workers` defaults to parallel (Playwright picks worker count).
- CI: This repo sets **`workers: 1`** in CI to reduce flake from shared origin / IndexedDB (see Section 1 Playwright notes). Increase workers only if you have proven isolation.

---

### 📊 Test Flakiness Handling

**Flaky tests** (tests that pass/fail intermittently) are a common issue.

**Strategies:**
1. **Retry failed tests** (already configured: 2 retries in CI)
2. **Quarantine flaky tests** (mark as @flaky, investigate separately)
3. **Use wait strategies** (proper waiting, not arbitrary sleeps)
4. **Stable selectors** (use stable, unique selectors)
5. **Proper test isolation** (each test independent)

**Example:**
```typescript
test('dashboard loads', async ({ page }) => {
  // GOOD: Wait for element
  await expect(page.getByText('Dashboard')).toBeVisible();
  
  // BAD: Arbitrary sleep
  await page.waitForTimeout(5000);
});
```

---

### 🎯 Execution Summary

| Scenario | When | Command | Duration |
|----------|------|---------|----------|
| Local Development | Daily | `npm run test:e2e -- --headed` | Variable |
| Debugging | When needed | `npm run test:e2e -- --debug` | Variable |
| PR Checks (Smoke) | Every PR | `npm run test:e2e:phase0` | 5-10 min |
| PR Checks (Full) | Every PR | `npm run test:e2e` | 15-20 min |
| Scheduled Runs | Daily | `npm run test:e2e` | 45-60 min |
| Pre-Release | Before deploy | `npm run test:e2e` | 45-60 min |
| Mobile Tests | Weekly | `npm run test:e2e -- --project=mobile-chrome` | 20-30 min |

**Recommendation for CareNet 2:**
- ✅ **Primary:** Run locally during development
- ✅ **Critical:** CI/CD integration (GitHub Actions)
- ✅ **Strategy:** Phase-based testing (smoke → critical → full)
- ✅ **Parallel:** Use parallel execution for speed
- ✅ **Retries:** 2 retries in CI to handle flakiness
- ✅ **Artifacts:** Upload reports on failure for debugging

---

## 14. Special Notes (Important)

### 🔍 Anything Unusual About CareNet 2?

---

### ✅ 1. Infinite Scroll

**Where:**
- Job listings (`/caregiver/jobs`, `/agency/jobs`)
- Caregiver search results (`/guardian/search`)
- Agency directory (`/agencies`)
- Product listings (`/shop`)

**Testing Considerations:**
- ✅ Tests should scroll to load more items
- ✅ Verify new items appear after scrolling
- ✅ Test with both short and long lists
- ✅ Verify scroll position maintained on navigation back
- ✅ Test "Load More" button if present (alternative to infinite scroll)

**Example Test:**
```typescript
test('infinite scroll loads more jobs', async ({ page }) => {
  await page.goto('/caregiver/jobs');
  
  const initialCount = await page.locator('.job-card').count();
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000); // Wait for load
  
  const newCount = await page.locator('.job-card').count();
  expect(newCount).toBeGreaterThan(initialCount);
});
```

---

### ✅ 2. Heavy Use of Modals

**Where:**
- **Booking Wizard** (4-step modal)
- **Care Requirement Wizard** (6-step modal)
- **Shift Check-In/Check-Out** modals
- **Review/Rating** modal
- **Role Selection** modal
- **Confirmation** modals (delete, cancel, submit)
- **Image Upload** modals
- **Filter** modals
- **Search** modal (global search)

**Testing Considerations:**
- ✅ Modal must open on trigger
- ✅ Modal must close (X button, cancel, outside click, ESC key)
- ✅ Modal content must be visible and interactive
- ✅ Background should be dimmed/overlayed
- ✅ Modal should trap focus (accessibility)
- ✅ Modal should be centered and sized correctly
- ✅ Multi-step modals: Verify step navigation
- ✅ Verify data persists between modal steps
- ✅ Verify modal state on page refresh (if applicable)

**Example Test:**
```typescript
test('booking wizard modal opens and closes', async ({ page }) => {
  await page.goto('/guardian/dashboard');
  
  // Open modal
  await page.getByText('Book Care').click();
  await expect(page.getByText('Choose Service Type')).toBeVisible();
  
  // Close with X button
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Choose Service Type')).not.toBeVisible();
  
  // Open again
  await page.getByText('Book Care').click();
  await expect(page.getByText('Choose Service Type')).toBeVisible();
  
  // Close with ESC key
  await page.keyboard.press('Escape');
  await expect(page.getByText('Choose Service Type')).not.toBeVisible();
});
```

---

### ✅ 3. WebSockets / Real-time Updates

**Where:**
- **Supabase Realtime Subscriptions**
  - Care logs (guardian sees caregiver updates in real-time)
  - Shift status changes
  - New bids on care requirements
  - New messages
  - Notifications
  - Live tracking (caregiver location)
- **System Health Dashboard** (admin views channel status)

**Testing Considerations:**
- ⚠️ **Real-time features are challenging in E2E tests**
- ✅ Test with mocked real-time updates (using wait/expect)
- ✅ Verify UI updates when data changes
- ✅ Test subscription cleanup (no memory leaks)
- ✅ Test reconnection on connection loss
- ✅ Test offline/online sync (Dexie + Supabase)

**Example Test (Mock Real-time):**
```typescript
test('care log updates in real-time', async ({ page, context }) => {
  // Guardian page
  const guardianPage = await context.newPage();
  await loginAs(guardianPage, 'guardian');
  await guardianPage.goto('/guardian/care-log');
  
  // Caregiver page
  const caregiverPage = await context.newPage();
  await loginAs(caregiverPage, 'caregiver');
  await caregiverPage.goto('/caregiver/care-log');
  
  // Caregiver submits log
  await caregiverPage.fill('textarea[name="notes"]', 'Test note');
  await caregiverPage.click('button[type="submit"]');
  
  // Guardian should see update (with wait)
  await guardianPage.waitForTimeout(2000); // Allow for real-time sync
  await expect(guardianPage.getByText('Test note')).toBeVisible();
});
```

---

### ✅ 4. Role Switching

**Where:**
- Multi-role users can switch between roles
- Role selection modal on login (if user has multiple roles)
- User menu → "Switch Role" option

**Roles that can have multiple:**
- Caregiver + Guardian (caregiver managing own family)
- Agency + Shop Owner (agency selling medical supplies)
- Admin + Moderator (platform staff)

**Testing Considerations:**
- ✅ Test role selection modal shows correct roles
- ✅ Test switching between roles
- ✅ Verify dashboard changes for each role
- ✅ Verify URL updates to new role path
- ✅ Verify permissions change (cannot access other role's pages)
- ✅ Test role persistence across page navigation
- ✅ Test role switching without logout
- ✅ Verify cross-role guards (user cannot access pages for inactive roles)

**Example Test:**
```typescript
test('role switching updates dashboard', async ({ page }) => {
  // Login as multi-role user (caregiver + guardian)
  await loginAs(page, 'caregiver');
  await expect(page).toHaveURL('/caregiver/dashboard');
  
  // Switch to guardian role
  await page.click('[aria-label="User menu"]');
  await page.click('text=Switch Role');
  await page.click('text=Guardian');
  
  // Verify dashboard changes
  await expect(page).toHaveURL('/guardian/dashboard');
  await expect(page.getByText('Caregiver Dashboard')).not.toBeVisible();
  await expect(page.getByText('Guardian Dashboard')).toBeVisible();
});
```

---

### ✅ 5. Known Unstable Areas

**Areas to Watch:**

**1. Real-time Sync:**
- **Issue:** Real-time updates may not appear immediately
- **Solution:** Use appropriate wait times or assertions
- **Test:** Add `waitForTimeout` or `waitForSelector` for sync

**2. Offline/Online Transitions:**
- **Issue:** Dexie sync may have race conditions
- **Solution:** Test with explicit offline/online toggles
- **Test:** Use `context.setOffline(true)` and `context.setOffline(false)`

**3. File Uploads:**
- **Issue:** File upload dialogs can vary by browser
- **Solution:** Use `setInputFiles()` API
- **Test:** Mock file uploads, verify file appears

**4. Mobile Navigation:**
- **Issue:** Bottom navigation may overlap content
- **Solution:** Test on mobile viewport, check z-index
- **Test:** Use `mobile-chrome` project, verify all elements clickable

**5. Modal Stacking:**
- **Issue:** Multiple modals may open simultaneously
- **Solution:** Ensure only one modal open at a time
- **Test:** Verify previous modal closes before new one opens

**6. Form Auto-save:**
- **Issue:** Forms may auto-save, causing unexpected behavior
- **Solution:** Test with and without auto-save
- **Test:** Verify draft behavior, test explicit save

**7. Cross-Role Page Access:**
- **Issue:** User may manually navigate to other role's pages
- **Solution:** Verify route guards redirect appropriately
- **Test:** Navigate to other role's page, verify redirect

**8. Date/Time Inputs:**
- **Issue:** Date picker behavior varies by browser
- **Solution:** Use `fill()` with ISO format
- **Test:** Fill dates directly, avoid clicking calendar

**9. Long-running Operations:**
- **Issue:** Some operations (reports, exports) take time
- **Solution:** Use appropriate timeouts
- **Test:** Increase timeout for slow operations

---

### ✅ 6. Mock Mode (E2E) vs Production Mode

**CareNet 2 has two modes:**

**Mock Mode (`VITE_PLAYWRIGHT_E2E=true`):**
- ✅ Uses mock Supabase
- ✅ Real test credentials from `plans/00 Test Credentials.md`
- ✅ No real database operations
- ✅ Faster, more predictable tests
- ✅ Used for E2E testing

**Production Mode (`VITE_PLAYWRIGHT_E2E=false` or unset):**
- ✅ Uses real Supabase
- ✅ Real authentication
- ✅ Real database operations
- ✅ Used for staging/production

**Testing Implications:**
- ✅ E2E tests use mock mode by default
- ✅ Can test both modes if needed
- ✅ Ensure tests work in both modes
- ✅ Test credentials: see `plans/00 Test Credentials.md` for all accounts and password

**Example Configuration:**
```typescript
// playwright.config.ts
const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const demoMode = process.env.DEMO_MODE !== 'false'; // Default to demo

use: {
  baseURL,
  extraHTTPHeaders: {
    'X-Demo-Mode': demoMode ? 'true' : 'false',
  },
}
```

---

### ✅ 7. Accessibility Considerations

**Important for All Tests:**
- ✅ Test with keyboard navigation
- ✅ Test with screen reader (if possible)
- ✅ Verify ARIA labels on interactive elements
- ✅ Verify alt text on images
- ✅ Verify form labels
- ✅ Verify focus management (modals, dialogs)
- ✅ Verify color contrast (automated with @axe-core/playwright)
- ✅ Test with reduced motion preference
- ✅ Test with high contrast mode

**Example A11y Test:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('dashboard is accessible', async ({ page }) => {
  await injectAxe(page);
  await page.goto('/caregiver/dashboard');
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

---

### ✅ 8. Mobile-Specific Considerations

**CareNet 2 is a PWA with Capacitor for mobile:**

**Testing on Mobile:**
- ✅ Use `mobile-chrome` project in Playwright
- ✅ Test touch interactions (tap, swipe)
- ✅ Test bottom navigation (mobile-specific)
- ✅ Test mobile menus (hamburger, drawer)
- ✅ Test responsive layouts
- ✅ Test safe areas (notch, home indicator)
- ✅ Test keyboard behavior (open/close, auto-scroll)
- ✅ Test pull-to-refresh (if implemented)
- ✅ Test swipe gestures (if implemented)

**Mobile Viewport Sizes:**
```typescript
// playwright.config.ts
projects: [
  {
    name: 'mobile-chrome',
    use: { 
      ...devices['Pixel 7'],
      // or custom viewport
      viewport: { width: 375, height: 812 }, // iPhone X
    },
  },
]
```

---

### ✅ 9. Offline Capabilities

**CareNet 2 supports offline via Dexie:**

**Testing Offline Behavior:**
- ✅ Test with network offline (`context.setOffline(true)`)
- ✅ Verify app loads from cache
- ✅ Verify data saves to Dexie (IndexedDB)
- ✅ Verify sync when back online
- ✅ Test offline-to-online transitions
- ✅ Test queue operations (offline write, sync later)

**Example Offline Test (pattern only — align selectors with the real care-log UI):** See `e2e/carenet/care-log-offline-network.spec.ts` for a maintained example. Do not copy placeholder strings (`Saved offline`, field `name`s) unless they exist in the product.

```typescript
test("network toggles while caregiver is logged in", async ({ page, context }) => {
  await loginAs(page, "caregiver");
  await context.setOffline(true);
  await page.goto("/caregiver/care-log", { waitUntil: "load" });
  // Drive the real form with getByRole / labels from the current page
  // …
  await context.setOffline(false);
  // Assert sync using a toast, URL, or list refresh — not an arbitrary sleep
  // await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 15_000 });
});
```

---

### ✅ 10. Internationalization (i18n)

**CareNet 2 supports multiple languages:**
- ✅ English (en)
- ✅ Bengali (bn)
- ✅ Additional languages (admin-managed, loaded at runtime)

**Testing i18n:**
- ✅ Test with both English and Bengali
- ✅ Verify all text is translatable (no hardcoded strings)
- ✅ Verify language switch works
- ✅ Verify date/time formatting
- ✅ Verify currency formatting (BDT)
- ✅ Verify RTL support (if Arabic/Urdu added later)

**Example i18n Test:** Discover the language control in the running app (aria-label, menu item role, or `data-testid`) — it can change with layout. Prefer **stable** assertions: `toHaveURL`, `html[lang="bn"]`, or a known translation key surfaced in the DOM, rather than a single long Bangla string that may differ by pluralization or copy edits.

```typescript
test("language switch updates html lang", async ({ page }) => {
  await loginAs(page, "caregiver");
  // Pseudocode: open settings / user menu, pick Bengali using getByRole('menuitem', { name: /…/i })
  // await page.getByRole("button", { name: /language/i }).click();
  // await page.getByRole("menuitem", { name: /বাংলা|bangla/i }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn", { timeout: 10_000 });
});
```

---

### ✅ 11. PWA Considerations

**CareNet 2 is a Progressive Web App:**

**Testing PWA Features:**
- ✅ Test app installs (install prompt)
- ✅ Test offline loading (service worker)
- ✅ Test app manifest (name, icons, colors)
- ✅ Test add to home screen
- ✅ Test splash screen
- ✅ Test theme color
- ✅ Test full-screen mode

**Service Worker Testing:**
```typescript
test("service worker caches app shell", async ({ page, context }) => {
  await page.goto("/", { waitUntil: "load" });
  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  // `/` may redirect to `/auth/login` in dev — assert a stable shell, not a fixed path
  await expect(page.getByRole("main").first()).toBeVisible({ timeout: 15_000 });
});
```

---

### ✅ 12. Capacitor/Native Features

**CareNet 2 uses Capacitor for native mobile apps:**

**Native Features to Test (on real devices/emulators):**
- ✅ Camera access (document uploads, profile pictures)
- ✅ Geolocation (caregiver location tracking)
- ✅ Push notifications (shift alerts, messages)
- ✅ Network status (online/offline detection)
- ✅ Local storage (preferences, settings)
- ✅ File system (document uploads/downloads)
- ✅ Haptics (feedback on actions)
- ✅ Status bar styling
- ✅ Safe area handling
- ✅ Keyboard handling (auto-scroll, resize)
- ✅ App lifecycle (background, foreground)
- ✅ Deep links (URL schemes)
- ✅ Back button handling (Android)

**Note:** Native features require real devices or emulators — **Playwright projects in this repo do not validate Capacitor plugins.** Keep a separate native QA checklist.

---

### ✅ 13. Performance Considerations

**Performance Testing:**
- ✅ Measure page load times
- ✅ Measure API response times
- ✅ Test with slow network (3G, 4G)
- ✅ Test with slow CPU (throttling)
- ✅ Test with large data sets (long lists)
- ✅ Monitor memory usage (no leaks)
- ✅ Monitor bundle size (code splitting)

**Example Performance Test:** Avoid `networkidle` in SPAs (polling, websockets, Supabase). Measure **meaningful readiness** (e.g. main landmark visible) instead.

```typescript
import { loginAs } from "./helpers";

test("dashboard becomes interactive", async ({ page }) => {
  await loginAs(page, "caregiver");
  const start = Date.now();
  await page.goto("/caregiver/dashboard", { waitUntil: "load" });
  await expect(page.getByRole("main").first()).toBeVisible({ timeout: 15_000 });
  expect(Date.now() - start).toBeLessThan(15_000);
});
```

---

### ✅ 14. Security Considerations

**Security Testing:**
- ✅ Test authentication (login, logout)
- ✅ Test authorization (role-based access)
- ✅ Test XSS vulnerabilities (user input sanitization)
- ✅ Test CSRF protection (form tokens)
- ✅ Test secure headers (CSP, X-Frame-Options)
- ✅ Test sensitive data handling (passwords, tokens)
- ✅ Test API rate limiting
- ✅ Test input validation (all forms)
- ✅ Test file upload restrictions (type, size)

**Example Security Test:**
```typescript
test('unauthorized user cannot access admin pages', async ({ page }) => {
  // Login as caregiver (not admin)
  await loginAs(page, 'caregiver');
  
  // Try to access admin dashboard
  await page.goto('/admin/dashboard');
  
  // Should redirect to login or show error
  await expect(page).toHaveURL(/\/(auth\/login|caregiver\/dashboard)/);
});
```

---

### ✅ 15. Test Data Management

**Managing Test Data:**
- ✅ Use unique test data (timestamps, random numbers)
- ✅ Clean up test data after tests
- ✅ Use test database (separate from production)
- ✅ Reset database between test runs (if possible)
- ✅ Mock external dependencies (email, SMS, payments)
- ✅ Seed database with test fixtures
- ✅ Avoid data pollution between tests

**Example:**
```typescript
const uniqueEmail = `test${Date.now()}@example.com`;
const uniquePhone = `+880${Date.now().toString().slice(-10)}`;

test.afterEach(async () => {
  // Wire cleanup to your environment (API, admin script, or skip in mock E2E)
});
```

---

### 📋 Summary of Special Notes

| Area | Key Considerations | Testing Approach |
|------|-------------------|------------------|
| **Infinite Scroll** | Job lists, search results | Scroll to load, verify new items |
| **Modals** | Booking wizard, care requirement wizard | Open/close, multi-step, focus trapping |
| **Real-time** | Supabase subscriptions, live updates | Mock updates, wait for sync |
| **Role Switching** | Multi-role users, role selection | Switch roles, verify permissions |
| **Unstable Areas** | Sync, file uploads | Explicit `expect` / toasts, not arbitrary sleeps |
| **Mock Mode** | Mock Supabase vs real | Test both modes if needed |
| **Accessibility** | A11y compliance | A11y tests, keyboard navigation |
| **Mobile** | PWA + responsive web | `mobile-chrome` project; native Capacitor = device QA |
| **Offline** | Dexie, service worker | Offline mode, sync when online |
| **i18n** | English, Bengali, more | Test language switch, formatting |
| **PWA** | Install, offline, manifest | Service worker, app shell |
| **Performance** | Load times, slow network | Measure performance, throttle |
| **Security** | Auth, authorization, XSS | Access control, input validation |

---

### 🎯 Final Recommendations for CareNet 2 E2E Testing

1. **Use Mock Mode** for most E2E tests (`VITE_PLAYWRIGHT_E2E=true`, started by Playwright `webServer`)
2. **Use `loginAs(page, role)`** with real test credentials from `plans/00 Test Credentials.md` — prefer per-test `loginAs` or a documented shared-context / `storageState` pattern
3. **Test All 7 Roles** with appropriate dashboards and flows
4. **Focus on Critical Workflows** (Section 5) for CI/CD
5. **Handle Modals Carefully** (open, close, multi-step)
6. **Real-time / sync:** assert on UI outcomes (list updates, toasts), not fixed `waitForTimeout`
7. **Test Mobile Responsiveness** (`mobile-chrome` project)
8. **Verify Accessibility** (`@axe-core/playwright` — match `a11y-smoke.spec.ts`: disable color-contrast, filter serious/critical)
9. **Test Offline Behavior** (Dexie / `setOffline` — see `care-log-offline-network.spec.ts`; mind parallel IndexedDB)
10. **Monitor Performance** using user-meaningful ready signals, not `networkidle`
11. **Run in CI/CD** (GitHub Actions on every PR)
12. **Reports:** shipped config is **HTML + failure screenshots + trace on first retry**; add JSON/video/Allure only when CI needs them

---

**End of TestInfo.md**
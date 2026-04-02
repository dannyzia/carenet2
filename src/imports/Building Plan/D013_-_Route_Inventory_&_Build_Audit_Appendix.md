# D013 - Route Inventory & Build Audit Appendix

## 1. Scope & Appendix Rule [✅ 100% Built] [🔴 High]
This appendix captures the route and module audit layer from the wireframe corpus, especially the Section 21 build-status audit.

It is intended as a QA, routing, and handoff reference rather than a replacement for the structural frontend planning in → D007.

This document should be read with → D006 §6, → D006 §8, → D007, → D012, → D014, and → D015.

## 2. Executive Build Position [✅ 100% Built] [🔴 High]
The source corpus states that CareNet v1.0 core scope is fully built.

Related reading: → D007 for frontend structure, → D012 for shared UI confirmation, and → D014 for admin and operations surfaces.

| Build Metric | Source Position |
|---|---|
| Total built core pages | 141 |
| Original baseline | 117 |
| Section 17 additions | 12 |
| Section 18 additions | 8 |
| Additional pages | 4 |
| Core build verdict | 141 of 141 built |

## 3. Module-Level Build Audit [✅ 100% Built] [🔴 High]

| Module | Wireframed Pages | Built Pages | Status |
|---|---:|---:|---|
| Public | 13 | 13 | [✅ 100% Built] |
| Authentication | 8 | 8 | [✅ 100% Built] |
| Caregiver | 20 | 20 | [✅ 100% Built] |
| Guardian | 20 | 20 | [✅ 100% Built] |
| Patient | 9 | 9 | [✅ 100% Built] |
| Agency | 20 | 20 | [✅ 100% Built] |
| Admin | 19 | 19 | [✅ 100% Built] |
| Moderator | 4 | 4 | [✅ 100% Built] |
| Shop Merchant | 9 | 9 | [✅ 100% Built] |
| Shop Front | 10 | 10 | [✅ 100% Built] |
| Community | 3 | 3 | [✅ 100% Built] |
| Support | 4 | 4 | [✅ 100% Built] |
| Utility | 1 | 1 | [✅ 100% Built] |
| Agency Directory | 1 | 1 | [✅ 100% Built] |

## 4. Route Inventory by Module [✅ 100% Built] [🔴 High]

### 4.1 Public Routes [✅ 100% Built] [🔴 High]

| Page | Route | Status |
|---|---|---|
| Home | `/` or `/home` | [✅ 100% Built] |
| About | `/about` | [✅ 100% Built] |
| Features | `/features` | [✅ 100% Built] |
| Pricing | `/pricing` | [✅ 100% Built] |
| Marketplace | `/marketplace` | [✅ 100% Built] |
| Contact | `/contact` | [✅ 100% Built] |
| Privacy | `/privacy` | [✅ 100% Built] |
| Terms | `/terms` | [✅ 100% Built] |
| Global Search | `/search` | [✅ 100% Built] |
| Dashboard Redirect | `/dashboard` | [✅ 100% Built] |
| Messages | `/messages` | [✅ 100% Built] |
| Notifications | `/notifications` | [✅ 100% Built] |
| Settings | `/settings` | [✅ 100% Built] |

### 4.2 Authentication Routes [✅ 100% Built] [🔴 High]

| Page | Route | Status |
|---|---|---|
| Login | `/auth/login` | [✅ 100% Built] |
| Role Selection | `/auth/role-selection` | [✅ 100% Built] |
| Register | `/auth/register` | [✅ 100% Built] |
| Forgot Password | `/auth/forgot-password` | [✅ 100% Built] |
| Reset Password | `/auth/reset-password` | [✅ 100% Built] |
| MFA Setup | `/auth/mfa-setup` | [✅ 100% Built] |
| MFA Verify | `/auth/mfa-verify` | [✅ 100% Built] |
| Verification Result | `/auth/verification-result` | [✅ 100% Built] |

### 4.3 Caregiver Routes [✅ 100% Built] [🔴 High]

| Page Family | Representative Routes | Status |
|---|---|---|
| Overview and identity | `/caregiver/dashboard`, `/caregiver/profile` | [✅ 100% Built] |
| Job marketplace | `/caregiver/jobs`, job detail, application detail | [✅ 100% Built] |
| Assigned work | `/caregiver/assigned-patients`, `/caregiver/schedule`, `/caregiver/shift/:id` | [✅ 100% Built] |
| Care logging | `/caregiver/care-log` | [✅ 100% Built] |
| Workforce operations | earnings, payout, documents, training, skills, tax, references, portfolio | [✅ 100% Built] |
| Communication and reviews | `/caregiver/messages`, `/caregiver/reviews` | [✅ 100% Built] |

### 4.4 Guardian Routes [✅ 100% Built] [🔴 High]

| Page Family | Representative Routes | Status |
|---|---|---|
| Dashboard and search | `/guardian/dashboard`, `/guardian/search` | [✅ 100% Built] |
| Research pages | `/guardian/caregiver/:id`, `/guardian/caregiver-comparison`, `/guardian/agency/:id` | [✅ 100% Built] |
| Requirement flow | `/guardian/care-requirements`, `/guardian/care-requirement-wizard`, `/guardian/care-requirement/:id` | [✅ 100% Built] |
| Redirected legacy flow | `/guardian/booking` | [🔄 Redirect/Deprecated] |
| Patients and schedule | `/guardian/patients`, `/guardian/patient-intake`, `/guardian/schedule` | [✅ 100% Built] |
| Operations | `/guardian/messages`, `/guardian/payments`, `/guardian/reviews`, `/guardian/profile`, `/guardian/family-hub` | [✅ 100% Built] |
| Placement branch | `/guardian/placements`, `/guardian/placement/:id` | [✅ 100% Built] |

### 4.5 Patient Routes [✅ 100% Built] [🟠 Medium]

| Page | Route | Status |
|---|---|---|
| Dashboard | `/patient/dashboard` | [✅ 100% Built] |
| Profile | `/patient/profile` | [✅ 100% Built] |
| Care History | `/patient/care-history` | [✅ 100% Built] |
| Medical Records | `/patient/medical-records` | [✅ 100% Built] |
| Health Report | `/patient/health-report` | [✅ 100% Built] |
| Vitals | `/patient/vitals` | [✅ 100% Built] |
| Medications | `/patient/medications` | [✅ 100% Built] |
| Emergency | `/patient/emergency` | [✅ 100% Built] |
| Data Privacy | `/patient/data-privacy` | [✅ 100% Built] |

### 4.6 Agency Routes [✅ 100% Built] [🔴 High]

| Page Family | Representative Routes | Status |
|---|---|---|
| Dashboard and roster | `/agency/dashboard`, `/agency/caregivers`, `/agency/clients` | [✅ 100% Built] |
| Client operations | `/agency/client-intake`, `/agency/clients/:id/care-plan` | [✅ 100% Built] |
| Business ops | `/agency/payments`, `/agency/reports`, `/agency/storefront`, `/agency/branches`, `/agency/attendance`, `/agency/hiring` | [✅ 100% Built] |
| Incident creation | `/agency/incident-report` | [✅ 100% Built] |
| Architecture additions | `/agency/requirements-inbox`, `/agency/requirement-review/:id`, `/agency/placements`, `/agency/placement/:id`, `/agency/shift-monitoring` | [✅ 100% Built] |
| Section 18 additions | `/agency/job-management`, `/agency/jobs/:id/applications`, `/agency/payroll` | [✅ 100% Built] |
| Residual enhancement | `/agency/incidents` | [🔄 Enhancement] |

### 4.7 Admin and Moderator Routes [✅ 100% Built] [🟠 Medium]

| Module | Representative Routes | Status |
|---|---|---|
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/verifications`, `/admin/verifications/:id`, `/admin/reports`, `/admin/disputes/:id`, `/admin/payments`, `/admin/financial-audit`, `/admin/settings`, `/admin/policy`, `/admin/promos`, `/admin/cms`, `/admin/tickets/:id`, `/admin/audit-logs`, `/admin/system-health`, `/admin/users/:id`, `/admin/sitemap` | [✅ 100% Built] |
| Moderator | `/moderator/dashboard`, `/moderator/reviews`, `/moderator/reports`, `/moderator/content` | [✅ 100% Built] |

### 4.8 Shop, Community, Support, and Utility Routes [✅ 100% Built] [🟠 Medium]

| Module | Representative Routes | Status |
|---|---|---|
| Shop merchant | `/shop/dashboard`, `/shop/products`, `/shop/products/new`, `/shop/products/:id/edit`, `/shop/orders`, `/shop/inventory`, `/shop/analytics`, `/shop/onboarding`, `/shop/merchant-analytics`, `/shop/fulfillment` | [✅ 100% Built] |
| Shop front | `/shop`, `/shop/products`, `/shop/product/:id`, `/shop/category/:slug`, `/shop/product/:id/reviews`, `/shop/cart`, `/shop/checkout`, `/shop/order-success`, `/shop/orders/:id/track`, `/shop/orders`, `/shop/wishlist` | [✅ 100% Built] |
| Community | `/blog`, `/blog/:id`, `/careers` | [✅ 100% Built] |
| Support | `/support`, `/support/contact`, `/support/submit-ticket`, `/support/refund` | [✅ 100% Built] |
| Utility | `*` catch-all 404 | [✅ 100% Built] |

### 4.9 Public Agency Directory [✅ 100% Built] [🔴 High]

| Page | Route | Status |
|---|---|---|
| Public Agency Directory | `/agencies` | [✅ 100% Built] |

## 5. Shared Components Built [✅ 100% Built] [🟠 Medium]
Section 21 explicitly confirms the shared shell layer as built.

| Shared Surface | Status |
|---|---|
| Layout | [✅ 100% Built] |
| PublicNavBar | [✅ 100% Built] |
| BottomNav | [✅ 100% Built] |
| RootLayout | [✅ 100% Built] |
| ThemeProvider | [✅ 100% Built] |
| Design tokens and theme CSS | [✅ 100% Built] |

Related reading: → D007 §2 and → D012.

## 6. Section 15 Proposed Improvement Pages [❌ Not Built – v2.0] [🔴 High]
The build audit explicitly separates proposed v2.0 pages from the 141-page core.

| Route Family | Examples |
|---|---|
| Patient enhancements | `/patient/care-log`, `/patient/care-plan`, `/patient/alerts`, `/patient/symptoms`, `/patient/photo-journal`, `/patient/telehealth`, `/patient/nutrition`, `/patient/rehab`, `/patient/insurance` |
| Guardian enhancements | `/guardian/care-log`, `/guardian/alerts`, `/guardian/live-tracking`, `/guardian/live-monitor`, `/guardian/care-scorecard`, `/guardian/family-board` |
| Caregiver enhancements | `/caregiver/handoff` |

## 7. Minor Pending Enhancements [🔄 Enhancement] [🟠 Medium]

| Item | Status |
|---|---|
| Agency incidents list page | Pending enhancement |
| Features page content depth | Placeholder content |
| Pricing page content depth | Placeholder content |

## 8. Final Audit Position [✅ 100% Built] [🔴 High]
This appendix gives the planning suite a preserved route-audit layer.

1. The core route surface is fully built at 141 pages.
2. Section 21 audit findings are now preserved outside the compressed frontend summary.
3. v2.0 pages remain clearly separated from the live core route tree.
4. Residual enhancements remain visible without being misclassified as missing core coverage.
5. The appendix now serves as the audit bridge back into → D006 for operationally relevant surfaces and → D007 for the frontend structural model.
6. It also serves as the audit bridge for → D012 design-surface confirmation and → D014 operations-surface confirmation.
7. It now pairs with → D015 as the suite's direct page-by-page wireframe preservation layer.
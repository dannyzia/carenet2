# D015 - Page-by-Page Wireframe Appendix

## 1. Scope & Preservation Rule [✅ 100% Built] [🔴 High]
This appendix preserves the page-by-page wireframe layer from the source corpus so the master planning suite includes the wireframe inventory directly rather than only by reference.

This document should be read with → D007 §3, → D013 §4, and → D013 §6.

The source rule remains unchanged: this appendix is derived only from `DO_NOT_COMMIT/Instructions/WIREFRAMES.md`, with Section 21 route names treated as the canonical naming baseline when earlier narrative sections use older route wording.

## 2. Design Review Use [✅ 100% Built] [🟠 Medium]
Use this appendix when a review needs the wireframe layer in a design-review format rather than a raw page list.

| Need | Read This Appendix For |
|---|---|
| Product review | Page purpose and expected workflow intent |
| UX review | Primary user actions per page |
| Delivery review | Acceptance-oriented notes for what each page must prove |
| Frontend handoff | Canonical route naming aligned to the build audit |
| QA review | Quick verification expectations per page family |

### 2.1 Review Columns

| Column | Meaning |
|---|---|
| Purpose | Why the page exists in the operating model |
| Primary User Actions | The main things a user should be able to do on the page |
| Acceptance Notes | What must be visibly true for the wireframe intent to be considered satisfied |

## 3. Wireframe Corpus Position [✅ 100% Built] [🔴 High]

| Item | Source Position |
|---|---|
| Core wireframed pages | 141 |
| Original baseline | 117 |
| Section 17 architectural additions | 12 |
| Section 18 compliance additions | 8 |
| Proposed v2.0 wireframes | 14 |
| Core build verdict | 141 of 141 built |

Related reading: → D001 §4, → D007 §4, and → D013 §2.

## 4. Shared Wireframe Shell [✅ 100% Built] [🟠 Medium]
The wireframe corpus uses a shared shell across modules: PublicNavBar for public pages, role-aware authenticated layout for private pages, BottomNav for mobile, role color coding, and mobile-first interaction patterns.

| Shared Surface | Design Review Expectation |
|---|---|
| PublicNavBar | Public routes retain persistent navigation, auth CTAs, and mobile drawer behavior |
| BottomNav | Mobile tabs remain role-aware and persistent on small screens |
| Layout component | Authenticated pages inherit sidebar, top bar, breadcrumb/title area, and scrollable content region |
| Role accents | Each role keeps a distinct visual accent for orientation and status recognition |
| Mobile-first patterns | Core actions remain reachable via touch-safe layouts and stacked mobile behavior |

Related reading: → D002, → D008, and → D012.

## 5. Core Page-by-Page Design Review Map [✅ 100% Built] [🔴 High]

### 5.1 Public Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Home Page | §2.1 | `/` or `/home` | Introduce CareNet and route users into the platform | Register; enter job portal; enter care shop; review trust messaging | Hero, CTA stack, feature grid, and help/contact block are all present | [✅ 100% Built] |
| About Page | §2.2 | `/about` | Explain mission, trust model, and audience fit | Read mission; explore role value cards; review impact and values | Mission narrative, value sections, trust proof, and CTA footer remain visible | [✅ 100% Built] |
| Features Page | §2.3 | `/features` | Hold a placeholder for future feature-detail content | Open page; return home | Placeholder state clearly communicates deferred detail rather than broken content | [✅ 100% Built] |
| Pricing Page | §2.4 | `/pricing` | Hold a placeholder for future pricing-detail content | Open page; return home | Placeholder state clearly communicates deferred detail rather than broken content | [✅ 100% Built] |
| Marketplace / Job Portal | §2.5 | `/marketplace` | Let public users browse open caregiver-related job opportunities | Search; filter; inspect job card; apply or open details | Search/filter bar, result count, skill pills, and agency identity remain visible | [✅ 100% Built] |
| Contact Page | §2.6 | `/contact` | Provide direct support and inquiry entry | Submit contact form; inspect phone/email/address details | Form fields and sidebar contact surfaces are present and understandable | [✅ 100% Built] |
| Privacy Policy Page | §2.7 | `/privacy` | Present platform privacy terms in a legal reading layout | Read policy; navigate by sections | Legal-document structure is readable and sectioned | [✅ 100% Built] |
| Terms of Service Page | §2.8 | `/terms` | Present platform terms and agreement context | Read terms; reach end-of-flow acknowledgement area | Legal-document structure is readable and includes end-state acknowledgement intent | [✅ 100% Built] |
| Global Search Page | §2.9 | `/global-search` | Search across major content types from one entry point | Search; switch result tabs; inspect grouped results | Search bar and grouped result categories remain explicit | [✅ 100% Built] |
| Dashboard (Role Router) | §2.10 | `/dashboard` | Redirect authenticated users to the correct role hub | Enter dashboard; wait for role detection | Router behavior clearly resolves to role destinations instead of exposing dead-end content | [✅ 100% Built] |
| Messages Page (General) | §2.11 | `/messages` | Provide the shared baseline conversation shell | Select conversation; read thread; send message | Conversation list and chat surface both remain available in the wireframe intent | [✅ 100% Built] |
| Notifications Page | §2.12 | `/notifications` | Surface system and workflow updates in one feed | Review notifications; scan timestamps and types | Notification items retain icon, title, body, and timestamp treatment | [✅ 100% Built] |
| Settings Page | §2.13 | `/settings` | Centralize account, preference, security, and logout controls | Open settings groups; review theme and security options; log out | Grouped cards, theme choices, and logout block remain explicit | [✅ 100% Built] |

### 5.2 Authentication Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Login Page | §3.1 | `/auth/login` | Authenticate returning users | Enter phone and password; toggle password visibility; continue to reset flow | Sign-in card, input iconography, and recovery link remain clear | [✅ 100% Built] |
| Role Selection Page | §3.2 | `/auth/role-selection` | Route new users into role-appropriate registration | Review roles; choose one; proceed to registration | Role cards clearly differentiate the available user paths | [✅ 100% Built] |
| Register Page | §3.3 | `/auth/register` | Capture new user registration details | Complete form; submit registration | Registration surface reflects multi-role onboarding intent | [✅ 100% Built] |
| Forgot Password Page | §3.4 | `/auth/forgot-password` | Start credential recovery | Request reset; submit contact/identity info | Reset-request flow is identifiable as a standalone recovery step | [✅ 100% Built] |
| Reset Password Page | §3.5 | `/auth/reset-password` | Let users set a new password | Enter new credentials; confirm reset | Reset state is distinct from login and clearly completion-oriented | [✅ 100% Built] |
| MFA Setup Page | §3.6 | `/auth/mfa-setup` | Enroll users in two-factor authentication | Review setup instructions; activate MFA | Enrollment-specific guidance and setup path remain visible | [✅ 100% Built] |
| MFA Verify Page | §3.7 | `/auth/mfa-verify` | Verify a second factor during authentication | Enter verification code; complete sign-in | Challenge state is explicit and separate from initial login | [✅ 100% Built] |
| Verification Result Page | §3.8 | `/auth/verification-result` | Confirm the result of auth-related verification | Review outcome; continue to next destination | Result messaging is unambiguous and action-oriented | [✅ 100% Built] |

### 5.3 Caregiver Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Caregiver Dashboard | §4.1 | `/caregiver/dashboard` | Give caregivers a working overview of shifts, jobs, and earnings | Review current work; jump to tasks; inspect KPIs | Dashboard highlights active work, schedule, and earnings context | [✅ 100% Built] |
| Caregiver Profile Page | §4.2 | `/caregiver/profile` | Manage professional identity and qualifications | Edit profile; review credentials; update personal details | Profile surface supports identity and qualification management | [✅ 100% Built] |
| Caregiver Assigned Patients Page | §4.3 and §17.3.11 | `/caregiver/assigned-patients` | Show active patient roster tied to placements | Review assigned patients; open care plan or history; log care | Cards expose patient identity, placement context, and quick actions | [✅ 100% Built] |
| Caregiver Structured Care Log Form | §4.4 and §17.3.12 | `/caregiver/care-log` | Record structured care activity during a shift | Select log type; complete form; attach evidence; save entry | Typed log categories and context header are present, not just a generic note box | [✅ 100% Built] |
| Caregiver Jobs Page | §4.5 and §18.2.7 | `/caregiver/jobs` | Let caregivers browse agency-posted jobs | Browse jobs; review agency info; apply; inspect status | Jobs are clearly agency-posted and never framed as direct guardian hiring | [✅ 100% Built] |
| Caregiver Job Detail Page | legacy §4.4 numbering | `/caregiver/jobs/:id` | Show one job in detail before application or follow-up | Review skills/rate/schedule; apply; inspect status | Job detail retains agency identity and application-oriented actions | [✅ 100% Built] |
| Caregiver Schedule Page | legacy §4.5 numbering | `/caregiver/schedule` | Show the caregiver's shift calendar and commitments | Review schedule; inspect shift timing | Schedule view makes active and upcoming work legible | [✅ 100% Built] |
| Caregiver Earnings Page | §4.6 | `/caregiver/earnings` | Show earnings performance and payout progress | Review totals; inspect payout states | Earnings page exposes trend/summary information rather than only static totals | [✅ 100% Built] |
| Caregiver Messages Page | §4.7 | `/caregiver/messages` | Support placement-stage messaging with agency and guardian | Select conversation; send message; inspect conversation roles | Messaging surface respects the placement-stage model in D004/D006 | [✅ 100% Built] |
| Caregiver Reviews Page | §4.8 | `/caregiver/reviews` | Let caregivers inspect quality feedback | Review ratings; read feedback | Review content remains a discrete quality-management page | [✅ 100% Built] |
| Caregiver Documents Page | §4.9 | `/caregiver/documents` | Store and manage professional documents | Upload or inspect documents | Credential/document management is explicit and role-relevant | [✅ 100% Built] |
| Daily Earnings Detail Page | §4.10 | `/caregiver/daily-earnings` | Break down one period of earnings in more detail | Review payout line items; inspect daily work impact | Detail view expands earnings into understandable subcomponents | [✅ 100% Built] |
| Job Application Detail Page | §4.11 | `/caregiver/job-application/:id` | Show one application and its lifecycle state | Review application status; inspect agency response | Application-state detail remains more specific than generic job detail | [✅ 100% Built] |
| Payout Setup Page | §4.12 | `/caregiver/payout-setup` | Configure how earnings are paid out | Add payout details; review setup status | Setup flow is clearly financial and completion-oriented | [✅ 100% Built] |
| Portfolio Editor Page | §4.13 | `/caregiver/portfolio` | Edit the caregiver's market-facing profile | Add/edit portfolio items; present experience | Editing intent is explicit and supports professional presentation | [✅ 100% Built] |
| Reference Manager Page | §4.14 | `/caregiver/references` | Maintain references and supporting endorsements | Add, review, or manage references | Reference handling is structured rather than buried in generic profile editing | [✅ 100% Built] |
| Shift Detail Page | §4.15 | `/caregiver/shift/:id` | Show one active or historical shift in context | Review shift details; enter care logs; inspect timing | Shift page connects directly to care logging and shift evidence | [✅ 100% Built] |
| Skills Assessment Page | §4.16 | `/caregiver/skills-assessment` | Capture assessed capabilities | Review or complete assessments | Assessment intent is visible and distinct from static profile content | [✅ 100% Built] |
| Tax Reports Page | §4.17 | `/caregiver/tax-reports` | Provide tax-facing payout records | Review reports; export/inspect tax details | Tax reporting is discrete and understandable | [✅ 100% Built] |
| Training Portal Page | §4.18 | `/caregiver/training` | Give caregivers access to learning and readiness content | Browse training; open learning materials | Training remains a dedicated enablement surface | [✅ 100% Built] |

### 5.4 Guardian Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Guardian Dashboard | §5.1 and §17.2.1 | `/guardian/dashboard` | Give guardians an agency-mediated care overview | Review placements and requirements; start requirement flow | Dashboard reflects placements and requirements, not direct caregiver booking | [✅ 100% Built] |
| Agency & Caregiver Search Page | §5.2 and §17.2.2 | `/guardian/search` | Let guardians research agencies first and caregivers second | Search; filter; open agency profile; inspect caregiver research tab | Search results are agency-first and avoid direct hire language | [✅ 100% Built] |
| Caregiver Public Profile Page | §5.3 and §17.2.3 | `/guardian/caregiver/:id` | Support caregiver research inside the agency-mediated model | Review caregiver details; contact agency; start requirement with agency context | Read-only research posture and agency affiliation are explicit | [✅ 100% Built] |
| Caregiver Comparison Page | §5.4 and §17.2.4 | `/guardian/caregiver-comparison` | Compare caregiver options before submitting a requirement | Compare profiles; route request through agency | Comparison stops at research and never ends in direct selection | [✅ 100% Built] |
| Booking Wizard Page | §5.5 and §17.2.5 | `/guardian/booking` | Preserve legacy route behavior while redirecting invalid flow | Enter legacy route; be redirected | Legacy booking does not act as a live direct-booking flow | [🔄 Redirect/Deprecated] |
| Guardian Schedule Page | §5.6 | `/guardian/schedule` | Show schedule commitments from the family side | Review schedule; inspect care timing | Schedule remains placement-aware and guardian-facing | [✅ 100% Built] |
| Guardian Patients Page | §5.7 | `/guardian/patients` | Manage patient roster and patient context | Review patient list; open patient details | Patient management remains separate from requirement flow | [✅ 100% Built] |
| Patient Intake Page | §5.8 | `/guardian/patient-intake` | Capture care-relevant patient onboarding information | Add patient; record intake details | Intake supports patient creation for later requirements and placements | [✅ 100% Built] |
| Guardian Messages Page | §5.9 and §17.2.6 | `/guardian/messages` | Allow stage-aware communication with agency and caregiver | Message agency; message caregiver only when placement allows | Messaging rules align to requirement and placement stage | [✅ 100% Built] |
| Guardian Payments Page | §5.10 and §17.2.7 | `/guardian/payments` | Let guardians review billing tied to agencies and placements | Review invoices; inspect billing status | Payment framing is agency-billed and placement-linked | [✅ 100% Built] |
| Invoice Detail Page | §5.11 | `/guardian/invoice/:id` | Show one invoice in detail | Open invoice; inspect line items | Invoice detail ties charges to placement and agency context | [✅ 100% Built] |
| Guardian Reviews Page | §5.12 | `/guardian/reviews` | Capture and inspect feedback on care quality | Review or leave ratings | Review surface supports service-quality follow-up | [✅ 100% Built] |
| Guardian Profile Page | §5.13 | `/guardian/profile` | Manage household and personal account details | Edit profile; review personal settings | Household identity management remains distinct from general settings | [✅ 100% Built] |
| Family Hub Page | §5.14 | `/guardian/family-hub` | Coordinate family-side care visibility | Review family updates; coordinate care context | Collaborative family-oriented function is clear | [✅ 100% Built] |
| Agency Public Profile Page | §17.3.1 | `/guardian/agency/:id` | Let guardians review one agency before submitting a requirement | Review agency; inspect services; submit care requirement | Agency value, caregiver roster preview, and CTA path all remain visible | [✅ 100% Built] |
| Care Requirements List Page | §17.3.2 | `/guardian/care-requirements` | Track requirement lifecycle from draft to completion | Filter requirements; open detail; edit or submit draft | Requirement state machine is legible from the list view | [✅ 100% Built] |
| Care Requirement Wizard | §17.3.3 | `/guardian/care-requirement-wizard` | Capture a new care requirement for an agency | Select agency; select patient; define needs; set budget; submit | Multi-step requirement flow replaces the old booking logic completely | [✅ 100% Built] |
| Care Requirement Detail Page | §17.3.4 | `/guardian/care-requirement/:id` | Show one requirement, its status, and agency response | Review timeline; inspect proposal; message agency; accept or request changes | Detail view exposes status timeline, proposal response, and placement handoff | [✅ 100% Built] |
| Guardian Placements List Page | §17.3.5 | `/guardian/placements` | Let guardians monitor active service contracts | Filter placements; open detail; message agency | Placement list clearly separates active/upcoming/completed service contracts | [✅ 100% Built] |
| Guardian Placement Detail Page | §17.3.6 | `/guardian/placement/:id` | Give guardians shift-level visibility into live care delivery | Review rotation timeline; inspect shifts and logs; request changes | Placement detail proves the multi-caregiver rotation model | [✅ 100% Built] |

### 5.5 Patient Module [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Patient Dashboard | §6.1 | `/patient/dashboard` | Give patients a personal health and care overview | Review status; jump to care-related pages | Dashboard summarizes patient-relevant health and care context | [✅ 100% Built] |
| Patient Profile Page | §6.2 | `/patient/profile` | Manage patient identity and profile details | Review or update patient info | Patient demographic context remains explicit | [✅ 100% Built] |
| Patient Care History Page | §6.3 | `/patient/care-history` | Show historical care activities and timeline | Review history entries | History page reads as a care-timeline surface rather than generic records | [✅ 100% Built] |
| Patient Medical Records Page | §6.4 | `/patient/medical-records` | Provide access to stored medical data | Review records; inspect documents/data | Medical record access is distinct from general health summaries | [✅ 100% Built] |
| Patient Health Report Page | §6.5 | `/patient/health-report` | Summarize health status in report form | Review health report | Summary/report intent is visible and separate from live tracking | [✅ 100% Built] |
| Vitals Tracking Page | §6.6 | `/patient/vitals` | Show ongoing vital-sign tracking | Review vitals and trends | Vitals remain a trend-oriented monitoring page | [✅ 100% Built] |
| Medication Reminders Page | §6.7 | `/patient/medications` | Support medication schedule visibility | Review reminders; inspect medication schedule | Medication timing and reminder purpose remain explicit | [✅ 100% Built] |
| Emergency Hub Page | §6.8 | `/patient/emergency` | Give patients quick access to emergency support functions | Review emergency options; trigger support path | Emergency intent is immediate and unmistakable | [✅ 100% Built] |
| Data Privacy Manager Page | §6.9 | `/patient/data-privacy` | Let patients inspect privacy and consent controls | Review privacy settings; manage data controls | Privacy management remains explicit and patient-controlled | [✅ 100% Built] |

### 5.6 Agency Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Agency Dashboard | §7.1 | `/agency/dashboard` | Give agencies an operating overview across staff, clients, and placements | Review KPIs; open core work areas | Dashboard acts as an operating hub rather than a static summary | [✅ 100% Built] |
| Agency Caregivers Page | §7.2 | `/agency/caregivers` | Manage caregiver roster and workforce state | Review roster; open caregiver records | Roster-management function is clear | [✅ 100% Built] |
| Agency Clients Page | §7.3 | `/agency/clients` | Manage active and prospective clients | Review clients; open client records | Client portfolio and status remain explicit | [✅ 100% Built] |
| Client Intake Page | §7.4 | `/agency/client-intake` | Capture new client onboarding information | Create client intake; submit data | Intake behavior is distinct from general client browsing | [✅ 100% Built] |
| Client Care Plan Page | §7.5 | `/agency/care-plan/:id` | View or edit the agency-managed care plan | Review or update plan | Care plan ownership clearly sits with the agency | [✅ 100% Built] |
| Agency Payments Page | §7.6 | `/agency/payments` | Operate billing and payment collection | Review payment states; inspect billing | Agency billing role remains visible | [✅ 100% Built] |
| Agency Reports Page | §7.7 | `/agency/reports` | Review operating and financial reports | Open reports; inspect metrics | Reporting is a distinct analytic surface | [✅ 100% Built] |
| Agency Storefront Page | §7.8 | `/agency/storefront` | Present the agency publicly on-platform | Review storefront view; maintain presentation | Public-facing agency representation remains clear | [✅ 100% Built] |
| Branch Management Page | §7.9 | `/agency/branches` | Manage multi-branch organization structure | Review branches; manage branch data | Multi-branch operational model is explicit | [✅ 100% Built] |
| Staff Attendance Page | §7.10 | `/agency/attendance` | Track workforce attendance | Review attendance; inspect status | Attendance is treated as an operational workforce surface | [✅ 100% Built] |
| Staff Hiring Page | §7.11 | `/agency/hiring` | Support internal recruitment activity | Review hiring status; manage recruitment | Hiring remains separate from client/placement operations | [✅ 100% Built] |
| Incident Report Wizard Page | §7.12 | `/agency/incident-report` | Capture incidents tied to care delivery | Create incident; submit report | Incident creation workflow is explicit even if list management is still separate | [✅ 100% Built] |
| Agency Requirements Inbox | §17.3.7 | `/agency/requirements-inbox` | Receive and triage guardian care requirements | Filter inbox; review requirement; message guardian | Inbox acts as the front door to the agency-mediated workflow | [✅ 100% Built] |
| Requirement Review & Proposal Page | §17.3.8 | `/agency/requirement-review/:id` | Build agency response and proposal | Review requirement; build proposal; request more info | Proposal-building and requirement assessment are clearly supported | [✅ 100% Built] |
| Agency Placements Management Page | §17.3.9 | `/agency/placements` | Manage live and planned placements | Filter placements; open detail; create/manage placement actions | Placement portfolio remains operational and action-driven | [✅ 100% Built] |
| Agency Placement Detail & Shift Planner | §17.3.10 | `/agency/placement/:id` | Run one placement including staffing and shift planning | Plan shifts; assign caregivers; review quality indicators | Placement detail proves staffing, schedule, and care-quality oversight | [✅ 100% Built] |
| Agency Shift Monitoring Dashboard | §17.3.13 | `/agency/shift-monitoring` | Provide real-time oversight across active shifts | Review live shifts; inspect alerts; assign replacement | Live-monitoring intent is obvious through status and alert surfaces | [✅ 100% Built] |
| Agency Job Management Page | §18.2.2 | `/agency/job-management` | Run agency-posted jobs generated from requirements | Create/manage jobs; inspect status; open applications | Job state machine is visible and tied to agency workflow | [✅ 100% Built] |
| Agency Job Applications Review Page | §18.2.3 | `/agency/jobs/:id/applications` | Review applications, schedule interviews, and send offers | Review candidates; schedule interview; send offer | Application pipeline clearly supports hiring-state progression | [✅ 100% Built] |
| Agency Payroll & Payout Page | §18.2.4 | `/agency/payroll` | Manage agency-to-caregiver payout handling | Review payroll; process payouts; export report | Guardian-to-agency-to-caregiver payment logic remains visible | [✅ 100% Built] |

### 5.7 Admin Module [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Admin Dashboard | §8.1 | `/admin/dashboard` | Give admins a platform-wide command overview | Review metrics; open major governance surfaces | Dashboard orients admin users across compliance and operations | [✅ 100% Built] |
| Admin Users Page | §8.2 | `/admin/users` | Manage platform users | Browse users; inspect user states | User directory and management purpose remain explicit | [✅ 100% Built] |
| Admin Verifications Page | §8.3 | `/admin/verifications` | Process verification workload | Review queue; open cases | Verification queue is clear and actionable | [✅ 100% Built] |
| Verification Case Page | §8.4 | `/admin/verification-case/:id` | Resolve one verification case | Review case; decide outcome | Case detail supports decision-making, not just record viewing | [✅ 100% Built] |
| Admin Reports Page | §8.5 | `/admin/reports` | Review platform-wide reports | Open reports; inspect metrics | Reports page is distinct from dashboard summary content | [✅ 100% Built] |
| Dispute Adjudication Page | §8.6 | `/admin/disputes` | Resolve disputes across the platform | Review disputes; adjudicate | Dispute-resolution role is explicit | [✅ 100% Built] |
| Admin Payments Page | §8.7 | `/admin/payments` | Oversee platform-level financial movement | Review payment flows; inspect statuses | Payment oversight is platform-level, not agency-local | [✅ 100% Built] |
| Financial Audit Page | §8.8 | `/admin/financial-audit` | Inspect financial evidence and audit posture | Review financial audit details | Audit framing remains formal and review-oriented | [✅ 100% Built] |
| Admin Settings Page | §8.9 | `/admin/settings` | Configure platform controls | Review or change settings | Settings purpose is administrative rather than personal | [✅ 100% Built] |
| Policy Manager Page | §8.10 | `/admin/policy` | Maintain operational and compliance policies | Review/edit policies | Policy ownership is explicit and controlled | [✅ 100% Built] |
| Promo Management Page | §8.11 | `/admin/promos` | Manage promotions and campaigns | Review/create promotions | Promotional controls remain discrete | [✅ 100% Built] |
| CMS Manager Page | §8.12 | `/admin/cms` | Manage structured content | Review/edit content | CMS surface is content-management-specific | [✅ 100% Built] |
| Support Ticket Detail Page | §8.13 | `/admin/support-ticket/:id` | Resolve one support issue in detail | Review ticket; inspect status | Detail page clearly supports case handling | [✅ 100% Built] |
| Audit Logs Page | §8.14 | `/admin/audit-logs` | Review evidence of platform activity | Filter logs; inspect entries | Audit evidence remains a first-class admin surface | [✅ 100% Built] |
| System Health Page | §8.15 | `/admin/system-health` | Review operational platform health | Inspect services; review alerts/status | Health page communicates real operating status rather than generic metrics | [✅ 100% Built] |
| User Inspector Page | §8.16 | `/admin/user-inspector` | Inspect one user deeply for support/compliance needs | Search user; inspect account context | Deep inspection posture remains explicit | [✅ 100% Built] |
| Sitemap Page | §8.17 | `/admin/sitemap` | Provide route/content map visibility | Review route map | Sitemap is a readable structural/admin tool | [✅ 100% Built] |
| Admin Placement Monitoring Page | §18.2.5 | `/admin/placement-monitoring` | Monitor placements platform-wide | Filter placements; inspect alerts and compliance | Admin oversight extends beyond agency-level placement views | [✅ 100% Built] |
| Admin Agency Approvals Page | §18.2.6 | `/admin/agency-approvals` | Approve, reject, or suspend agencies | Review application; approve/request info/reject | Approval workflow and document review are explicit | [✅ 100% Built] |

### 5.8 Moderator Module [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Moderator Dashboard | §9.1 | `/moderator/dashboard` | Give moderators a queue and KPI overview | Review moderation workload | Dashboard clearly orients moderation work | [✅ 100% Built] |
| Moderator Reviews Page | §9.2 | `/moderator/reviews` | Moderate user reviews | Review flagged content; take moderation action | Reviews queue is distinct and moderation-focused | [✅ 100% Built] |
| Moderator Reports Page | §9.3 | `/moderator/reports` | Handle reported abuse or issues | Inspect reports; process actions | Abuse/report handling purpose is clear | [✅ 100% Built] |
| Moderator Content Page | §9.4 | `/moderator/content` | Moderate general platform content | Review content; take moderation action | Content moderation control remains explicit | [✅ 100% Built] |

### 5.9 Shop Merchant Module [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Shop Dashboard | §10.1 | `/shop/dashboard` | Give merchants an operating overview | Review KPIs; open core commerce functions | Merchant dashboard orients around commerce operations | [✅ 100% Built] |
| Shop Products Page | §10.2 | `/shop/products` | Manage product catalog | Review products; open edit/create actions | Catalog-management function is explicit | [✅ 100% Built] |
| Product Editor Page | §10.3 | `/shop/product-editor` | Create or edit a product record | Add/edit product data | Editor intent is specific and task-oriented | [✅ 100% Built] |
| Shop Orders Page | §10.4 | `/shop/orders` | Operate merchant order workflow | Review orders; inspect fulfillment state | Order-management role is clear | [✅ 100% Built] |
| Shop Inventory Page | §10.5 | `/shop/inventory` | Track stock and inventory state | Review stock; inspect inventory data | Inventory remains distinct from product catalog editing | [✅ 100% Built] |
| Shop Analytics Page | §10.6 | `/shop/analytics` | Review commerce performance | Inspect analytics | Analytic posture is explicit and not merged into dashboard summary | [✅ 100% Built] |
| Merchant Onboarding Page | §10.7 | `/shop/onboarding` | Onboard a merchant into the shop system | Review onboarding steps; submit setup info | Onboarding path remains clearly staged | [✅ 100% Built] |
| Merchant Analytics Page | §10.8 | `/shop/merchant-analytics` | Provide deeper merchant performance insight | Review advanced analytics | Advanced reporting remains separate from basic analytics | [✅ 100% Built] |
| Merchant Fulfillment Page | §10.9 | `/shop/fulfillment` | Manage dispatch and delivery operations | Review fulfillment work; update status | Fulfillment action posture remains explicit | [✅ 100% Built] |

### 5.10 Shop Front Module [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Product List Page | §11.1 | `/shop` | Let customers browse the storefront | Browse catalog; filter or inspect products | Storefront browsing is product-led and legible | [✅ 100% Built] |
| Product Details Page | §11.2 | `/shop/product/:id` | Show one product before purchase | Review product details; continue toward purchase | Detail view supports buying decisions | [✅ 100% Built] |
| Product Category Page | §11.3 | `/shop/category/:category` | Browse category-specific product sets | Review category products | Category context remains explicit | [✅ 100% Built] |
| Product Reviews Page | §11.4 | `/shop/product/:id/reviews` | Review customer sentiment on one product | Read reviews | Review content is visibly associated with a product | [✅ 100% Built] |
| Cart Page | §11.5 | `/shop/cart` | Manage items before checkout | Review cart; adjust purchase intent | Cart remains a pre-checkout holding surface | [✅ 100% Built] |
| Checkout Page | §11.6 | `/shop/checkout` | Complete a purchase | Enter checkout data; place order | Checkout is clearly completion-oriented | [✅ 100% Built] |
| Order Success Page | §11.7 | `/shop/order-success` | Confirm successful order placement | Review success state; continue | Success messaging is unmistakable | [✅ 100% Built] |
| Order Tracking Page | §11.8 | `/shop/order-tracking/:id` | Show delivery/progress state for one order | Review order status | Tracking remains order-specific and status-led | [✅ 100% Built] |
| Customer Order History Page | §11.9 | `/shop/order-history` | Let customers review prior purchases | Browse previous orders | History remains distinct from live tracking | [✅ 100% Built] |
| Wishlist Page | §11.10 | `/shop/wishlist` | Save products for later consideration | Review saved items; continue shopping | Wishlist intent remains explicit and customer-facing | [✅ 100% Built] |

### 5.11 Community Module [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Blog List Page | §12.1 | `/community/blog` | Publish editorial content list | Browse articles | Editorial list behavior remains obvious | [✅ 100% Built] |
| Blog Detail Page | §12.2 | `/community/blog/:id` | Present one editorial article | Read article | Article detail is readable and content-first | [✅ 100% Built] |
| Career Page | §12.3 | `/community/careers` | Present recruitment content | Review career information | Career-purpose messaging remains clear | [✅ 100% Built] |

### 5.12 Support and Utility Pages [✅ 100% Built] [🟠 Medium]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Help Center Page | §13.1 | `/support/help` | Provide support knowledge and entry | Browse help content | Help-center intent is explicit | [✅ 100% Built] |
| Contact Us Page | §13.2 | `/support/contact` | Offer support contact entry | Submit inquiry; inspect contact details | Contact purpose remains obvious and accessible | [✅ 100% Built] |
| Ticket Submission Page | §13.3 | `/support/ticket` | Let users submit structured support requests | Complete ticket form; submit | Ticket entry is discrete and action-led | [✅ 100% Built] |
| Refund Request Page | §13.4 | `/support/refund` | Let users request refund resolution | Submit refund request | Refund workflow remains identifiable and specific | [✅ 100% Built] |
| 404 Not Found Page | §14.1 | `*` | Handle unmatched routes gracefully | Recover navigation; return to valid area | Error state remains helpful rather than blank or broken | [✅ 100% Built] |

### 5.13 Section 18 Public Agency Directory [✅ 100% Built] [🔴 High]

| Page | Source | Canonical Route | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Public Agency Directory | §18.2.1 | `/agencies` | Let public users browse agencies directly | Search/filter agencies; open profile; start requirement path | Public agency-browse layer is clearly present and guardian-relevant | [✅ 100% Built] |

## 6. Correction and Addition Layer [✅ 100% Built] [🔴 High]
Sections 17 and 18 change the review standard for the wireframe corpus rather than simply adding more pages.

| Layer | Source Position | Design Review Meaning |
|---|---|---|
| Architectural corrections | §17.2 | Guardian and caregiver pages must reflect agency-mediated care, not direct caregiver hiring |
| New architecture-required pages | §17.3 | Requirement, placement, and shift-monitoring surfaces are mandatory to complete the operating model |
| Compliance/spec additions | §18.2 | Public, agency, and admin surfaces must include the missing spec-defined pages |
| Messaging constraints | §17.4 | Messaging permissions are stage-based and must be visibly respected in page behavior |
| Canonical route reset | §17.5 and §18.3 | Later corrected routes override legacy direct-booking language and route names |

Related reading: → D004, → D006, → D009 §2, and → D013 §6.

## 7. Proposed v2.0 Wireframes [❌ Not Built – v2.0] [🔴 High]
Section 15 remains outside the 141-page built core. These wireframes are preserved here in the same review format so the suite contains both current-state and future-state wireframe scope.

| Proposed Page | Source | Route Family | Purpose | Primary User Actions | Acceptance Notes | Status |
|---|---|---|---|---|---|---|
| Daily Care Log / Care Diary | §15.1 | `/patient/care-log`, `/guardian/care-log` | Give patients and guardians consolidated care-log visibility | Review daily care entries; inspect care narrative | Future page must expose consolidated viewing beyond caregiver-only logging | [❌ Not Built – v2.0] |
| Patient Care Plan (Patient View) | §15.2 | `/patient/care-plan` | Let patients see their own care plan | Review care plan | Future page must expose patient-side plan visibility, not only agency-side editing | [❌ Not Built – v2.0] |
| Smart Health Alerts / Alert Rules | §15.3 | `/guardian/alerts`, `/patient/alerts` | Surface automated health thresholds and alerts | Review alerts; inspect rule triggers | Future page must go beyond manual reminders into rule-based alerting | [❌ Not Built – v2.0] |
| Caregiver Live Tracking | §15.4 | `/guardian/live-tracking` | Show live caregiver location and ETA | Monitor live progress | Future page must deliver actual tracking visibility, not only scheduled shift status | [❌ Not Built – v2.0] |
| Care Transition / Shift Handoff | §15.5 | `/caregiver/handoff` | Formalize handoff between caregivers or shifts | Review and record handoff | Future page must explicitly reduce handoff risk and preserve care continuity | [❌ Not Built – v2.0] |
| Symptom & Pain Journal | §15.6 | `/patient/symptoms` | Track subjective symptom history | Log/review symptoms | Future page must support recurring symptom and pain context | [❌ Not Built – v2.0] |
| Wound / Photo Journal | §15.7 | `/patient/photo-journal` | Track visual progression of patient conditions | Upload/review photo history | Future page must support timeline-style visual documentation | [❌ Not Built – v2.0] |
| Guardian Live Dashboard | §15.8 | `/guardian/live-monitor` | Give guardians a real-time monitoring view | Review live status | Future page must move beyond historical summary into real-time situational awareness | [❌ Not Built – v2.0] |
| Care Quality Scorecard | §15.9 | `/guardian/care-scorecard` | Summarize care quality metrics | Review quality indicators | Future page must aggregate service quality, not only anecdotal feedback | [❌ Not Built – v2.0] |
| Telehealth / Video Consultation | §15.10 | `/patient/telehealth` | Support remote care consultation | Start/review consultation flow | Future page must make telehealth a distinct care channel | [❌ Not Built – v2.0] |
| Nutrition & Diet Tracker | §15.12 | `/patient/nutrition` | Track nutrition and hydration compliance | Log/review intake | Future page must support ongoing nutrition tracking rather than static intake notes | [❌ Not Built – v2.0] |
| Rehabilitation / Exercise Tracker | §15.13 | `/patient/rehab` | Track rehab plan adherence | Review or log exercise progress | Future page must support regimen tracking and completion visibility | [❌ Not Built – v2.0] |
| Family Communication Board | §15.14 | `/guardian/family-board` | Provide shared family coordination space | Post/review family updates | Future page must go beyond 1:1 messaging into shared communication | [❌ Not Built – v2.0] |
| Insurance & Coverage Tracker | §15.15 | `/patient/insurance` | Track coverage and claims context | Review policy/claim state | Future page must expose insurance workflow data, not just billing totals | [❌ Not Built – v2.0] |

Related reading: → D009 and → D010.

## 8. Final Appendix Position [✅ 100% Built] [🔴 High]
This appendix now serves as the design-review version of the wireframe layer.

1. The master planning suite now contains a direct page-by-page wireframe appendix in review-ready format.
2. Every preserved page now states purpose, primary user actions, and acceptance-oriented notes.
3. Section 17 and Section 18 corrections are carried forward into the official planning set.
4. Section 15 proposed v2.0 wireframes remain explicitly separated from live core scope.
5. D007 remains the structural frontend plan, D013 remains the route-audit appendix, and this appendix is the design-review wireframe layer between them.
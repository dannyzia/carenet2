# CareNet Master Planning Suite - v1.1 -> v2.0

## 1. Suite Overview [✅ 100% Built] [🔴 High]
This index is the executive cover, navigation sheet, and export handoff page for the CareNet Master Planning Suite.

### Source Rule
- The suite is derived only from the two provided source documents:
  - `DO_NOT_COMMIT/Instructions/WIREFRAMES.md`
  - `DO_NOT_COMMIT/Instructions/System Architecture & Engineering Specification.md`

### Consistency Rule
- When route names differ between architectural narrative sections and the final build audit, the suite uses the Section 21 build-audit route names as the canonical frontend naming baseline.

## 2. Document Index [✅ 100% Built] [🔴 High]

| ID | Document | Purpose |
|---|---|---|
| D001 | [D001 - Executive Overview & Current Reality Check](D001%20-%20Executive%20Overview%20%26%20Current%20Reality%20Check.md) | Platform reality, built-vs-gap status, module confidence |
| D002 | [D002 - Global Navigation, Layouts & Role System](D002%20-%20Global%20Navigation,%20Layouts%20%26%20Role%20System.md) | Shared shell, navigation, role color system, sidebar and mobile variants |
| D003 | [D003 - Roles, RBAC & Organization Model](D003%20-%20Roles,%20RBAC%20%26%20Organization%20Model.md) | Role taxonomy, organization hierarchy, permission and ownership rules |
| D004 | [D004 - Core Business Workflows & State Machines](D004%20-%20Core%20Business%20Workflows%20%26%20State%20Machines.md) | Agency-mediated workflows and state models |
| D005 | [D005 - Master Data Model & Critical Tables](D005%20-%20Master%20Data%20Model%20%26%20Critical%20Tables.md) | Condensed data model, ownership, scaling notes |
| D006 | [D006 - API & Backend Service Outline](D006%20-%20API%20%26%20Backend%20Service%20Outline.md) | Service boundaries, priority APIs, Kafka topics |
| D007 | [D007 - Frontend Architecture & Page Tree](D007%20-%20Frontend%20Architecture%20%26%20Page%20Tree.md) | Shared components, route tree, page inventory, page status |
| D008 | [D008 - Mobile Architecture & Deployment Strategy](D008%20-%20Mobile%20Architecture%20%26%20Deployment%20Strategy.md) | Capacitor strategy, mobile patterns, plugin stack, rollout path |
| D009 | [D009 - Gap Analysis + v2.0 Roadmap (Prioritized)](D009%20-%20Gap%20Analysis%20%2B%20v2.0%20Roadmap%20(Prioritized).md) | Remaining backlog, epics, sequencing, AI extensions |

## 2A. Supplemental Delivery Artifacts [✅ 100% Built] [🟠 Medium]

| ID | Document | Purpose |
|---|---|---|
| D010 | [D010 - Delivery Plan Conversion (Sprint-Ready Workstreams)](D010%20-%20Delivery%20Plan%20Conversion%20(Sprint-Ready%20Workstreams).md) | Converts D009 epics into execution workstreams with entry gates, delivery tracks, and completion gates |

## 2B. Supplemental Planning Addenda [✅ 100% Built] [🟠 Medium]

| ID | Document | Purpose |
|---|---|---|
| D011 | [D011 - Security, Compliance & Non-Functional Requirements](D011%20-%20Security,%20Compliance%20%26%20Non-Functional%20Requirements.md) | Captures the source-defined security, audit, retention, uptime, and scalability requirements that were previously only summarized |
| D012 | [D012 - Design System & UI Standards Addendum](D012%20-%20Design%20System%20%26%20UI%20Standards%20Addendum.md) | Captures the explicit design tokens, card styles, badge styles, and breakpoint rules from the wireframe corpus |
| D013 | [D013 - Route Inventory & Build Audit Appendix](D013%20-%20Route%20Inventory%20%26%20Build%20Audit%20Appendix.md) | Captures the full route and module inventory plus Section 21 build-audit summary in appendix form |
| D014 | [D014 - Operations Runbook Addendum](D014%20-%20Operations%20Runbook%20Addendum.md) | Captures the source-defined operational watch surfaces, health indicators, event-driven escalation paths, and runbook constraints |
| D015 | [D015 - Page-by-Page Wireframe Appendix](D015%20-%20Page-by-Page%20Wireframe%20Appendix.md) | Preserves the source wireframe inventory page by page, including the Section 17 and Section 18 correction/addition layer |

## 2C. Operational Reality Addenda [✅ 100% Built] [🔴 High]

| ID | Document | Purpose |
|---|---|---|
| D016 | [D016 - Offline Strategy & Data Sync](D016%20-%20Offline%20Strategy%20%26%20Data%20Sync.md) | Defines offline tiers, sync queue, conflict resolution, and data budgets for Bangladesh network conditions |
| D017 | [D017 - Localization & Bangla Language Strategy](D017%20-%20Localization%20%26%20Bangla%20Language%20Strategy.md) | Defines i18n framework, Bangla typography, number/date/currency formatting, and translation workflow |
| D018 | [D018 - Authentication & Session Flows](D018%20-%20Authentication%20%26%20Session%20Flows.md) | Defines phone+OTP auth, biometric login, multi-role accounts, session management, and Bangladesh phone validation |
| D019 | [D019 - Bangladesh Payment Integration](D019%20-%20Bangladesh%20Payment%20Integration.md) | Defines bKash/Nagad/Rocket integration, SSLCommerz gateway, payment flows, refunds, and tax handling |
| D020 | [D020 - Testing & Quality Strategy](D020%20-%20Testing%20%26%20Quality%20Strategy.md) | Defines testing pyramid, critical E2E flows, device matrix, performance budgets, accessibility, and quality gates |
| D021 | [D021 - Push Notification Design](D021%20-%20Push%20Notification%20Design.md) | Defines notification channels, event-to-notification mapping, FCM integration, user preferences, and bilingual payloads |

## 3. Recommended Reading Order [✅ 100% Built] [🟠 Medium]

| Order | Document | Reason |
|---|---|---|
| 1 | D001 | Establishes current platform reality |
| 2 | D002 | Defines the shell and navigation model |
| 3 | D003 | Defines roles, RBAC, and ownership |
| 4 | D004 | Defines operational workflows and state machines |
| 5 | D005 | Defines the core data model |
| 6 | D006 | Defines backend boundaries and API/event model |
| 7 | D007 | Maps the frontend to the documented module tree |
| 8 | D008 | Defines mobile delivery strategy |
| 9 | D009 | Converts remaining gaps into a roadmap |
| 10 | D011 | Captures platform-level operational requirements |
| 11 | D012 | Preserves the visual system used across modules |
| 12 | D013 | Provides a route-level audit appendix for QA and handoff |
| 13 | D014 | Captures the planning-baseline operating model for support, incidents, and platform health |
| 14 | D015 | Provides the direct page-by-page wireframe appendix for product, UX, QA, and frontend handoff |
| 15 | D016 | Defines offline architecture critical for Bangladesh deployment |
| 16 | D017 | Defines Bangla language strategy and i18n framework |
| 17 | D018 | Defines authentication flows for Bangladesh market |
| 18 | D019 | Defines payment integration with Bangladesh MFS providers |
| 19 | D020 | Defines testing strategy and quality gates |
| 20 | D021 | Defines push notification architecture |

## 3A. Supplement Map [✅ 100% Built] [🟠 Medium]

| Document | Read This When |
|---|---|
| D010 | You are converting D009 roadmap epics into execution-ready workstreams or backlog structure |
| D011 | You need the platform security, audit, retention, uptime, and scale requirements in one place |
| D012 | You need the source-defined visual system, tokens, card patterns, status colors, or breakpoint rules |
| D013 | You need route-by-route audit evidence, build-status appendix detail, or QA handoff support |
| D014 | You need the planning-baseline operating model for health monitoring, incidents, evidence review, and event-driven operations |
| D015 | You need the page-by-page wireframe layer itself included in the suite rather than only summarized through frontend and audit documents |
| D016 | You are implementing offline features, sync logic, or need to understand which pages work without connectivity |
| D017 | You are implementing localization, adding Bangla translations, or need typography and formatting guidance |
| D018 | You are implementing login, registration, OTP, biometric auth, or session management |
| D019 | You are implementing payments, invoicing, refunds, or integrating with bKash/Nagad/SSLCommerz |
| D020 | You are setting up testing infrastructure, defining QA gates, or planning device testing |
| D021 | You are implementing push notifications, FCM integration, or notification preference management |

## 4. Export Handoff Notes [✅ 100% Built] [🟠 Medium]

| Item | Handoff Guidance |
|---|---|
| Document order | Export in D001 -> D009 order, with this index first |
| Supplemental artifact | Include D010 after D009 when delivery planning is required |
| Supplemental addenda | Include D011-D015 when compliance, UX governance, QA handoff, operations planning depth, or direct wireframe review is required |
| Operational reality addenda | Include D016-D021 when implementing Bangladesh-specific features: offline, localization, auth, payments, testing, and notifications |
| Version naming | Present as `CareNet Master Planning Suite - v1.1 -> v2.0` |
| Cross-references | Keep `-> D0xx §y` format intact for internal navigation |
| Canonical naming | Use the current document titles and Section 21 route names |
| Scope boundary | D001-D015 are derived from the original source corpus; D016-D021 extend the suite with operational reality requirements for Bangladesh deployment |

## 5. Final Handoff Status [✅ 100% Built] [🔴 High]
The suite now includes:

1. Nine core planning documents (D001-D009) in the requested order.
2. A supplemental delivery-plan conversion (D010) for execution planning.
3. Five supplemental planning addenda (D011-D015) for compliance, UI standards, route audit, operations, and wireframes.
4. Six operational reality addenda (D016-D021) covering offline strategy, Bangla localization, authentication, Bangladesh payments, testing, and push notifications.
5. A consistent cross-reference convention using `-> D0xx §y` format.
6. Aligned route naming based on the build audit where route names drifted in earlier narrative sections.
7. A single index page suitable for export, review circulation, and executive handoff.

### 5.1 Amended Documents [✅ 100% Built] [🟠 Medium]
The following existing documents received amendments as part of the D016-D021 addition:

| Document | Amendment | Reason |
|---|---|---|
| D002 §6.3 | Added BottomNav variants for Patient, Moderator, Shop Merchant, Shop Customer | Resolved mobile navigation gap for all 8 roles |
| D004 §8 | Added formal care-log lifecycle state machine (Draft -> PendingSync -> Submitted -> Acknowledged -> Amended -> Locked) | Resolved the only missing workflow state machine; connects to D016 offline and D011 compliance |
| D008 §12 | Added Capacitor implementation specifics: config, WebView compat, back-button, deep linking, update strategy, status bar theming | Bridged gap between plugin list and implementation-ready specification |
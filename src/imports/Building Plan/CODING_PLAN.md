# CareNet Detailed Coding Plan

## Project Folder Structure

### Constraint
`/src/app/App.tsx` must remain the entry point with a default export. `/src/app/components/figma/ImageWithFallback.tsx` is protected. Everything else can be reorganized.

### Target Structure: Frontend / Backend Separation

```
/src/
│
├── app/                              # ── ENTRY POINT ──
│   ├── App.tsx                       # Root component (ThemeProvider + AuthProvider + RouterProvider)
│   └── routes.ts                     # Route definitions with nested layout branches
│
├── frontend/                         # ── ALL UI / PRESENTATION CODE ──
│   │
│   ├── components/
│   │   ├── figma/                    # Protected (ImageWithFallback.tsx)
│   │   ├── ui/                       # shadcn/ui primitives (button, card, dialog, etc.)
│   │   │
│   │   ├── shell/                    # Layout shells
│   │   │   ├── RootLayout.tsx        # Bare wrapper: ThemeProvider + Outlet
│   │   │   ├── PublicLayout.tsx      # PublicNavBar + Footer + Outlet
│   │   │   ├── AuthenticatedLayout.tsx  # Sidebar (desktop) + MobileHeader + BottomNav + Outlet
│   │   │   └── ShopFrontLayout.tsx   # Shop customer layout variant
│   │   │
│   │   ├── navigation/              # Navigation components
│   │   │   ├── PublicNavBar.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Sidebar.tsx           # Extracted from current Layout.tsx
│   │   │   └── MobileHeader.tsx      # NEW: Sticky 56px header for mobile role pages
│   │   │
│   │   ├── mobile/                   # Mobile-specific interaction components
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── SwipeableCard.tsx
│   │   │   ├── PullToRefresh.tsx
│   │   │   ├── StickySubmit.tsx
│   │   │   └── ResponsiveTable.tsx   # Table on desktop, card list on mobile
│   │   │
│   │   ├── shared/                   # Cross-cutting UI components
│   │   │   ├── OfflineIndicator.tsx
│   │   │   ├── LanguageSwitcher.tsx
│   │   │   ├── NotificationPermissionPrompt.tsx
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── PageSkeleton.tsx
│   │   │   ├── CardSkeleton.tsx
│   │   │   └── ThemeProvider.tsx
│   │   │
│   │   └── guards/                   # Route protection components
│   │       ├── ProtectedRoute.tsx
│   │       └── RoleGuard.tsx
│   │
│   ├── pages/                        # All 141 pages, organized by module
│   │   ├── public/                   # Home, About, Features, Pricing, Contact, Privacy, Terms
│   │   │   ├── HomePage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── FeaturesPage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── ContactPage.tsx
│   │   │   ├── PrivacyPage.tsx
│   │   │   ├── TermsPage.tsx
│   │   │   ├── MarketplacePage.tsx
│   │   │   ├── AgencyDirectoryPage.tsx
│   │   │   └── GlobalSearchPage.tsx
│   │   │
│   │   ├── auth/                     # Login, Register, OTP, MFA, ForgotPassword
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── RoleSelectionPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── MFASetupPage.tsx
│   │   │   ├── MFAVerifyPage.tsx
│   │   │   └── VerificationResultPage.tsx
│   │   │
│   │   ├── shared/                   # Authenticated shared pages (all roles)
│   │   │   ├── DashboardPage.tsx     # Role router — redirects to role-specific dashboard
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── NotificationsPage.tsx
│   │   │   └── MessagesPage.tsx
│   │   │
│   │   ├── caregiver/               # 20 pages
│   │   ├── guardian/                 # 20 pages
│   │   ├── agency/                   # 20 pages
│   │   ├── admin/                    # 19 pages
│   │   ├── patient/                  # 9 pages
│   │   ├── moderator/               # 4 pages
│   │   ├── shop/                     # 9 pages (merchant)
│   │   ├── shop-front/              # 10 pages (customer)
│   │   ├── community/               # 3 pages
│   │   └── support/                  # 4 pages
│   │
│   ├── hooks/                        # Custom React hooks (UI-focused)
│   │   ├── useMobile.ts             # Breakpoint detection (already exists in ui/)
│   │   ├── useScrollDirection.ts     # Hide/show header on scroll
│   │   └── usePageTitle.ts           # Document title per route
│   │
│   └── i18n/                         # Internationalization config
│       └── index.ts                  # i18next setup, language detection, namespace config
│
├── backend/                          # ── ALL DATA / BUSINESS LOGIC ──
│   │
│   ├── models/                       # TypeScript types and interfaces
│   │   ├── user.model.ts            # User, Role, AuthState
│   │   ├── placement.model.ts       # Placement, CareRequirement, Job, Application
│   │   ├── shift.model.ts           # Shift, ShiftStatus, CheckIn, CheckOut
│   │   ├── careLog.model.ts         # CareLog, CareLogType, CareLogStatus (per D004 §8.2)
│   │   ├── payment.model.ts         # Invoice, Payment, Payout, Refund (per D019 §9)
│   │   ├── notification.model.ts    # Notification, Channel, Preference (per D021 §5)
│   │   ├── agency.model.ts          # Agency, Branch, Staff
│   │   ├── patient.model.ts         # Patient, MedicalRecord, Vitals
│   │   └── index.ts                 # Barrel export
│   │
│   ├── services/                     # Business logic layer (framework-agnostic)
│   │   ├── auth.service.ts          # Login, register, OTP verify, token refresh, session mgmt
│   │   ├── careLog.service.ts       # CRUD + state transitions (Draft→Submitted→Locked per D004 §8)
│   │   ├── shift.service.ts         # Check-in, check-out, GPS capture, status transitions
│   │   ├── placement.service.ts     # Requirement→Job→Application→Placement lifecycle
│   │   ├── payment.service.ts       # Invoice, pay, refund, payout (per D019)
│   │   ├── notification.service.ts  # Preference CRUD, channel mapping (per D021)
│   │   ├── user.service.ts          # Profile CRUD, role management, verification
│   │   ├── agency.service.ts        # Agency ops, staff, requirements inbox
│   │   ├── shop.service.ts          # Products, orders, inventory, fulfillment
│   │   └── search.service.ts        # Caregiver search, agency search, global search
│   │
│   ├── api/                          # HTTP client and API integration
│   │   ├── client.ts                # Fetch/axios wrapper with auth headers, base URL, error handling
│   │   ├── interceptors.ts          # Token refresh interceptor, 401 handling, retry logic
│   │   ├── endpoints.ts             # API endpoint constants organized by service
│   │   └── mock/                    # Mock data for development (replaces inline mock data in pages)
│   │       ├── caregiverMocks.ts    # Caregiver jobs, shifts, earnings, schedule mock data
│   │       ├── guardianMocks.ts     # Guardian patients, requirements, placements mock data
│   │       ├── agencyMocks.ts       # Agency requirements, placements, caregivers mock data
│   │       ├── adminMocks.ts        # Admin users, verifications, reports mock data
│   │       ├── patientMocks.ts      # Patient records, vitals, medications mock data
│   │       ├── shopMocks.ts         # Products, orders, inventory mock data
│   │       ├── paymentMocks.ts      # Invoices, payouts, refunds mock data
│   │       └── index.ts             # Mock data barrel export
│   │
│   ├── store/                        # State management (React Context or Zustand)
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx       # Auth state provider: user, role, tokens
│   │   │   ├── authActions.ts       # Login, logout, switchRole, refreshToken
│   │   │   └── types.ts             # AuthState, LoginCredentials, OTPPayload
│   │   │
│   │   ├── app/
│   │   │   └── AppContext.tsx        # App-level state: language, notification prefs, connection status
│   │   │
│   │   └── index.ts                 # Combined provider export
│   │
│   └── offline/                      # Offline-first infrastructure (per D016)
│       ├── db.ts                     # Dexie IndexedDB schema: offline_actions, cached_entities
│       ├── syncEngine.ts            # Queue processor: priority, backoff, idempotency
│       ├── syncQueue.ts             # React hooks: useSyncQueue, useOfflineAction
│       └── useOnlineStatus.ts       # Online/offline detection hook
│
├── native/                           # ── CAPACITOR ABSTRACTION LAYER ──
│   ├── platform.ts                  # isNative(), isAndroid(), isIOS(), isWeb()
│   ├── camera.ts                    # Capacitor camera → web file input fallback
│   ├── geolocation.ts              # Capacitor GPS → navigator.geolocation fallback
│   ├── notifications.ts            # Capacitor push → web no-op fallback
│   ├── biometric.ts                # Capacitor biometric → hidden on web
│   ├── haptics.ts                  # Capacitor haptics → no-op on web
│   ├── backButton.ts              # Android back button handler (per D008 §12.3)
│   └── statusBar.ts               # Role-themed status bar color (per D008 §12.7)
│
├── locales/                          # ── TRANSLATION FILES (per D017) ──
│   ├── en/
│   │   ├── common.json              # Nav, buttons, statuses, errors
│   │   ├── auth.json
│   │   ├── caregiver.json
│   │   ├── guardian.json
│   │   ├── patient.json
│   │   ├── agency.json
│   │   ├── admin.json
│   │   ├── moderator.json
│   │   ├── shop.json
│   │   ├── community.json
│   │   └── support.json
│   └── bn/
│       ├── common.json              # বাংলা translations
│       └── ... (same structure)
│
├── theme/                            # ── DESIGN TOKENS ──
│   └── tokens.ts                    # Role colors, cn helpers, statusColors (moved from app/theme/)
│
├── styles/                           # ── CSS (stays as-is) ──
│   ├── fonts.css
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
│
└── imports/                          # ── PLANNING DOCS (stays as-is) ──
    ├── D000-D021 planning suite
    ├── CODING_PLAN.md
    └── ...
```

### Why This Structure Works for CareNet

| Principle | How It Applies |
|---|---|
| **frontend/ owns all rendering** | Pages, components, hooks, and i18n config — everything that touches the DOM lives here |
| **backend/ owns all data** | Models, services, API client, mock data, state management, offline sync — zero JSX in this folder |
| **native/ isolates platform code** | Capacitor plugins wrapped with web fallbacks; frontend imports from native/ without knowing if it's native or web |
| **locales/ is peer-level** | Translation JSON files are loaded by i18n config but aren't "frontend" or "backend" — they're content |
| **theme/ is peer-level** | Design tokens consumed by both frontend components and potentially backend (for notification channel colors, etc.) |
| **Services are framework-agnostic** | `backend/services/*.ts` contain pure business logic with no React imports — they can be unit tested independently |
| **Mock data is centralized** | Instead of 141 pages each defining inline mock data, `backend/api/mock/` provides a single source — pages import from services which use mocks in dev |

### Import Path Examples

```tsx
// From a page component:
import { useAuth } from '@/backend/store/auth/AuthContext';
import { placementService } from '@/backend/services/placement.service';
import { Placement } from '@/backend/models/placement.model';
import { BottomSheet } from '@/frontend/components/mobile/BottomSheet';
import { ResponsiveTable } from '@/frontend/components/mobile/ResponsiveTable';
import { formatCurrency } from '@/backend/services/formatters';

// From App.tsx:
import { AuthProvider } from '@/backend/store/auth/AuthContext';
import { AppProvider } from '@/backend/store/app/AppContext';
import { ThemeProvider } from '@/frontend/components/shared/ThemeProvider';

// From a service:
import { apiClient } from '@/backend/api/client';
import { User } from '@/backend/models/user.model';
// NO React imports here — services are pure TypeScript
```

### Migration Path from Current → Target

| Current Location | Target Location | Notes |
|---|---|---|
| `/src/app/App.tsx` | `/src/app/App.tsx` | **Stays** — entry point constraint |
| `/src/app/routes.ts` | `/src/app/routes.ts` | **Stays** — imports from new paths |
| `/src/app/components/ui/*` | `/src/frontend/components/ui/*` | Move shadcn components |
| `/src/app/components/figma/*` | `/src/frontend/components/figma/*` | Move (protected — don't edit content) |
| `/src/app/components/Layout.tsx` | Split into `shell/AuthenticatedLayout.tsx` + `navigation/Sidebar.tsx` | Decompose |
| `/src/app/components/RootLayout.tsx` | `/src/frontend/components/shell/RootLayout.tsx` | Move + simplify |
| `/src/app/components/PublicLayout.tsx` | `/src/frontend/components/shell/PublicLayout.tsx` | Move |
| `/src/app/components/PublicNavBar.tsx` | `/src/frontend/components/navigation/PublicNavBar.tsx` | Move |
| `/src/app/components/PublicFooter.tsx` | `/src/frontend/components/navigation/PublicFooter.tsx` | Move |
| `/src/app/components/BottomNav.tsx` | `/src/frontend/components/navigation/BottomNav.tsx` | Move |
| `/src/app/components/ThemeProvider.tsx` | `/src/frontend/components/shared/ThemeProvider.tsx` | Move |
| `/src/app/pages/HomePage.tsx` | `/src/frontend/pages/public/HomePage.tsx` | Move + reclassify |
| `/src/app/pages/LoginPage.tsx` | `/src/frontend/pages/auth/LoginPage.tsx` | Move |
| `/src/app/pages/caregiver/*` | `/src/frontend/pages/caregiver/*` | Move (20 files) |
| `/src/app/pages/guardian/*` | `/src/frontend/pages/guardian/*` | Move (20 files) |
| `/src/app/pages/agency/*` | `/src/frontend/pages/agency/*` | Move (20 files) |
| `/src/app/pages/admin/*` | `/src/frontend/pages/admin/*` | Move (19 files) |
| `/src/app/pages/patient/*` | `/src/frontend/pages/patient/*` | Move (9 files) |
| `/src/app/pages/moderator/*` | `/src/frontend/pages/moderator/*` | Move (4 files) |
| `/src/app/pages/shop/*` | `/src/frontend/pages/shop/*` | Move (9 files) |
| `/src/app/pages/shop-front/*` | `/src/frontend/pages/shop-front/*` | Move (10 files) |
| `/src/app/pages/community/*` | `/src/frontend/pages/community/*` | Move (3 files) |
| `/src/app/pages/support/*` | `/src/frontend/pages/support/*` | Move (4 files) |
| `/src/app/pages/DashboardPage.tsx` etc. | `/src/frontend/pages/shared/*` | Move shared auth pages |
| `/src/app/theme/tokens.ts` | `/src/theme/tokens.ts` | Move to peer-level |
| `/src/app/components/ui/use-mobile.ts` | `/src/frontend/hooks/useMobile.ts` | Move to hooks |
| Mock data inside each page | `/src/backend/api/mock/*` | Extract and centralize |
| (new) | `/src/backend/models/*` | New TypeScript interfaces |
| (new) | `/src/backend/services/*` | New service layer |
| (new) | `/src/backend/store/*` | New state management |
| (new) | `/src/backend/offline/*` | New offline infrastructure |
| (new) | `/src/native/*` | New Capacitor abstraction |
| (new) | `/src/locales/*` | New translation files |

---

## Current Codebase Baseline

| Item | Current State |
|---|---|
| Framework | React 19 + React Router (data mode) + Tailwind v4 + Vite |
| Pages | 141 pages built, all flat children of `RootLayout` in `routes.ts` |
| Routing | Flat route list — no nested layout routes; all under single `RootLayout` |
| Shell components | `RootLayout`, `PublicNavBar`, `Layout` (role sidebar), `BottomNav`, `PublicLayout` (exists but unused), `PublicFooter`, `ThemeProvider` |
| Design tokens | `/src/app/theme/tokens.ts` — 7 roles, `cn` semantic helpers, `roleConfig`, `statusColors` |
| CSS | `/src/styles/theme.css` — CSS custom properties, dark mode, Tailwind v4 `@theme inline` mapping |
| UI library | shadcn/ui full component set in `/src/app/components/ui/` |
| State management | None (all pages use local mock data) |
| i18n | None |
| Auth | None (pages render role UIs directly via URL path) |
| Offline | None |
| Testing | None |

### Critical Architecture Issue

`RootLayout` currently renders `PublicNavBar` and `BottomNav` on **every** route — including role pages like `/caregiver/dashboard` which already have their own sidebar via `<Layout>`. This means:
- Role pages show **both** PublicNavBar AND Layout's header (double navigation)
- BottomNav appears on all mobile pages regardless of context
- The `PublicLayout` component exists but is completely unused
- No route nesting separates public routes from authenticated routes

---

## Phase 0: Route Architecture & Shell Fix (PREREQUISITE)
**Priority: 🔴 CRITICAL — Do this first, everything else depends on it**
**Estimated scope: ~5 files changed**

**Note:** Phase 0 simultaneously performs the folder migration. Each file is moved to its target location in the `frontend/` or `backend/` tree as it is modified. Files that are only moved (no logic changes) are batched at the start of each sub-phase.

### 0.0 Folder migration — move existing files to new structure

This is a mechanical move operation. No logic changes. Done first so all subsequent work uses new paths.

| Batch | Files | From | To |
|---|---|---|---|
| shadcn/ui | ~47 files | `/src/app/components/ui/*` | `/src/frontend/components/ui/*` |
| figma | 1 file | `/src/app/components/figma/*` | `/src/frontend/components/figma/*` (protected — move only) |
| Theme tokens | 1 file | `/src/app/theme/tokens.ts` | `/src/theme/tokens.ts` |
| Public pages | 10 files | `/src/app/pages/HomePage.tsx`, `AboutPage.tsx`, etc. | `/src/frontend/pages/public/*` |
| Auth pages | 8 files | `/src/app/pages/LoginPage.tsx`, `auth/*` | `/src/frontend/pages/auth/*` |
| Shared auth pages | 4 files | `DashboardPage.tsx`, `SettingsPage.tsx`, `NotificationsPage.tsx`, `MessagesPage.tsx` | `/src/frontend/pages/shared/*` |
| Caregiver pages | 20 files | `/src/app/pages/caregiver/*` | `/src/frontend/pages/caregiver/*` |
| Guardian pages | 20 files | `/src/app/pages/guardian/*` | `/src/frontend/pages/guardian/*` |
| Agency pages | 20 files | `/src/app/pages/agency/*` | `/src/frontend/pages/agency/*` |
| Admin pages | 19 files | `/src/app/pages/admin/*` | `/src/frontend/pages/admin/*` |
| Patient pages | 9 files | `/src/app/pages/patient/*` | `/src/frontend/pages/patient/*` |
| Moderator pages | 4 files | `/src/app/pages/moderator/*` | `/src/frontend/pages/moderator/*` |
| Shop pages | 9 files | `/src/app/pages/shop/*` | `/src/frontend/pages/shop/*` |
| Shop-front pages | 10 files | `/src/app/pages/shop-front/*` | `/src/frontend/pages/shop-front/*` |
| Community pages | 3 files | `/src/app/pages/community/*` | `/src/frontend/pages/community/*` |
| Support pages | 4 files | `/src/app/pages/support/*` | `/src/frontend/pages/support/*` |
| Hook | 1 file | `/src/app/components/ui/use-mobile.ts` | `/src/frontend/hooks/useMobile.ts` |
| **Total** | **~190 files** | | |

After this batch move:
- Update `routes.ts` import paths to reference `@/frontend/pages/...`
- Update all inter-component imports (e.g., `import { Button } from "../components/ui/button"` → `import { Button } from "@/frontend/components/ui/button"`)
- Verify TypeScript path alias `@/` resolves to `/src/` in `tsconfig.json` / `vite.config.ts`

### 0.1 Restructure routes.ts with nested layout routes

**Current:** All 141 routes are flat children of `RootLayout`
**Target:** Two layout branches — public routes under `PublicLayout`, authenticated routes under `AuthenticatedLayout`

```
/ (no layout — just <Outlet>)
├── Public routes → PublicLayout (PublicNavBar + PublicFooter)
│   ├── / (HomePage)
│   ├── /about
│   ├── /features
│   ├── /pricing
│   ├── /contact
│   ├── /privacy, /terms
│   ├── /marketplace
│   ├── /global-search
│   ├── /agencies
│   ├── /community/*
│   ├── /support/*
│   └── /auth/*
│
├── Authenticated routes → AuthenticatedLayout (Layout sidebar + BottomNav)
│   ├── /dashboard (role router)
│   ├── /settings
│   ├── /notifications
│   ├── /messages
│   ├── /caregiver/*
│   ├── /guardian/*
│   ├── /patient/*
│   ├── /agency/*
│   ├── /admin/*
│   ├── /moderator/*
│   └── /shop/*
│
├── Shop Front routes → ShopFrontLayout (PublicNavBar + BottomNav for shop customer)
│   ├── /shop (product list)
│   ├── /shop/cart
│   ├── /shop/checkout
│   ├── /shop/order-*
│   ├── /shop/product/*
│   └── /shop/wishlist
│
└── * → NotFoundPage
```

**File changes:**

| File | Change |
|---|---|
| `/src/app/routes.ts` | Restructure into nested layout routes with 3 layout branches |
| `/src/app/components/RootLayout.tsx` | Simplify to just `<ThemeProvider><Outlet /></ThemeProvider>` — no nav bars |
| `/src/app/components/AuthenticatedLayout.tsx` | **NEW** — wraps `<Layout>` logic; hides sidebar on mobile, shows BottomNav |
| `/src/app/components/PublicLayout.tsx` | Already exists — wire into routes as public layout parent |

### 0.2 Fix Layout.tsx for mobile

**Current:** Layout sidebar is always rendered; uses `lg:hidden` / `lg:translate-x-0` to toggle. But the sidebar still occupies space on mobile and overlaps with BottomNav.

**Target:**
- Mobile (`<768px`): No sidebar at all; show mobile header (sticky 56px, back arrow or hamburger, centered title, notification bell); content gets `pb-24` for BottomNav clearance
- Desktop (`>=768px`): Current sidebar behavior (unchanged)

| File | Change |
|---|---|
| `/src/app/components/Layout.tsx` | Add mobile header variant; ensure sidebar is `hidden md:flex`; add `pb-24 md:pb-0` to main content |

### 0.3 Remove Layout wrapper from individual pages

**Current:** Every role page manually imports and wraps itself in `<Layout>`:
```tsx
import { Layout } from "../components/Layout";
export default function CaregiverDashboardPage() {
  return <Layout> ... </Layout>;
}
```

**Target:** Pages should NOT wrap themselves in `<Layout>`. The `AuthenticatedLayout` route parent handles the shell. Pages just render their content.

| Scope | Change |
|---|---|
| ~128 role pages | Remove `<Layout>` wrapper import and usage; render content directly |

**Strategy:** This is a bulk operation. Process module by module:
1. Caregiver (20 pages)
2. Guardian (20 pages)
3. Agency (20 pages)
4. Admin (19 pages)
5. Patient (9 pages)
6. Moderator (4 pages)
7. Shop merchant (9 pages)
8. Shared authenticated pages (Dashboard, Settings, Notifications, Messages — 4 pages)

Note: Some pages may need the `role` prop passed differently since they currently rely on `<Layout role="...">`. The `AuthenticatedLayout` will detect role from URL pathname (same logic already in Layout.tsx line 91).

### 0.4 Add mobile utility classes to theme.css

| File | Change |
|---|---|
| `/src/styles/theme.css` | Add touch target classes, safe area utilities, mobile spacing |

```css
@layer components {
  /* Touch targets per D008 §5.1 */
  .touch-target { min-height: 48px; min-width: 48px; }
  .touch-target-sm { min-height: 44px; min-width: 44px; }
  .touch-target-list { min-height: 56px; }
  
  /* Safe area */
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }
  
  /* Bottom nav clearance */
  .pb-bottomnav { padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)); }
  
  /* Mobile form inputs */
  .mobile-input { min-height: 48px; font-size: 16px; /* prevents iOS zoom */ }
}
```

### 0.5 Update BottomNav.tsx

**Current:** Shows on all pages via `RootLayout`; uses `md:hidden`.
**Target:** Only rendered inside `AuthenticatedLayout`; update breakpoint to match D002 §7 (`768px`).

The BottomNav already has role detection and correct tab sets. Main change is it moves from `RootLayout` into `AuthenticatedLayout`.

**Verification gate:** After Phase 0:
- Public pages show PublicNavBar + PublicFooter, no BottomNav, no sidebar
- Role pages show Layout sidebar (desktop) OR mobile header + BottomNav (mobile)
- No double navigation bars
- BottomNav shows correct role tabs
- All 141 routes still work

---

## Phase 1: Mobile Treatment for Key Pages
**Priority: 🔴 HIGH**
**Estimated scope: ~8 pages rewritten**
**Depends on: Phase 0**

These pages are explicitly named in D008 §6 as requiring special mobile treatment.

### 1.1 MessagesPage — Split-pane to full-screen

**Current:** Desktop split-pane (chat list left, conversation right) renders at all breakpoints.
**Target per D008 §5.3:**
- Mobile: Full-screen chat list → tap → full-screen conversation (push navigation)
- Desktop: Current split-pane behavior (unchanged)

| File | Change |
|---|---|
| `/src/app/pages/MessagesPage.tsx` | Add mobile state: `showConversation` boolean; on mobile, show list OR conversation, not both; add back-arrow header on conversation view |
| Same pattern for | `/src/app/pages/caregiver/CaregiverMessagesPage.tsx`, `/src/app/pages/guardian/GuardianMessagesPage.tsx` |

### 1.2 CaregiverSearchPage — Mobile filter treatment

**Target:** Sticky filter bar at top; filter expansion via bottom sheet; scrollable results below.

| File | Change |
|---|---|
| `/src/app/pages/guardian/CaregiverSearchPage.tsx` | Add bottom-sheet filter drawer on mobile; make filter bar sticky; ensure result cards stack in single column |

### 1.3 CaregiverComparisonPage — Swipeable cards

**Target:** Side-by-side comparison → swipeable comparison cards on mobile.

| File | Change |
|---|---|
| `/src/app/pages/guardian/CaregiverComparisonPage.tsx` | Add horizontal swipe between comparison cards on mobile; keep desktop side-by-side |

### 1.4 GuardianSchedulePage — Horizontal week view

**Target:** Calendar density → horizontal-scrolling week view on mobile.

| File | Change |
|---|---|
| `/src/app/pages/guardian/GuardianSchedulePage.tsx` | Add horizontal-scroll week strip on mobile; keep desktop calendar grid |

### 1.5 AgencyJobManagementPage — Card list with swipe

**Target:** Data-table → status-card list with swipe actions on mobile.

| File | Change |
|---|---|
| `/src/app/pages/agency/AgencyJobManagementPage.tsx` | Replace table with card list on mobile; add swipe-to-act pattern |

### 1.6 AdminPlacementMonitoringPage — Filterable cards

**Target:** Complex table → filterable card list with expandable detail on mobile.

| File | Change |
|---|---|
| `/src/app/pages/admin/AdminPlacementMonitoringPage.tsx` | Card list on mobile with filter pills and expandable sections |

### 1.7 ShiftMonitoringPage — Scrollable shift cards

**Target:** Real-time grid → scrollable shift cards with live status badges on mobile.

| File | Change |
|---|---|
| `/src/app/pages/agency/ShiftMonitoringPage.tsx` | Vertical card scroll on mobile; keep desktop grid |

### 1.8 CaregiverCareLogPage — Step-by-step form

**Target:** Multi-step data entry → step-by-step form with sticky progress on mobile.

| File | Change |
|---|---|
| `/src/app/pages/caregiver/CaregiverCareLogPage.tsx` | Add step indicator; single-step-per-screen on mobile; sticky submit button at bottom |

**Verification gate:** After Phase 1:
- All 8 named pages render correctly on 375px viewport
- Touch targets are 48px+ on all interactive elements
- No horizontal scroll on any mobile page
- Forms have 16px+ font size (prevents iOS zoom)

---

## Phase 2: Internationalization Infrastructure
**Priority: 🔴 HIGH**
**Estimated scope: ~15 new files + config changes**
**Depends on: Phase 0**
**Reference: D017**

### 2.1 Install and configure react-i18next

| File | Change |
|---|---|
| `package.json` | Install `i18next`, `react-i18next` |
| `/src/app/i18n/index.ts` | **NEW** — i18next configuration with language detection, namespace lazy loading, fallback to English |
| `/src/app/App.tsx` | Initialize i18n before RouterProvider |

### 2.2 Create translation namespace files

| Path | Namespace | Priority |
|---|---|---|
| `/src/locales/en/common.json` | Shared: nav labels, buttons, statuses, errors | Wave 1 |
| `/src/locales/bn/common.json` | Bangla translations of common namespace | Wave 1 |
| `/src/locales/en/auth.json` | Auth module labels | Wave 1 |
| `/src/locales/bn/auth.json` | Bangla auth translations | Wave 1 |
| `/src/locales/en/caregiver.json` | Caregiver module | Wave 2 |
| `/src/locales/bn/caregiver.json` | Bangla caregiver | Wave 2 |
| `/src/locales/en/guardian.json` | Guardian module | Wave 2 |
| `/src/locales/bn/guardian.json` | Bangla guardian | Wave 2 |
| `/src/locales/en/patient.json` | Patient module | Wave 3 |
| `/src/locales/bn/patient.json` | Bangla patient | Wave 3 |
| `/src/locales/en/agency.json` | Agency module | Wave 3 |
| `/src/locales/bn/agency.json` | Bangla agency | Wave 3 |
| `/src/locales/en/admin.json` | Admin module | Wave 4 |
| `/src/locales/bn/admin.json` | Bangla admin | Wave 4 |
| + remaining modules... | | Wave 4 |

### 2.3 Add Bangla font to fonts.css

| File | Change |
|---|---|
| `/src/styles/fonts.css` | Add `@import` for Noto Sans Bengali from Google Fonts (400, 700 weights, Bengali subset) |
| `/src/styles/theme.css` | Update `--cn-font-family` to include `'Noto Sans Bengali'` in the stack; add Bangla line-height adjustment |

### 2.4 Create language switcher component

| File | Change |
|---|---|
| `/src/app/components/LanguageSwitcher.tsx` | **NEW** — Toggle between বাংলা and English; stores preference in localStorage |
| `/src/app/pages/SettingsPage.tsx` | Add language selection section |

### 2.5 Create number/date formatting utilities

| File | Change |
|---|---|
| `/src/app/utils/formatters.ts` | **NEW** — `formatDate()`, `formatCurrency()`, `formatNumber()` using `Intl` API with locale awareness; Bengali digit conversion |

### 2.6 Migrate shell components to use translation keys

| File | Change |
|---|---|
| `/src/app/components/BottomNav.tsx` | Replace hardcoded tab labels with `t('common.nav.home')` etc. |
| `/src/app/components/Layout.tsx` | Replace hardcoded sidebar labels with translation keys |
| `/src/app/components/PublicNavBar.tsx` | Replace hardcoded nav labels |

**Verification gate:** After Phase 2:
- App loads in Bangla by default
- Language can be switched from Settings
- Shell navigation (BottomNav, sidebar, PublicNavBar) shows Bangla labels
- Dates, numbers, currency display in Bengali format when in Bangla mode
- Noto Sans Bengali font loads and renders correctly
- Bundle size per route stays under 50KB gzipped (namespace lazy loading works)

---

## Phase 3: Authentication State & Flows
**Priority: 🔴 HIGH**
**Estimated scope: ~10 new files + page rewrites**
**Depends on: Phase 0, Phase 2 (for Bangla labels)**
**Reference: D018**

### 3.1 Create auth state management

| File | Change |
|---|---|
| `/src/app/auth/AuthContext.tsx` | **NEW** — React context for auth state: `user`, `role`, `isAuthenticated`, `activeRole`, `switchRole()`, `login()`, `logout()` |
| `/src/app/auth/types.ts` | **NEW** — `User`, `AuthState`, `LoginCredentials` types |
| `/src/app/auth/mockAuth.ts` | **NEW** — Mock auth service with simulated OTP, demo accounts per role |
| `/src/app/App.tsx` | Wrap app in `<AuthProvider>` |

### 3.2 Create route guards

| File | Change |
|---|---|
| `/src/app/auth/ProtectedRoute.tsx` | **NEW** — Route guard component that checks `isAuthenticated` and `role`; redirects to login if not authenticated |
| `/src/app/auth/RoleGuard.tsx` | **NEW** — Route guard that checks active role matches required role for the route |
| `/src/app/routes.ts` | Wrap authenticated route branches with `ProtectedRoute` loader/component |

### 3.3 Rewrite LoginPage for phone + OTP

**Current:** Email/password form
**Target per D018:** Phone number input → OTP screen → role selection (if multi-role) → dashboard

| File | Change |
|---|---|
| `/src/app/pages/LoginPage.tsx` | Rewrite to phone + OTP flow; +880 prefix input; 6-digit OTP entry; demo bypass for testing |

### 3.4 Rewrite RoleSelectionPage

**Current:** Shows 9 role cards
**Target:** Post-registration role selection (for new users) AND post-login role switch (for multi-role users)

| File | Change |
|---|---|
| `/src/app/pages/RoleSelectionPage.tsx` | Two modes: registration and role-switch; save selection to auth context |

### 3.5 Rewrite RegisterPage for phone-first

| File | Change |
|---|---|
| `/src/app/pages/auth/RegisterPage.tsx` | Phone-first registration with OTP verification; role-specific fields after verification per D018 §3.2 |

### 3.6 Update DashboardPage as role router

**Current:** Shows a generic dashboard
**Target per D013:** Role-aware redirect to `/caregiver/dashboard`, `/guardian/dashboard`, etc. based on active role

| File | Change |
|---|---|
| `/src/app/pages/DashboardPage.tsx` | Read active role from auth context; redirect to role-specific dashboard |

### 3.7 Add biometric setup UI (Capacitor-aware)

| File | Change |
|---|---|
| `/src/app/pages/auth/MFASetupPage.tsx` | Add biometric enrollment option (only shown in Capacitor context via `window.Capacitor` check) |

### 3.8 Update Layout & BottomNav to use auth context

| File | Change |
|---|---|
| `/src/app/components/Layout.tsx` | Read `user` and `activeRole` from auth context instead of inferring from URL |
| `/src/app/components/BottomNav.tsx` | Read active role from auth context for tab selection |

**Verification gate:** After Phase 3:
- Login with demo phone + OTP works
- Role selection after login works
- `/dashboard` redirects to correct role dashboard
- Unauthenticated users cannot access role pages
- Role switching works from Settings
- Logout clears auth state and redirects to login
- All existing page functionality preserved

---

## Phase 4: Offline Infrastructure
**Priority: 🟠 HIGH**
**Estimated scope: ~8 new files**
**Depends on: Phase 3 (auth context needed for user-scoped offline data)**
**Reference: D016**

### 4.1 Install and configure offline storage

| Action | Detail |
|---|---|
| Install packages | `dexie` (IndexedDB wrapper), `dexie-react-hooks` |
| `/src/app/offline/db.ts` | **NEW** — Dexie database schema: `offline_actions`, `cached_entities`, `attachment_refs` per D016 §4.2 |

### 4.2 Create sync engine

| File | Change |
|---|---|
| `/src/app/offline/syncEngine.ts` | **NEW** — Sync queue processor: priority ordering, exponential backoff, idempotency key generation, retry logic per D016 §5.2 |
| `/src/app/offline/useOnlineStatus.ts` | **NEW** — React hook wrapping `navigator.onLine` + `online`/`offline` events + `@capacitor/network` when available |
| `/src/app/offline/useSyncQueue.ts` | **NEW** — React hook for queuing offline actions and monitoring sync state |

### 4.3 Create offline status UI

| File | Change |
|---|---|
| `/src/app/components/OfflineIndicator.tsx` | **NEW** — Connection status banner per D016 §7.1: amber offline banner, sync animation, error indicator |
| `/src/app/components/AuthenticatedLayout.tsx` | Add `<OfflineIndicator />` to authenticated shell |

### 4.4 Make CaregiverCareLogPage offline-capable

This is the highest-priority Tier 1 offline surface per D016 §3.1.

| File | Change |
|---|---|
| `/src/app/pages/caregiver/CaregiverCareLogPage.tsx` | Add offline draft saving to IndexedDB; show "Pending sync" badge on offline-created logs; queue for sync on reconnect |
| `/src/app/pages/caregiver/ShiftDetailPage.tsx` | Add offline check-in/check-out with GPS capture queued for sync |

### 4.5 Add service worker for asset caching

| File | Change |
|---|---|
| `/src/sw.ts` | **NEW** — Service worker with cache-first for app shell, stale-while-revalidate for route chunks, network-first for API per D016 §8.1 |
| `vite.config.ts` | Add service worker build configuration |

**Verification gate:** After Phase 4:
- Offline indicator shows when network is disconnected
- Care log can be created while offline; saved to IndexedDB
- Offline care logs sync when network returns
- App shell loads from cache when offline
- Sync queue processes in priority order

---

## Phase 5: Payment UI
**Priority: 🟠 HIGH**
**Estimated scope: ~4 pages updated + 2 new components**
**Depends on: Phase 3 (auth context)**
**Reference: D019**

### 5.1 Create payment method selector component

| File | Change |
|---|---|
| `/src/app/components/PaymentMethodSelector.tsx` | **NEW** — bKash, Nagad, Rocket, Card selection with MFS logos; bottom sheet on mobile |

### 5.2 Update GuardianPaymentsPage

| File | Change |
|---|---|
| `/src/app/pages/guardian/GuardianPaymentsPage.tsx` | Add invoice list with payment status; "Pay Now" button opening payment method selector; mock bKash/Nagad flow |

### 5.3 Update InvoiceDetailPage

| File | Change |
|---|---|
| `/src/app/pages/guardian/InvoiceDetailPage.tsx` | Add invoice line items (base amount, platform fee, VAT per D019 §4.3); payment action; BDT formatting with South Asian grouping |

### 5.4 Update AgencyPayrollPage

| File | Change |
|---|---|
| `/src/app/pages/agency/AgencyPayrollPage.tsx` | Add payout history with bKash/bank method display; settlement period tracking |

### 5.5 Update RefundRequestPage

| File | Change |
|---|---|
| `/src/app/pages/support/RefundRequestPage.tsx` | Add refund flow UI per D019 §7.1; original payment method display; refund timeline |

**Verification gate:** After Phase 5:
- Guardian can view invoice with BDT amounts in South Asian grouping
- Payment method selector shows bKash, Nagad, Rocket, Card options
- Agency payroll page shows payout history
- All amounts display correctly in both Bangla and English modes

---

## Phase 6: Push Notification UI
**Priority: 🟠 MEDIUM**
**Estimated scope: ~3 files updated + 2 new**
**Depends on: Phase 3 (auth context)**
**Reference: D021**

### 6.1 Create notification preference UI

| File | Change |
|---|---|
| `/src/app/components/NotificationPreferences.tsx` | **NEW** — Per-channel toggle (Care & Safety, Shift Reminders, Messages, etc.); quiet hours picker per D021 §6 |
| `/src/app/pages/SettingsPage.tsx` | Add notification preferences section |

### 6.2 Update NotificationsPage

| File | Change |
|---|---|
| `/src/app/pages/NotificationsPage.tsx` | Group notifications by channel category; add channel-specific icons and colors; badge count management; bilingual notification titles |

### 6.3 Add notification permission prompt

| File | Change |
|---|---|
| `/src/app/components/NotificationPermissionPrompt.tsx` | **NEW** — First-login prompt per D021 §9.2: "Enable notifications to receive shift reminders, care alerts, and messages"; only in Capacitor context |

**Verification gate:** After Phase 6:
- Notification preferences can be toggled per channel
- Quiet hours can be configured
- Notification list groups by category
- Permission prompt appears on first login (Capacitor only)

---

## Phase 7: Performance Optimization
**Priority: 🟠 MEDIUM**
**Estimated scope: ~5 files changed + build config**
**Depends on: Phase 0 (route restructure enables code splitting)**
**Reference: D008 §9, D020 §6**

### 7.1 Route-based code splitting

**Current:** All 141 page imports are static in `routes.ts` — entire app loads as one bundle.
**Target:** Every page uses `React.lazy()` for dynamic import.

| File | Change |
|---|---|
| `/src/app/routes.ts` | Convert all 141 static imports to `React.lazy(() => import('./pages/...'))` with `Suspense` fallback |

### 7.2 Add skeleton loading components

| File | Change |
|---|---|
| `/src/app/components/PageSkeleton.tsx` | **NEW** — Shimmer skeleton for page load: stat cards, lists, forms |
| `/src/app/components/CardSkeleton.tsx` | **NEW** — Reusable card shimmer for dashboard loading |

### 7.3 Image optimization

| File | Change |
|---|---|
| All pages using images | Ensure all images use `loading="lazy"`; add skeleton placeholder |
| `/src/app/components/figma/ImageWithFallback.tsx` | Already exists — verify it uses lazy loading |

### 7.4 Bundle analysis and route chunk verification

| Action | Detail |
|---|---|
| Add `rollup-plugin-visualizer` | Dev dependency for bundle analysis |
| Verify | Every route chunk < 50KB gzipped per D008 §9 |
| Verify | Initial JS bundle < 300KB gzipped |

**Verification gate:** After Phase 7:
- Each route loads its own chunk (visible in network tab)
- FCP < 2s on throttled 3G
- TTI < 4s on throttled 3G
- No route chunk exceeds 50KB gzipped
- Skeleton loading appears during page transitions

---

## Phase 8: Mobile Treatment — Remaining Pages
**Priority: 🟡 MEDIUM**
**Estimated scope: ~130 pages audited, ~40 need changes**
**Depends on: Phase 0, Phase 1**

This is the bulk mobile pass across all remaining pages. Phase 1 covered the 8 explicitly named critical pages. This phase covers the remaining 133 pages.

### 8.1 Dashboard pages (7 pages)

All role dashboards follow the same pattern: stat cards + activity list + quick actions.

| Mobile treatment | Specification |
|---|---|
| Stat cards | Stack 1-column on mobile (currently 2-4 column grid) |
| Activity lists | Full-width card list |
| Quick action buttons | Full-width stacked; 48px height |
| Charts | Horizontal scroll container for wide charts |

**Pages:** `CaregiverDashboardPage`, `GuardianDashboardPage`, `AgencyDashboardPage`, `AdminDashboardPage`, `PatientDashboardPage`, `ModeratorDashboardPage`, `ShopDashboardPage`

### 8.2 Table-heavy pages (~25 pages)

All admin, agency, and shop pages with data tables.

| Mobile treatment | Specification |
|---|---|
| Desktop tables | Hidden on mobile |
| Mobile cards | Shown on mobile; same data as table row, in card format |
| Filters | Sticky filter bar + bottom-sheet expansion |
| Pagination | Simplified: prev/next only on mobile |

**Pattern:** Create a shared `<ResponsiveTable>` component that renders table on desktop, card list on mobile.

| File | Change |
|---|---|
| `/src/app/components/ResponsiveTable.tsx` | **NEW** — Takes column definitions + data; renders `<table>` on `md+`, card stack on mobile |

**Pages affected:** `AdminUsersPage`, `AdminVerificationsPage`, `AdminPaymentsPage`, `AdminReportsPage`, `AuditLogsPage`, `AgencyCaregiversPage`, `AgencyClientsPage`, `AgencyPaymentsPage`, `AgencyReportsPage`, `ShopOrdersPage`, `ShopInventoryPage`, `ShopProductsPage`, `ModeratorReviewsPage`, `ModeratorReportsPage`, + others

### 8.3 Form pages (~20 pages)

All form-heavy pages (registration, intake, wizards, editors).

| Mobile treatment | Specification |
|---|---|
| Form layout | Single-column; labels above inputs |
| Input height | 48px minimum |
| Submit button | Sticky at bottom of viewport |
| Multi-step forms | One step per screen with progress indicator |

**Pages affected:** `RegisterPage`, `PatientIntakePage`, `ClientIntakePage`, `CareRequirementWizardPage`, `BookingWizardPage`, `IncidentReportWizardPage`, `ProductEditorPage`, `TicketSubmissionPage`, `RefundRequestPage`, + others

### 8.4 Profile and detail pages (~15 pages)

| Mobile treatment | Specification |
|---|---|
| Profile header | Full-width hero with avatar |
| Info sections | Stacked cards |
| Action buttons | Full-width at bottom |

**Pages affected:** `CaregiverProfilePage`, `GuardianProfilePage`, `PatientProfilePage`, `CaregiverPublicProfilePage`, `AgencyPublicProfilePage`, `AgencyStorefrontPage`, + detail pages

### 8.5 Shop front pages (10 pages)

| Mobile treatment | Specification |
|---|---|
| Product grid | 2-column on mobile (currently 3-4) |
| Cart | Full-screen with sticky checkout button |
| Checkout | Single-column form, sticky submit |

### 8.6 Create shared mobile components

| File | Purpose |
|---|---|
| `/src/app/components/BottomSheet.tsx` | **NEW** — Reusable bottom sheet for filters, actions, confirmations |
| `/src/app/components/MobileHeader.tsx` | **NEW** — Sticky mobile header: back arrow, title, action button |
| `/src/app/components/SwipeableCard.tsx` | **NEW** — Card with swipe-to-act (archive, delete, edit) |
| `/src/app/components/PullToRefresh.tsx` | **NEW** — Pull-to-refresh gesture handler for list pages |
| `/src/app/components/StickySubmit.tsx` | **NEW** — Sticky bottom submit button for forms |

**Verification gate:** After Phase 8:
- All 141 pages render correctly at 375px viewport width
- No horizontal scroll on any page
- All touch targets >= 44px
- All forms have 16px+ font size
- Tables convert to card lists on mobile
- Modals convert to bottom sheets on mobile

---

## Phase 9: Capacitor Integration
**Priority: 🟡 MEDIUM — After mobile UI is solid**
**Estimated scope: ~8 new files + config**
**Depends on: Phase 0, Phase 1, Phase 4, Phase 8**
**Reference: D008 §12**

### 9.1 Initialize Capacitor

| Action | Detail |
|---|---|
| Install | `@capacitor/core`, `@capacitor/cli` |
| Run | `npx cap init CareNet com.carenet.app --web-dir dist` |
| Add Android | `npx cap add android` |
| `/capacitor.config.ts` | Configure per D008 §12.1 |

### 9.2 Install Capacitor plugins

| Plugin | Purpose |
|---|---|
| `@capacitor/camera` | Care log photos, incident evidence |
| `@capacitor/geolocation` | Shift check-in GPS verification |
| `@capacitor/push-notifications` | FCM push notifications |
| `@capacitor/network` | Online/offline detection |
| `@capacitor/preferences` | Offline key-value storage |
| `@capacitor/filesystem` | Attachment staging |
| `@capacitor/status-bar` | Role-themed status bar |
| `@capacitor/haptics` | Tactile feedback |
| `@capacitor/app` | Back button, lifecycle |
| `capacitor-native-biometric` | Biometric auth |

### 9.3 Create Capacitor abstraction layer

| File | Purpose |
|---|---|
| `/src/app/native/camera.ts` | **NEW** — Camera wrapper: uses `@capacitor/camera` if available, falls back to `<input type="file" accept="image/*">` |
| `/src/app/native/geolocation.ts` | **NEW** — GPS wrapper: uses `@capacitor/geolocation` if available, falls back to `navigator.geolocation` |
| `/src/app/native/notifications.ts` | **NEW** — Push wrapper: uses `@capacitor/push-notifications` if available, no-op on web |
| `/src/app/native/biometric.ts` | **NEW** — Biometric wrapper: uses `capacitor-native-biometric` if available, hidden on web |
| `/src/app/native/haptics.ts` | **NEW** — Haptic wrapper: uses `@capacitor/haptics` if available, no-op on web |
| `/src/app/native/platform.ts` | **NEW** — Platform detection: `isNative()`, `isAndroid()`, `isIOS()`, `isWeb()` |

### 9.4 Android back button handler

| File | Change |
|---|---|
| `/src/app/native/backButton.ts` | **NEW** — Back button handler per D008 §12.3: modal → close; drawer → close; sub-page → pop; tab root → exit confirmation |
| `/src/app/App.tsx` | Register back button listener on mount |

### 9.5 Status bar theming

| File | Change |
|---|---|
| `/src/app/native/statusBar.ts` | **NEW** — Set status bar color based on active role per D008 §12.7 |
| `/src/app/components/AuthenticatedLayout.tsx` | Call `setStatusBarColor()` on role change |

**Verification gate:** After Phase 9:
- `npx cap sync android` completes without errors
- Android build produces APK
- Camera abstraction works on both web and native
- GPS abstraction works on both web and native
- Back button behaves correctly per D008 §12.3 flowchart
- Status bar color matches active role

---

## Phase 10: Testing Infrastructure
**Priority: 🟡 MEDIUM**
**Estimated scope: ~15 new files + config**
**Depends on: All previous phases**
**Reference: D020**

### 10.1 Setup testing tools

| Action | Detail |
|---|---|
| Install | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test` |
| `/vitest.config.ts` | **NEW** — Vitest configuration with jsdom environment |
| `/playwright.config.ts` | **NEW** — Playwright configuration with mobile viewport presets |

### 10.2 Unit tests for utilities

| File | Tests |
|---|---|
| `/src/app/utils/formatters.test.ts` | Date, currency, number formatting in both bn and en |
| `/src/app/auth/mockAuth.test.ts` | OTP generation, validation, rate limiting |
| `/src/app/offline/syncEngine.test.ts` | Queue ordering, retry logic, idempotency |

### 10.3 Component integration tests

| File | Tests |
|---|---|
| `/src/app/components/BottomNav.test.tsx` | Role detection, tab rendering, active state |
| `/src/app/components/Layout.test.tsx` | Sidebar rendering, mobile header, role-specific nav links |
| `/src/app/components/OfflineIndicator.test.tsx` | Online/offline state display |

### 10.4 E2E workflow tests (Playwright)

| Test File | Coverage |
|---|---|
| `/e2e/auth-flow.spec.ts` | Phone + OTP login, role selection, logout |
| `/e2e/care-requirement.spec.ts` | Guardian creates requirement → appears in agency inbox |
| `/e2e/shift-lifecycle.spec.ts` | Shift check-in → care log → check-out |
| `/e2e/mobile-navigation.spec.ts` | BottomNav tab switching, back button, drawer |
| `/e2e/offline-carelog.spec.ts` | Create care log offline → sync on reconnect |

### 10.5 Accessibility tests

| Action | Detail |
|---|---|
| Install | `@axe-core/playwright` |
| `/e2e/accessibility.spec.ts` | **NEW** — Run axe-core on all public pages + key role pages |

### 10.6 Performance budget CI gate

| Action | Detail |
|---|---|
| Install | `lighthouse-ci` |
| `/.lighthouserc.json` | **NEW** — Budget: FCP < 2s, TTI < 4s, route chunk < 50KB |

**Verification gate:** After Phase 10:
- `npm test` runs all unit + integration tests
- `npx playwright test` runs all E2E tests
- Zero critical axe-core violations
- Lighthouse CI scores >= 70 on mobile profile

---

## Execution Order Summary

```
Phase 0: Route Architecture & Shell Fix ──────── WEEK 1
    ↓
Phase 1: Key Page Mobile Treatment ──────────── WEEK 1-2
Phase 2: i18n Infrastructure ────────────────── WEEK 2 (parallel with Phase 1)
    ↓
Phase 3: Auth State & Flows ─────────────────── WEEK 3
    ↓
Phase 4: Offline Infrastructure ─────────────── WEEK 4
Phase 5: Payment UI ─────────────────────────── WEEK 4 (parallel with Phase 4)
    ↓
Phase 6: Push Notification UI ───────────────── WEEK 5
Phase 7: Performance Optimization ───────────── WEEK 5 (parallel with Phase 6)
    ↓
Phase 8: Remaining Pages Mobile Pass ────────── WEEK 6-8
    ↓
Phase 9: Capacitor Integration ──────────────── WEEK 9
    ↓
Phase 10: Testing Infrastructure ────────────── WEEK 10 (can start earlier)
```

## File Change Summary

| Category | New Files | Modified Files | Total |
|---|---|---|---|
| Phase 0: Shell fix | 1 | 4 + ~128 pages | ~133 |
| Phase 1: Key page mobile | 0 | 8 | 8 |
| Phase 2: i18n | ~15 | 5 | ~20 |
| Phase 3: Auth | ~7 | 6 | ~13 |
| Phase 4: Offline | ~6 | 3 | ~9 |
| Phase 5: Payment UI | 1 | 4 | 5 |
| Phase 6: Notifications | 2 | 2 | 4 |
| Phase 7: Performance | 2 | 2 | 4 |
| Phase 8: Remaining mobile | ~6 | ~40 | ~46 |
| Phase 9: Capacitor | ~8 | 3 | ~11 |
| Phase 10: Testing | ~15 | 1 | ~16 |
| **Total** | **~63** | **~206** | **~269** |

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Phase 0 shell restructure breaks existing pages | 🔴 High | Process module by module; verify each module's routes before proceeding |
| Removing `<Layout>` wrapper from 128 pages introduces regressions | 🔴 High | Automated script to remove wrapper; visual diff before/after per module |
| i18n namespace lazy loading increases TTFB | 🟠 Medium | Keep `common` namespace inline; lazy-load module namespaces with route chunk |
| Offline sync creates duplicate care logs | 🔴 High | Idempotency key contract is non-negotiable per D016 §5.3; test thoroughly |
| Capacitor WebView differences from Chrome | 🟠 Medium | Test on Android System WebView specifically; polyfill as needed |
| Budget device memory pressure from IndexedDB | 🟠 Medium | Enforce 350MB total storage cap per D016 §10; LRU eviction |
| Bangla text overflow in fixed-width UI elements | 🟡 Low | Visual testing with longest Bangla strings; add `overflow-hidden text-ellipsis` where needed |

## Definition of Done (per phase)

Every phase must pass these checks before moving to the next:

1. All existing routes still render (no 404s, no blank pages)
2. Dark mode still works on all affected pages
3. Desktop layout unchanged (no regressions)
4. Mobile viewport (375px) renders correctly
5. No TypeScript errors
6. No console errors in browser dev tools
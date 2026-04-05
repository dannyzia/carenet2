# CareNet 2 — App Cleanup Audit

> **Context:** CareNet was originally built as a marketing website. It was later turned into a Capacitor-wrapped mobile app. Many website-era pages, navigation links, marketing components, and website shell elements still remain in the codebase, cluttering the app experience.
>
> **Goal:** Remove all website artifacts and streamline the navigation so the app feels like a native mobile product.

---

## Table of Contents

1. [Entire Pages to Delete](#1-entire-pages-to-delete)
2. [Pages to Keep — But Remove Marketing Components Within Them](#2-pages-to-keep----remove-marketing-components-within-them)
3. [Shell / Layout Components to Remove or Strip](#3-shell--layout-components-to-remove-or-strip)
4. [Sidebar Cleanup Plan](#4-sidebar-cleanup-plan)
5. [PublicNavBar Cleanup Plan](#5-publicnavbar-cleanup-plan)
6. [Route Cleanup — `src/app/routes.ts`](#6-route-cleanup----srcapproutests)
7. [i18n Keys to Remove](#7-i18n-keys-to-remove)
8. [Execution Order](#8-execution-order)

---

## 1. Entire Pages to Delete

These pages are pure website/marketing content with no place in a mobile app.

### 1A. Public Marketing Pages — `src/frontend/pages/public/`

| # | File | Route | Reason |
|---|------|-------|--------|
| 1 | `HomePage.tsx` | `/`, `/home` | Classic landing page: hero banner with CTAs ("Experience the App", "Sign in / Register", "Job Portal", "Care Shop"), feature cards ("Why CareNet?"), stats section (10,000+ caregivers, 98% satisfaction), and contact info. Entire page is a sales funnel — the user already installed the app. |
| 2 | `AboutPage.tsx` | `/about` | "About CareNet" company page with ecosystem cards, core values, and detailed "How to Use CareNet" role guides. This is documentation/marketing, not an app feature. |
| 3 | `FeaturesPage.tsx` | `/features` | Feature showcase page with per-role feature tabs (Guardian, Caregiver, Agency, Patient, Shop) and platform highlights. Also has CTA footer ("Get Started", "View Pricing"). Pure marketing. |
| 4 | `PricingPage.tsx` | `/pricing` | Pricing tiers page with Guardian/Agency/Shop plans, monthly/annual toggle, feature comparison, FAQ, and "Get Started" CTA footer. Website sales content. |
| 5 | `ContactPage.tsx` | `/contact` | Website contact form with "Send us a Message", social media links (Facebook, Twitter, Instagram, LinkedIn), office address, "Follow Us" section, and "Live Support" CTA. Redundant with in-app support ticket. |
| 6 | `ExperienceAppPage.tsx` | `/experience` | Demo/sandbox page — "Experience the App before signing up." Lets visitors try each role in a sandbox. This is a marketing onboarding funnel, not an in-app feature. |

### 1B. Community / Blog / Careers — `src/frontend/pages/community/`

| # | File | Route | Reason |
|---|------|-------|--------|
| 7 | `BlogListPage.tsx` | `/community/blog` | Blog listing with "Trending Now" sidebar, categories, and article cards. CMS/website content. |
| 8 | `BlogDetailPage.tsx` | `/community/blog/:id` | Blog article detail view. Same — website CMS content. |
| 9 | `CareerPage.tsx` | `/community/careers` | Job openings at CareNet (the company). Not a feature for app users. |

### 1C. Roadmap — `src/frontend/pages/shared/`

| # | File | Route | Reason |
|---|------|-------|--------|
| 10 | `SmartCareRoadmapPage.tsx` | `/smart-care/roadmap` | Product roadmap showcase (AI vitals, voice logging, wearables, shift optimization). Informational/marketing. Currently linked from **every** role's sidebar. |

### 1D. Public Footer Component

| # | File | Reason |
|---|------|--------|
| 11 | `src/frontend/components/navigation/PublicFooter.tsx` | Website footer with links to Features, Pricing, About, Contact, Privacy, Terms + copyright. Apps don't use web-style footers. |

**Total: 11 files to delete entirely.**

---

## 2. Pages to Keep — Remove Marketing Components Within Them

These are functional app pages that contain embedded marketing/website content that should be stripped out.

### 2A. `MarketplacePage.tsx` — `/marketplace`

**Keep:** Yes — the marketplace is a functional in-app feature.

**Remove these sections:**

| Location | What | Why |
|----------|------|-----|
| Title area (lines 87–92) | Marketing tagline "Find the perfect caregiver for your loved ones" | Sounds like website copy. Replace with role-aware heading. |
| "Apply Now" button (lines 185–194) | "Apply Now" CTA button on each job card | If the user is a guardian browsing, this button makes no sense. Should be role-contextual or removed. |

### 2B. `AgencyDirectoryPage.tsx` — `/agencies`

**Keep:** Yes — the agency directory is a functional in-app feature.

**Remove these sections:**

| Location | What | Why |
|----------|------|-----|
| Lines 88–93 | Bottom CTA card: "Are you a care agency?" with "Join CareNet to connect with guardians seeking care services" + "Register as Agency" button | This is a user-acquisition CTA. Users who see this are already in the app. Remove the entire `finance-card` block. |
| Lines 32–42 | Hero section with "Find a Trusted Care Agency" + "Browse verified care agencies across Bangladesh" | Replace with a simpler, app-appropriate header. This full-width gradient hero is a website pattern. |

### 2C. `GlobalSearchPage.tsx` — `/global-search`

**Keep:** Yes — global search is a useful in-app feature.

**Remove these sections:**

| Location | What | Why |
|----------|------|-----|
| Lines 189–194 | Sidebar card "Trending Near You" with "Families in Gulshan are currently looking for post-op recovery specialists" + "View Area Trends" button | This is a marketing/informational widget with no real functionality. Remove the entire `finance-card`. |
| Lines 182–188 | "Recent Searches" with hardcoded values "Diabetes care", "Wheelchair", "Dhanmondi", etc. | These are static hardcoded strings, not actual user search history. Remove or replace with real recent searches from local storage. |
| Lines 31–71 | Full-width `PageHero` with gradient background | Website search hero pattern. Should be simplified for app. |
| Line 198 | Inline `<style>` tag injecting `.finance-card` CSS globally | Dangerous global style injection — should use Tailwind classes instead. |

### 2D. `HelpCenterPage.tsx` — `/support/help`

**Keep:** Yes — help center is useful in-app.

**Remove these sections:**

| Location | What | Why |
|----------|------|-----|
| Lines 40–61 | `PageHero` with full-width gradient background, "How can we help you?" heading, abstract background orbs | Website hero pattern. Replace with simple in-app heading. |
| Lines 51–55 | Trending tags row: #Booking, #Payment, #Verification, #Shop, #Refunds | Website decorative element. |
| Lines 59–60 | Abstract blur orbs (decorative `div`s) | Website decorative element. |
| Lines 143–157 | "System Status" card showing API/Payments/Matching status | This is an admin/ops dashboard widget, not something end users need. Remove. |
| Line 162–163 | Inline `<style>` tag injecting global `.finance-card` CSS | Dangerous global style injection. |
| Lines 104–118 | "Can't find what you're looking for?" dark card — "Submit a Ticket" is fine, but "Chat with Support" is non-functional marketing | Remove "Chat with Support" button or wire it to real functionality. |

### 2E. `ContactUsPage.tsx` — `/support/contact`

**Recommendation: Delete entirely.** Support ticket (`/support/ticket`) already covers user communication needs.

If kept, remove these sections:

| Location | What | Why |
|----------|------|-----|
| Lines 41–47 | `PageHero` with "We're Here for You" + gradient background | Website hero pattern. |
| Lines 124–133 | "Follow Us" section with Facebook, Twitter, Instagram, LinkedIn buttons | Social media marketing links. Not an app feature. |
| Lines 136–143 | "Live Support" green card with "Chat with a medical coordinator right now" | Non-functional marketing CTA. |
| Lines 114–122 | "Our Headquarters" with physical office address | Website information. Not needed in-app. |
| Line 148–149 | Inline `<style>` tag | Global CSS injection. |

### 2F. `GuardianDashboardPage.tsx` — `/guardian/dashboard`

**Keep:** Yes — core app page.

| Location | What | Why |
|----------|------|-----|
| Line 33 | Hardcoded date string "Sunday, March 15" | Should use dynamic date. |
| Line 32 | Hardcoded user name "Rashed" | Should use `user.name` from auth context. |

### 2G. `CaregiverDashboardPage.tsx` — `/caregiver/dashboard`

**Keep:** Yes — core app page.

| Location | What | Why |
|----------|------|-----|
| Line 27 | Hardcoded date "Sunday, March 15" | Should use dynamic date. |
| Line 26 | Hardcoded "Karim" | Should use `user.name`. |

### 2H. `SettingsPage.tsx` — `/settings`

**Keep:** Yes — core app page. **Add** these items:

| What | Why |
|------|-----|
| Privacy Policy link → opens `/privacy` or in-app modal | Relocated from sidebar "Support" section. |
| Terms of Service link → opens `/terms` or in-app modal | Relocated from sidebar "Support" section. |
| Contact Support link → navigates to `/support/ticket` | Consolidate support entry point. |

### 2I. Shop Front Pages — `/shop/*`

**Keep:** If the shop is a real in-app feature. The `ShopFrontLayout.tsx` currently renders `PublicNavBar` and `PublicFooter` — both need to be stripped after the cleanup above. Replace `PublicNavBar` with a simple shop header or reuse the authenticated header. Remove `PublicFooter` reference entirely.

---

## 3. Shell / Layout Components to Remove or Strip

### 3A. `PublicFooter.tsx` → **Delete entirely**

- Referenced by `PublicLayout.tsx` and `ShopFrontLayout.tsx`.
- After deleting, remove the import and `<PublicFooter />` from both layouts.

### 3B. `PublicLayout.tsx` → **Strip down**

After marketing pages are removed, `PublicLayout` only wraps:
- Auth pages (login, register, forgot-password, etc.)
- 404 page
- (Optionally) `/marketplace`, `/agencies`, `/global-search` if kept public

The `PublicNavBar` still serves these pages, but its content should be simplified (see section 5).

### 3C. `ShopFrontLayout.tsx` → **Remove PublicNavBar + PublicFooter**

- Remove `<PublicFooter />` reference.
- Replace `<PublicNavBar />` with either: a minimal shop header, or render these routes inside `AuthenticatedLayout` so the shop gets the standard app sidebar.

---

## 4. Sidebar Cleanup Plan

**File:** `src/frontend/components/shell/AuthenticatedLayout.tsx`

### 4A. Remove the entire "Browse" collapsible section (lines 525–560)

Currently contains:
- `/marketplace` → links to public marketing page
- `/agencies` → links to public agency directory
- `/shop` → links to shop front

**Action:** Remove the entire `<Collapsible>` block for "Browse". If marketplace/agencies/shop are needed in-app, they should appear in the role's own `getRoleNavSections` links, not in a shared "Browse" section.

### 4B. Strip the "Support & Info" collapsible section (lines 562–603)

Currently contains 11 links. Reduce to:

| Link | Action |
|------|--------|
| Help Center `/support/help` | **Keep** — useful in-app |
| Submit Ticket `/support/ticket` | **Keep** — functional |
| Refund Request `/support/refund` | **Keep** — functional |
| Contact Us `/support/contact` | **Remove** — delete the page entirely |
| Blog `/community/blog` | **Remove** — deleting the page |
| Careers `/community/careers` | **Remove** — deleting the page |
| About `/about` | **Remove** — deleting the page |
| Features `/features` | **Remove** — deleting the page |
| Pricing `/pricing` | **Remove** — deleting the page |
| Privacy Policy `/privacy` | **Relocate** to Settings page |
| Terms of Service `/terms` | **Relocate** to Settings page |

After cleanup, the "Support" section should have at most 2–3 links: Help Center, Submit Ticket, Refund Request. Or these can be moved into the "App Controls" section.

### 4C. Remove `smartCareRoadmap` from every role's nav

The `smartCareRoadmap` entry appears in:
- Guardian → `getRoleNavSections` → tools section
- Patient → privacyBrowse section
- Caregiver → growth section
- Agency → financeSettings section
- Admin → system section

**Action:** Delete `{ i18nKey: "smartCareRoadmap", path: "/smart-care/roadmap", icon: BarChart2 }` from all five roles.

### 4D. Simplify "App Controls" collapsible → always visible

Currently language, theme, settings, and logout are hidden behind a `<Collapsible>` that defaults to closed. On mobile, this means **4 taps** to reach logout (Menu → Sidebar → Expand App Controls → Logout).

**Action:** Make app controls always visible at the bottom of the sidebar without a collapsible wrapper. The layout should be:

```
┌─────────────────────────────┐
│  🔒 Caregiver Portal        │
├─────────────────────────────┤
│  [role nav sections...]     │
│  (primary expanded,         │
│   others collapsed)         │
├─────────────────────────────┤
│  ⚙ Settings                 │  ← always visible
│  🌐 Language  🌙 Theme       │  ← always visible
│  🚪 Log Out                 │  ← always visible
└─────────────────────────────┘
```

### 4E. Consolidate role nav sections — fewer items visible by default

Current link counts per role:

| Role | Visible links (all sections) |
|------|------------------------------|
| Guardian | 21 main + 7 tools = **28** |
| Patient | 10 main + 3 tools + 13 health + 2 privacy = **28** |
| Caregiver | 12 main + 4 patientCare + 6 finance + 5 growth = **27** |
| Agency | 13 main + 8 operations + 8 finance = **29** |
| Shop | 6 main + 4 management = **10** |
| Admin | 10 main + 6 system + 6 contentConfig = **22** |
| Moderator | 5 main = **5** |

**Recommendation:** For roles with 20+ links, default-collapse all sections after the first ("main"). This means on initial load, users see ~6–12 links (dashboard + core features), and can expand "More", "Finance", "Health", etc. to see the rest.

---

## 5. PublicNavBar Cleanup Plan

**File:** `src/frontend/components/navigation/PublicNavBar.tsx`

### 5A. Desktop nav links (lines 22–28) — Strip marketing links

```tsx
// BEFORE:
const navLinks = [
  { labelKey: "home", to: "/home", activePaths: ["/", "/home"] },
  { labelKey: "marketplace", to: "/marketplace" },
  { labelKey: "about", to: "/about" },        // ← DELETE
  { labelKey: "features", to: "/features" },   // ← DELETE
  { labelKey: "pricing", to: "/pricing" },     // ← DELETE
];

// AFTER:
const navLinks = [
  { labelKey: "home", to: "/auth/login", activePaths: ["/"] },
  { labelKey: "marketplace", to: "/marketplace" },
];
```

### 5B. Mobile drawer nav links (lines 31–38) — Strip marketing links

Remove `about`, `features`, `pricing`, `contact` from `mobileNavLinks`.

### 5C. Mobile support links (lines 46–55) — Strip marketing links

Remove `blog`, `careers`, `about`, `features`, `pricing` from `mobileSupportLinks`. Keep only `help`, `ticket`, `refund`, `privacy`, `terms`.

---

## 6. Route Cleanup — `src/app/routes.ts`

### 6A. Remove routes for deleted pages

Delete these route entries from the `PublicLayout` children block:

```tsx
// DELETE these:
{ path: "home", ...p(() => import("@/frontend/pages/public/HomePage")) },
{ path: "experience", ...p(() => import("@/frontend/pages/public/ExperienceAppPage")) },
{ path: "about", ...p(() => import("@/frontend/pages/public/AboutPage")) },
{ path: "features", ...p(() => import("@/frontend/pages/public/FeaturesPage")) },
{ path: "pricing", ...p(() => import("@/frontend/pages/public/PricingPage")) },
{ path: "contact", ...p(() => import("@/frontend/pages/public/ContactPage")) },

{ path: "community/blog", ...p(() => import("@/frontend/pages/community/BlogListPage")) },
{ path: "community/blog/:id", ...p(() => import("@/frontend/pages/community/BlogDetailPage")) },
{ path: "community/careers", ...p(() => import("@/frontend/pages/community/CareerPage")) },

// From authenticated section:
{ path: "smart-care/roadmap", ...p(() => import("@/frontend/pages/shared/SmartCareRoadmapPage")) },
```

### 6B. Change the index route

The `/` (index) route currently loads `HomePage`. After deletion:

- If the user is **unauthenticated**: redirect to `/auth/login`.
- If the user is **authenticated**: redirect to `/{role}/dashboard` (already handled by `DashboardPage`).

```tsx
// BEFORE:
{ index: true, ...p(() => import("@/frontend/pages/public/HomePage")) },

// AFTER (option A — reuse DashboardPage which handles both cases):
{ index: true, ...p(() => import("@/frontend/pages/shared/DashboardPage")) },

// AFTER (option B — simple redirect):
{ index: true, element: <Navigate to="/auth/login" replace /> },
```

### 6C. Keep these public routes

| Route | Reason |
|-------|--------|
| `/marketplace` | Functional in-app feature (caregiver job board) |
| `/agencies` | Functional in-app feature (agency directory) |
| `/global-search` | Functional in-app feature (search) |
| `/privacy` | Legal requirement — accessible from Settings |
| `/terms` | Legal requirement — accessible from Settings |
| `/support/help` | In-app help |
| `/support/ticket` | Support ticket submission |
| `/support/refund` | Refund request |
| Auth pages (`/auth/*`) | Login, register, password reset, MFA |
| 404 catch-all | Still needed |

---

## 7. i18n Keys to Remove

After deleting pages, these translation key groups become unused:

| Namespace | Keys to remove | Files |
|-----------|---------------|-------|
| `common` | `nav.about`, `nav.features`, `nav.pricing`, `nav.contact` (from PublicNavBar) | `src/locales/en/*.json`, `src/locales/bn/*.json` |
| `common` | `sidebar.section.browse`, `sidebar.marketplace`, `sidebar.agencies`, `sidebar.shop` | Same |
| `common` | `sidebar.blog`, `sidebar.careers`, `sidebar.about`, `sidebar.features`, `sidebar.pricing` | Same |
| `common` | `sidebar.smartCareRoadmap` | Same |
| `common` | `home.*` (all `home.hero.*`, `home.features.*`, `home.stats.*`, `home.contact.*`) | Same |
| `features` | Entire namespace (was only used by FeaturesPage) | `src/locales/en/features.json` |
| `pricing` | Entire namespace (was only used by PricingPage) | `src/locales/en/pricing.json` |

Run `npm run i18n:sync` after changes to identify any remaining orphaned keys.

---

## 8. Execution Order

Recommended sequence to minimize breakage:

| Step | Action |
|------|--------|
| 1 | **Delete page files** (Section 1) — 11 files |
| 2 | **Remove routes** from `routes.ts` (Section 6A) — prevents runtime errors from deleted imports |
| 3 | **Update index route** (Section 6B) — `/` goes to login or dashboard redirect |
| 4 | **Strip sidebar** in `AuthenticatedLayout.tsx` (Section 4) — remove Browse section, clean Support section, remove roadmap links from all roles, make App Controls always visible |
| 5 | **Strip PublicNavBar** (Section 5) — remove marketing links |
| 6 | **Delete PublicFooter** + remove references from layouts |
| 7 | **Clean up kept pages** (Section 2) — strip marketing components from MarketplacePage, AgencyDirectoryPage, GlobalSearchPage, HelpCenterPage |
| 8 | **Test** — verify all remaining routes load, sidebar navigation works, mobile BottomNav still functions |
| 9 | **Build & sync** — `npm run build` + `npx cap sync` to verify no native build issues |

---

## Appendix: Files Changed Summary

### Files to DELETE (11)

```
src/frontend/pages/public/HomePage.tsx
src/frontend/pages/public/AboutPage.tsx
src/frontend/pages/public/FeaturesPage.tsx
src/frontend/pages/public/PricingPage.tsx
src/frontend/pages/public/ContactPage.tsx
src/frontend/pages/public/ExperienceAppPage.tsx
src/frontend/pages/community/BlogListPage.tsx
src/frontend/pages/community/BlogDetailPage.tsx
src/frontend/pages/community/CareerPage.tsx
src/frontend/pages/shared/SmartCareRoadmapPage.tsx
src/frontend/components/navigation/PublicFooter.tsx
```

### Files to EDIT (10)

```
src/app/routes.ts                                          — remove deleted routes, update index
src/frontend/components/shell/AuthenticatedLayout.tsx       — strip sidebar Browse/Support sections, remove roadmap links, make app controls always visible
src/frontend/components/shell/PublicLayout.tsx              — remove PublicFooter import
src/frontend/components/shell/ShopFrontLayout.tsx           — remove PublicFooter + PublicNavBar
src/frontend/components/navigation/PublicNavBar.tsx         — strip marketing nav links
src/frontend/pages/public/MarketplacePage.tsx               — strip website copy
src/frontend/pages/public/AgencyDirectoryPage.tsx           — remove "Register as Agency" CTA
src/frontend/pages/public/GlobalSearchPage.tsx              — remove "Trending Near You" sidebar
src/frontend/pages/shared/SettingsPage.tsx                  — add Privacy/Terms links
src/frontend/pages/support/HelpCenterPage.tsx               — strip hero, system status, inline styles
```

### Files to OPTIONALLY DELETE (1)

```
src/frontend/pages/support/ContactUsPage.tsx                — if support ticket covers the same need
```

---

## 9. Multi-Surface Architecture Plan

### 9A. Why This Plan Exists

CareNet was initially built as a single React website that served both marketing (landing pages, feature showcases, pricing, blog) and product (authenticated dashboards, role-specific tools) from one codebase. When the project pivoted to a Capacitor mobile app, the marketing pages were left in place. This created several problems:

1. **Bloated app bundle** — pages like Pricing, Features, Blog, and the Smart Care Roadmap ship to every mobile user but are never relevant inside the app.
2. **Confusing navigation** — the sidebar links to marketing pages (About, Pricing, Blog) alongside functional app pages, giving users 25+ nav items per role.
3. **Mixed concerns** — the same repo handles SEO landing pages, CMS content, and real-time care management. These have different deployment cadences, testing needs, and technical requirements (marketing needs SSR for SEO; the app needs offline-first and Capacitor native bridges).
4. **Poor role clarity** — each surface serves a fundamentally different audience and purpose:
   - The **marketing website** targets potential users who haven't signed up yet.
   - The **app** (mobile + desktop) targets authenticated users doing real work.

The solution is to split into **two repos** serving **three surfaces**, with clear boundaries between them.

### 9B. Three Surfaces, Two Repos

| Surface | Auth? | Purpose | Repo | Tech Stack | Deployment |
|---------|-------|---------|------|------------|------------|
| **Mobile App** | Yes (Capacitor) | Caregivers, guardians, patients, agencies, shops doing daily work on phones/tablets | `CareNet 2` (current repo) | React 18 + Vite + Capacitor | App stores via `npm run build` + `npx cap sync` |
| **Desktop Web App** | Yes (browser) | Same users on larger screens — wider sidebar, more table views, multi-column layouts | `CareNet 2` (same build) | Same codebase, responsive breakpoints | Vercel / Netlify / Cloudflare Pages |
| **Marketing Website** | No | SEO landing pages, feature showcases, pricing, blog, careers, contact — drives signups | `CareNet Marketing` (new repo) | Astro (recommended) or Next.js | Separate CDN / static hosting |

**Mobile App and Desktop Web App are the same build.** The `AuthenticatedLayout` already adapts via responsive breakpoints — sidebar is always visible on `lg:` screens, hamburger + BottomNav on mobile. No separate builds or feature flags needed.

### 9C. What Moves to the Marketing Repo

The following pages are deleted from the app repo and recreated in the marketing repo:

| Page | Current Route | Notes for Marketing Repo |
|------|--------------|--------------------------|
| Home / Landing | `/`, `/home` | Hero, stats, CTAs → "Download App" / "Open Web App" buttons |
| About | `/about` | Company story, role guides, values |
| Features | `/features` | Per-role feature tabs, platform highlights |
| Pricing | `/pricing` | Tier comparison, FAQ, CTA footer |
| Contact | `/contact` | Contact form, social links, office address |
| Experience the App | `/experience` | Sandbox demo — only on marketing site |
| Blog List | `/community/blog` | Blog listing with categories, trending |
| Blog Detail | `/community/blog/:id` | Article view |
| Careers | `/community/careers` | Job openings at CareNet |
| Smart Care Roadmap | `/smart-care/roadmap` | Product roadmap showcase |
| Public Footer | Component | Marketing site footer |

### 9D. What Stays in the App Repo

Everything that's **functional, authenticated, or legal**:

| Category | Pages | Notes |
|----------|-------|-------|
| **Auth** | Login, Register, Forgot Password, Reset Password, MFA Setup, MFA Verify, Role Selection, Verification Result | Public but not marketing |
| **Role Dashboards** | Guardian, Caregiver, Patient, Agency, Shop, Admin, Moderator | Core app |
| **Role Features** | Patients, Jobs, Schedule, Messages, Care Log, Earnings, Wallet, Contracts, Reviews, Portfolio, etc. | All role-specific tools |
| **Shared** | Dashboard redirect, Settings, Notifications, Profile, Marketplace, Agency Directory, Global Search, Billing, Support Ticket, Refund Request | Functional in-app features |
| **Legal** | Privacy Policy, Terms of Service | Minimal in-app versions; full versions on marketing site |
| **404** | Not Found | Still needed |

### 9E. App Entry Point Strategy

After cleanup, the app's URL behavior is:

```
https://app.carenet.xyz/
  ├── /                          → redirects to /auth/login (or /{role}/dashboard if logged in)
  ├── /auth/login                → login page
  ├── /auth/register/:role       → registration
  ├── /{role}/dashboard          → role dashboard (authenticated)
  ├── /{role}/*                  → all role-specific pages (authenticated)
  ├── /settings                  → app settings
  ├── /support/ticket            → submit support ticket
  ├── /support/help              → help center
  ├── /support/refund            → refund request
  ├── /privacy                   → minimal privacy policy
  ├── /terms                     → minimal terms of service
  ├── /marketplace               → caregiver job board
  ├── /agencies                  → agency directory
  ├── /global-search             → search
  └── /*                         → 404
```

No landing page. No marketing. The URL is the **product**, not the **pitch**.

### 9F. Marketing Website Entry Point Strategy

```
https://carenet.xyz/  (or www.carenet.xyz)
  ├── /                          → landing page (hero, features, stats, CTAs)
  ├── /about                     → company story, role guides
  ├── /features                  → feature showcase
  ├── /pricing                   → pricing tiers
  ├── /contact                   → contact form
  ├── /experience                → sandbox demo
  ├── /blog                      → blog listing
  ├── /blog/:slug                → blog article
  ├── /careers                   → job openings
  ├── /roadmap                   → product roadmap
  ├── /privacy                   → full privacy policy (SEO-optimized)
  ├── /terms                     → full terms of service (SEO-optimized)
  └── /download                  → links to app stores + web app URL
```

### 9G. Cross-Linking Between Surfaces

| From | To | How |
|------|----|-----|
| Marketing → App | "Open App" / "Sign In" buttons | Link to `https://app.carenet.xyz/auth/login` |
| Marketing → App | "Download" buttons | Link to App Store / Play Store URLs |
| App → Marketing | Privacy Policy (full version) | `PUBLIC_MARKETING_URL` env var → open in external browser / InAppBrowser |
| App → Marketing | Terms of Service (full version) | Same env var |
| App → Marketing | Blog, Careers, About | Remove links from sidebar. If needed, open in external browser via env var. |
| Marketing → App | Deep links | `https://app.carenet.xyz/guardian/dashboard` etc. with Capacitor deep link handling |

### 9H. Environment Variable

Add to `.env` / `.env.production`:

```env
# URL of the marketing website — used for "Learn More" links, legal pages, etc.
VITE_PUBLIC_MARKETING_URL=https://carenet.xyz
```

Usage in the app:

```tsx
const MARKETING_URL = import.meta.env.VITE_PUBLIC_MARKETING_URL ?? "https://carenet.xyz";

// In SettingsPage — link to full privacy policy
<a href={`${MARKETING_URL}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>

// In HelpCenterPage — link to blog
<a href={`${MARKETING_URL}/blog`} target="_blank" rel="noopener noreferrer">CareNet Blog</a>
```

### 9I. Recommended Tech Stack for Marketing Repo

**Astro** (recommended) — reasons:

| Factor | Why Astro |
|--------|-----------|
| **SEO** | Static HTML by default — no client-side rendering needed for landing pages |
| **Performance** | Zero JS shipped by default; add React/Vue/etc. only where interactive |
| **Content** | Built-in Markdown/MDX collections for blog posts — no CMS needed initially |
| **Simplicity** | The marketing site has no real-time features, no Supabase subscriptions, no offline sync |
| **Familiar** | Uses the same Tailwind + CSS tokens — design consistency with the app |
| **i18n** | Astro supports i18n routing out of the box |

Alternatives: Next.js (if the team prefers React-only), or a static site generator like Hugo.

The marketing repo does **NOT** need:
- Supabase client
- Dexie / IndexedDB
- Capacitor
- Service worker / offline sync
- Real-time subscriptions
- Complex auth flows

### 9J. Shared Code Between Repos

| What | Strategy |
|------|----------|
| Design tokens (`tokens.ts`, `theme.css`) | Copy into marketing repo, or extract to a shared npm package |
| Tailwind config (`tailwind.css`) | Same Tailwind v4 setup, duplicated |
| Logo / brand assets | Shared via a `carenet-assets` folder or CDN |
| i18n strings | Separate per repo — marketing has its own locale files, app keeps its own |
| Supabase types/models | Marketing repo doesn't need them (or needs only read-only public types) |
| Translation scripts | Each repo runs its own `i18n:sync` |

### 9K. Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                    DNS (carenet.xyz)                  │
├──────────────┬───────────────────────────────────────┤
│  carenet.xyz │  app.carenet.xyz                      │
│  www.* → @   │  (or app.* CNAME)                     │
├──────────────┼───────────────────────────────────────┤
│  Marketing   │  CareNet App (Vite build)             │
│  (Astro)     │  ├── Mobile: Capacitor build          │
│  Static CDN  │  ├── Desktop: served by Vercel/CF     │
│              │  └── API: Supabase backend             │
├──────────────┼───────────────────────────────────────┤
│  SEO, CMS,   │  Auth, Realtime, Offline,             │
│  Landing     │  Care Management, Billing, etc.       │
│  Pages       │                                       │
└──────────────┴───────────────────────────────────────┘
```

### 9L. Migration Steps

| Step | Action |
|------|--------|
| 1 | **Create marketing repo** — scaffold Astro project with Tailwind v4, copy design tokens and brand assets from app repo |
| 2 | **Migrate marketing pages** — move HomePage, AboutPage, FeaturesPage, PricingPage, ContactPage, BlogListPage, BlogDetailPage, CareerPage, ExperienceAppPage, SmartCareRoadmapPage into Astro components. Adapt to Astro's component model. |
| 3 | **Set up marketing i18n** — copy relevant locale keys (home.*, features.*, pricing.*, etc.) into marketing repo's i18n setup |
| 4 | **Set up marketing deployment** — deploy to carenet.xyz via Vercel/Netlify/Cloudflare Pages |
| 5 | **Add `VITE_PUBLIC_MARKETING_URL`** to app repo's `.env.production` |
| 6 | **Execute the app cleanup** — follow Section 8 execution order from this audit |
| 7 | **Deploy app** — deploy cleaned app to app.carenet.xyz |
| 8 | **Configure DNS** — ensure carenet.xyz → marketing, app.carenet.xyz → webapp |
| 9 | **Update app store listings** — update website URL fields to point to carenet.xyz (marketing) |
| 10 | **Verify deep links** — test that marketing site CTAs correctly link into app.carenet.xyz/auth/login and that Capacitor deep links work |

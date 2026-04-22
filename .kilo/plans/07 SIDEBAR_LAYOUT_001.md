# SIDEBAR_LAYOUT_001 — Reposition Sidebar Between Top Bar and Bottom Nav

---

## 3. CURRENT STATE

### Relevant Modules — Verified Against Codebase

**IMPORTANT CORRECTIONS:** Several paths in the task spec do not exist in the codebase. The actual architecture is documented below.

**Frontend — ACTUAL components (not as listed in task spec):**

| Spec Reference | Actual Location | Notes |
|---|---|---|
| `src/frontend/components/shell/TopBar.tsx` | **DOES NOT EXIST** | Top bar is inline `<header>` inside `AuthenticatedLayout.tsx` (line 682-752) |
| `src/frontend/components/shell/BottomNav.tsx` | `src/frontend/components/navigation/BottomNav.tsx` | Different path; universal 5-tab bar |
| `src/frontend/components/shared/Sidebar.tsx` | **DOES NOT EXIST** | Sidebar is inline `<aside>` inside `AuthenticatedLayout.tsx` (line 427-677) |
| `src/frontend/components/shared/ProfileLayout.tsx` | **DOES NOT EXIST** | No per-page-type layout wrappers |
| `src/frontend/components/shared/UserLayout.tsx` | **DOES NOT EXIST** | — |
| `src/frontend/components/shared/RoleLayout.tsx` | **DOES NOT EXIST** | — |
| `src/frontend/components/shared/ScreenLayout.tsx` | **DOES NOT EXIST** | — |
| `src/frontend/pages/profile/*` | `src/frontend/pages/{role}/ProfilePage.tsx` | Profile pages are per-role, not in a shared `profile/` dir |
| `src/frontend/pages/user/*` | `src/frontend/pages/admin/AdminUsersPage.tsx`, `admin/UserInspectorPage.tsx` | User management is admin-only |
| `src/frontend/pages/role/*` | `src/frontend/pages/auth/RoleSelectionPage.tsx`, `auth/RegisterPage.tsx` | Role selection is under auth |
| `src/frontend/pages/screen/*` | **DOES NOT EXIST** | No screen pages exist in the codebase |
| `src/app/App.tsx` | `src/app/App.tsx` | Exists; delegates layout to router tree |

**Actual layout architecture (4 shell components):**

| File | Role | Provides |
|---|---|---|
| `src/frontend/components/shell/RootLayout.tsx` | Route tree root | Global hooks + `<Outlet />` |
| `src/frontend/components/shell/AuthenticatedLayout.tsx` | All logged-in pages | Inline sidebar + inline header + `<BottomNav>` |
| `src/frontend/components/shell/PublicLayout.tsx` | Public pages (login, register, role-selection) | `<PublicNavBar>` + `<BottomNav>` (no sidebar) |
| `src/frontend/components/shell/ShopFrontLayout.tsx` | Customer-facing shop | `<PublicNavBar>` + `<BottomNav>` (no sidebar) |
| `src/frontend/components/shell/Layout.tsx` | **DEPRECATED** passthrough | Renders `<>{children}</>` only |

**Backend:** None — UI-only change.

**Database:** None — UI-only change.

**Supabase:**
- **RLS Policies:** N/A — no database access in this change. No tables are queried or modified.
- **Data Scoping:** N/A — this change does not touch any data-fetching logic. All existing `sbRead`/`sbWrite`/`currentUserId` helpers remain untouched.
- **Realtime:** N/A — no realtime subscriptions are added, removed, or modified. The existing `usePendingProofCount` and `useUnreadCounts` hooks in `AuthenticatedLayout` are unchanged.
- **Policies, triggers, functions:** None affected.

### Page-to-Layout Mapping (Verified)

| Page Category | Layout Shell | Has Sidebar? | Has Top Bar? | Has BottomNav? |
|---|---|---|---|---|
| Caregiver profile (`/caregiver/profile`) | AuthenticatedLayout | Yes (desktop: static left col; mobile: fixed slide-in) | Yes (inline header, z-30) | Yes (fixed, z-50) |
| Guardian profile (`/guardian/profile`) | AuthenticatedLayout | Yes | Yes | Yes |
| Patient profile (`/patient/profile`) | AuthenticatedLayout | Yes | Yes | Yes |
| Public profiles (`/guardian/caregiver/:id`, etc.) | AuthenticatedLayout | Yes | Yes | Yes |
| Admin users (`/admin/users`) | AuthenticatedLayout | Yes | Yes | Yes |
| Admin user inspector (`/admin/user-inspector`) | AuthenticatedLayout | Yes | Yes | Yes |
| Role selection (`/auth/role-selection`) | PublicLayout | **NO** | PublicNavBar (sticky, z-50, safe-area-top) | Yes |
| Register (`/auth/register`) | PublicLayout | **NO** | PublicNavBar | Yes |
| "Screen" pages | **DO NOT EXIST** | — | — | — |

### Current Behavior — AuthenticatedLayout (Exact DOM, lines 400-776)

```
<div min-h-screen flex flex-col>                        ← outermost wrapper (L401)
  <a ...skip-to-content... z-[100]>                     ← a11y (L403-409)
  <OfflineIndicator />                                  ← full-width banner (L412)
  <RetryOverlay />                                      ← retry backoff (L415)
  <NotificationPermissionPrompt />                      ← one-time prompt (L418)

  <div flex flex-1 min-h-0>                             ← FLEX ROW (L420)
    {sidebarOpen && <div backdrop z-40>}                ← mobile backdrop (L422-424)
    <aside                                              ← SIDEBAR (L427-677)
      fixed top-14 left-0 z-50 w-64
      bottom: calc(3.5rem + env(safe-area-inset-bottom))
      md:static md:h-auto md:max-h-screen md:translate-x-0
    >
      ...nav sections, browse, support, app controls...
    </aside>

    <div flex-1 flex flex-col min-w-0>                  ← MAIN COLUMN (L680)
      <header sticky top-0 z-30 h-14 border-b>          ← HEADER (L682-752)
        ...search, notifications, messages, avatar...
      </header>

      <main flex-1 cn-bottom-safe overflow-y-auto>      ← PAGE CONTENT (L755)
        <Outlet />
      </main>
    </div>
  </div>                                                ← end flex row (L763)

  <BottomNav fixed bottom-0 z-50>                       ← BOTTOM NAV (L766-770)
</div>
```

### Current Z-Index Stack (Verified)

| Component | z-index | Position | File:Line |
|---|---|---|---|
| Skip-to-content link | `z-[100]` | fixed | AuthenticatedLayout.tsx:405 |
| PublicNavBar mobile drawer | `z-[70]` | fixed | PublicNavBar.tsx:201 |
| PublicNavBar backdrop | `z-[60]` | fixed | PublicNavBar.tsx:194 |
| Sidebar `<aside>` | `z-50` | fixed (mobile) / static (desktop) | AuthenticatedLayout.tsx:429 |
| BottomNav | `z-50` | fixed | BottomNav.tsx:76 |
| PublicNavBar header | `z-50` | sticky | PublicNavBar.tsx:78 |
| Sidebar backdrop | `z-40` | fixed | AuthenticatedLayout.tsx:423 |
| AuthenticatedLayout header | `z-30` | sticky | AuthenticatedLayout.tsx:683 |

### Current Safe-Area Handling (Verified)

| Component | Safe-Area Usage | Source |
|---|---|---|
| PublicNavBar header | `pt-[env(safe-area-inset-top,0px)]` | PublicNavBar.tsx:78 |
| BottomNav | `paddingBottom: env(safe-area-inset-bottom, 0px)`, `minHeight: calc(3.5rem + env(safe-area-inset-bottom, 0px))` | BottomNav.tsx:81-83 |
| AuthenticatedLayout sidebar (mobile) | `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px))` | AuthenticatedLayout.tsx:433 |
| AuthenticatedLayout `<main>` | `cn-bottom-safe` class → `padding-bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px))` | AuthenticatedLayout.tsx:755, theme.css:448 |
| AuthenticatedLayout header | **NONE** — no safe-area-inset-top | AuthenticatedLayout.tsx:682 |
| PublicNavBar mobile drawer | `bottom: calc(3.5rem + env(safe-area-inset-bottom, 0px))`, footer `paddingBottom: max(0.75rem, env(safe-area-inset-bottom, 0px))` | PublicNavBar.tsx:205, 323 |

### CSS Variables Available (theme.css:87-90)

```css
--cn-header-height: 3.5rem;           /* 56px */
--cn-mobile-header-height: 3.5rem;    /* 56px */
--cn-bottom-nav-height: 3.5rem;       /* 56px */
--cn-sticky-submit-height: 5rem;      /* 80px */
```

### Known Issues — Verified Against Code

- [x] **AuthenticatedLayout header has NO safe-area-inset-top** — unlike PublicNavBar which has `pt-[env(safe-area-inset-top,0px)]`. On iOS devices with notch, the header sits behind the status bar.
- [x] **Mobile sidebar `top-14` is hardcoded** — uses Tailwind class `top-14` (3.5rem) instead of dynamic calc with safe-area. Doesn't account for the header potentially being taller due to safe-area padding.
- [x] **Desktop header sits BESIDE sidebar, not above it** — header is inside the right flex column, so on desktop the header only spans the content area, not the full viewport width.
- [x] **Desktop sidebar uses `md:max-h-screen`** — constrains to viewport height, which is correct when sidebar is inside the flex row, but will break if the header is moved above the flex row (sidebar would overflow below viewport).
- [x] **`cn-bottom-safe` hardcodes `3.5rem`** (theme.css:448) instead of using `var(--cn-bottom-nav-height)` — pre-existing inconsistency, not introduced by this change.
- [ ] Sidebar positioning is inconsistent across profile/role/user/screen pages — **PARTIALLY TRUE**: All authenticated pages have consistent sidebar via AuthenticatedLayout. Role pages in PublicLayout intentionally have no sidebar.
- [ ] Mobile touch targets may be obscured by overlapping elements — not verified; existing `cn-touch-target` class enforces 44x44px minimums.
- [ ] Content area may not be scrollable — `overflow-y-auto` on `<main>` handles this.

---

## 1. IMPACT ANALYSIS

### Affected Modules

| File | Change Type | Risk |
|---|---|---|
| `src/frontend/components/shell/AuthenticatedLayout.tsx` | DOM restructure + class/style changes | **Medium** — affects ALL authenticated pages |
| `src/frontend/components/navigation/PublicNavBar.tsx` | Style change (drawer `top` value) | **Low** — single value change |
| `src/styles/theme.css` | Add new CSS variable | **Low** — additive only |

### Risk Level: **Medium**

Justification:
- AuthenticatedLayout DOM restructuring touches every logged-in page (caregiver, guardian, patient, agency, admin, moderator, shop).
- Desktop visual layout changes significantly (header now full-width above sidebar vs. beside sidebar).
- No backend, database, auth, or realtime changes — pure CSS/DOM restructuring.
- Change is reversible with `git revert` — no data migrations involved.

### Breaking Change Assessment

| Aspect | Breaking? | Details |
|---|---|---|
| Public API | No | No endpoints touched |
| Database schema | No | No tables/columns touched |
| RLS policies | No | No policies touched |
| Visual layout (desktop) | **Yes — intentional** | Header moves from inside right column to full-width above sidebar+content. This is the requested change. |
| Visual layout (mobile) | No | Sidebar already slides in below header area; only the safe-area calc changes |
| Navigation functionality | No | All links, role switching, sidebar toggle, BottomNav behavior unchanged |
| i18n | No | No new strings, no changed strings |
| Existing tests | Unlikely | No existing tests for AuthenticatedLayout component; BottomNav tests don't assert layout structure |

### Pages Affected by AuthenticatedLayout Change

All pages inside the `AuthenticatedLayout` route tree (via `routes.ts`):
- `/caregiver/*` — dashboard, profile, jobs, schedule, messages, earnings, etc.
- `/guardian/*` — dashboard, profile, patients, schedule, messages, etc.
- `/patient/*` — dashboard, profile, care-history, schedule, messages, etc.
- `/agency/*` — dashboard, caregivers, clients, shifts, messages, etc.
- `/admin/*` — dashboard, users, verifications, reports, etc.
- `/moderator/*` — dashboard, reviews, reports, content, etc.
- `/shop/*` — dashboard, products, orders, inventory, etc.
- Shared authenticated routes: `/settings`, `/wallet`, `/billing`, `/contracts`, `/notifications`, `/messages`

### Pages NOT Affected

- Public pages via `PublicLayout`: `/auth/*`, `/privacy`, `/terms`, `/support/*`
- Shop-front pages via `ShopFrontLayout`: `/shop` (customer), `/shop/product/:id`, `/shop/cart`, etc.

### DISCREPANCY: "Role Pages" and "Screen Pages"

**"Role pages"** (`RoleSelectionPage`, `RegisterPage`) are inside `PublicLayout`, which has NO sidebar. These are pre-login / role-switching pages. Adding a sidebar here would:
1. Require a significant new feature (sidebar in public layout)
2. Conflict with the existing `PublicNavBar` mobile drawer (which already has navigation links)
3. Not match the task's user flow (steps 1-7 describe authenticated behavior)

**Decision:** Role pages are OUT OF SCOPE for this task. The sidebar repositioning applies to `AuthenticatedLayout` only, where a sidebar already exists. PublicLayout's mobile drawer top-position fix is included as a related safe-area bug fix.

**"Screen pages"** — no such pages exist in the codebase. No `screen/` directory, no routes with `/screen` prefix. This appears to be a spec error.

**Decision:** Screen pages are NOT APPLICABLE. No action needed.

---

## 2. ARCHITECTURE DECISION

### Chosen Approach

Extract the inline `<header>` from inside the right flex column in `AuthenticatedLayout.tsx` and place it as a full-width element above the sidebar+content flex row. This creates a three-tier vertical stack matching the `PublicLayout` pattern:

```
HEADER (full-width, sticky, safe-area-top)
├── SIDEBAR (desktop: static left col) | CONTENT (desktop: right col)
└── [mobile: fixed slide-in]
BOTTOM NAV (fixed)
```

### Alternatives Considered

1. **Keep side-by-side, only add safe-area** — Header stays beside sidebar on desktop. Rejected because user explicitly requested full-width header above sidebar.

2. **CSS Grid instead of Flexbox** — Replace the flex row with `display: grid; grid-template-columns: auto 1fr`. Rejected because the current flex approach works and grid would be a larger diff for no functional benefit.

3. **Use shadcn/ui Sidebar primitives** (`src/frontend/components/ui/sidebar.tsx`) — Rejected because `AuthenticatedLayout` has a hand-rolled sidebar with role-based nav sections, collapsible groups, and specific styling that doesn't map cleanly to the shadcn primitives.

### Why This Approach Is Optimal

- **Minimal DOM restructuring:** Move one element (header) up one level in the tree. No new components, no rewrites.
- **Matches existing pattern:** `PublicLayout` already uses this three-tier stack (`PublicNavBar` → `<main>` → `BottomNav`). We're aligning `AuthenticatedLayout` to the same pattern.
- **Uses existing CSS variables:** `--cn-header-height` (3.5rem) already defined in `theme.css:88`. Safe-area `env()` calls follow the same pattern used by `PublicNavBar`, `BottomNav`, and the sidebar's existing `bottom` calculation.
- **No state management changes:** Sidebar open/close, collapsed sections, active role detection — all unchanged.
- **No new dependencies:** No new libraries, no new state stores, no new routing patterns.

### Performance Considerations

- **Layout reflow:** Moving the header above the flex row is a single DOM mutation. The browser recalculates layout once. This is not a performance concern — it's equivalent to any CSS change.
- **No repaint penalty:** The header is already rendered; we're changing its position in the DOM tree, not adding new painted elements.
- **Desktop `max-h-screen` removal:** Changing `md:max-h-screen` to `md:max-h-none` on the sidebar removes a viewport-height constraint. The parent flex column now constrains the sidebar height instead. No performance impact.

---

## 3. DATABASE DESIGN

**Not applicable.** This is a UI-only layout change. No database tables, columns, indexes, RLS policies, or realtime subscriptions are affected.

- **Tables affected:** None
- **RLS Policy Updates:** None — no database access patterns are changed
- **Data Scoping:** No change — all existing data scoping logic (user-scoped via `auth.uid()`, role-filtered queries) remains untouched
- **Realtime Changes:** None — no channels added/removed/modified

---

## 4. API DESIGN

**Not applicable.** This is a UI-only layout change. No API endpoints are added, modified, or removed.

- **Endpoints:** None
- **Supabase Query Details:** None — no queries changed. Existing `sbRead`/`sbWrite`/`sb`/`currentUserId` usage in `AuthenticatedLayout`-child pages is unaffected.

---

## 5. FRONTEND DESIGN

### Components to Update

#### 5.1 `AuthenticatedLayout.tsx` (lines 400-776) — Primary Change

**Change A: Move header above flex row (structural)**

Current (lines 418-763):
```tsx
<NotificationPermissionPrompt />
<div className="flex flex-1 min-h-0">       ← flex row starts here (L420)
  <aside ...>                               ← sidebar
  <div className="flex-1 flex flex-col min-w-0">  ← main column (L680)
    <header ...>                            ← HEADER IS HERE (L682-752)
    <main ...>
  </div>
</div>
```

Target:
```tsx
<NotificationPermissionPrompt />
<header className="sticky top-0 z-30 border-b cn-safe-top"    ← HEADER MOVED HERE
  style={{ background: cn.bgHeader, boxShadow: cn.shadowHeader, borderColor: cn.borderLight }}>
  <div className="max-w-6xl mx-auto w-full h-14 px-4 sm:px-6 flex items-center gap-3">
    {/* ...search, notifications, messages, avatar — UNCHANGED */ }
  </div>
</header>
<div className="flex flex-1 min-h-0">       ← flex row (unchanged position)
  <aside ...>                               ← sidebar (with fixes — see Change B)
  <div className="flex-1 flex flex-col min-w-0">
    <main ...>                              ← NO header here anymore
  </div>
</div>
```

**Specific edit:** Cut lines 682-752 (`<header>` through `</header>`) and paste after line 418 (`<NotificationPermissionPrompt />`), before line 420 (`<div className="flex flex-1 min-h-0">`).

**Change B: Add safe-area-inset-top to header**

Current (line 683):
```tsx
className="sticky top-0 z-30 border-b"
```

Target:
```tsx
className="sticky top-0 z-30 border-b cn-safe-top"
```

Uses the existing `cn-safe-top` utility class from `theme.css:392` which applies `padding-top: env(safe-area-inset-top, 0px)`. This matches the pattern used by `PublicNavBar` (line 78).

**Change C: Fix mobile sidebar top position**

Current (line 429):
```tsx
className={`fixed top-14 left-0 z-50 flex w-64 min-h-0 flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:h-auto md:max-h-screen md:min-h-0 md:self-stretch md:translate-x-0`}
style={{
  background: cn.bgSidebar,
  boxShadow: cn.shadowSidebar,
  bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
  transition: "translate 300ms ease-in-out, transform 300ms ease-in-out",
}}
```

Target:
```tsx
className={`fixed left-0 z-50 flex w-64 min-h-0 flex-col overflow-hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:static md:h-auto md:max-h-none md:min-h-0 md:self-stretch md:translate-x-0`}
style={{
  top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))",
  background: cn.bgSidebar,
  boxShadow: cn.shadowSidebar,
  bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
  transition: "translate 300ms ease-in-out, transform 300ms ease-in-out",
}}
```

Changes:
1. Remove `top-14` from className (hardcoded 3.5rem)
2. Add `top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))"` to inline style — uses CSS variable instead of hardcoded value
3. Change `md:max-h-screen` → `md:max-h-none` — sidebar height is now constrained by the parent flex column, not viewport
4. Change `bottom` to use `var(--cn-bottom-nav-height)` instead of hardcoded `3.5rem` — consistent with CSS variable usage

**Change D: Remove sidebar logo section (desktop only)**

Since the header is now full-width and contains the logo/branding area, the sidebar's own logo section (lines 437-445) becomes redundant on desktop. However, on mobile the sidebar is a slide-in panel and still needs its own header with close button. **No change needed** — the existing close button (`md:hidden`) already hides on desktop, and the logo link is harmless.

**Z-index conflict analysis:**

After the change, the header sits as a sibling ABOVE the flex row (not inside it). The z-index stack remains valid:

| Component | z-index | Concern |
|---|---|---|
| Header (now above flex row) | `z-30` | Sticky, stays at viewport top. Sidebar z-50 will overlap it when open on mobile — this is correct behavior (sidebar slides over header) |
| Sidebar backdrop | `z-40` | Above header — correct, dims everything |
| Sidebar | `z-50` | Above backdrop and header — correct |
| BottomNav | `z-50` | Same as sidebar — both are fixed at edges, no overlap |
| Skip-to-content | `z-[100]` | Always on top — correct |

**No z-index conflicts introduced.** The header at z-30 is below the sidebar at z-50, which is the desired behavior when the sidebar slides in on mobile.

#### 5.2 `PublicNavBar.tsx` (line 201) — Related Safe-Area Fix

Current:
```tsx
<aside
  className="fixed left-0 top-14 z-[70] flex w-72 min-w-0 flex-col overflow-hidden md:hidden"
  style={{
    background: cn.bgSidebar,
    boxShadow: menuOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
    bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))",
    ...
  }}
```

Target:
```tsx
<aside
  className="fixed left-0 z-[70] flex w-72 min-w-0 flex-col overflow-hidden md:hidden"
  style={{
    top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))",
    background: cn.bgSidebar,
    boxShadow: menuOpen ? "4px 0 24px rgba(0,0,0,0.18)" : "none",
    bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
    ...
  }}
```

Changes:
1. Remove `top-14` from className
2. Add `top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))"` to inline style
3. Change `bottom` to use `var(--cn-bottom-nav-height)` instead of hardcoded `3.5rem`

#### 5.3 `src/styles/theme.css` — No Changes Required

The existing CSS variables `--cn-header-height` and `--cn-bottom-nav-height` are already defined at lines 88-90. The existing `cn-safe-top` utility class at line 392 provides the safe-area padding. No new CSS is needed.

**Note on pre-existing `cn-bottom-safe` hardcoding:** `cn-bottom-safe` (line 448) uses hardcoded `3.5rem` instead of `var(--cn-bottom-nav-height)`. This is a pre-existing inconsistency. Fixing it is out of scope for this task but should be noted as a follow-up.

### State Management Changes

None. All existing state remains identical:
- `sidebarOpen` (boolean) — toggle via BottomNav "Menu" event listener
- `sidebarBrowseOpen`, `sidebarSupportOpen`, `sidebarAppOpen` (booleans) — collapsible sections
- `collapsedSections` (Record<string,boolean>) — nav section collapse state
- `useAuth()` — role detection, user info
- `useUnreadCounts()` — notification/message badges
- `usePendingProofCount()` — billing badge

### API Integration

None. No API calls added or modified.

### Loading/Error Handling

No changes. Existing `<Suspense fallback={<PageSkeleton />}>` and `<OfflineIndicator />` / `<RetryOverlay />` remain in their current positions.

### Accessibility Considerations

- **Skip-to-content link** (`z-[100]`): Positioned above the new header location. Still works — `#main-content` target unchanged.
- **`useFocusOnNavigate()`:** Focuses `#main-content` on route change. `<main>` element and its `id` are unchanged.
- **Sidebar `aria-label`:** `aria-label={t("a11y.sidebarNav", "Sidebar navigation")}` — unchanged.
- **Header tab order:** Header was previously after sidebar in DOM order (inside right column). Now it's before sidebar. This changes the natural tab order, which is correct — header controls (search, notifications) should receive focus before sidebar navigation.
- **Reduced motion:** The sidebar transition uses `transition: "translate 300ms ease-in-out, transform 300ms ease-in-out"`. The existing `prefers-reduced-motion` rule at `theme.css:4` only targets `.cn-toast-no-motion` elements. The sidebar transition is NOT affected by reduced-motion preferences. **This is a pre-existing gap** — not introduced by this change. The sidebar transition duration and the header repositioning itself have no motion animation (it's a DOM reorder, not an animation).

### i18n Changes

None. No new user-facing strings. All existing `t()` calls remain unchanged.

### Realtime Integration

No changes to realtime subscriptions. The existing hooks (`useUnreadCounts`, `usePendingProofCount`) and their channel management remain untouched.

---

## 6. IMPLEMENTATION PLAN (STEP-BY-STEP)

### Step 1: Add `cn-safe-top` to AuthenticatedLayout header class
- **File:** `src/frontend/components/shell/AuthenticatedLayout.tsx`
- **Line 683:** Change `className="sticky top-0 z-30 border-b"` to `className="sticky top-0 z-30 border-b cn-safe-top"`
- **Why:** Adds `padding-top: env(safe-area-inset-top, 0px)` matching PublicNavBar pattern
- **Risk:** Zero — additive only

### Step 2: Move header above flex row in AuthenticatedLayout
- **File:** `src/frontend/components/shell/AuthenticatedLayout.tsx`
- **Action:** Cut the `<header>` block (lines 682-752) and paste after `<NotificationPermissionPrompt />` (line 418), before `<div className="flex flex-1 min-h-0">` (line 420)
- **Why:** Creates full-width header above sidebar+content
- **Risk:** Low — DOM reorder only, no logic changes. Header contents (search, notifications, avatar) are unchanged.

### Step 3: Fix mobile sidebar top position in AuthenticatedLayout
- **File:** `src/frontend/components/shell/AuthenticatedLayout.tsx`
- **Line 429:** Remove `top-14` from className
- **Add to inline style:** `top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))"`
- **Line 429:** Change `md:max-h-screen` to `md:max-h-none` in className
- **Line 433:** Change `bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))"` to `bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))"`
- **Why:** Uses CSS variable instead of hardcoded value; accounts for safe-area; constrains height via parent flex instead of viewport
- **Risk:** Low — same visual result on standard devices, better behavior on notched devices

### Step 4: Fix PublicNavBar mobile drawer top position
- **File:** `src/frontend/components/navigation/PublicNavBar.tsx`
- **Line 201:** Remove `top-14` from className
- **Add to inline style:** `top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))"`
- **Line 205:** Change `bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))"` to `bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))"`
- **Why:** Same safe-area fix applied to PublicNavBar's mobile drawer
- **Risk:** Low — consistent with AuthenticatedLayout fix

### Step 5: Visual verification (manual)
- Run `npm run dev`
- **Desktop (>768px):** Verify header spans full viewport width above sidebar. Sidebar left column. Content right column. No overlap. Header sticky on scroll.
- **Mobile (<768px):** Verify header at top (with safe-area on notched devices). Sidebar slides in from left, starting below header, ending above BottomNav. BottomNav at bottom.
- **Tablet (768-1024px):** Verify same as desktop. Sidebar visible, header full-width.
- **All viewports:** Verify no z-index conflicts (sidebar overlays header when open, BottomNav stays on top).
- **All viewports:** Verify all navigation links work (sidebar links, header notifications, BottomNav tabs).
- **All viewports:** Verify sidebar open/close toggle still works (BottomNav "Menu" tab dispatches `toggle-sidebar` event).

### Step 6: Build verification
- Run `npm run build` to verify no TypeScript compilation errors
- Run `npm run lint` (or project lint command) if available
- If changes affect native behavior: run `npx cap sync` after build

---

## 7. EDGE CASES & FAILURE HANDLING

| Scenario | Expected Behavior | Why |
|---|---|---|
| **iOS device with notch** | Header pushed down by safe-area-inset-top. Sidebar starts below header (including safe-area offset). BottomNav pushed up by safe-area-inset-bottom. | `cn-safe-top` on header + `top: calc(var(--cn-header-height) + env(safe-area-inset-top))` on sidebar |
| **Android gesture navigation** | BottomNav already handles safe-area-inset-bottom. No change to this behavior. | `env(safe-area-inset-bottom, 0px)` fallback to 0 |
| **Desktop browser (no safe-area)** | All `env()` values resolve to 0px. Layout identical to current minus header repositioning. | `env(safe-area-inset-top, 0px)` fallback |
| **Very short viewport (<500px)** | Sidebar internal scroll region (`cn-scroll-mobile`) handles overflow. `flex-1 min-h-0` ensures sidebar doesn't push content off-screen. | Existing `overflow-hidden` + scroll region |
| **Sidebar open while soft keyboard visible** | Existing behavior preserved. Sidebar `bottom: calc(...)` anchors to BottomNav position, which may shift with keyboard on some devices. | No change to keyboard handling |
| **OfflineIndicator visible** | Renders above header (sibling in outer flex column). Pushes everything down including header. Sidebar `top` calc uses `var(--cn-header-height)` which doesn't include OfflineIndicator height — sidebar may start slightly lower than the visible header bottom. **Pre-existing behavior** — OfflineIndicator is always visible and pushes content. | No change |
| **Reduced motion preference** | Sidebar slide transition (300ms) is NOT affected by `prefers-reduced-motion`. This is a pre-existing gap — the sidebar transition has no reduced-motion handling. The header repositioning itself has no animation. | Pre-existing issue, not introduced by this change |
| **RTL layout** | Sidebar uses `left-0` (physical property), not `start-0` (logical property). In RTL, sidebar would still appear on the left. Pre-existing issue. | Pre-existing issue, not introduced by this change |
| **Capacitor WebView** | Safe-area insets are provided by the Capacitor WebView plugin. `env(safe-area-inset-*)` values are injected via the viewport meta tag. `setStatusBarForRole()` in `useEffect` updates native status bar color. No change to this flow. | Native helpers untouched |

### RLS Edge Cases

**Not applicable.** No database access in this change. If existing RLS policies deny access to any data displayed in sidebar badges (unread counts, pending proofs), the existing error handling in `useUnreadCounts` and `usePendingProofCount` handles it — these hooks are unchanged.

### Realtime Edge Cases

**Not applicable.** No realtime subscriptions added or modified. Existing realtime connections for unread counts and pending proofs continue to work through their current channel management.

---

## 8. TESTING STRATEGY

### Unit Tests (Vitest)

**Existing tests:** `src/frontend/components/navigation/__tests__/BottomNav.test.tsx` — tests BottomNav tab rendering and link destinations. This test does NOT assert layout structure and should pass unchanged.

**No existing AuthenticatedLayout tests** — no test file found for this component.

**New tests recommended (post-implementation):**
- Verify header renders outside the sidebar flex row
- Verify sidebar `style.top` includes safe-area calc
- Verify `cn-safe-top` class is present on header

### Integration Tests

No integration test changes needed — the layout change doesn't affect data flow, API calls, or state management.

### E2E Considerations (Playwright)

**Existing E2E tests potentially affected:**
- `e2e/carenet/mobile.spec.ts` — Tests mobile viewport (375x812) for horizontal overflow. The DOM restructuring may change `document.body.scrollWidth` if the header's `max-w-6xl` wrapper behaves differently when moved above the flex row. **Action:** Run this test suite after implementation. If it fails, verify that the header's `max-w-6xl mx-auto` inner div still constrains width correctly.
- `e2e/carenet/a11y-smoke.spec.ts` — Runs axe-core accessibility checks. The DOM reorder changes the heading/tab order. **Action:** Run this test. Likely passes since no ARIA attributes are changed.

**New E2E test cases recommended:**
1. **Desktop layout verification:**
   - Set viewport to 1280x800
   - Verify header element is a sibling of (not child of) the flex row container
   - Verify header spans full viewport width
   - Verify sidebar is visible and positioned below header
   - Verify no overlap between header and sidebar

2. **Mobile sidebar safe-area:**
   - Set viewport to 375x812
   - Emulate safe-area insets via `page.addStyleTag({ content: ':root { --sat: 44px; --sab: 34px; }' })` or similar
   - Click BottomNav "Menu" tab
   - Verify sidebar appears below header (not overlapping it)
   - Verify sidebar clears BottomNav

3. **Sidebar open/close on mobile:**
   - Set viewport to 375x812
   - Click "Menu" tab → sidebar opens
   - Click backdrop → sidebar closes
   - Click a sidebar nav link → navigates + sidebar closes

4. **No horizontal overflow on any role dashboard:**
   - Existing `mobile.spec.ts` already covers this at 375px
   - Extend to also check 768px (tablet) and 1280px (desktop)

### RLS Testing

**Not applicable.** No database access patterns changed.

### Realtime Testing

**Not applicable.** No realtime subscriptions changed.

---

## 9. ROLLBACK PLAN

### How to Revert Safely

1. `git revert <commit-hash>` — single commit revert restores previous layout
2. The revert undoes:
   - Header position (moves back inside right flex column)
   - Sidebar `top` value (back to `top-14` className)
   - Sidebar `max-h` (back to `md:max-h-screen`)
   - PublicNavBar drawer `top` (back to `top-14` className)
   - Safe-area additions on header

### Rollback Risk

**Minimal.** All changes are CSS class/style adjustments and a DOM position change. No data migrations, no API changes, no schema changes.

### RLS Policy Rollback

**Not applicable.** No RLS policies changed.

### Orphaned Realtime Subscriptions

**Not applicable.** No realtime subscriptions added or modified. Existing subscription cleanup (via `useEffect` return functions in `useUnreadCounts`, `usePendingProofCount`) remains unchanged.

### Native Shell Considerations

If `npm run build` and `npx cap sync` were run after this change, rolling back requires:
1. Revert the commit
2. `npm run build` (rebuild with old layout)
3. `npx cap sync` (push old build to native shells)

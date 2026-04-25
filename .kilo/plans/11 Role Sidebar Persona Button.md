# Plan: ROLE_SIDEBAR_PERSONA_BUTTON

**Task ID:** `ROLE_SIDEBAR_PERSONA_BUTTON`
**Feature Type:** `NEW_FEATURE`
**Date:** 2026-04-24

---

## Critical Pre-Work — Read Before Writing Any Code

The implementor must read these files in full before starting:

| File | Why |
|---|---|
| `src/frontend/components/shell/AuthenticatedLayout.tsx` | Contains `getRoleNavSections`, the entire sidebar JSX, and the current state model |
| `src/frontend/components/navigation/BottomNav.tsx` | Contains the tab array, action handlers, and icon imports being changed |
| `src/backend/navigation/roleAppPaths.ts` | Role-to-path mappings used in BottomNav |
| `src/locales/en/common.json` | Current `bottomNav.*` and `sidebar.*` key inventory |
| `src/locales/bn/common.json` | Same, in Bangla |

**Verified facts — do not re-discover during implementation:**

| Fact | Detail |
|---|---|
| `getRoleNavSections(t)` | Defined **inline** in `AuthenticatedLayout.tsx` (~lines 70–337). **NOT exported.** Takes a `TFunction` param. Returns `Record<Role, NavSection[]>`. ALL sections it returns are role-specific — Browse and Support are NOT in this function. |
| Browse / Support blocks | **Hardcoded JSX** inside `<aside>` after the nav loop — completely separate from `getRoleNavSections`. Controlled by `sidebarBrowseOpen` / `sidebarSupportOpen` state. |
| App Controls block | Hardcoded at bottom of `<aside>`. Mobile logout: `shrink-0 border-b px-3 py-2 md:hidden` at top of sidebar. Desktop logout: `hidden px-3 py-2 md:block` at bottom. |
| `NavSection` interface | Defined at ~line 44 of `AuthenticatedLayout.tsx`. Must be extracted. |
| `filterCareSeekerCaregiverNavLinks` | Helper at ~line 55. Called inside `getRoleNavSections`. Must be extracted with it. |
| `collapsedSections` state | Used only inside the `navSections.map()` render loop. Move to `RoleSidebar.tsx`. |
| `pendingProofCount` / `pendingActivationCount` | Hooks in `AuthenticatedLayout`, used only in the nav loop for badges. Move to `RoleSidebar.tsx`. Before deleting from `AuthenticatedLayout`, **grep the entire file** for both names to confirm zero other usages. |
| `navSections` variable | Used only for the nav loop render. Before deleting, **grep `AuthenticatedLayout.tsx`** for `navSections` to confirm no remaining references. |
| `roleNavLinks` variable | Computed from `getRoleNavSections(t)` in `AuthenticatedLayout`. Used for URL segment validation (`segment in roleNavLinks`). After extraction, it calls the imported function — works as-is. Do not change. |
| Avatar component | **Does not exist.** Avatar is a raw `<div>` with initials and `rCfg.gradient` background. Follow that same pattern in `RoleSidebar`. |
| `toggle-sidebar` event | Dispatched by BottomNav Menu tab; listened to in `AuthenticatedLayout`. Must remain untouched. |
| BottomNav current props | `unreadMessages`, `unreadNotifications`, `aria-label`. `useAuth()` is already imported inside BottomNav. |
| `searchPath` / `effectiveRole` | Computed in BottomNav solely for the Search tab. Remove both after Search tab is replaced. **Grep BottomNav.tsx first** to confirm no other usages. |
| BottomNav desktop visibility | `BottomNav` is rendered with `fixed bottom-0 left-0 right-0` and has **no `md:hidden` class** — it is visible on all breakpoints. No separate desktop Persona button is needed in the header. |

---

## 1. IMPACT ANALYSIS

**Parts affected:**
- `src/frontend/components/navigation/BottomNav.tsx` — Search tab replaced with Persona tab; new prop; new action handler.
- `src/frontend/components/shell/AuthenticatedLayout.tsx` — `getRoleNavSections` and nav loop extracted out; portal badge removed; new `roleSidebarOpen` state and event listener added; `<RoleSidebar>` rendered; `<BottomNav>` props updated.
- `src/backend/navigation/roleNavSections.ts` — **new file** receiving extracted `NavSection`, `filterCareSeekerCaregiverNavLinks`, `getRoleNavSections`.
- `src/frontend/components/shell/RoleSidebar.tsx` — **new file** implementing role-specific nav overlay.
- `src/locales/en/common.json` — new keys added to `bottomNav`, `a11y`, and `sidebar` objects.
- `src/locales/bn/common.json` — same keys in Bangla.
- `src/frontend/components/shell/__tests__/RoleSidebar.test.tsx` — **new file** for unit tests.
- Existing `BottomNav.test.tsx` — updated to reflect Search → Persona replacement.

**Risk level:** Low. Pure UI reorganization. No route changes, no Supabase queries, no schema changes, no offline sync impact.

**Breaking change assessment:** None. All existing routes remain reachable. Search functionality stays accessible via the global-search URL and the Browse section in the Legacy Menu. The Menu tab continues to open the Legacy Menu unchanged. All existing i18n keys are preserved.

---

## 2. ARCHITECTURE DECISION

**Chosen approach:** Split the monolithic `<aside>` in `AuthenticatedLayout` into two independent overlay components:
1. **Legacy Menu** — the existing `<aside>`, stripped to Browse + Support + App Controls only. Toggled by the existing `toggle-sidebar` event from the Menu tab. Permanently visible on desktop.
2. **Role Sidebar** — new `RoleSidebar.tsx`, rendering only `getRoleNavSections(t)[currentRole]` output. Toggled by a new `toggle-rolesidebar` event dispatched by the new Persona tab.

The Persona tab replaces the Search tab in `BottomNav` at the same tab-3 position.

**Alternatives rejected:**
1. Tab-switched single panel — adds visual complexity and breaks the user's mental model of two distinct navigation surfaces.
2. Role Sidebar as a header dropdown — bottom navigation is more accessible on mobile and matches existing navigation patterns.
3. Role Sidebar replaces Legacy Menu entirely — hides Browse/Support discoverability.

**Why this approach:** Minimal diff. Reuses the existing sidebar infrastructure (Collapsible, link styling, event bus). Clean separation of concerns. No global state libraries needed.

**Desktop behavior:** `BottomNav` has no `md:hidden` class — the Persona tab is visible and functional on desktop. The Legacy Menu remains statically rendered on desktop (`md:static md:translate-x-0`). The Role Sidebar appears as an overlay on top of the main content area, positioned to the right of the Legacy Menu (`left-0 md:left-64`), with a full-screen backdrop. No separate header button is required.

---

## 3. DATABASE DESIGN

- **Tables affected:** None.
- **Schema changes:** None.
- **RLS Policy Updates:** N/A — no data access changes.
- **Data Scoping:** N/A — no queries added or modified. `user.activeRole` is read from the already-loaded AuthContext in memory.
- **Realtime Changes:** N/A — no subscriptions added or removed.

---

## 4. API DESIGN

- **New endpoints:** None.
- **Modified endpoints:** None.
- **Supabase query details:** N/A — `user` and `user.activeRole` are sourced entirely from the existing `AuthContext` state. No additional Supabase calls are issued.

---

## 5. FRONTEND DESIGN

### Files to create

| File | Purpose |
|---|---|
| `src/backend/navigation/roleNavSections.ts` | Exported `NavSection`, `filterCareSeekerCaregiverNavLinks`, `getRoleNavSections` |
| `src/frontend/components/shell/RoleSidebar.tsx` | Role-specific nav overlay component |
| `src/frontend/components/shell/__tests__/RoleSidebar.test.tsx` | Unit tests |

### Files to modify

| File | Changes |
|---|---|
| `src/frontend/components/shell/AuthenticatedLayout.tsx` | Extract nav code; add `roleSidebarOpen`; render `<RoleSidebar>`; update `<BottomNav>` props |
| `src/frontend/components/navigation/BottomNav.tsx` | Replace Search tab with Persona tab; new `isRoleSidebarOpen` prop |
| `src/locales/en/common.json` | New keys: `bottomNav.persona`, `a11y.*`, `sidebar.noNavItems` |
| `src/locales/bn/common.json` | Same keys in Bangla |

### State management

- `roleSidebarOpen: boolean` — local `useState` in `AuthenticatedLayout`. Passed as `isRoleSidebarOpen` prop to `BottomNav` and as `isOpen` prop to `RoleSidebar`.
- `collapsedSections: Record<string, boolean>` — moves from `AuthenticatedLayout` to `RoleSidebar`.
- No global state libraries. No context additions.

### Event bus

| Event name | Dispatched by | Listened to by | Purpose |
|---|---|---|---|
| `toggle-sidebar` | BottomNav Menu tab | `AuthenticatedLayout` | Toggle Legacy Menu — **unchanged** |
| `toggle-rolesidebar` | BottomNav Persona tab | `AuthenticatedLayout` | Toggle Role Sidebar — **new** |

### RoleSidebar component contract

```typescript
export interface RoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

Wraps with `React.memo` for performance since props are stable primitives:
```typescript
export const RoleSidebar = React.memo(function RoleSidebar({ isOpen, onClose }: RoleSidebarProps) { ... });
```

### BottomNav prop addition

```typescript
export interface BottomNavProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  isRoleSidebarOpen?: boolean;   // NEW — default false
  "aria-label"?: string;
}
```

### API integration
None — pure UI logic sourced from AuthContext.

### Loading / error handling
None required. `user.activeRole` is either set or null; the Persona button reflects that state synchronously.

### Realtime integration
N/A — no new subscriptions.

---

## 6. IMPLEMENTATION PLAN (STEP-BY-STEP)

Complete all phases in order. Do not skip steps. Verify the build compiles at the end of each phase before moving to the next.

---

### Phase 1 — Extract `getRoleNavSections` to a shared module

**This must be done first. All later phases depend on it.**

#### Step 1.1 — Create `src/backend/navigation/roleNavSections.ts`

Cut from `AuthenticatedLayout.tsx` and paste into this new file, adding `export` to each:

1. **`NavSection` interface** (currently ~line 44) — add `export`.
2. **`filterCareSeekerCaregiverNavLinks` function** (currently ~line 55) — add `export`.
3. **`getRoleNavSections` function** (currently ~lines 70–337) — add `export`.

Import block for the new file — take only what these three items need:
```typescript
import React from "react";
import type { Role } from "@/frontend/auth/types";
import type { TFunction } from "react-i18next";
import { features } from "@/config/features";
// Lucide icons: copy only those referenced inside getRoleNavSections body.
// Before copying, grep AuthenticatedLayout.tsx for each icon name to confirm
// it has zero usages OUTSIDE the getRoleNavSections function body.
// Do NOT move any icon that is also used in the Browse/Support/header/App Controls JSX.
```

**Icon move checklist:** For every icon in the `getRoleNavSections` body, verify in `AuthenticatedLayout.tsx` using a text search that it appears **only** within the function body. Icons confirmed to also be used elsewhere (e.g., `Search` in the header, `MessageSquare` in the header, `ChevronDown` in the Collapsible triggers, `X` in the close button, `LogOut` in App Controls, `Settings` in App Controls, `Shield` and `ShoppingBag` in Browse/Support, `Building2` in Browse, `FileText` in Support, `RefreshCw` in Support, `Bell` in the header, `ChevronRight` in nav links AND in Collapsible) must **stay** in `AuthenticatedLayout.tsx`'s import. Move only what is exclusively used inside `getRoleNavSections`.

#### Step 1.2 — Update `AuthenticatedLayout.tsx` imports

1. Delete the three items (interface + two functions) from `AuthenticatedLayout.tsx`.
2. Add this import line:
   ```typescript
   import { getRoleNavSections, type NavSection } from "@/backend/navigation/roleNavSections";
   ```
3. Remove from the lucide-react import any icon that was moved in Step 1.1. Keep every icon still used in the remaining JSX.
4. Run `npm run build` (or TypeScript check). Fix any import errors before proceeding.

---

### Phase 2 — Add i18n keys

#### Step 2.1 — `src/locales/en/common.json`

Add to the `"bottomNav"` object (maintain alphabetical order — between `"patients"` and `"payments"`):
```json
"persona": "Profile"
```

Add to the `"a11y"` object (create the object if it does not exist):
```json
"openPersonaMenu": "Open profile menu for {{role}}",
"personaMenuDisabled": "Profile menu (no active role)",
"closeRoleSidebar": "Close role sidebar",
"roleSidebarOpened": "Role menu opened",
"roleSidebarClosed": "Role menu closed"
```

Add to the `"sidebar"` object:
```json
"noNavItems": "No items available"
```

#### Step 2.2 — `src/locales/bn/common.json`

Add matching keys (all in the same respective objects):
```json
"bottomNav.persona": "প্রোফাইল"
"a11y.openPersonaMenu": "{{role}} এর প্রোফাইল মেনু খুলুন"
"a11y.personaMenuDisabled": "প্রোফাইল মেনু (কোন সক্রিয় ভূমিকা নেই)"
"a11y.closeRoleSidebar": "রোল সাইডবার বন্ধ করুন"
"a11y.roleSidebarOpened": "রোল মেনু খোলা হয়েছে"
"a11y.roleSidebarClosed": "রোল মেনু বন্ধ হয়েছে"
"sidebar.noNavItems": "কোন আইটেম পাওয়া যায়নি"
```

---

### Phase 3 — Create `src/frontend/components/shell/RoleSidebar.tsx`

Build from scratch using only project-approved imports. No new libraries.

#### 3.1 — Import block

```typescript
import React, { useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Link, useLocation } from "react-router";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/backend/store/auth/AuthContext";
import { roleConfig, cn, type Role } from "@/frontend/theme/tokens";
import { getRoleNavSections } from "@/backend/navigation/roleNavSections";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/frontend/components/ui/collapsible";
import { UnreadCountsContext } from "@/frontend/hooks/UnreadCountsContext";
import { usePendingProofCount } from "@/frontend/hooks/usePendingProofCount";
import { usePendingActivationCount } from "@/frontend/hooks/usePendingActivationCount";
```

#### 3.2 — Props interface

```typescript
export interface RoleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

#### 3.3 — Component body (implement in this exact order)

Wrap the component in `React.memo`:
```typescript
export const RoleSidebar = memo(function RoleSidebar({ isOpen, onClose }: RoleSidebarProps) {
```

**Inside the component, in this order:**

**a) Auth and translation:**
```typescript
const { user } = useAuth();
const { t } = useTranslation("common");
const location = useLocation();
```

**b) Resolve role data — always guard against null:**
```typescript
const currentRole = (user?.activeRole as Role) ?? null;
const rCfg = currentRole ? roleConfig[currentRole] : null;
const rolePrimary = rCfg ? `var(--${rCfg.cssVar})` : "var(--cn-pink)";
const userName = user?.name ?? "";
const roleLabel = currentRole ? t(`roles.${currentRole}`, rCfg?.label ?? "") : "";
```

**c) Compute nav sections — memoized:**
```typescript
const navSections = useMemo(
  () => (currentRole ? getRoleNavSections(t)[currentRole] : []),
  [t, currentRole]
);
```
No filtering is needed — `getRoleNavSections` never returns Browse or Support sections.

**d) Collapsible section state:**
```typescript
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
```

**e) Badge data — from context and hooks (match the existing sidebar badge pattern exactly):**
```typescript
const unreadCounts = useContext(UnreadCountsContext);
const unreadMessages = unreadCounts?.messages ?? 0;
const pendingProofCount = usePendingProofCount();
const pendingActivationCount = usePendingActivationCount();
```

**f) Refs for focus management:**
```typescript
const closeBtnRef = useRef<HTMLButtonElement>(null);
const sidebarRef = useRef<HTMLElement>(null);
const announcerRef = useRef<HTMLDivElement>(null);
```

**g) Screen-reader live region announcer — update on open/close:**
```typescript
useEffect(() => {
  if (!announcerRef.current) return;
  announcerRef.current.textContent = isOpen
    ? t("a11y.roleSidebarOpened", "Role menu opened")
    : t("a11y.roleSidebarClosed", "Role menu closed");
}, [isOpen, t]);
```

**h) Escape key handler:**
```typescript
useEffect(() => {
  if (!isOpen) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [isOpen, onClose]);
```

**i) Focus management — move focus in, restore focus out:**
```typescript
useEffect(() => {
  if (isOpen) {
    // Focus the close button when sidebar opens.
    // If for any reason closeBtnRef is unavailable, fall back to the first
    // focusable element inside the sidebar.
    setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      } else if (sidebarRef.current) {
        const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const first = sidebarRef.current.querySelector<HTMLElement>(FOCUSABLE);
        first?.focus();
      }
    }, 50);
  } else {
    // Restore focus to the Persona button that opened this sidebar.
    (document.querySelector("[data-persona-button]") as HTMLElement | null)?.focus();
  }
}, [isOpen]);
```

**j) Focus trap — Tab and Shift+Tab cycle inside sidebar:**
```typescript
useEffect(() => {
  if (!isOpen || !sidebarRef.current) return;
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const els = Array.from(
      sidebarRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
    if (!els.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [isOpen]);
```

#### 3.4 — JSX return

Return a React fragment with three items:

**Item A — Screen-reader live region (always in DOM, visually hidden):**
```tsx
<div
  ref={announcerRef}
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
/>
```

**Item B — Backdrop (only when `isOpen`):**
```tsx
{isOpen && (
  <div
    className="fixed inset-0 z-40"
    style={{ background: "rgba(0,0,0,0.40)" }}
    onClick={onClose}
    aria-hidden="true"
  />
)}
```

**Item C — Sidebar panel:**
```tsx
<aside
  ref={sidebarRef}
  role="dialog"
  aria-modal="true"
  aria-label={t("a11y.roleNav", "Role navigation")}
  className={[
    "fixed left-0 md:left-64 z-50 flex w-64 flex-col overflow-hidden",
    "transition-transform duration-300 ease-in-out",
    isOpen ? "translate-x-0" : "-translate-x-full",
  ].join(" ")}
  style={{
    top: "calc(var(--cn-header-height) + env(safe-area-inset-top, 0px))",
    bottom: "calc(var(--cn-bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
    background: cn.bgSidebar,
    boxShadow: cn.shadowSidebar,
  }}
>
```

**Inside the `<aside>`, three sections:**

**Section A — Header** (`shrink-0 p-4 flex items-center gap-3`, bottom border via `style={{ borderBottom: \`1px solid ${cn.borderLight}\` }}`):

- Avatar div: `w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 select-none`, `style={{ background: rCfg?.gradient ?? "linear-gradient(135deg, #ec4899, #8b5cf6)" }}`, `aria-hidden="true"`, content: `{userName.charAt(0).toUpperCase() || "?"}`.
- User info column (`flex-1 min-w-0`): `<p>` for `{userName}` with `style={{ color: cn.text }}` and truncate class; `<p>` for `{roleLabel}` with `style={{ color: cn.textSecondary }}` and truncate class.
- Close button: `ref={closeBtnRef}`, `type="button"`, `onClick={onClose}`, `aria-label={t("a11y.closeRoleSidebar", "Close role sidebar")}`, `className="p-1.5 rounded-lg hover:opacity-80 transition-all shrink-0"`, `style={{ color: cn.textSecondary }}`. Icon: `<X className="w-5 h-5" aria-hidden="true" />`.

**Section B — Empty state** (shown when `navSections.length === 0`):
```tsx
{navSections.length === 0 && (
  <div className="flex-1 flex items-center justify-center p-6">
    <p className="text-sm text-center" style={{ color: cn.textSecondary }}>
      {t("sidebar.noNavItems", "No items available")}
    </p>
  </div>
)}
```

**Section C — Nav scroll area** (`flex-1 overflow-y-auto overflow-x-hidden cn-scroll-mobile cn-safe-bottom`), only when `navSections.length > 0`:

Inside a `<nav aria-label={t("a11y.roleNav", "Role navigation")} className="px-3 py-3">`, render `navSections.map((section, sIdx) => ...)`.

The map logic is a **verbatim copy** of the `navSections.map()` block from `AuthenticatedLayout.tsx` with these substitutions:

| Replace | With |
|---|---|
| `setSidebarOpen(false)` in `Link onClick` | `onClose()` |
| `unreadCounts.messages` | `unreadMessages` (local variable from step e) |
| `pendingProofCount` | `pendingProofCount` (local variable from step e) |
| `pendingActivationCount` | `pendingActivationCount` (local variable from step e) |

Keep exactly: `collapsedSections`, `setCollapsedSections`, `rCfg.lightBg`, `rolePrimary`, `Collapsible`/`CollapsibleContent`/`CollapsibleTrigger`, the `isMain = sIdx === 0` branching logic, and the `isActiveInSection` check.

Do **not** add Browse, Support, or App Controls sections.

---

### Phase 4 — Update `AuthenticatedLayout.tsx`

Work in this exact order:

#### Step 4.1 — Add import
After the existing import block, add:
```typescript
import { RoleSidebar } from "@/frontend/components/shell/RoleSidebar";
```
(`getRoleNavSections` import was already added in Phase 1.)

#### Step 4.2 — Add `roleSidebarOpen` state
After the line declaring `sidebarOpen`:
```typescript
const [roleSidebarOpen, setRoleSidebarOpen] = useState(false);
```

#### Step 4.3 — Pre-removal verification (grep before deleting)
**Before** making any deletions, search `AuthenticatedLayout.tsx` for the following strings and confirm each appears ONLY in the locations being removed:
- `collapsedSections` — must appear only in the `navSections.map()` block.
- `navSections` — must appear only in the nav loop and in the `roleNavLinks` computation.
- `pendingProofCount` — must appear only in the nav loop badge JSX.
- `pendingActivationCount` — must appear only in the nav loop badge JSX.

If any of these appear elsewhere, **do not delete that item** — investigate first.

#### Step 4.4 — Remove items that moved to `RoleSidebar`
Only after the grep check passes:
- Delete `const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});`
- Delete `const pendingProofCount = usePendingProofCount();`
- Delete `const pendingActivationCount = usePendingActivationCount();`
- Delete the import lines for `usePendingProofCount` and `usePendingActivationCount`.

#### Step 4.5 — Add `toggle-rolesidebar` event listener
Place immediately after the existing `toggle-sidebar` `useEffect` block:
```typescript
useEffect(() => {
  const handler = () => setRoleSidebarOpen((prev) => !prev);
  window.addEventListener("toggle-rolesidebar", handler);
  return () => window.removeEventListener("toggle-rolesidebar", handler);
}, []);
```

#### Step 4.6 — Remove from `<aside>` JSX
Remove only these two items — do not touch anything else in `<aside>`:

**A.** Remove the portal badge `<div>`:
The `shrink-0 mx-4 mt-3 mb-1 px-3 py-1.5 rounded-lg text-center text-xs` div containing `{t("sidebar.portal", ...)}`. Delete the entire element.

**B.** Remove the role nav `<nav>` block:
The `<nav className="px-3 py-3 shrink-0" aria-label={...}>` element and all of its children (the full `navSections.map()` render). Delete the entire element.

**Do not touch:**
- The mobile logout button block at the top (`shrink-0 border-b px-3 py-2 md:hidden`).
- The Browse `<Collapsible>` block.
- The Support `<Collapsible>` block.
- The App Controls block.
- The sidebar header (logo + close button).

#### Step 4.7 — Remove `navSections` variable
Delete the line: `const navSections = getRoleNavSections(t)[currentRole];`
Only after confirming via grep that no remaining reference to `navSections` exists in the file (except possibly in `roleNavLinks` — which uses `getRoleNavSections(t)` directly, not via `navSections`).

#### Step 4.8 — Audit `rCfg`, `rolePrimary`, `userName`
- `rCfg` — still used in the header avatar `style={{ background: rCfg.gradient }}`. **Keep.**
- `userName` — still used in the header user info. **Keep.**
- `rolePrimary` — grep for remaining usages. If none remain after removing the nav loop, delete it.

#### Step 4.9 — Update `<BottomNav>` render call
Add `isRoleSidebarOpen`:
```tsx
<BottomNav
  unreadMessages={unreadCounts.messages}
  unreadNotifications={unreadCounts.notifications}
  isRoleSidebarOpen={roleSidebarOpen}
  aria-label={t("a11y.bottomNav", "Bottom navigation")}
/>
```

#### Step 4.10 — Render `<RoleSidebar>`
Place immediately after the closing `</aside>` tag, inside the `<div className="flex flex-1 min-h-0">` wrapper:
```tsx
<RoleSidebar
  isOpen={roleSidebarOpen}
  onClose={() => setRoleSidebarOpen(false)}
/>
```
`RoleSidebar` uses `position: fixed` internally — its DOM placement does not affect the visual layout.

#### Step 4.11 — Verify `roleNavLinks`
Search `AuthenticatedLayout.tsx` for `roleNavLinks`. It should call `getRoleNavSections(t)` directly (not via the removed `navSections` variable). Confirm it works as-is after the import in Phase 1. Make no changes.

---

### Phase 5 — Update `src/frontend/components/navigation/BottomNav.tsx`

#### Step 5.1 — Extend `BottomNavProps`
```typescript
export interface BottomNavProps {
  unreadMessages?: number;
  unreadNotifications?: number;
  isRoleSidebarOpen?: boolean;
  "aria-label"?: string;
}
```

#### Step 5.2 — Destructure the new prop
```typescript
export function BottomNav({
  unreadMessages = 0,
  unreadNotifications = 0,
  isRoleSidebarOpen = false,
  ...rest
}: BottomNavProps) {
```

#### Step 5.3 — Add `User` to the lucide-react import
Add `User` to the import list. Remove `Search` only after verifying via grep that `Search` has no other usages in `BottomNav.tsx` outside the search tab definition.

#### Step 5.4 — Remove `searchPath` and `effectiveRole`
Grep `BottomNav.tsx` for `searchPath` and `effectiveRole`. If both appear only in the search tab definition and its computed variables, delete both lines. If either is used elsewhere, investigate first.

#### Step 5.5 — Replace the `search` tab entry in the `tabs` array
Delete:
```typescript
{ key: "search", labelKey: "search", icon: Search, action: "link", to: searchPath },
```
Insert:
```typescript
{ key: "persona", labelKey: "persona", icon: User, action: "persona", to: "" },
```
The `action: "persona"` value is new. `to: ""` is intentional — the persona tab never navigates.

#### Step 5.6 — Add the persona action handler
In the tab render loop (`tabs.map((item) => { ... })`), add this `if` block **before** the `/* ── Regular link tab ── */` block:

```tsx
/* ── Persona button ── */
if (item.action === "persona") {
  const hasActiveRole = !!(user?.activeRole);
  const isPersonaActive = isRoleSidebarOpen;
  // Derive active color from role, falling back to cn-pink when no role is set.
  const personaActivePrimary = hasActiveRole && user?.activeRole
    ? `var(--${roleConfig[user.activeRole as Role].cssVar})`
    : rolePrimary;

  return (
    <button
      key={item.key}
      type="button"
      onClick={
        hasActiveRole
          ? () => window.dispatchEvent(new CustomEvent("toggle-rolesidebar"))
          : undefined
      }
      disabled={!hasActiveRole}
      aria-disabled={!hasActiveRole}
      aria-label={
        hasActiveRole && user?.activeRole
          ? t("a11y.openPersonaMenu", "Open profile menu for {{role}}", {
              role: t(`roles.${user.activeRole}`, roleConfig[user.activeRole as Role].label),
            })
          : t("a11y.personaMenuDisabled", "Profile menu (no active role)")
      }
      data-persona-button=""
      className={`${cellClass} bg-transparent border-0`}
      style={{
        ...cellStyle,
        opacity: hasActiveRole ? 1 : 0.5,
        cursor: hasActiveRole ? "pointer" : "not-allowed",
      }}
    >
      {isPersonaActive && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full"
          style={{ width: "24px", background: personaActivePrimary }}
        />
      )}
      <Icon
        className="shrink-0"
        style={iconStyle(isPersonaActive)}
        aria-hidden="true"
      />
      <span className="text-[10px] leading-tight" style={labelStyle(isPersonaActive)}>
        {label}
      </span>
    </button>
  );
}
```

#### Step 5.7 — Verify existing `isActive` logic for link tabs
The existing `isActive` check uses `location.pathname === item.to && item.to !== "/"`. Since the persona tab has `to: ""`, this condition is always false for it — the persona tab will never accidentally show as an active link tab. The `isPersonaActive` flag inside the new block handles its active state independently. No changes to the existing link tab render code are needed.

---

### Phase 6 — Final locale keys

Add `"noNavItems"` to the `"sidebar"` object in both locale files if not already added in Phase 2:
- `en`: `"noNavItems": "No items available"`
- `bn`: `"noNavItems": "কোন আইটেম পাওয়া যায়নি"`

---

### Phase 7 — Test updates

#### Step 7.1 — Update `BottomNav.test.tsx`
Locate the existing BottomNav test file in `src/frontend/components/navigation/__tests__/`. Update or add the following assertions:

- **Removed:** Assert the Search tab (`Search` icon, label key `"search"`) is **not** rendered.
- **Added — Persona tab presence:** Assert a button with `data-persona-button` attribute exists.
- **Added — disabled state:** When `user` is null or `user.activeRole` is null, assert the Persona button has `disabled` attribute and `opacity: 0.5` styling.
- **Added — enabled state:** When `user.activeRole` is set, assert the Persona button does not have `disabled` attribute.
- **Added — dispatch:** When enabled Persona button is clicked, assert `window.CustomEvent("toggle-rolesidebar")` is dispatched (spy on `window.dispatchEvent`).
- **Added — active indicator:** When `isRoleSidebarOpen={true}` prop is passed, assert the role-color top-bar indicator div is rendered.
- **Added — aria-label content:** When enabled with `activeRole = "guardian"`, assert `aria-label` contains the translated role label (not the raw role key).

#### Step 7.2 — Create `src/frontend/components/shell/__tests__/RoleSidebar.test.tsx`

Test cases to implement (jsdom environment, mock `useAuth`, mock `useTranslation`):

| # | Test | Assertion |
|---|---|---|
| 1 | `isOpen=false` | Sidebar has `translate-x-0` absent; `-translate-x-full` present |
| 2 | `isOpen=true`, user with activeRole | Avatar div renders with first initial of user name |
| 3 | `isOpen=true`, user with activeRole | User name text is rendered |
| 4 | `isOpen=true`, user with activeRole | Role label text is rendered |
| 5 | `isOpen=true`, user with activeRole | Nav links from `getRoleNavSections` for the role are rendered |
| 6 | `isOpen=true`, any role | Browse section links (Marketplace, Agencies, Shop) are **not** rendered |
| 7 | `isOpen=true`, any role | Support section links (Help Center, Submit Ticket, etc.) are **not** rendered |
| 8 | `isOpen=true` | Clicking X close button calls `onClose` |
| 9 | `isOpen=true` | Pressing Escape key calls `onClose` |
| 10 | `isOpen=true` | Clicking backdrop calls `onClose` |
| 11 | `isOpen=true`, active path matches a link | That link has active highlight styling |
| 12 | `isOpen=true`, `navSections=[]` (no active role) | Empty state message from `sidebar.noNavItems` is rendered |
| 13 | `isOpen=true`, `unreadMessages=3` | Messages link shows badge with count `3` |
| 14 | `isOpen=true`, `pendingProofCount=2` | Billing link shows badge count `2` |
| 15 | `isOpen=true` | `aria-modal="true"` and `role="dialog"` are present on `<aside>` |
| 16 | `isOpen=true` | `aria-label` on `<aside>` equals translated `"a11y.roleNav"` string |
| 17 | `isOpen=true`, user with name "Fatima" | Avatar initial renders "F" |
| 18 | `isOpen=true`, user with no name | Avatar initial renders "?" (empty-name fallback) |

#### Step 7.3 — Manual smoke test checklist

Run through each item after implementation:

- [ ] Login as Guardian → Persona tab enabled → tap → Role Sidebar slides in from left (300ms) → shows Main, Finance, Tools sections. Legacy Menu via Menu tab shows Browse, Support, App Controls only (no role nav).
- [ ] Login as Caregiver → Role Sidebar shows Main, Patient Care, Finance, Growth.
- [ ] Login as Admin → Role Sidebar shows Main, Finance, System, Content & Config.
- [ ] Login as Patient → Role Sidebar shows Main, Tools, Health, Privacy & Browse.
- [ ] Login as Agency → Role Sidebar shows Main, Operations, Finance & Settings.
- [ ] Login as Shop → Role Sidebar shows Main, Management.
- [ ] Login as Channel Partner → Role Sidebar shows Main, Tools.
- [ ] Login as Moderator → Role Sidebar shows Main only.
- [ ] Switch role mid-session → tap Persona → Role Sidebar immediately shows new role's sections (sidebar was closed; re-open reflects new role).
- [ ] Open Role Sidebar → switch role → Role Sidebar updates its content without closing (because `navSections` is derived from `user.activeRole` via `useMemo` which re-runs on role change).
- [ ] Tap nav link inside Role Sidebar → navigates to correct URL → sidebar closes.
- [ ] Press Escape while Role Sidebar open → closes → focus returns to Persona button (`data-persona-button`).
- [ ] Tab through Role Sidebar → focus cycles within sidebar (does not escape to page behind).
- [ ] Click backdrop → sidebar closes.
- [ ] Tap Menu button → Legacy Menu opens → contains Browse, Support, App Controls → no role-specific nav items.
- [ ] Desktop viewport: Legacy Menu always visible (static). Persona tap → Role Sidebar appears at `md:left-64` beside Legacy Menu, with backdrop.
- [ ] Mobile viewport: Legacy Menu slides in from left. Role Sidebar slides in from left (at `left-0`).
- [ ] Persona button dimmed (`opacity-50`) and unclickable on login page (no user).
- [ ] Persona button dimmed if user has no `activeRole`.
- [ ] Screen reader test: When Role Sidebar opens, live region announces "Role menu opened". When closed, announces "Role menu closed".
- [ ] Unread message badge appears on Messages link inside Role Sidebar.
- [ ] Switch language to Bengali → Persona tab label shows "প্রোফাইল".
- [ ] All flows work offline (no network calls involved).
- [ ] Run `npm run build` with no TypeScript errors.

---

## 7. EDGE CASES & FAILURE HANDLING

**RLS edge cases:** N/A — no database access.

**Realtime edge cases:** N/A — no subscriptions.

**Role transition while Role Sidebar is open:**
`RoleSidebar` is wrapped in `React.memo` and re-derives `navSections` via `useMemo([t, currentRole])`. When `user.activeRole` changes (via `switchRole()`), `currentRole` changes, the memo invalidates, and the sidebar re-renders with the new role's sections — without closing. This is correct behavior: the user is already looking at the sidebar, so showing updated content is better than a jarring close.

**Role transition while Role Sidebar is closed:**
No special handling needed. The next open will call `getRoleNavSections(t)[currentRole]` with the current role.

**Logout while Role Sidebar is open:**
`AuthenticatedLayout` redirects to `/auth/login` on logout via the existing `handleLogout` function. The component unmounts, destroying `roleSidebarOpen` state. The event listeners are cleaned up by their `useEffect` return functions. No action needed.

**No active role (isLoading=true or role not yet selected):**
`user?.activeRole` is `null` or `undefined`. The Persona button renders with `disabled`, `aria-disabled="true"`, `opacity-50`, `cursor-not-allowed`. The `onClick` is `undefined` — no event fires.

**`getRoleNavSections` returns empty array for a role:**
Guarded by `navSections.length === 0` check in `RoleSidebar`. Shows the `sidebar.noNavItems` empty-state paragraph instead of a blank body.

**Avatar fallback — missing name:**
`userName.charAt(0).toUpperCase() || "?"` — if `userName` is an empty string, `charAt(0)` returns `""`, and `|| "?"` produces `"?"`. No crash.

**Avatar fallback — no `rCfg` (no active role):**
`rCfg?.gradient ?? "linear-gradient(135deg, #ec4899, #8b5cf6)"` — the hardcoded fallback is the only literal color in this component and is only used as an emergency null-guard when no role config exists. It is not a design token violation because it is only reached in an invalid state.

**Multiple rapid taps on Persona button:**
The `handler` inside the `toggle-rolesidebar` event listener uses functional state update `setRoleSidebarOpen((prev) => !prev)` — it toggles correctly regardless of batching or rapid firing. No debounce is required.

**`toggle-rolesidebar` event dispatch fails:**
In the extremely unlikely case that `window.dispatchEvent` throws, the error will surface naturally. No crash handler needed — this is a browser built-in with no realistic failure scenario.

**Navigation link leads to 404:**
The Link's `onClick` calls `onClose()` and then React Router navigates. If the route is not found, React Router renders the NotFound page. The sidebar is already closed. No issue.

**Focus trap with zero focusable elements:**
If `sidebarRef.current.querySelectorAll(FOCUSABLE)` returns an empty list, the trap handler exits early (`if (!els.length) return`). Keyboard Tab will exit the sidebar. This is an extreme edge case — the sidebar always has at least a close button.

**Close button focus on open — timing:**
`setTimeout(..., 50)` is used to defer focus until after the CSS transition begins. This ensures the element is in the rendered DOM and interactive.

---

## 8. TESTING STRATEGY

### Unit Tests (Vitest + Testing Library)

**`RoleSidebar.test.tsx`** — see Phase 7, Step 7.2 for the full test case table (18 cases).

**`BottomNav.test.tsx`** — see Phase 7, Step 7.1 for the full update list (7 assertions).

**`AuthenticatedLayout.test.tsx`** (update existing if present):
- Assert `toggle-rolesidebar` event toggles `roleSidebarOpen` state.
- Assert `<RoleSidebar>` is rendered in the DOM (can check for `role="dialog"`).
- Assert `<aside>` (Legacy Menu) does NOT contain any role-specific nav items for any role.
- Assert the Menu tab still dispatches `toggle-sidebar` (existing behavior — verify not broken).
- Assert `<BottomNav>` receives `isRoleSidebarOpen` prop.

### Integration Tests

- **Auth flow:** Login as Guardian → Persona tab enabled → click → `toggle-rolesidebar` event fires → `roleSidebarOpen` becomes `true` → `RoleSidebar` receives `isOpen=true` → nav links visible → click a link → `onClose()` called → `roleSidebarOpen` becomes `false`.
- **Role switching:** Login as multi-role user → `switchRole("caregiver")` → re-open Role Sidebar → nav sections reflect Caregiver role.
- **Desktop overlay position:** At `md` breakpoint, assert Role Sidebar has `left-64` CSS class active.
- **Mobile overlay position:** At `sm` breakpoint, assert Role Sidebar has `left-0` CSS class active.
- **Language switch:** Change language to `bn` → assert Persona tab label renders "প্রোফাইল".
- **Menu tab unchanged:** Dispatch `toggle-sidebar` manually → assert `<aside>` (Legacy Menu) becomes visible.

### E2E Tests (Playwright)

- **Disabled state:** Navigate to login page → assert Persona button has `disabled` attribute.
- **Enabled state:** Login with demo Guardian → assert Persona button does not have `disabled` attribute.
- **Open / close flow:** Click Persona → assert sidebar is visible (contains user name) → click nav link → assert URL changed → assert sidebar is not visible.
- **Escape to close:** Click Persona → press Escape → assert sidebar is not visible → assert `document.activeElement` is the Persona button (`data-persona-button`).
- **Backdrop to close:** Click Persona → click backdrop overlay → assert sidebar is not visible.
- **Focus trap:** Click Persona → press Tab repeatedly → assert focus never reaches elements behind the sidebar.
- **Desktop Legacy Menu always visible:** At desktop viewport, assert `<aside>` is visible without clicking Menu.
- **Role Sidebar desktop overlay:** At desktop viewport, open Role Sidebar → assert it appears at offset matching the Legacy Menu width.
- **Offline:** Set `context.setOffline(true)` → perform full Persona open/close/navigate flow → assert all interactions work without network.
- **Accessibility audit:** After opening Role Sidebar, run `@axe-core/playwright` checks → assert zero critical violations.
- **Bengali locale:** Navigate with `?lng=bn` or switch via Language Switcher → assert Persona tab label is "প্রোফাইল".

### RLS Testing
N/A — no data queries.

### Realtime Testing
N/A — no subscriptions.

---

## 9. ROLLBACK PLAN

**Immediate git revert:** All changes are in a single feature branch. `git revert` restores:
- `BottomNav.tsx` to Search tab.
- `AuthenticatedLayout.tsx` to monolithic sidebar with role nav.
- Removes `RoleSidebar.tsx`, `roleNavSections.ts`, and the new test file.
- Removes the new i18n keys from both locale files.

**No database or migration changes** to roll back.

**Event listener cleanup:** Both `useEffect` hooks in `AuthenticatedLayout` (`toggle-sidebar` and `toggle-rolesidebar`) return cleanup functions that call `removeEventListener`. On component unmount (e.g., during rollback, logout, or route change), both listeners are removed. No orphaned handlers remain.

**Graceful degradation during rollback:** Until the revert is deployed, if `RoleSidebar` fails to render, the `toggle-rolesidebar` event fires into the void with no visible side-effect. The Menu tab and Legacy Menu remain fully functional.

**Feature flag (not implemented in v1):** If phased rollout is needed in the future, wrap the Persona tab render and `RoleSidebar` render behind `features.roleSidebar` (in `src/config/features.ts`). This is out of scope for the current implementation.

---

## Optional Flags

- [ ] `ALLOW_SCHEMA_CHANGE`
- [ ] `ALLOW_API_BREAKING_CHANGE`
- [ ] `PRIORITIZE_SPEED_OVER_PERF`
- [ ] `REALTIME_REQUIRED`
- [ ] `HIGH_SECURITY_MODE`

---

*End of Plan — ROLE_SIDEBAR_PERSONA_BUTTON*

# CareNet Deployment Guide

## Environment Setup

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables (see `.env.example`):

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `VITE_MEDICINE_API_URL` | BD Medicine API Supabase project URL (separate project) |
| `VITE_MEDICINE_API_KEY` | BD Medicine API anon key (read-only, safe for frontend) |

---

## Vercel (Frontend)

1. Connect your repo to [Vercel](https://vercel.com).
2. Set the environment variables above in **Settings → Environment Variables**.
3. Build command: `pnpm build`
4. Output directory: `dist`

---

## Supabase (Backend)

Run the SQL migration files **in order** via the Supabase SQL Editor:

1. `supabase/migrations/20260318_full_domain_schema.sql` — all domain tables
2. `seed/00_seed_auth_users.sql` — demo auth users
3. `seed/01_seed_data.sql` — seed/demo data
4. `seed/02_views_and_rpcs.sql` — 14 views, 4 RPCs
5. `seed/03_moderation_tables.sql` — 6 moderation tables + triggers
6. `seed/04_rls_policies.sql` — 60+ RLS policies
7. `supabase/migrations/20260317000000_notifications_and_preferences.sql`
8. `supabase/migrations/20260317000001_queued_notifications.sql`
9. `supabase/migrations/20260317000002_pgcron_process_queue.sql`
10. `supabase/migrations/20260317000003_cleanup_queued_notifications.sql`
11. `supabase/migrations/20260323045420_fix_function_search_path_update_updated_at.sql`
12. `supabase/migrations/20260323045421_fix_function_search_path_update_updated_at_column.sql`
13. `supabase/migrations/20260323045422_fix_function_search_path_generate_contract_number.sql`
14. `supabase/migrations/20260323050953_add_missing_fk_indexes.sql`
15. `supabase/migrations/20260323051429_fix_rls_auth_initplan_wrap_auth_uid.sql`
16. `supabase/migrations/20260323053350_add_remaining_3_fk_indexes.sql`
17. `supabase/migrations/20260323053757_consolidate_duplicate_permissive_policies.sql`
18. `supabase/migrations/20260323053916_drop_shop_products_duplicate_select_policy.sql`
19. `supabase/migrations/20260403120000_section15_v2_tables.sql` — Section 15 / v2.0 care tables (run when using those app routes)

After SQL runs, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optional `VITE_MEDICINE_*` in `.env` (local) and in your host (e.g. Vercel). The app **auto-enables** Supabase when the main vars are present — do **not** manually flip flags in `supabase.ts`.

**pg_cron:** Step 9 may require the `pg_cron` extension (Dashboard → Database → Extensions).

**Edge functions:** Deploy `supabase/functions/*` if you use device registration or queued push processing.

**Verify:** Run `scripts/verify-supabase-after-seed.sql` in the SQL Editor.

**Production smoke:** Redeploy after env changes; sign in with a seeded user (`seed/README.md`); open a role dashboard and confirm no repeated PostgREST / RLS failures in the network tab.

---

## PWA / Capacitor Native Builds

### Prerequisites

- Android Studio (for Android)
- Xcode (for iOS, macOS only)
- Capacitor CLI: `npm install -g @capacitor/cli`

### Build & Sync

```bash
# Build web assets
pnpm build

# Sync to native projects
npx cap sync

# Open in IDE
npx cap open android
npx cap open ios
```

### Platform-Specific Testing Checklist

**Offline Storage**

- Toggle airplane mode and verify IndexedDB sync queue buffers writes
- Re-enable network and confirm queued operations sync to Supabase
- Test `useOnlineStatus` hook transitions in the UI

**Push Notifications**

- Android: configure Firebase Cloud Messaging in `google-services.json`
- iOS: configure APNs in Apple Developer portal and `Info.plist`
- Add Capacitor push plugin config in `capacitor.config.ts`:

```ts
plugins: {
  PushNotifications: {
    presentationOptions: ["badge", "sound", "alert"],
  },
}
```

**Deep Linking**

- Android: add intent filters in `AndroidManifest.xml` for your domain
- iOS: add Associated Domains in `Info.plist` and host `apple-app-site-association`
- Handle `appUrlOpen` events in your React router:

```ts
import { App as CapApp } from "@capacitor/app";

CapApp.addListener("appUrlOpen", ({ url }) => {
  const path = new URL(url).pathname;
  router.navigate(path);
});
```

**General Native Checks**

- Splash screen and status bar styling
- Safe area insets (notch/dynamic island)
- Back button behavior on Android
- App backgrounding / foregrounding state persistence

---

## Accessibility (a11y) Audit Checklist

CareNet has 168 pages across 7 roles. The following infrastructure is in place and should be validated page-by-page.

### Already Implemented

- [x] `prefers-reduced-motion` respected in animations
- [x] ARIA live-region toasts (sonner)
- [x] Skip-to-content link (`AuthenticatedLayout`)
- [x] Focus moves to `<main>` on route change (`useFocusOnNavigate`)
- [x] ARIA landmarks: `<aside aria-label>`, `<nav aria-label>`, `<main aria-label>`, `role="search"`
- [x] Hamburger button: `aria-label`, `aria-expanded`
- [x] Icon-only buttons/links: `aria-label` on notifications, messages, theme toggle, close sidebar
- [x] Decorative icons: `aria-hidden="true"` on Lucide icons next to text
- [x] Dialog focus trap + `role="dialog"` + `aria-modal` (`ConfirmDialog`)
- [x] RTL layout support (42 languages including Arabic, Hebrew, Urdu, Persian)

### Next Steps

- [ ] **Add `useDocumentTitle` hook** — Set `document.title` per page so screen readers announce the current page on route change. Wire into every page component (e.g. `useDocumentTitle(t("guardian.dashboard.title"))`)
- [ ] **Automated first pass with axe** — Run axe against each role's dashboard as a quick baseline before manual testing:

```bash
# Start dev server, then run against each role dashboard
npx @axe-core/cli http://localhost:5173/guardian/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/caregiver/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/patient/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/agency/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/admin/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/moderator/dashboard --tags wcag2a,wcag2aa
npx @axe-core/cli http://localhost:5173/shop/dashboard --tags wcag2a,wcag2aa
```

### Per-Page Keyboard Navigation Checklist

For each of the 168 pages, verify:

- [ ] **Tab order** — All interactive elements reachable via Tab/Shift+Tab in logical order
- [ ] **Focus visibility** — Focus ring visible on every focusable element (Tailwind `focus-visible:ring`)
- [ ] **Enter/Space activation** — All buttons and links activate on Enter; checkboxes/toggles on Space
- [ ] **Escape dismissal** — All modals, dropdowns, popovers close on Escape and return focus to trigger
- [ ] **Arrow key navigation** — Tab lists, radio groups, select menus navigable with arrow keys
- [ ] **No keyboard traps** — Focus never gets stuck; always possible to Tab away

### Per-Page Screen Reader Checklist

For each page, test with VoiceOver (macOS/iOS) and TalkBack (Android):

- [ ] **Page title** — Announced on route change (use `document.title` or `react-helmet`)
- [ ] **Headings hierarchy** — Single `<h1>` per page; `<h2>`-`<h6>` in logical order
- [ ] **Form labels** — Every `<input>`, `<select>`, `<textarea>` has a visible `<label>` or `aria-label`
- [ ] **Error announcements** — Validation errors linked via `aria-describedby` or `aria-errormessage`
- [ ] **Dynamic content** — Loading states, toast notifications, and async updates announced via `aria-live`
- [ ] **Data tables** — `<th scope="col/row">` on all table headers; `<caption>` where helpful
- [ ] **Images** — Meaningful images have descriptive `alt`; decorative images have `alt=""`
- [ ] **Link purpose** — No "click here" links; link text describes destination

### Role-by-Role Priority Pages

Test these high-traffic pages first:

| Role | Priority Pages |
|---|---|
| Guardian | Dashboard, Search, Booking wizard, Care Requirement wizard, Payments |
| Caregiver | Dashboard, Jobs, Care Log, Earnings, Shift Planner |
| Patient | Dashboard, Vitals, Medications, Emergency Hub |
| Agency | Dashboard, Requirements Inbox, Bid Management, Shift Monitoring |
| Admin | Dashboard, Users, Verifications, Wallet Management |
| Moderator | Dashboard, Reviews, Reports, Content |
| Shop | Dashboard, Product Editor, Orders, Fulfillment |

### Color Contrast

- [ ] All text meets WCAG AA contrast (4.5:1 normal text, 3:1 large text)
- [ ] Verify in both light and dark themes
- [ ] Verify across all 7 role color schemes (pink, green, blue, orange, red, purple, teal)
- [ ] Status badges and notification dots meet 3:1 against background

### Touch Target Sizes

- [ ] All tap targets are minimum 44x44px on mobile (WCAG 2.5.5)
- [ ] BottomNav icons meet minimum size
- [ ] Sidebar links have sufficient padding

### Testing Tools

```bash
# Browser extensions
- axe DevTools (Deque)
- WAVE (WebAIM)
- Lighthouse Accessibility audit

# Automated CI
npx @axe-core/cli http://localhost:5173 --tags wcag2a,wcag2aa

# Screen readers
- macOS/iOS: VoiceOver (built-in)
- Android: TalkBack (built-in)
- Windows: NVDA (free) or JAWS
```
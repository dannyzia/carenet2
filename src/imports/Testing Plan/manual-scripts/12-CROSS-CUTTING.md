# 12 — CROSS-CUTTING Manual Test Script

**Covers:** Mobile responsiveness, i18n, Offline/Service Worker, Console error audit.

---

## PART A — MOBILE RESPONSIVENESS

**Tool setup:** Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M) → Set width to 375 px.  
Keep width at 375 px for ALL tests in this part.

---

## MTS-MOB-01 — Mobile: Login Page

**Pre-condition:** DevTools open, viewport 375 px wide.

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Navigate to `/auth/login` at 375 px | Page fits. No horizontal scroll bar. | — | |
| 2 | **[VERIFY]** Email and Password inputs | Full width, not overflowing | — | |
| 3 | **[VERIFY]** Sign In button | Full width, not cut off | — | |
| 4 | **[VERIFY]** Demo Access grid | Two-column grid of role buttons fits within 375 px | — | |

---

## MTS-MOB-02 — Mobile: Each Role Dashboard

For each role: Demo Login → navigate to dashboard → check at 375 px.  
See `01-AUTH.md → MTS-AUTH-04` for demo login.

| Role | Dashboard loads cleanly | No horizontal scroll | Bottom nav (not sidebar) | Buttons not cut off | Status | Notes |
|---|---|---|---|---|---|---|
| Caregiver `/caregiver/dashboard` | — | — | — | — | — | |
| Guardian `/guardian/dashboard` | — | — | — | — | — | |
| Patient `/patient/dashboard` | — | — | — | — | — | |
| Agency `/agency/dashboard` | — | — | — | — | — | |
| Admin `/admin/dashboard` | — | — | — | — | — | |
| Moderator `/moderator/dashboard` | — | — | — | — | — | |
| Shop `/shop/dashboard` | — | — | — | — | — | |

---

## MTS-MOB-03 — Mobile: Caregiver Jobs Page

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/caregiver/jobs` | Page fits | — | |
| 2 | **[VERIFY]** Job cards | Stack in single column | — | |
| 3 | **[VERIFY]** Filter dropdown | Not overflowing the viewport | — | |
| 4 | **[VERIFY]** "Apply Now" and "Details" buttons | Both visible on each card, not stacked off-screen | — | |

---

## MTS-MOB-04 — Mobile: Booking Wizard

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/guardian/booking` | Page loads | — | |
| 2 | **[VERIFY]** Progress bar | All 4 step icons visible, not truncated | — | |
| 3 | **[VERIFY]** Service cards (step 1) | Stack vertically, single column | — | |
| 4 | **[VERIFY]** "Next Step" button | Full width, not cut off | — | |
| 5 | Navigate through all 4 steps | Each step renders without overflow | — | |

---

## MTS-MOB-05 — Mobile: Guardian Search

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/guardian/search` | Hero loads. Search bar full width. | — | |
| 2 | **[VERIFY]** Filter button | A slider/funnel icon appears in the hero (not a full desktop filter row) | — | |
| 3 | **[CLICK]** filter icon | Bottom drawer slides up with filter options | — | |
| 4 | Select a filter, **[CLICK]** Apply | Drawer closes. Filter applied. | — | |

---

## MTS-MOB-06 — Mobile: Shift Check-In

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/caregiver/shift-check-in` | Page fits. Progress bar visible. | — | |
| 2 | **[VERIFY]** Selfie capture button | Full width, readable label | — | |
| 3 | **[VERIFY]** GPS step | "Get My Location" button full width | — | |
| 4 | Complete check-in | Done state renders within viewport | — | |

---

## MTS-MOB-07 — Mobile: Vitals Tracking (Patient)

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/patient/vitals` | Page loads | — | |
| 2 | **[VERIFY]** Vital cards in hero | Horizontally scrollable row OR stacked — not overflowing the card boundary | — | |
| 3 | **[VERIFY]** Chart | Renders within viewport width | — | |

---

## MTS-MOB-08 — Mobile: Care Notes

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/caregiver/care-notes` | Page fits | — | |
| 2 | **[CLICK]** "New Note" | Form opens correctly on mobile. All fields accessible. | — | |
| 3 | **[VERIFY]** Stat cards (4 at top) | Two-column grid, no overflow | — | |

---

## MTS-MOB-09 — Mobile: Shop Front

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/shop` | Product list loads. Cards stack in 1 or 2 columns. | — | |
| 2 | **[CLICK]** a product → `/shop/product/:id` | Detail page fits. "Add to Cart" button full width. | — | |
| 3 | Navigate to `/shop/cart` | Cart fits within 375 px. Quantity controls accessible. | — | |
| 4 | Navigate to `/shop/checkout` | Checkout form fits. Fields full width. | — | |

---

## MTS-MOB-10 — Mobile: Admin Dashboard

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | At 375 px, navigate to `/admin/dashboard` | Page loads | — | |
| 2 | **[VERIFY]** Stat cards | Stack to 2-column or 1-column, no overflow | — | |
| 3 | **[VERIFY]** Charts | Responsive — do not overflow horizontally | — | |
| 4 | **[VERIFY]** Recent Activity feed | Readable on 375 px | — | |

---

## PART B — CONSOLE ERROR AUDIT

Run this AFTER completing all other test files. Keep DevTools Console open throughout.

---

## MTS-ERR-01 — Console Error Log

Visit each page below. Note any `console.error` or uncaught exceptions.

| URL | Error Found? | Error Message | Severity |
|---|---|---|---|
| `/auth/login` | — | | |
| `/caregiver/dashboard` | — | | |
| `/caregiver/jobs` | — | | |
| `/caregiver/shift-check-in` | — | | |
| `/caregiver/care-notes` | — | | |
| `/caregiver/med-schedule` | — | | |
| `/caregiver/earnings` | — | | |
| `/caregiver/training` | — | | |
| `/guardian/dashboard` | — | | |
| `/guardian/search` | — | | |
| `/guardian/booking` | — | | |
| `/patient/dashboard` | — | | |
| `/patient/vitals` | — | | |
| `/patient/emergency` | — | | |
| `/agency/dashboard` | — | | |
| `/agency/shift-monitoring` | — | | |
| `/admin/dashboard` | — | | |
| `/admin/system-health` | — | | |
| `/moderator/dashboard` | — | | |
| `/shop/dashboard` | — | | |
| `/shop` | — | | |
| `/shop/cart` | — | | |
| `/wallet` | — | | |
| `/billing` | — | | |
| `/contracts` | — | | |
| `/notifications` | — | | |
| `/settings` | — | | |
| `/` (home) | — | | |
| `/global-search` | — | | |

**Total pages with errors:** ___  
**Total error count:** ___

---

## PART C — i18n / LANGUAGE SWITCHING

**Pre-condition:** App running. If language switcher is exposed in the UI, complete these tests.

---

## MTS-I18N-01 — Language Switch

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Find the language switcher in the UI (Settings, nav dropdown, or footer) | Switcher visible | — | |
| 2 | **[CLICK]** switch to a second language (e.g. Bengali/বাংলা) | UI text updates to the selected language. No missing translation keys (no raw strings like `common:pageTitles.login`). | — | |
| 3 | **[VERIFY]** No layout breaks | Text does not overflow cards or buttons | — | |
| 4 | Switch back to English | UI returns to English | — | |
| 5 | **[VERIFY]** Console | Zero errors from i18n | — | |

---

## PART D — OFFLINE / SERVICE WORKER

---

## MTS-OFF-01 — Offline Behaviour

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Load app, navigate to `/caregiver/dashboard`, wait for full load | Page fully loaded | — | |
| 2 | DevTools → Network tab → **[SELECT]** "Offline" | Device is now offline | — | |
| 3 | Navigate to `/caregiver/schedule` | Either: cached page loads with a stale-content banner, OR a graceful offline page is shown. Must NOT show a blank white screen. | — | |
| 4 | Navigate to `/` (home) | Same — cached or graceful offline | — | |
| 5 | DevTools → Network → **[SELECT]** "Online" | App reconnects | — | |
| 6 | Hard reload (Ctrl+Shift+R) | App loads normally again | — | |
| 7 | **[VERIFY]** Console | No unexpected errors from SW | — | |

---

## PART E — DEV-ONLY (NON-RELEASE)

Optional smoke for engineers. **Do not** treat failure here as a ship blocker for production UX.

---

## MTS-DEV-01 — Connectivity demo

**URL:** `/dev/connectivity`  
**Pre-condition:** Logged in (any role — page is behind `ProtectedRoute`).

| # | Action | Expected Result | ✅❌⚠️ | Notes |
|---|---|---|---|---|
| 1 | Demo login as any role | Session active | — | |
| 2 | Navigate to `/dev/connectivity` | Page loads; connectivity / offline demo UI visible (P1) | — | |
| 3 | **[VERIFY]** Console | No uncaught `console.error` from this navigation alone (P1) | — | Tag **non-release** in defect log if issues are dev-tooling only |

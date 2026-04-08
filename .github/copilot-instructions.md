# CareNet 2 — Copilot Instructions

## Project Summary

CareNet 2 is a React 18 + TypeScript healthcare web and hybrid-mobile application (Capacitor for Android/iOS) built on Supabase with offline-first behavior via Dexie, bilingual i18n (English + Bangla), and role-based access control.

- **Figma source:** https://www.figma.com/design/KtWt75G0uLQfcrMAqAHu6v/CareNet-2
- **Next migration prefix:** `20260406`
- **Active locales (committed):** `en`, `bn` (additional languages load at runtime from admin config)
- **Build:** `npm run build` | **Dev:** `npm run dev` | **Test:** `npm run test` | **E2E:** `npm run test:e2e`
- **Capacitor sync:** `npm run build:cap && npx cap sync android`

---

## Critical Constraints — Never Violate

1. **`react-router` only.** Never import from `react-router-dom`. Use `src/lib/react-router-shim.ts` for any compatibility needs.
2. **Routes go in `src/app/routes.ts`.** Register every new route there using the existing lazy-load pattern. Never create a parallel routing system.
3. **Auth via `useAuth()` only.** Read session and role state exclusively through `useAuth()` and `user.activeRole`. Never access Supabase session state directly in components.
4. **Supabase helpers from `_sb.ts`.** Use `sbRead`, `sbWrite`, `sb`, `currentUserId` from `src/backend/services/_sb.ts`. No raw query boilerplate.
5. **Preserve `USE_SUPABASE` mock fallbacks.** Every Supabase call has a mock branch. Never delete or bypass it.
6. **Clean up realtime subscriptions.** Every `supabase.channel(...)` must be removed on component unmount.
7. **i18n all user-facing copy.** No hardcoded English strings in JSX. Add keys to both `src/locales/en/` and `src/locales/bn/`.
8. **Design tokens only.** Use `src/frontend/theme/tokens.ts` and `src/styles/theme.css` CSS variables. No raw color literals.
9. **`motion/react` for animation.** No framer-motion, no other animation library.
10. **No new global state libraries.** Do not introduce Redux, Zustand, Jotai, or TanStack Query.
11. **No new top-level tech.** Do not introduce Next.js, Expo, React Native, Firebase, or Prisma.
12. **Migrations are append-only.** Use `IF NOT EXISTS`. Every new table needs RLS + at least one policy. Wrap `auth.uid()` in `(SELECT auth.uid())` in all RLS clauses.

---

## Architecture — Fixed Structure

```
src/
  app/           ← routes.ts (route registry), App.tsx (app bootstrap)
  backend/
    services/    ← _sb.ts (Supabase helpers), supabase.ts, realtime.ts
    offline/     ← db.ts (Dexie schema), syncEngine.ts, useSyncQueue.ts
    store/auth/  ← AuthContext.tsx, auth store — the only auth source of truth
    models/      ← domain TypeScript types
    api/         ← API call wrappers
  frontend/
    components/
      shared/    ← reusable app-level components
      shell/     ← layout shells, navigation chrome
      ui/        ← Radix-based primitive components
    hooks/       ← shared hooks
    i18n/        ← i18n bootstrap (index.ts), languageManager.ts
    native/      ← Capacitor bridge helpers — all native calls go here
    theme/       ← tokens.ts (design tokens)
  locales/
    en/          ← committed English strings (JSON namespaces)
    bn/          ← committed Bangla strings (JSON namespaces)
  styles/
    tailwind.css ← Tailwind v4 config and directives
    theme.css    ← CSS custom properties / design tokens

supabase/
  migrations/    ← SQL migrations (append-only, idempotent)
  functions/     ← Supabase Edge Functions
```

**Request lifecycle:** User action → component → `useAuth()` for role check → service (`_sb.ts` helper) → if offline-critical: Dexie queue → Supabase (or mock fallback if `USE_SUPABASE` is false) → realtime subscription pushes updates back.

---

## Tech Stack — Locked

| Layer | Technology | Import / Config path |
|---|---|---|
| Language | TypeScript (strict) | `tsconfig.json` |
| Framework | React 18.3.1 | `react` |
| Build | Vite 6.3.5 | `vite.config.ts` |
| Styling | Tailwind CSS v4 | `src/styles/tailwind.css` |
| Animation | motion/react 12 | `motion/react` |
| Routing | react-router v7 | `react-router` (never `react-router-dom`) |
| UI primitives | Radix UI | `@radix-ui/react-*` |
| UI supplemental | MUI v7 | `@mui/material` — only where already used |
| Backend | Supabase | `src/backend/services/_sb.ts` |
| Offline | Dexie 4 | `src/backend/offline/db.ts` |
| i18n | react-i18next | `useTranslation()` |
| Mobile | Capacitor 8 | `src/frontend/native/`, `capacitor.config.ts` |
| Unit tests | Vitest 4 | `vitest.config.ts` |
| E2E tests | Playwright | `playwright.config.ts` |
| Forms | React Hook Form 7 | `react-hook-form` |

---

## Coding Rules

**TypeScript**
- Prefer strict, explicit types for all exported helpers and shared hooks.
- Functional components and hooks only — no class components.
- Use `user.activeRole` from `useAuth()` for all role-conditional logic.

**Supabase / Data**
- Use `sbRead`, `sbWrite`, `sb`, `currentUserId` from `_sb.ts`.
- `supabase.channel(...).on('postgres_changes', ...)` for realtime — always clean up in useEffect return.
- Writes that must survive disconnects → route through Dexie sync queue in `src/backend/offline/`.

**UI / Styling**
- Reuse `src/frontend/components/shared/`, `shell/`, `ui/` before creating anything new.
- Tailwind v4 utility classes only — no new CSS files unless adding to `src/styles/`.
- Token colors and CSS vars from `tokens.ts` / `theme.css` — never `text-[#hex]` or inline `style={{ color }}`.
- Reduced-motion, dark mode, safe-area, and touch-target size must all be preserved.

**i18n**
- Every user-facing string goes through `useTranslation()`.
- Scripts: `npm run i18n:sync` (key sync) · `npm run translate` (auto Bangla) · `npm run translate:verify` (audit).

**Mobile**
- Native API calls behind `Capacitor.isNativePlatform()` or existing helpers in `src/frontend/native/`.
- After any bundle change that affects native: `npm run build:cap && npx cap sync`.

**Testing**
- Vitest: `node` environment by default; jsdom only when DOM APIs needed.
- Playwright: reuse existing mock-auth flow; `context.setOffline(true)` for offline scenarios.
- Never mutate `navigator.onLine` in tests.

---

## Scoped Instructions (auto-applied by Copilot)

These files in `.github/instructions/` apply automatically to matching paths:

| File | Applies to |
|---|---|
| `frontend.instructions.md` | `src/frontend/**` |
| `backend-services.instructions.md` | `src/backend/**` |
| `migrations.instructions.md` | `supabase/migrations/**` |
| `tests.instructions.md` | `e2e/**`, `**/*.test.ts`, `**/*.spec.ts` |
| `locales.instructions.md` | `src/locales/**` |

---

## Agents Available (`.github/agents/`)

| Agent | Use for |
|---|---|
| `feature-builder` | Building new features end-to-end |
| `feature-planner` | Writing specs and plans before building |
| `code-reviewer` | Reviewing diffs and generated code (read-only) |
| `test-runner` | Writing and running Vitest + Playwright tests |
| `migration-author` | Writing Supabase SQL migrations |

---

## Skills Available (`.github/skills/`)

Copilot loads these automatically when relevant, or trigger manually with `/skill-name`:

| Skill | Loads when... |
|---|---|
| `fullstack-carenet` | General feature work across routing, auth, UI, offline, i18n |
| `supabase-dexie-sync` | Editing services, write flows, offline, or realtime behavior |
| `tailwind-radix-motion` | Building or refactoring UI components or layouts |
| `i18next-bangla` | Adding strings, editing locales, changing i18n behavior |
| `capacitor-mobile` | Anything touching native behavior or Capacitor config |
| `vitest-playwright` | Writing or fixing tests |
| `code-review-carenet` | Reviewing diffs or pull requests |
| `spec-writing-carenet` | Planning features or writing implementation specs |

---

## Document Hierarchy

| Priority | Path | Contains |
|---|---|---|
| 1 | `rules.md` | Binding project constraints (same content as this file's constraints) |
| 2 | `supabase-schema.sql` | Full current DB schema |
| 3 | `supabase/migrations/` | Migration history — read before any schema change |
| 4 | `src/app/routes.ts` | All registered routes |
| 5 | `src/backend/services/_sb.ts` | Supabase helper API |
| 6 | `src/backend/store/auth/AuthContext.tsx` | Auth shape and role model |
| 7 | `plans/` | Active feature plans |
| 8 | `docs/` | Architecture and sync documentation |

---

## Do Not Add to This Project

- `react-router-dom` (use `react-router`)
- Redux, Zustand, Jotai, TanStack Query
- Next.js, Expo, React Native
- Firebase, Prisma
- framer-motion (use `motion/react`)
- Any second design token system or CSS-in-JS library
- Any new top-level `src/` directory when an existing folder fits

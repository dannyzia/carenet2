---
description: Start a new CareNet 2 feature from a brief description. Reads project constraints and produces a plan + implementation.
---

You are working on **CareNet 2** — a React 18 + TypeScript + Vite healthcare app with Supabase, Dexie offline storage, Capacitor mobile, and i18n (English + Bangla).

Before writing any code for the feature described below, do the following:
1. Read `src/app/routes.ts` to understand current routing.
2. Read `src/backend/store/auth/AuthContext.tsx` to understand auth shape.
3. Search `src/frontend/components/` for any existing component that handles similar UI.
4. Check `src/backend/services/_sb.ts` for relevant Supabase helpers.
5. Check `supabase/migrations/` to see if any schema changes are needed.

Then implement the feature following these non-negotiable rules:
- Register routes in `src/app/routes.ts` using the lazy-load pattern.
- Import routing APIs from `react-router` only (never `react-router-dom`).
- Auth and role state only via `useAuth()` and `user.activeRole`.
- Use `sbRead`, `sbWrite`, `sb`, `currentUserId` from `_sb.ts` for all Supabase calls.
- Preserve all `USE_SUPABASE` mock fallback branches.
- Add all user-facing strings to both `src/locales/en/` and `src/locales/bn/`.
- Use design tokens from `src/frontend/theme/tokens.ts` — no raw color literals.
- Reuse shared components from `src/frontend/components/shared/`, `shell/`, `ui/`.
- Import animations from `motion/react` only.
- Clean up any realtime subscriptions on component unmount.
- Add Vitest unit tests for new hooks/services and Playwright tests for new user journeys.

**Feature to implement:**

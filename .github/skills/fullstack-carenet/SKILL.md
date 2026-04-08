---
name: fullstack-carenet
description: General CareNet 2 project skill for feature work across routing, auth, shared UI, offline-first behavior, localization, and testing. Use when adding, refactoring, or reviewing app features in this repo.
---

# CareNet 2 Full-Stack Workflow

Read these landmarks first:
- `src/app/App.tsx`
- `src/app/routes.ts`
- `src/backend/store/auth/AuthContext.tsx`
- `src/frontend/theme/tokens.ts`
- `src/styles/theme.css`

Follow these rules:
- Add routes in `src/app/routes.ts` and match the repo's lazy-loading pattern.
- Import router APIs from `react-router` (never `react-router-dom`).
- Read role and session state through `useAuth()` and `user.activeRole`.
- Reuse shared shells, shared components, and existing UI primitives before creating new ones.
- Keep user-facing strings on the i18n path and update both committed locale trees.
- Keep tests in scope for new user-visible work.

When building a feature:
1. Place code in the current folder structure instead of inventing new architecture.
2. Check whether the flow needs offline queueing or realtime updates.
3. Preserve Supabase mock fallback behavior (`USE_SUPABASE` checks must stay intact).
4. Update localization (`en` and `bn`) and tests before finishing.

Avoid:
- `react-router-dom` imports
- Redux, Zustand, Jotai, or TanStack Query
- new global state libraries
- new visual systems outside the existing tokens and theme files
- hardcoded user-facing English strings in components

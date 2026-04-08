---
applyTo: "src/backend/**"
---

You are working on the backend service layer for CareNet 2.

- Use `sbRead`, `sbWrite`, `sb`, and `currentUserId` from `src/backend/services/_sb.ts` for all Supabase operations. Do not duplicate query boilerplate.
- Preserve all `USE_SUPABASE` mock fallback branches. Never remove them.
- Use `supabase.channel(...).on('postgres_changes', ...)` for realtime subscriptions.
- Always clean up channels and listeners on component unmount or hook teardown.
- Write flows that must survive disconnects should route through the Dexie queue in `src/backend/offline/`.
- Check `supabase/functions/` and `supabase/migrations/` before changing behavior that depends on them.
- Keep conflict-prone flows retry-safe and idempotent.
- Do not introduce Firebase, Prisma, TanStack Query, or any alternative data layer.

---
name: supabase-dexie-sync
description: CareNet 2 data-layer skill for Supabase services, mock fallback, realtime subscriptions, Dexie offline storage, and sync queue behavior. Use when editing backend services, write flows, offline behavior, or realtime features in this repo.
---

# Data And Sync Workflow

Read these files first:
- `src/backend/services/supabase.ts`
- `src/backend/services/_sb.ts`
- `src/backend/services/realtime.ts`
- `src/backend/offline/db.ts`
- `src/backend/offline/syncEngine.ts`
- `src/backend/offline/useSyncQueue.ts`

Follow these rules:
- Keep `USE_SUPABASE` checks and mock-mode behavior intact — never remove mock fallbacks.
- Prefer `sbRead`, `sbWrite`, `sb`, and `currentUserId` instead of duplicating query boilerplate.
- Use `supabase.channel(...).on('postgres_changes', ...)` for realtime subscriptions.
- If a flow must survive disconnects, route writes through the offline queue and sync engine.
- Clean up realtime subscriptions and listeners on unmount/teardown.
- Check `supabase/functions/` and `supabase/migrations/` before depending on backend changes.

When adding a write flow:
1. Decide whether it must work offline.
2. Preserve optimistic or local state if the feature already uses it.
3. Keep idempotency and retry behavior in mind.
4. Add or update tests for online and offline scenarios.

Avoid:
- deleting mock fallbacks
- bypassing `_sb.ts` helpers without a clear reason
- rerunning migrations as a default fix
- Firebase, Prisma, or any alternative data layer

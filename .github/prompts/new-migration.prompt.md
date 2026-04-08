---
description: Write a new Supabase database migration for CareNet 2 with correct RLS, indexes, and idempotent SQL.
---

You are writing a Supabase PostgreSQL migration for **CareNet 2**.

Before writing the migration:
1. Read `supabase-schema.sql` to understand the current schema.
2. Scan `supabase/migrations/` to find the most recent migration and avoid duplicating any changes.
3. Check `supabase/functions/` if the change may affect edge function behavior.

Use the following filename convention:
- Location: `supabase/migrations/`
- Name format: `YYYYMMDD_description.sql` (today: use `20260406`)
- If multiple migrations are needed today, use letter suffixes: `20260406a_`, `20260406b_`, etc.
- Description in lowercase snake_case.

Follow these rules without exception:
1. **Every new table must have RLS enabled** — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and at least one policy.
2. **All migrations must be idempotent** — use `IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`.
3. **Add indexes for all foreign keys** on tables with meaningful lookup patterns.
4. **Wrap `auth.uid()` in `(SELECT auth.uid())`** in all RLS USING/CHECK clauses to prevent per-row re-evaluation.
5. **Reuse the existing `update_updated_at_column()` trigger function** — don't create a duplicate.
6. **Append-only** — never drop tables or columns without an explicit instruction to do so.

Migration template:
```sql
-- Migration: YYYYMMDD_description
-- Purpose: [one line explanation]

CREATE TABLE IF NOT EXISTS public.example (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.example ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own example rows"
  ON public.example FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_example_user_id ON public.example(user_id);

CREATE TRIGGER update_example_updated_at
  BEFORE UPDATE ON public.example
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Migration to write:**

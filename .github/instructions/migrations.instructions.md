---
applyTo: "supabase/migrations/**"
---

You are writing a Supabase PostgreSQL migration for CareNet 2.

- Every new table must have RLS enabled and at least one policy.
- All statements must be idempotent: use `IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`.
- Wrap `auth.uid()` in `(SELECT auth.uid())` inside all RLS USING/CHECK clauses.
- Add foreign key indexes for all FK columns on tables with meaningful lookup patterns.
- Reuse the existing `update_updated_at_column()` trigger function — do not create a duplicate.
- Filename format: `YYYYMMDD_description.sql` — next available date prefix is `20260406`.
- Append-only: never DROP tables or columns without an explicit instruction.
- Check prior migrations in `supabase/migrations/` before adding anything that may already exist.

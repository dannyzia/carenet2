/**
 * Mark all local migration versions as applied on the linked remote (no SQL execution).
 * Use when the remote schema already matches the repo but supabase_migrations was out of sync.
 *
 * Prerequisites:
 *   - `npx supabase link` already configured for this project
 *   - Database password in env (CLI uses pooler temp role):
 *       PowerShell: $env:SUPABASE_DB_PASSWORD = "<Database password from Supabase Dashboard>"
 *   - Wait out pooler "circuit breaker" if you hit too many auth failures
 * Optional: SUPABASE_ALIGN_SKIP_VERSIONS=20260404 (comma-separated) if a version is already applied on remote.
 *
 * Run: node scripts/supabase-align-migrations.mjs
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migDir = join(root, "supabase", "migrations");

if (!process.env.SUPABASE_DB_PASSWORD?.trim()) {
  console.error("Set SUPABASE_DB_PASSWORD to your Supabase database password (Dashboard → Database).");
  process.exit(1);
}

const skip = new Set(
  (process.env.SUPABASE_ALIGN_SKIP_VERSIONS || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);

const files = readdirSync(migDir).filter((f) => f.endsWith(".sql"));
const versions = [
  ...new Set(
    files
      .map((f) => {
        const m = f.match(/^(\d+)_/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
      .filter((v) => !skip.has(v)),
  ),
].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0));

if (versions.length === 0) {
  console.error("No migration versions found.");
  process.exit(1);
}

const CHUNK = 8;
for (let i = 0; i < versions.length; i += CHUNK) {
  const chunk = versions.slice(i, i + CHUNK);
  console.log("Repair applied:", chunk.join(" "));
  const r = spawnSync(
    "npx",
    ["supabase", "migration", "repair", "--status", "applied", ...chunk, "--linked"],
    { cwd: root, env: process.env, stdio: "inherit", shell: true },
  );
  if (r.status !== 0) {
    console.error("repair failed for chunk starting at index", i);
    process.exit(r.status ?? 1);
  }
}

console.log("Done. Run: npx supabase migration list --linked");

/**
 * Shared Supabase query helpers for all domain services.
 * Provides thin wrappers around dedup + withRetry + getSupabaseClient
 * so each service doesn't have to repeat boilerplate.
 *
 * Demo accounts (@carenet.demo, demo-* ids, fixed seed UUIDs) use Postgres schema `demo`
 * so mock data never mixes with `public` for real users. Requires `demo` in Supabase API exposed schemas.
 */
import { USE_SUPABASE, getSupabaseClient } from "./supabase";
import { withRetry } from "@/backend/utils/retry";
import { dedup } from "@/backend/utils/dedup";

export { USE_SUPABASE };

/**
 * When true, services may load the in-memory mock barrel (`loadMockBarrel`) or substitute
 * demo fixtures on empty DB / errors.
 *
 * - `isDemoSession()` true: demo accounts (`@carenet.demo`, `demo-*`, `carenet-auth-mode=demo`, etc.).
 * - Otherwise false — including when `USE_SUPABASE` is false (missing env): return empty DB-shaped
 *   results or propagate errors, never fabricated mock rows unless the user is a demo session.
 */
export function useInAppMockDataset(): boolean {
  return isDemoSession();
}

/** True when the active browser session is a CareNet demo user (routes queries to `demo` schema). */
export function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("carenet-auth-mode") === "demo") return true;
    const raw = window.localStorage.getItem("carenet-auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { id?: string; email?: string };
    const id = typeof parsed.id === "string" ? parsed.id : "";
    const email = (typeof parsed.email === "string" ? parsed.email : "").toLowerCase();
    if (id.startsWith("demo-")) return true;
    if (email.endsWith("@carenet.demo")) return true;
    if (/^00000000-0000-0000-0000-00000000000[0-9a-f]$/i.test(id)) return true;
    return false;
  } catch {
    return false;
  }
}

/** PostgREST client targeting `demo` or `public` based on session. */
export function sbData() {
  const c = getSupabaseClient();
  return isDemoSession() ? c.schema("demo") : c;
}

/** TTL for rows created by demo users in `demo` schema (monthly cleanup removes when past due). */
export function demoUserCreatedExpiresAtIso(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

/** Merge demo_expires_at onto insert payloads when in a demo Supabase session. */
export function withDemoExpiry<T extends Record<string, unknown>>(row: T): T & { demo_expires_at?: string } {
  if (!isDemoSession()) return row;
  return { ...row, demo_expires_at: demoUserCreatedExpiresAtIso() };
}

/** Suffix for sbRead dedup keys so demo and public caches never collide. */
export function dataCacheScope(): "demo" | "pub" {
  return isDemoSession() ? "demo" : "pub";
}

const READ_RETRY = {
  maxRetries: 3,
  baseDelayMs: 800,
  onRetry: (_e: unknown, a: number, d: number) =>
    console.log(`[SB] Retry #${a} in ${d}ms`),
};
const WRITE_RETRY = { maxRetries: 2, baseDelayMs: 500 };

/** Get the Supabase client (convenience re-export) */
export const sb = () => getSupabaseClient();

/** Get the current authenticated user's ID. Throws if not authed. */
export async function currentUserId(): Promise<string> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * Deduplicated read query with retry.
 * @param key   Dedup key
 * @param fn    Async function that does the Supabase query
 */
export function sbRead<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return dedup(key, () => withRetry(fn, READ_RETRY));
}

/**
 * Write with retry (no dedup — writes are always executed).
 */
export function sbWrite<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, WRITE_RETRY);
}

/**
 * Select rows from a table, mapping snake_case → camelCase via `mapFn`.
 */
export async function sbSelect<T>(
  table: string,
  mapFn: (row: Record<string, unknown>) => T,
  build?: (q: any) => any,
): Promise<T[]> {
  let q = sbData().from(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: Record<string, unknown>) => mapFn(d));
}

/**
 * Select a single row from a table.
 */
export async function sbSelectOne<T>(
  table: string,
  mapFn: (row: Record<string, unknown>) => T,
  build?: (q: any) => any,
): Promise<T | null> {
  let q = sbData().from(table).select("*");
  if (build) q = build(q);
  q = q.single();
  const { data, error } = await q;
  if (error) {
    if ((error as any).code === "PGRST116") return null; // no rows
    throw error;
  }
  return data ? mapFn(data as Record<string, unknown>) : null;
}

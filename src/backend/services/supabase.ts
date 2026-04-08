/**
 * CareNet Supabase Client
 * ────────────────────────
 * Uses @supabase/supabase-js with env vars injected by Figma Make / Vercel.
 *
 * Toggle USE_SUPABASE: real PostgREST when URL/key are set (and not Playwright mock mode).
 * When env vars are missing, services return empty shapes unless the user is a demo session.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Configuration ───
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Playwright sets `VITE_PLAYWRIGHT_E2E` on the dev server; vite.config `define` also injects
 * `__CARENET_PLAYWRIGHT_E2E__` so bundled code forces mock mode. We check both: some dev/preview
 * paths expose the env var while `define` is missing from a prebundle edge case.
 */
declare const __CARENET_PLAYWRIGHT_E2E__: boolean | undefined;

function isPlaywrightE2EMock(): boolean {
  if (import.meta.env.VITE_PLAYWRIGHT_E2E === "true") return true;
  return typeof __CARENET_PLAYWRIGHT_E2E__ !== "undefined" && !!__CARENET_PLAYWRIGHT_E2E__;
}

/** Set to true to use real Supabase. Auto-disables if env vars are missing. */
export const USE_SUPABASE = !isPlaywrightE2EMock() && !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ─── Singleton client ───
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log(
      "[CareNet] Supabase URL/key not set — API layers return empty data unless you use Demo Access (@carenet.demo).\n" +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect."
    );
    // Return a minimal client that won't crash — services check USE_SUPABASE first
    _client = createClient("https://placeholder.supabase.co", "placeholder-key");
    return _client;
  }

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return _client;
}

/** Convenience re-export for direct imports */
export const supabase = getSupabaseClient();
/**
 * CareNet Supabase Client
 * ────────────────────────
 * Uses @supabase/supabase-js with env vars injected by Figma Make / Vercel.
 *
 * Toggle USE_SUPABASE to switch between real Supabase and mock data.
 * When env vars are missing, falls back to mock mode automatically.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Configuration ───
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Playwright sets `VITE_PLAYWRIGHT_E2E` on the dev server; vite.config `define` injects this
 * so mock mode works even when `import.meta.env` omits ad-hoc VITE_* keys.
 */
declare const __CARENET_PLAYWRIGHT_E2E__: boolean;
const E2E_FORCE_MOCK = typeof __CARENET_PLAYWRIGHT_E2E__ !== "undefined" && __CARENET_PLAYWRIGHT_E2E__;

/** Set to true to use real Supabase. Auto-disables if env vars are missing. */
export const USE_SUPABASE = !E2E_FORCE_MOCK && !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// ─── Singleton client ───
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log(
      "[CareNet] Supabase not configured. Using mock data.\n" +
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
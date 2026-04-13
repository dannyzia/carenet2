/**
 * unregisterDevice — Deactivate this device's push token on logout
 * ─────────────────────────────────────────────────────────────────
 * Reads the token persisted by registerDeviceForPush() in localStorage
 * and deactivates only that specific token row. If no stored token is
 * found, falls back to deactivating all tokens for the user.
 */

import { USE_SUPABASE, getSupabaseClient } from "@/backend/services/supabase";
import { getStoredDeviceToken, clearStoredDeviceToken } from "./registerDevice";
import { isCapacitorNativeShell } from "./platform";

/**
 * Deactivates this device's push token for the current user.
 * Call this during the logout flow before clearing the session.
 *
 * @returns true if the token was deactivated, false if skipped/failed
 */
export async function unregisterDeviceForPush(): Promise<boolean> {
  if (!USE_SUPABASE) {
    console.log("[unregisterDevice] Skipped — Supabase not connected");
    return false;
  }

  // Push tokens are registered only on real native shells; avoid direct `device_tokens`
  // REST calls from web (RLS expects a normal user session — logout races can surface as 401).
  if (!isCapacitorNativeShell()) {
    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/04d63fde-28d9-48a9-bc93-871ef0a09c70", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "672241" },
      body: JSON.stringify({
        sessionId: "672241",
        runId: "pre-fix",
        hypothesisId: "H-push-skip-web",
        location: "unregisterDevice.ts:native-gate",
        message: "unregister push skipped (not Capacitor native shell)",
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    clearStoredDeviceToken();
    return false;
  }

  try {
    const sb = getSupabaseClient();

    // Get current user before logout clears the session
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      console.log("[unregisterDevice] Skipped — no authenticated user");
      clearStoredDeviceToken();
      return false;
    }

    const storedToken = getStoredDeviceToken();

    // #region agent log
    fetch("http://127.0.0.1:7557/ingest/04d63fde-28d9-48a9-bc93-871ef0a09c70", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "672241" },
      body: JSON.stringify({
        sessionId: "672241",
        runId: "pre-fix",
        hypothesisId: "H-push-native-update",
        location: "unregisterDevice.ts:before-update",
        message: "unregister will call device_tokens update",
        data: { hasStoredToken: Boolean(storedToken) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (storedToken) {
      // Target only this device's token
      const { error } = await sb
        .from("device_tokens")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("token", storedToken);

      if (error) {
        console.error("[unregisterDevice] Failed to deactivate token:", error);
        return false;
      }

      console.log("[unregisterDevice] Deactivated token for this device:", storedToken.slice(0, 12) + "…");
    } else {
      // Fallback: no stored token, deactivate all tokens for this user
      console.warn("[unregisterDevice] No stored token — deactivating all tokens for user");
      const { error } = await sb
        .from("device_tokens")
        .update({ active: false })
        .eq("user_id", user.id);

      if (error) {
        console.error("[unregisterDevice] Failed to deactivate all tokens:", error);
        return false;
      }
    }

    // Always clear localStorage regardless of outcome
    clearStoredDeviceToken();
    return true;
  } catch (e) {
    console.error("[unregisterDevice] Failed:", e);
    clearStoredDeviceToken();
    return false;
  }
}

/**
 * registerDevice — Register FCM/APNs token with Supabase on app launch
 * ─────────────────────────────────────────────────────────────────────
 * Call this once after the user is authenticated and Capacitor has
 * obtained a push notification token. It invokes the `register-device`
 * Edge Function to upsert the token into the `device_tokens` table.
 */

import { isCapacitorNativeShell, getPlatform } from "./platform";
import { requestPermission, getDeviceToken } from "./notifications";
import { USE_SUPABASE, getSupabaseClient } from "@/backend/services/supabase";

const DEVICE_TOKEN_KEY = "carenet-device-push-token";

/** Retrieve the last registered device token from localStorage */
export function getStoredDeviceToken(): string | null {
  try {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored device token (called on unregister) */
export function clearStoredDeviceToken(): void {
  try {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
  } catch { /* noop */ }
}

/**
 * Registers the current device's push token with the backend.
 * Safe to call multiple times — the Edge Function handles upserts.
 *
 * @returns The registered token string, or null if registration wasn't possible
 */
export async function registerDeviceForPush(): Promise<string | null> {
  if (!USE_SUPABASE) {
    console.log("[registerDevice] Skipped — Supabase not connected");
    return null;
  }
  if (!isCapacitorNativeShell()) {
    console.log(
      "[registerDevice] Skipped — push registration runs only on the iOS/Android app (Capacitor native shell), not in the browser"
    );
    return null;
  }

  try {
    // 1. Request permission if not already granted
    const permission = await requestPermission();
    if (permission !== "granted") {
      console.log("[registerDevice] Push permission not granted:", permission);
      return null;
    }

    // 2. Get the device token from Capacitor
    const token = await getDeviceToken();
    if (!token) {
      console.warn("[registerDevice] No device token received");
      return null;
    }

    // 3. Determine platform (fcm for Android, apns for iOS)
    const platform = getPlatform();
    const pushPlatform: "fcm" | "apns" =
      platform === "ios" ? "apns" : "fcm";

    // 4. Call the register-device Edge Function
    const sb = getSupabaseClient();
    const { data, error } = await sb.functions.invoke("register-device", {
      body: {
        platform: pushPlatform,
        token,
      },
    });

    if (error) {
      console.error("[registerDevice] Edge Function error:", error);
      return null;
    }

    console.log("[registerDevice] Registered successfully:", data);
    // Persist token so unregister can target this specific device
    try {
      localStorage.setItem(DEVICE_TOKEN_KEY, token);
    } catch { /* localStorage unavailable — non-critical */ }
    return token;
  } catch (e) {
    console.error("[registerDevice] Failed:", e);
    return null;
  }
}
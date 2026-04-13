/**
 * Platform detection utilities for Capacitor/web hybrid app.
 * Reference: D008 §12
 *
 * These detect the runtime environment so feature wrappers can
 * choose between native Capacitor plugins and web fallbacks.
 */

/** Returns true when the Capacitor runtime is present (including web builds that load Capacitor). */
export function isNative(): boolean {
  return typeof (window as any)?.Capacitor !== "undefined";
}

/** True only on an Android/iOS shell build — not the in-browser “web” Capacitor host. */
export function isCapacitorNativeShell(): boolean {
  const cap = typeof window !== "undefined" ? (window as any).Capacitor : undefined;
  return typeof cap?.isNativePlatform === "function" && cap.isNativePlatform() === true;
}

/** Returns true when running inside the Capacitor Android shell */
export function isAndroid(): boolean {
  return isNative() && (window as any).Capacitor.getPlatform() === "android";
}

/** Returns true when running inside the Capacitor iOS shell */
export function isIOS(): boolean {
  return isNative() && (window as any).Capacitor.getPlatform() === "ios";
}

/** Returns true when running as a regular web app (not inside Capacitor) */
export function isWeb(): boolean {
  return !isNative();
}

/**
 * Returns the current platform string.
 * Possible values: "android" | "ios" | "web"
 */
export function getPlatform(): "android" | "ios" | "web" {
  if (isAndroid()) return "android";
  if (isIOS()) return "ios";
  return "web";
}

/**
 * Safe-area inset CSS variables are set by Capacitor's viewport-fit=cover.
 * This returns the bottom safe area height (for iPhone notch/home indicator).
 */
export function getSafeAreaBottom(): number {
  if (typeof window === "undefined") return 0;
  const value = getComputedStyle(document.documentElement).getPropertyValue("env(safe-area-inset-bottom)");
  return parseInt(value, 10) || 0;
}

/**
 * Push Notifications abstraction — uses @capacitor/push-notifications on native
 * (via global plugin registry), falls back to Web Notifications API.
 * Reference: D008 §12.6
 */

import { isNative } from "./platform";
import { getPushNotificationsPlugin } from "./capacitor-plugins";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export type NotificationPermissionStatus = "granted" | "denied" | "prompt";

export async function requestPermission(): Promise<NotificationPermissionStatus> {
  if (isNative()) {
    const PushNotifications = getPushNotificationsPlugin();
    if (PushNotifications) {
      try {
        const result = await PushNotifications.requestPermissions();
        return mapPermission(result.receive);
      } catch { /* fall through */ }
    }
  }
  // Web fallback
  if (!("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result as NotificationPermissionStatus;
}

export async function getPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (isNative()) {
    const PushNotifications = getPushNotificationsPlugin();
    if (PushNotifications) {
      try {
        const result = await PushNotifications.checkPermissions();
        return mapPermission(result.receive);
      } catch { /* fall through */ }
    }
  }
  if ("Notification" in window) return Notification.permission as NotificationPermissionStatus;
  return "denied";
}

export async function getDeviceToken(): Promise<string | null> {
  if (!isNative()) return null;
  const PushNotifications = getPushNotificationsPlugin();
  if (!PushNotifications) return null;

  return new Promise((resolve) => {
    PushNotifications.addListener("registration", (token: any) => resolve(token.value));
    PushNotifications.addListener("registrationError", () => resolve(null));
    try {
      const reg = PushNotifications.register();
      // register() returns a Promise — catch native-side Firebase errors gracefully
      if (reg && typeof (reg as Promise<any>).catch === "function") {
        (reg as Promise<any>).catch(() => resolve(null));
      }
    } catch {
      resolve(null);
    }
  });
}

export function onNotificationReceived(callback: (notification: PushNotification) => void): () => void {
  if (!isNative()) return () => {};
  const PushNotifications = getPushNotificationsPlugin();
  if (!PushNotifications) return () => {};

  let cleanup: (() => void) | null = null;
  void Promise.resolve(
    PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
      callback({
        id: notification.id,
        title: notification.title || "",
        body: notification.body || "",
        data: notification.data,
      });
    }),
  ).then((listener: any) => {
    cleanup = () => listener.remove();
  });

  return () => cleanup?.();
}

export function onNotificationTapped(callback: (notification: PushNotification) => void): () => void {
  if (!isNative()) return () => {};
  const PushNotifications = getPushNotificationsPlugin();
  if (!PushNotifications) return () => {};

  let cleanup: (() => void) | null = null;
  void Promise.resolve(
    PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
      callback({
        id: action.notification.id,
        title: action.notification.title || "",
        body: action.notification.body || "",
        data: action.notification.data,
      });
    }),
  ).then((listener: any) => {
    cleanup = () => listener.remove();
  });

  return () => cleanup?.();
}

export async function showLocalNotification(title: string, body: string): Promise<void> {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/pwa-192.png" });
  }
}

function mapPermission(status: string): NotificationPermissionStatus {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "prompt";
}

/**
 * Native abstraction layer barrel export.
 * All Capacitor plugin wrappers with graceful web fallbacks.
 *
 * Import like:
 *   import { takePhoto, getCurrentPosition, hapticLight } from "@/frontend/native";
 */

export { isNative, isAndroid, isIOS, isWeb, getPlatform, getSafeAreaBottom } from "./platform";
export { takePhoto, pickImage, type PhotoResult } from "./camera";
export { getCurrentPosition, watchPosition, distanceMeters, type Position } from "./geolocation";
export {
  requestPermission as requestNotificationPermission,
  getPermissionStatus as getNotificationPermissionStatus,
  getDeviceToken,
  onNotificationReceived,
  onNotificationTapped,
  showLocalNotification,
  type PushNotification,
  type NotificationPermissionStatus,
} from "./notifications";
export {
  isBiometricAvailable,
  verifyBiometric,
  storeCredentials,
  getCredentials,
  type BiometricType,
  type BiometricAvailability,
} from "./biometric";
export {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSelection,
} from "./haptics";
export { setStatusBarForRole, setStatusBarColor, resetStatusBar, showStatusBar, hideStatusBar } from "./statusBar";
export { registerBackButton, unregisterBackButton } from "./backButton";
export { registerAppUrlOpenListener, parseDeepLinkToPath } from "./deepLinks";
export { registerDeviceForPush, getStoredDeviceToken, clearStoredDeviceToken } from "./registerDevice";
export { unregisterDeviceForPush } from "./unregisterDevice";
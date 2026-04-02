/**
 * Capacitor Configuration — CareNet Bangladesh
 * Reference: D008 §12.1
 *
 * Build flow:
 *   1. pnpm build                    → produces dist/
 *   2. npx cap sync android          → copies dist/ to Android project
 *   3. npx cap open android          → opens in Android Studio
 *
 * Plugins required (install before cap sync):
 *   @capacitor/camera
 *   @capacitor/geolocation
 *   @capacitor/push-notifications
 *   @capacitor/network
 *   @capacitor/preferences
 *   @capacitor/filesystem
 *   @capacitor/status-bar
 *   @capacitor/haptics
 *   @capacitor/app
 *   capacitor-native-biometric
 */

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.carenet.app",
  appName: "CareNet",
  webDir: "dist",
  bundledWebRuntime: false,

  // Server config for development (comment out for production builds)
  // server: {
  //   url: "http://192.168.1.X:5173",
  //   cleartext: true,
  // },

  plugins: {
    // ─── Push Notifications ───
    PushNotifications: {
      // Foreground presentation options (iOS)
      presentationOptions: ["badge", "sound", "alert"],
    },

    // ─── Camera ───
    // No special config needed; uses defaults

    // ─── Geolocation ───
    // Android: ACCESS_FINE_LOCATION is auto-added by plugin
    // iOS: Info.plist strings set in native project

    // ─── Status Bar ───
    StatusBar: {
      // Default to dark text on light background
      style: "LIGHT",
      backgroundColor: "#FFFFFF",
    },

    // ─── Keyboard ───
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },

    // ─── Splash Screen ───
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      // Splash image should be placed in:
      //   android/app/src/main/res/drawable/splash.png
      //   ios/App/App/Assets.xcassets/Splash.imageset/
    },
  },

  // ─── Android-specific ───
  android: {
    // Allow mixed content for development
    allowMixedContent: true,
    // Use WebView hardware acceleration
    webContentsDebuggingEnabled: false, // Set true for debug builds
    // Minimum SDK 23 (Android 6.0) per D008 §12.1 — see android/variables.gradle
  },

  // ─── iOS-specific ───
  ios: {
    // Content inset for safe area (notch/home indicator)
    contentInset: "automatic",
    // Scroll behavior
    scrollEnabled: true,
  },
};

export default config;

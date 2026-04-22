import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Capacitor } from "@capacitor/core";
import { router } from "./routes";
import { ThemeProvider } from "@/frontend/components/shared/ThemeProvider";
import { AuthProvider } from "@/backend/store/auth/AuthContext";
import { registerBackButton, unregisterBackButton } from "@/frontend/native/backButton";
import { registerAppUrlOpenListener } from "@/frontend/native/deepLinks";
import { onNotificationTapped } from "@/frontend/native/notifications";
import { Toaster } from "sonner";
import { sessionLog } from "@/debug/sessionLog";
import { startDemoSimulation, stopDemoSimulation } from "@/backend/services/realtime";

// Initialize i18n — must be imported before any component that uses useTranslation
import "@/frontend/i18n";

/**
 * UI copy is driven by **i18next** + `src/locales/*` (see D017).
 * Tolgee self-hosted (`VITE_APP_TOLGEE_*`) is **not** wrapped here: `TolgeeProvider`
 * gates the tree on `tolgee.run()`; if :8080 is down, CORS-blocked, or slow, the app
 * stuck on `fallback="Loading..."`. Re-enable Tolgee when the server is reliable — see
 * `src/frontend/i18n/tolgee.ts`.
 */
export default function App() {
  // #region agent log
  useEffect(() => {
    void (async () => {
      let swRegs = 0;
      let swUrls: string[] = [];
      try {
        const regs = await navigator.serviceWorker?.getRegistrations();
        swRegs = regs?.length ?? 0;
        swUrls = (regs ?? []).map((r) => r.scope);
      } catch {
        /* ignore */
      }
      sessionLog(
        "App.tsx:mount",
        "App mounted",
        {
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform(),
          swRegistrations: swRegs,
          swScopes: swUrls,
        },
        "H1",
      );
    })();
  }, []);
  // #endregion

  useEffect(() => {
    registerBackButton();
    return unregisterBackButton;
  }, []);

  useEffect(() => {
    const unDeep = registerAppUrlOpenListener((to) => {
      void router.navigate(to);
    });
    const unTap = onNotificationTapped((notification) => {
      const route = notification.data?.route;
      if (route && typeof route === "string") {
        void router.navigate(route);
      }
    });
    return () => {
      unDeep();
      unTap();
    };
  }, []);

  useEffect(() => {
    startDemoSimulation();
    return stopDemoSimulation;
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Skip navigation link for keyboard accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-pink-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          Skip to main content
        </a>
        <div id="main-content">
          <RouterProvider
            router={router}
            fallbackElement={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>}
            hydrateFallbackElement={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>}
          />
        </div>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontSize: "13px" },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

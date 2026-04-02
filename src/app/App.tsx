import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "@/frontend/components/shared/ThemeProvider";
import { AuthProvider } from "@/backend/store/auth/AuthContext";
import { registerBackButton, unregisterBackButton } from "@/frontend/native/backButton";
import { registerAppUrlOpenListener } from "@/frontend/native/deepLinks";
import { onNotificationTapped } from "@/frontend/native/notifications";
import { router } from "./routes";
import { Toaster } from "sonner";
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
        <RouterProvider
          router={router}
          fallbackElement={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>}
          hydrateFallbackElement={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" /></div>}
        />
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

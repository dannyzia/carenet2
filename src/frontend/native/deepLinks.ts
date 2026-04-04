/**
 * Capacitor App URL / deep link handling (D008 §12.4).
 * Maps carenet:// and https app links into in-app paths for React Router.
 */

import { isNative } from "./platform";
import { getAppPlugin } from "./capacitor-plugins";

export function registerAppUrlOpenListener(navigate: (to: string) => void): () => void {
  if (!isNative()) return () => {};

  const App = getAppPlugin();
  if (!App) return () => {};

  let cleanup: (() => void) | null = null;
  // Legacy window.Capacitor.Plugins.App returns a sync handle; @capacitor/app ES module returns a Promise.
  void Promise.resolve(
    App.addListener("appUrlOpen", (event: { url: string }) => {
      const path = parseDeepLinkToPath(event.url);
      if (path) navigate(path);
    }),
  ).then((handle) => {
    cleanup = () => handle.remove();
  });

  return () => cleanup?.();
}

/** Returns an app-internal path (leading slash) or null if not handled. */
export function parseDeepLinkToPath(urlString: string): string | null {
  try {
    const u = new URL(urlString);
    if (u.protocol === "carenet:") {
      const host = u.hostname;
      const path = u.pathname || "";
      if (host) {
        const joined = `/${host}${path === "/" ? "" : path}`;
        return joined.replace(/\/{2,}/g, "/") || "/";
      }
      if (path.startsWith("/")) return path;
      return path ? `/${path.replace(/^\/+/, "")}` : null;
    }
    if (u.protocol === "https:" || u.protocol === "http:") {
      return `${u.pathname}${u.search}${u.hash}` || "/";
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

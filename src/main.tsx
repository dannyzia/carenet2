import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { sessionLog } from "@/debug/sessionLog";

// #region agent log
window.addEventListener("error", (e) => {
  sessionLog(
    "main.tsx:window-error",
    "window error",
    {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
    },
    "H3",
  );
});
window.addEventListener("unhandledrejection", (e) => {
  sessionLog(
    "main.tsx:unhandledrejection",
    "unhandledrejection",
    { reason: String((e as PromiseRejectionEvent).reason) },
    "H3",
  );
});
// #endregion

// #region agent log
sessionLog(
  "main.tsx:boot",
  "bootstrap start",
  {
    href: typeof window !== "undefined" ? window.location.href : "",
    path: typeof window !== "undefined" ? window.location.pathname : "",
    hasRoot: !!document.getElementById("root"),
    hasSW: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  },
  "H1",
);
// #endregion

try {
  const rootEl = document.getElementById("root");
  // #region agent log
  sessionLog(
    "main.tsx:pre-render",
    "before createRoot",
    { rootExists: !!rootEl },
    "H2",
  );
  // #endregion
  createRoot(rootEl!).render(<App />);
  // #region agent log
  sessionLog("main.tsx:post-render", "createRoot render dispatched", {}, "H2");
  // #endregion
} catch (err) {
  // #region agent log
  sessionLog(
    "main.tsx:catch",
    "createRoot failed",
    { error: String(err) },
    "H2",
  );
  // #endregion
  throw err;
}
  
import { Tolgee, DevTools, FormatSimple } from "@tolgee/react";

/**
 * Tolgee client for **optional** in-context / remote workflows.
 *
 * **Not mounted in `App.tsx` by default:** `TolgeeProvider` waits for `tolgee.run()`
 * to finish before rendering children. A self-hosted instance on `localhost:8080`
 * that is down, misconfigured, or blocked by CORS leaves the app stuck on
 * `fallback="Loading..."`.
 *
 * To re-enable: wrap the tree in `App.tsx` with
 * `import { TolgeeProvider } from "@tolgee/react"` and `import tolgee from "./tolgee"`,
 * then `<TolgeeProvider tolgee={tolgee} fallback={null}>…</TolgeeProvider>` (or a
 * short timeout fallback). Ensure CORS on Tolgee allows your Vite origin.
 *
 * @see `VITE_APP_TOLGEE_API_URL` / `VITE_APP_TOLGEE_API_KEY` in `.env`
 */
const tolgee = Tolgee()
  .use(DevTools())
  .use(FormatSimple())
  .init({
    language: localStorage.getItem("carenet-lang") || navigator.language?.split("-")[0] || "en",
    apiUrl: import.meta.env.VITE_APP_TOLGEE_API_URL,
    apiKey: import.meta.env.VITE_APP_TOLGEE_API_KEY,
    ns: ["common", "auth", "caregiver", "guardian"],
    defaultNs: "common",
    fallbackLanguage: "en",
  });

export default tolgee;

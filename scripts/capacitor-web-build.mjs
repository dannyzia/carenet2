/**
 * Vite production build with PWA disabled — Workbox/service worker breaks many Capacitor WebViews (white screen).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";

const r = spawnSync("npm", ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: win,
  env: { ...process.env, VITE_DISABLE_PWA: "true" },
});
process.exit(r.status ?? 1);

/**
 * Production Android release: Vite build → cap sync → Gradle bundleRelease (AAB) or assembleRelease (APK).
 * Google Play uses AAB (bundleRelease) for new apps; APK is optional for sideload testing.
 *
 * Extra Gradle args after -- e.g.:
 *   node scripts/android-release.mjs -- -PcarenetAllowDebugSigning=true
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradlewCmd = isWin ? "gradlew.bat" : "./gradlew";

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const raw = process.argv.slice(2);
const sep = raw.indexOf("--");
const before = sep === -1 ? raw : raw.slice(0, sep);
const after = sep === -1 ? [] : raw.slice(sep + 1);

const apk = before[0] === "apk";
const gradleTask = apk ? "assembleRelease" : "bundleRelease";
const gradleArgs = [gradleTask, ...after, ...(apk ? before.slice(1) : before)];

run("npm", ["run", "build:cap"], root);
run("npx", ["cap", "sync", "android"], root);

run(gradlewCmd, gradleArgs, androidDir);

/** Matches android/app/build.gradle resolveCarenetAppBuildDirectory() */
function carenetAppBuildRoot() {
  const env = process.env.CARENET_ANDROID_BUILD_DIR?.trim();
  if (env) return env;
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, "CareNet2-Android-app-build");
  }
  return path.join(root, ".carenet-android-build");
}

const buildRoot = carenetAppBuildRoot();
const out = apk
  ? path.join(buildRoot, "outputs", "apk", "release", "app-release.apk")
  : path.join(buildRoot, "outputs", "bundle", "release", "app-release.aab");
console.log(`\nDone. Output: ${out}\n`);

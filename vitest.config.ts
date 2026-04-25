import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";
import fs from "fs";
import react from "@vitejs/plugin-react";

/**
 * Parse a .env file respecting quoted values and inline # comments.
 * Handles: KEY=value, KEY="val#ue", KEY='val#ue', KEY=`val#ue`
 * loadEnv (Vite) strips everything after # even inside values, so we
 * parse manually for keys that need special characters like # in passwords.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const result: Record<string, string> = {};
  for (const raw of fs.readFileSync(filePath, "utf8").split("\n")) {
    // Strip Windows \r and surrounding whitespace
    const line = raw.replace(/\r$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1);
    const first = val[0];
    if (first === '"' || first === "'" || first === "`") {
      const closing = val.lastIndexOf(first);
      val = closing > 0 ? val.slice(1, closing) : val.slice(1);
    } else {
      const commentIdx = val.indexOf(" #");
      if (commentIdx !== -1) val = val.slice(0, commentIdx);
      val = val.trim();
    }
    result[key] = val;
  }
  return result;
}

const projectRoot = path.resolve(__dirname);

export default defineConfig(({ mode }) => {
  // Parse .env files ourselves so quoted values with # are preserved correctly.
  // loadEnv treats # as a comment even inside unquoted values.
  const rawEnv = {
    ...parseEnvFile(path.resolve(projectRoot, ".env")),
    ...parseEnvFile(path.resolve(projectRoot, ".env.local")),
  };
  Object.assign(process.env, rawEnv);

  // Also run loadEnv for VITE_* import.meta.env compatibility, but don't
  // overwrite keys already set by our parser above.
  const viteEnv = loadEnv(mode, projectRoot, "");
  for (const [k, v] of Object.entries(viteEnv)) {
    if (!(k in process.env)) process.env[k] = v;
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "react-router-original": path.resolve(__dirname, "node_modules/react-router"),
        "react-router": path.resolve(__dirname, "src/lib/react-router-shim.ts"),
      },
    },
    test: {
      // Use node environment for utility/service tests (no DOM overhead).
      // Component tests can override with `// @vitest-environment jsdom` per-file.
      environment: "node",

      setupFiles: ["./src/test/setup-indexeddb.ts", "@testing-library/jest-dom/vitest"],

      // Test file discovery
      include: ["src/**/__tests__/**/*.test.ts", "src/**/__tests__/**/*.test.tsx"],
      exclude: ["node_modules", "dist", "e2e"],

      // Coverage config (optional — run with `vitest --coverage`)
      coverage: {
        provider: "v8",
        include: ["src/app/utils/**", "src/app/services/**", "src/app/hooks/**"],
        exclude: ["src/**/__tests__/**"],
      },

      // Timeout per test (5s default, 15s for integration)
      testTimeout: 10_000,

      // Silence console.log/warn in tests unless DEBUG=true
      silent: !process.env.DEBUG,
    },
  };
});
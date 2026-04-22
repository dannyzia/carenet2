import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Writes NDJSON to project-root `debug-c9056c.log` when the app POSTs to `/__carenet_debug_ingest`.
 * Used when the external debug ingest server is not writing into the workspace.
 */
export function carenetDebugSessionLogPlugin(projectRoot: string): Plugin {
  const logPath = path.join(projectRoot, "debug-c9056c.log");
  return {
    name: "carenet-debug-session-log",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] ?? "";
        if (pathname !== "/__carenet_debug_ingest" || req.method !== "POST") {
          return next();
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        req.on("end", () => {
          try {
            const raw = Buffer.concat(chunks).toString("utf8");
            const parsed = JSON.parse(raw) as unknown;
            fs.appendFileSync(logPath, `${JSON.stringify(parsed)}\n`, "utf8");
          } catch {
            fs.appendFileSync(
              logPath,
              `${JSON.stringify({ sessionId: "c9056c", message: "invalid_debug_payload", at: Date.now() })}\n`,
              "utf8"
            );
          }
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

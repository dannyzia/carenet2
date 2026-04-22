/** Cursor debug session: POST mirror for local NDJSON (see `plugins/vite-debug-session-log.ts`). */
export function agentDebugLog(payload: {
  runId?: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
}): void {
  const body = JSON.stringify({
    sessionId: "c9056c",
    ...payload,
    timestamp: Date.now(),
  });
  void fetch("http://127.0.0.1:7258/ingest/b9424d5e-0a74-4fc6-ab4f-93f1728fd7c6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c9056c" },
    body,
  }).catch(() => {});
  if (import.meta.env.DEV) {
    void fetch("/__carenet_debug_ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  }
}

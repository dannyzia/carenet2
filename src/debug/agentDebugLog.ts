/**
 * Agent debug NDJSON (session 672241). Do not log secrets or PII.
 */
export function agentDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  // #region agent log
  fetch("http://127.0.0.1:7557/ingest/04d63fde-28d9-48a9-bc93-871ef0a09c70", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "672241" },
    body: JSON.stringify({
      sessionId: "672241",
      timestamp: Date.now(),
      ...payload,
    }),
  }).catch(() => {});
  // #endregion
}

/**
 * Debug-mode NDJSON logging (session e015cb). Also mirrors to console for adb logcat.
 * Do not log secrets or PII.
 */
const ENDPOINT =
  "http://127.0.0.1:7673/ingest/d96fba52-21aa-407b-8a82-7b9b2f666253";
const SESSION = "e015cb";

const INGEST_ENABLED =
  typeof import.meta !== "undefined" &&
  import.meta.env?.DEV === true &&
  import.meta.env?.VITE_DEBUG_SESSION_INGEST === "1";

export function sessionLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
): void {
  const payload = {
    sessionId: SESSION,
    location,
    message,
    data,
    timestamp: Date.now(),
    hypothesisId,
  };
  console.log("[CARENET_DEBUG]", message, data);
  // #region agent log
  if (INGEST_ENABLED) {
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": SESSION,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }
  // #endregion
}

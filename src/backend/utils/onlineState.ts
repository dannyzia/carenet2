/**
 * Module-level Online State Tracker
 * ──────────────────────────────────
 * Non-React singleton that tracks connectivity via four sources
 * (in priority order):
 *
 *   1. Periodic lie-fi probe (HEAD request every 30s to detect false-positive)
 *   2. Capacitor Network plugin (native Android/iOS — most accurate)
 *   3. Network Information API (modern browsers)
 *   4. navigator.onLine + window events (universal fallback)
 *
 * The lie-fi probe catches the common scenario where `navigator.onLine`
 * reports true but the network is actually unreachable (e.g. captive
 * portal, DNS failure, upstream outage).
 *
 * Used by:
 *   - withRetry() — pauses retry loops while offline
 *   - realtime.ts — flips Realtime status on offline->online transitions
 *   - Any non-component code that needs connectivity awareness
 */

type StatusListener = (online: boolean) => void;

let _online = typeof navigator !== "undefined" ? navigator.onLine : true;
let _connectionType = "unknown";
const _listeners = new Set<StatusListener>();
let _capacitorCleanup: (() => void) | null = null;
let _forceMode = false; // When true, ignore probe/browser events and keep forced state

// ─── Data Saver change event ───
type DataSaverListener = (enabled: boolean) => void;
const _dataSaverListeners = new Set<DataSaverListener>();
let _dataSaverCached = false;

function _emitDataSaverChange(enabled: boolean) {
  if (enabled === _dataSaverCached) return;
  _dataSaverCached = enabled;
  console.log(`[OnlineState] Data Saver ${enabled ? "enabled" : "disabled"}`);
  _dataSaverListeners.forEach((fn) => {
    try { fn(enabled); } catch (e) { console.error("[OnlineState] data saver listener error:", e); }
  });
}

function _set(online: boolean) {
  _online = online;
  _listeners.forEach((fn) => {
    try { fn(online); } catch (e) { console.error("[OnlineState] listener error:", e); }
  });
}

// ─── Test / Hot-Reload Helpers ───

export function _forceOnline(online: boolean) {
  _forceMode = true;
  _set(online);
}

export function _destroy() {
  stopConnectivityProbe();
  _capacitorCleanup?.();
  _listeners.clear();
  _dataSaverListeners.clear();
  _forceMode = false;
}

function _setConnectionType(type: string) {
  _connectionType = type || "unknown";
}

// ═══════════════════════════════════════════════════════════════════════
// Source 0: Lie-Fi Connectivity Probe
// ═══════════════════════════════════════════════════════════════════════

export interface ProbeConfig {
  intervalMs?: number;
  timeoutMs?: number;
  failThreshold?: number;
  maxIntervalMs?: number;
  backoffMultiplier?: number;
  probeUrl?: string;
}

const DEFAULT_PROBE: Required<ProbeConfig> = {
  intervalMs: 30_000,
  timeoutMs: 5_000,
  failThreshold: 2,
  maxIntervalMs: 240_000,
  backoffMultiplier: 2,
  probeUrl: "",
};

let _probeTimer: ReturnType<typeof setTimeout> | null = null;
let _probeRunning = false;
let _consecutiveFailures = 0;
let _currentProbeInterval = 0;
let _probeConfig: Required<ProbeConfig> = { ...DEFAULT_PROBE };
let _probePausedForDataSaver = false;

// ─── Data Saver Detection ───

/** Check if the user has enabled Data Saver / Lite Mode in their browser. */
export function isDataSaverEnabled(): boolean {
  try {
    const conn = (navigator as any).connection;
    return !!conn?.saveData;
  } catch {
    return false;
  }
}

function _resolveProbeUrl(): string {
  if (_probeConfig.probeUrl) return _probeConfig.probeUrl;

  try {
    const sbUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL;
    if (sbUrl && !sbUrl.includes("YOUR_SUPABASE_URL")) {
      return `${sbUrl}/rest/v1/`;
    }
  } catch { /* ignore */ }

  return window.location.origin + "/";
}

async function _runProbe(): Promise<boolean> {
  if (!navigator.onLine) return false;

  if (isDataSaverEnabled()) {
    _probePausedForDataSaver = true;
    return true;
  }
  _probePausedForDataSaver = false;

  const url = _resolveProbeUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), _probeConfig.timeoutMs);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function _probeOnce() {
  const reachable = await _runProbe();

  if (reachable) {
    _consecutiveFailures = 0;
    _currentProbeInterval = _probeConfig.intervalMs;
    if (!_online && !_forceMode) {
      _set(true);
    }
  } else {
    _consecutiveFailures++;
    if (_consecutiveFailures >= _probeConfig.failThreshold && _online && !_forceMode) {
      console.warn(
        `[OnlineState] Lie-fi detected: ${_consecutiveFailures} consecutive probe failures. Flipping to offline.`
      );
      _set(false);
    }
    if (_consecutiveFailures >= _probeConfig.failThreshold) {
      _currentProbeInterval = Math.min(
        _currentProbeInterval * _probeConfig.backoffMultiplier,
        _probeConfig.maxIntervalMs
      );
    }
  }
}

function _scheduleNextProbe() {
  if (!_probeRunning) return;
  _probeTimer = setTimeout(async () => {
    await _probeOnce();
    _scheduleNextProbe();
  }, _currentProbeInterval);
}

/**
 * Start the periodic connectivity probe.
 * Safe to call multiple times — only one probe loop runs at a time.
 */
export function startConnectivityProbe(config?: ProbeConfig): void {
  if (typeof window === "undefined") return;
  stopConnectivityProbe();

  _probeConfig = { ...DEFAULT_PROBE, ...config };
  _consecutiveFailures = 0;
  _currentProbeInterval = _probeConfig.intervalMs;
  _probeRunning = true;

  _probeTimer = setTimeout(async () => {
    await _probeOnce();
    _scheduleNextProbe();
  }, 1000);

  document.addEventListener("visibilitychange", _handleVisibility);
}

/** Stop the connectivity probe. */
export function stopConnectivityProbe(): void {
  _probeRunning = false;
  if (_probeTimer) {
    clearTimeout(_probeTimer);
    _probeTimer = null;
  }
  document.removeEventListener("visibilitychange", _handleVisibility);
}

/** Get the current (possibly backed-off) probe interval in ms. */
export function getCurrentProbeInterval(): number {
  return _currentProbeInterval || _probeConfig.intervalMs;
}

/** Get the number of consecutive probe failures. */
export function getConsecutiveProbeFailures(): number {
  return _consecutiveFailures;
}

/** Whether the probe loop is currently active. */
export function isProbeRunning(): boolean {
  return _probeRunning;
}

/** Whether the probe is paused because Data Saver / Lite Mode is on. */
export function isProbePausedForDataSaver(): boolean {
  return _probePausedForDataSaver;
}

function _handleVisibility() {
  if (document.hidden) {
    if (_probeTimer) {
      clearTimeout(_probeTimer);
      _probeTimer = null;
    }
  } else {
    if (!_probeTimer && _probeRunning) {
      _probeOnce().then(_scheduleNextProbe);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Source 1: Capacitor Network Plugin (native-accurate)
// ═══════════════════════════════════════════════════════════════════════

function _initCapacitorNetwork(): boolean {
  try {
    const cap = (window as any)?.Capacitor;
    if (!cap?.isNativePlatform?.() && !cap?.isPluginAvailable?.("Network")) {
      return false;
    }
    const Network = cap?.Plugins?.Network;
    if (!Network) return false;

    Network.getStatus().then((status: any) => {
      _set(status.connected);
      _setConnectionType(status.connectionType);
    }).catch(() => { /* ignore */ });

    const listenerHandle = Network.addListener(
      "networkStatusChange",
      (status: any) => {
        _set(status.connected);
        _setConnectionType(status.connectionType);
        if (status.connected) _consecutiveFailures = 0;
      }
    );

    _capacitorCleanup = () => {
      listenerHandle?.remove?.();
    };

    console.log("[OnlineState] Capacitor Network plugin active");
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Source 2: Network Information API (browser)
// ═══════════════════════════════════════════════════════════════════════

function _initNetworkInfoAPI(): boolean {
  try {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return false;

    const updateType = () => {
      _setConnectionType(conn.effectiveType || conn.type || "unknown");
      if (conn.effectiveType === "none" || conn.downlink === 0) {
        _set(false);
      }
      const saveData = !!conn.saveData;
      _emitDataSaverChange(saveData);
      if (saveData) {
        _probePausedForDataSaver = true;
      } else if (_probePausedForDataSaver) {
        _probePausedForDataSaver = false;
        if (_probeRunning && !_probeTimer) {
          _probeOnce().then(_scheduleNextProbe);
        }
      }
    };

    _dataSaverCached = !!conn.saveData;

    updateType();
    conn.addEventListener("change", updateType);

    console.log("[OnlineState] Network Information API active");
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Source 3: navigator.onLine + browser events (universal fallback)
// ═══════════════════════════════════════════════════════════════════════

function _initBrowserEvents() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    _consecutiveFailures = 0;
    if (!_forceMode) _set(true);
  });
  window.addEventListener("offline", () => {
    if (!_forceMode) _set(false);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════

if (typeof window !== "undefined") {
  _initBrowserEvents();

  const deferredInit = () => {
    if (!_initCapacitorNetwork()) {
      _initNetworkInfoAPI();
    }
    startConnectivityProbe();
  };

  if (document.readyState === "complete") {
    setTimeout(deferredInit, 0);
  } else {
    window.addEventListener("load", deferredInit, { once: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════

/** Current online status (reads cached value — no DOM query) */
export function isOnline(): boolean {
  return _online;
}

/** Current connection type (e.g. "wifi", "cellular", "4g", "unknown") */
export function getConnectionType(): string {
  return _connectionType;
}

/** Subscribe to online/offline transitions. Returns unsubscribe fn. */
export function onOnlineChange(listener: StatusListener): () => void {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

/**
 * Subscribe to Data Saver on/off transitions. Returns unsubscribe fn.
 */
export function onDataSaverChange(listener: DataSaverListener): () => void {
  _dataSaverListeners.add(listener);
  return () => { _dataSaverListeners.delete(listener); };
}

/**
 * Returns a Promise that resolves once the device is back online.
 * If already online, resolves immediately.
 */
export function waitForOnline(signal?: AbortSignal): Promise<void> {
  if (_online) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Cancelled while waiting for online", "AbortError"));
    }

    const unsub = onOnlineChange((online) => {
      if (online) {
        cleanup();
        resolve();
      }
    });

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Cancelled while waiting for online", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    function cleanup() {
      unsub();
      signal?.removeEventListener("abort", onAbort);
    }
  });
}

/**
 * Retry with Exponential Backoff
 * ──────────────────────────────
 * Wraps an async function with automatic retry logic.
 *
 * - Retries on failure with exponentially increasing delays
 * - Adds jitter to prevent thundering herd
 * - Optionally accepts a shouldRetry predicate for selective retries
 * - Respects AbortSignal for cancellation
 * - Pauses automatically while the device is offline and resumes on reconnect
 */

import { isOnline, waitForOnline } from "./onlineState";

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  signal?: AbortSignal;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "shouldRetry" | "signal" | "onRetry">> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  jitter: 0.3,
};

// ─── Global Retry Activity Tracker ───

export interface RetryActivity {
  activeRetries: number;
  lastRetryInfo: { attempt: number; delayMs: number; error: string } | null;
}

type RetryActivityListener = (activity: RetryActivity) => void;
const _retryListeners = new Set<RetryActivityListener>();
let _activeRetries = 0;
let _lastRetryInfo: RetryActivity["lastRetryInfo"] = null;

function _emitRetryActivity() {
  const activity: RetryActivity = { activeRetries: _activeRetries, lastRetryInfo: _lastRetryInfo };
  _retryListeners.forEach((fn) => {
    try { fn(activity); } catch (e) { console.error("[Retry] activity listener error:", e); }
  });
}

function formatRetryError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function _retryStarted(attempt: number, delayMs: number, error: unknown) {
  _activeRetries++;
  _lastRetryInfo = {
    attempt,
    delayMs,
    error: formatRetryError(error).slice(0, 120),
  };
  _emitRetryActivity();
}

function _retryEnded() {
  _activeRetries = Math.max(0, _activeRetries - 1);
  if (_activeRetries === 0) _lastRetryInfo = null;
  _emitRetryActivity();
}

/** Get current retry activity snapshot */
export function getRetryActivity(): RetryActivity {
  return { activeRetries: _activeRetries, lastRetryInfo: _lastRetryInfo };
}

/** Subscribe to retry activity changes. Returns unsubscribe fn. */
export function onRetryActivityChange(listener: RetryActivityListener): () => void {
  _retryListeners.add(listener);
  listener({ activeRetries: _activeRetries, lastRetryInfo: _lastRetryInfo });
  return () => { _retryListeners.delete(listener); };
}

/**
 * Execute `fn` with exponential backoff retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs,
    maxDelayMs,
    jitter,
  } = { ...DEFAULT_OPTIONS, ...opts };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (opts?.signal?.aborted) {
      throw new DOMException("Retry aborted", "AbortError");
    }

    if (!isOnline()) {
      opts?.onRetry?.(new Error("Device offline — pausing retries"), attempt, 0);
      await waitForOnline(opts?.signal);
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries) break;

      if (opts?.shouldRetry && !opts.shouldRetry(error, attempt + 1)) break;

      if (isNonRetryableError(error)) break;

      if (!isOnline()) {
        opts?.onRetry?.(error, attempt + 1, 0);
        await waitForOnline(opts?.signal);
        attempt--;
        continue;
      }

      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
      const jitterRange = cappedDelay * jitter;
      const actualDelay = cappedDelay + (Math.random() * 2 - 1) * jitterRange;

      opts?.onRetry?.(error, attempt + 1, Math.round(actualDelay));

      _retryStarted(attempt + 1, Math.round(actualDelay), error);

      await sleep(actualDelay, opts?.signal);

      _retryEnded();
    }
  }

  throw lastError;
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;

  const status = (error as { status?: number })?.status;
  if (status !== undefined) {
    if (status === 408 || status === 429) return false;
    if (status >= 400 && status < 500) return true;
  }

  const message = (error as { message?: string })?.message || "";
  if (message.includes("Not authenticated") || message.includes("JWT")) return true;

  return false;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Sleep aborted", "AbortError"));
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Sleep aborted", "AbortError"));
    }, { once: true });
  });
}

/**
 * Convenience: wrap a service function so all its calls are automatically retried.
 */
export function withAutoRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  defaultOpts?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), defaultOpts);
}

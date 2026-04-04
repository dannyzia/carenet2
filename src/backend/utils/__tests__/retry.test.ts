import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, getRetryActivity, onRetryActivityChange } from "../retry";

vi.mock("../onlineState", () => ({
  isOnline: () => true,
  waitForOnline: vi.fn().mockResolvedValue(undefined),
}));

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const p = withRetry(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20, jitter: 0 });
    await expect(p).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce("recovered");

    const p = withRetry(fn, { maxRetries: 3, baseDelayMs: 5, maxDelayMs: 10, jitter: 0 });

    await vi.advanceTimersByTimeAsync(50);
    await expect(p).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws last error after exhausting retries", async () => {
    const err = new Error("always fails");
    const fn = vi.fn().mockRejectedValue(err);
    const p = withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 2, jitter: 0 });
    const settled = expect(p).rejects.toThrow("always fails");
    await vi.runAllTimersAsync();
    await settled;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("retry activity", () => {
  it("getRetryActivity returns a stable shape", () => {
    const a = getRetryActivity();
    expect(a).toHaveProperty("activeRetries");
    expect(a).toHaveProperty("lastRetryInfo");
  });

  it("onRetryActivityChange invokes listener with snapshot", () => {
    const fn = vi.fn();
    const off = onRetryActivityChange(fn);
    expect(fn).toHaveBeenCalled();
    off();
  });
});

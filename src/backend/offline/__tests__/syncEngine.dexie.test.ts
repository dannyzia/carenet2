import { describe, it, expect, beforeEach } from "vitest";
import { db, queueOfflineAction } from "../db";
import { syncEngine } from "../syncEngine";

describe("syncEngine + Dexie (fake-indexeddb)", () => {
  beforeEach(async () => {
    await db.offlineActions.clear();
  });

  it("processQueue syncs pending actions in priority order", async () => {
    await queueOfflineAction("low", { n: 1 }, "test-user", 4);
    await queueOfflineAction("high", { n: 2 }, "test-user", 1);

    const syncedTypes: string[] = [];
    const off = syncEngine.on((ev) => {
      if (ev.type === "action-synced" && ev.detail?.action?.actionType) {
        syncedTypes.push(ev.detail.action.actionType);
      }
    });

    const result = await syncEngine.processQueue();
    off();

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(syncedTypes).toEqual(["high", "low"]);

    const rows = await db.offlineActions.toArray();
    expect(rows.every((r) => r.status === "synced")).toBe(true);
  });

  it("returns zeros when queue is empty", async () => {
    const result = await syncEngine.processQueue();
    expect(result).toEqual({ synced: 0, failed: 0 });
  });
});

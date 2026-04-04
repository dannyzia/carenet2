// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfflineIndicator } from "../OfflineIndicator";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === "connectivity.offline.youreOffline") return "You are offline";
      if (key === "connectivity.offline.pendingChanges") return `Pending: ${opts?.count ?? 0}`;
      if (key === "connectivity.offline.queued") return `Queued ${opts?.count}`;
      if (key === "connectivity.offline.syncingItems") return `Syncing ${opts?.count}`;
      if (key === "connectivity.offline.waitingToSync") return `Waiting ${opts?.count}`;
      if (key === "connectivity.offline.syncFailure") return `Failed ${opts?.count}`;
      if (key === "connectivity.offline.retry") return "Retry";
      if (key === "connectivity.offline.dismiss") return "Dismiss";
      if (key === "connectivity.offline.syncedSuccess") return `Synced ${opts?.count}`;
      return key;
    },
    i18n: { language: "en" },
  }),
}));

const onlineMock = { isOnline: true };
const queueMock = {
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
  lastSyncResult: null as { synced: number } | null,
  triggerSync: vi.fn(),
};

vi.mock("@/backend/offline/useOnlineStatus", () => ({
  useOnlineStatus: () => onlineMock,
}));

vi.mock("@/backend/offline/useSyncQueue", () => ({
  useSyncQueue: () => queueMock,
}));

describe("OfflineIndicator", () => {
  beforeEach(() => {
    queueMock.triggerSync.mockClear();
  });

  it("shows offline banner with pending hint when offline", () => {
    onlineMock.isOnline = false;
    queueMock.pendingCount = 2;
    queueMock.failedCount = 0;
    queueMock.isSyncing = false;
    queueMock.lastSyncResult = null;

    render(<OfflineIndicator />);
    expect(screen.getByText(/You are offline/i)).toBeTruthy();
    expect(screen.getByText(/Pending:/i)).toBeTruthy();

    onlineMock.isOnline = true;
    queueMock.pendingCount = 0;
  });

  it("shows retry control when online with pending queue", () => {
    onlineMock.isOnline = true;
    queueMock.pendingCount = 1;
    queueMock.failedCount = 0;
    queueMock.isSyncing = false;

    render(<OfflineIndicator />);
    const retry = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retry);
    expect(queueMock.triggerSync).toHaveBeenCalled();
    queueMock.pendingCount = 0;
  });
});

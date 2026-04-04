import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../_sb", () => ({
  USE_SUPABASE: false,
  sbRead: vi.fn(),
  sbWrite: vi.fn(),
  sb: vi.fn(),
  currentUserId: vi.fn(),
}));

import { scheduleService } from "../schedule.service";

describe("scheduleService (mock mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tasks for a date", async () => {
    const tasks = await scheduleService.getDailyTasks("2026-03-18");
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks.every((t) => t.date === "2026-03-18")).toBe(true);
  });

  it("completes a pending task with a note", async () => {
    const tasks = await scheduleService.getDailyTasks("2026-03-18");
    const pending = tasks.find((t) => t.status === "pending");
    expect(pending).toBeTruthy();
    await scheduleService.completeTask(pending!.id, "Test note");
    const after = await scheduleService.getDailyTasks("2026-03-18");
    const done = after.find((t) => t.id === pending!.id);
    expect(done?.status).toBe("completed");
    expect(done?.completionNote).toBe("Test note");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isDemoUser,
  getDemoUserByRole,
  mockLogin,
  mockVerifyTotp,
  mockRegister,
  DEMO_PASSWORD,
  DEMO_TOTP,
} from "../mockAuth";

describe("mockAuth", () => {
  describe("isDemoUser", () => {
    it("returns true for @carenet.demo emails", () => {
      expect(isDemoUser({ id: "x", email: "caregiver@carenet.demo" })).toBe(true);
    });

    it("returns true for demo- prefixed ids", () => {
      expect(isDemoUser({ id: "demo-caregiver-1", email: "other@x.com" })).toBe(true);
    });

    it("returns false for arbitrary users", () => {
      expect(isDemoUser({ id: "u1", email: "a@b.com" })).toBe(false);
    });
  });

  describe("getDemoUserByRole", () => {
    it("returns seeded caregiver user", () => {
      const u = getDemoUserByRole("caregiver");
      expect(u.email).toBe("caregiver@carenet.demo");
      expect(u.activeRole).toBe("caregiver");
    });

    it("maps multi-role demo user to requested role", () => {
      const u = getDemoUserByRole("admin");
      expect(u.roles).toContain("admin");
      expect(u.activeRole).toBe("admin");
    });
  });

  describe("async flows", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("mockLogin rejects wrong password for demo account", async () => {
      const p = mockLogin("caregiver@carenet.demo", "wrong");
      await vi.advanceTimersByTimeAsync(700);
      const r = await p;
      expect(r.success).toBe(false);
    });

    it("mockLogin accepts demo password and requests MFA", async () => {
      const p = mockLogin("guardian@carenet.demo", DEMO_PASSWORD);
      await vi.advanceTimersByTimeAsync(700);
      const r = await p;
      expect(r.success).toBe(true);
      expect(r.needsMfa).toBe(true);
    });

    it("mockVerifyTotp accepts demo code", async () => {
      const p = mockVerifyTotp(DEMO_TOTP);
      await vi.advanceTimersByTimeAsync(600);
      expect(await p).toEqual({ success: true });
    });

    it("mockRegister rejects duplicate email", async () => {
      const p = mockRegister({
        name: "X",
        email: "caregiver@carenet.demo",
        password: "longenough",
        phone: "01",
        role: "guardian",
        district: "Dhaka",
      });
      await vi.advanceTimersByTimeAsync(1100);
      const r = await p;
      expect(r.success).toBe(false);
    });
  });
});

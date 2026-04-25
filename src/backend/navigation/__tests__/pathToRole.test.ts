import { describe, it, expect } from "vitest";
import { roleFromPath } from "../pathToRole";

describe("pathToRole", () => {
  describe("roleFromPath", () => {
    it('returns "channel_partner" for "/cp/dashboard"', () => {
      expect(roleFromPath("/cp/dashboard")).toBe("channel_partner");
    });

    it('returns "channel_partner" for "/cp/messages"', () => {
      expect(roleFromPath("/cp/messages")).toBe("channel_partner");
    });

    it('returns "caregiver" for "/caregiver/schedule"', () => {
      expect(roleFromPath("/caregiver/schedule")).toBe("caregiver");
    });

    it('returns "caregiver" for "/caregiver/dashboard"', () => {
      expect(roleFromPath("/caregiver/dashboard")).toBe("caregiver");
    });

    it('returns "guardian" for "/guardian/marketplace"', () => {
      expect(roleFromPath("/guardian/marketplace")).toBe("guardian");
    });

    it('returns "patient" for "/patient/dashboard"', () => {
      expect(roleFromPath("/patient/dashboard")).toBe("patient");
    });

    it('returns "agency" for "/agency/dashboard"', () => {
      expect(roleFromPath("/agency/dashboard")).toBe("agency");
    });

    it('returns "admin" for "/admin/dashboard"', () => {
      expect(roleFromPath("/admin/dashboard")).toBe("admin");
    });

    it('returns "moderator" for "/moderator/dashboard"', () => {
      expect(roleFromPath("/moderator/dashboard")).toBe("moderator");
    });

    it('returns "shop" for "/shop/dashboard"', () => {
      expect(roleFromPath("/shop/dashboard")).toBe("shop");
    });

    it('returns null for "/unknown"', () => {
      expect(roleFromPath("/unknown")).toBeNull();
    });

    it('returns null for "/"', () => {
      expect(roleFromPath("/")).toBeNull();
    });

    it('returns null for "/cp"', () => {
      expect(roleFromPath("/cp")).toBeNull();
    });
  });
});

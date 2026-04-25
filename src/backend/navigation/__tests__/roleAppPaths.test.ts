import { describe, it, expect } from "vitest";
import { ROLE_ROUTE_PREFIX, roleDashboardPath, roleMessagesPath, roleMarketplaceHubPath, rolePath } from "../roleAppPaths";

describe("roleAppPaths", () => {
  describe("ROLE_ROUTE_PREFIX", () => {
    it("has exactly 8 entries (one per Role)", () => {
      expect(Object.keys(ROLE_ROUTE_PREFIX)).toHaveLength(8);
    });
  });

  describe("roleDashboardPath", () => {
    it('returns "/cp/dashboard" for channel_partner', () => {
      expect(roleDashboardPath("channel_partner")).toBe("/cp/dashboard");
    });

    it('returns "/caregiver/dashboard" for caregiver', () => {
      expect(roleDashboardPath("caregiver")).toBe("/caregiver/dashboard");
    });

    it('returns "/guardian/dashboard" for guardian', () => {
      expect(roleDashboardPath("guardian")).toBe("/guardian/dashboard");
    });

    it('returns "/patient/dashboard" for patient', () => {
      expect(roleDashboardPath("patient")).toBe("/patient/dashboard");
    });

    it('returns "/agency/dashboard" for agency', () => {
      expect(roleDashboardPath("agency")).toBe("/agency/dashboard");
    });

    it('returns "/admin/dashboard" for admin', () => {
      expect(roleDashboardPath("admin")).toBe("/admin/dashboard");
    });

    it('returns "/moderator/dashboard" for moderator', () => {
      expect(roleDashboardPath("moderator")).toBe("/moderator/dashboard");
    });

    it('returns "/shop/dashboard" for shop', () => {
      expect(roleDashboardPath("shop")).toBe("/shop/dashboard");
    });
  });

  describe("roleMessagesPath", () => {
    it('returns "/cp/messages" for channel_partner', () => {
      expect(roleMessagesPath("channel_partner")).toBe("/cp/messages");
    });

    it('returns "/caregiver/messages" for caregiver', () => {
      expect(roleMessagesPath("caregiver")).toBe("/caregiver/messages");
    });
  });

  describe("roleMarketplaceHubPath", () => {
    it('returns "/guardian/marketplace" for guardian', () => {
      expect(roleMarketplaceHubPath("guardian")).toBe("/guardian/marketplace");
    });

    it('returns "/patient/marketplace" for patient', () => {
      expect(roleMarketplaceHubPath("patient")).toBe("/patient/marketplace");
    });
  });

  describe("rolePath", () => {
    it('returns "/cp/dashboard" for channel_partner with "dashboard" segment', () => {
      expect(rolePath("channel_partner", "dashboard")).toBe("/cp/dashboard");
    });

    it('returns "/caregiver/dashboard" for caregiver with "dashboard" segment', () => {
      expect(rolePath("caregiver", "dashboard")).toBe("/caregiver/dashboard");
    });

    it('returns "/caregiver/schedule" for caregiver with "schedule" segment', () => {
      expect(rolePath("caregiver", "schedule")).toBe("/caregiver/schedule");
    });
  });
});

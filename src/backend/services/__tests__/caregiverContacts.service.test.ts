import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../_sb", () => ({
  USE_SUPABASE: false,
  sbRead: vi.fn(),
  sbWrite: vi.fn(),
  sb: vi.fn(),
  sbData: vi.fn(),
  currentUserId: vi.fn(),
  useInAppMockDataset: () => true,
  demoOfflineDelayAndPick: vi.fn((delay, fallback, fn) => fn({
    MOCK_AGENCY_PROFILES: [
      { id: "agency1", name: "HealthCare Pro BD", role: "agency", avatar: "HP" },
      { id: "agency2", name: "CareNet Services", role: "agency", avatar: "CS" },
    ],
    MOCK_ACTIVE_JOB_CONTACTS: [
      { id: "guardian1", name: "Mrs. Fatema Begum", role: "guardian", group: "active_job_contacts", avatar: "FB" },
      { id: "patient1", name: "Mr. Rahim Ahmed", role: "patient", group: "active_job_contacts", avatar: "RA" },
      { id: "caregiver1", name: "Karim Uddin", role: "caregiver", group: "active_job_contacts", avatar: "KU" },
    ],
  })),
}));

import { caregiverContactsService } from "../caregiverContacts.service";

describe("caregiverContactsService (mock mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAgenciesForCaregiver", () => {
    it("returns agency profiles", async () => {
      const agencies = await caregiverContactsService.getAgenciesForCaregiver("cg1");
      expect(agencies.length).toBeGreaterThan(0);
      expect(agencies.every((a) => a.role === "agency")).toBe(true);
      expect(agencies.every((a) => a.group === "agencies")).toBe(true);
    });

    it("includes agency metadata", async () => {
      const agencies = await caregiverContactsService.getAgenciesForCaregiver("cg1");
      const agency = agencies[0];
      expect(agency).toHaveProperty("id");
      expect(agency).toHaveProperty("name");
      expect(agency).toHaveProperty("role");
      expect(agency).toHaveProperty("group");
      expect(agency).toHaveProperty("avatar");
    });
  });

  describe("getActiveJobContacts", () => {
    it("returns active job contacts", async () => {
      const contacts = await caregiverContactsService.getActiveJobContacts();
      expect(contacts.length).toBeGreaterThan(0);
      expect(contacts.every((c) => c.group === "active_job_contacts")).toBe(true);
    });

    it("includes guardians, patients, and fellow caregivers", async () => {
      const contacts = await caregiverContactsService.getActiveJobContacts();
      const roles = new Set(contacts.map((c) => c.role));
      expect(roles.has("guardian")).toBe(true);
      expect(roles.has("patient")).toBe(true);
      expect(roles.has("caregiver")).toBe(true);
    });

    it("includes contact metadata", async () => {
      const contacts = await caregiverContactsService.getActiveJobContacts();
      const contact = contacts[0];
      expect(contact).toHaveProperty("id");
      expect(contact).toHaveProperty("name");
      expect(contact).toHaveProperty("role");
      expect(contact).toHaveProperty("group");
      expect(contact).toHaveProperty("avatar");
    });
  });

  describe("getActiveJobParticipantIds", () => {
    it("returns set of participant IDs", async () => {
      const ids = await caregiverContactsService.getActiveJobParticipantIds();
      expect(ids).toBeInstanceOf(Set);
      expect(ids.size).toBeGreaterThan(0);
    });

    it("returns unique IDs from active job contacts", async () => {
      const ids = await caregiverContactsService.getActiveJobParticipantIds();
      const contacts = await caregiverContactsService.getActiveJobContacts();
      const contactIds = new Set(contacts.map((c) => c.id));
      expect(ids.size).toBe(contactIds.size);
    });
  });

  describe("searchContacts", () => {
    it("returns all contacts when query is empty", async () => {
      const results = await caregiverContactsService.searchContacts("cg1", "");
      expect(results.length).toBeGreaterThan(0);
      const agencies = await caregiverContactsService.getAgenciesForCaregiver("cg1");
      const jobContacts = await caregiverContactsService.getActiveJobContacts("cg1");
      expect(results.length).toBe(agencies.length + jobContacts.length);
    });

    it("filters by name case-insensitively", async () => {
      const results = await caregiverContactsService.searchContacts("cg1", "healthcare");
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.name.toLowerCase().includes("healthcare"))).toBe(true);
    });

    it("filters guardians by name", async () => {
      const results = await caregiverContactsService.searchContacts("cg1", "fatema");
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.name.toLowerCase().includes("fatema"))).toBe(true);
    });

    it("filters caregivers by name", async () => {
      const results = await caregiverContactsService.searchContacts("cg1", "karim");
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.name.toLowerCase().includes("karim"))).toBe(true);
    });

    it("returns empty array when no matches", async () => {
      const results = await caregiverContactsService.searchContacts("cg1", "nonexistentxyz123");
      expect(results.length).toBe(0);
    });
  });
});

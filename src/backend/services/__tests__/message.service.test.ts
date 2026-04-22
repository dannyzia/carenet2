import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../_sb", () => ({
  USE_SUPABASE: false,
  sbRead: vi.fn(),
  sbWrite: vi.fn(),
  sb: vi.fn(),
  sbData: vi.fn(),
  currentUserId: vi.fn(() => Promise.resolve("cg1")),
  useInAppMockDataset: () => true,
  demoOfflineDelayAndPick: vi.fn((delay, fallback, fn) => fn({
    MOCK_CAREGIVER_CONVERSATIONS_UNIFIED: [
      { id: "cg1", name: "Mr. Rahim Ahmed", role: "patient", avatar: "RA", lastMessage: "What time will you arrive tomorrow?", lastTime: "2m ago", unread: 2, online: true, participantId: "patient1", jobId: "job1" },
      { id: "cg2", name: "Mrs. Fatema Begum", role: "guardian", avatar: "FB", lastMessage: "Thank you for the update", lastTime: "1h ago", unread: 0, online: false, participantId: "guardian1", jobId: "job1" },
      { id: "cg3", name: "CareNet Support", role: "admin", avatar: "CN", lastMessage: "Your verification is complete!", lastTime: "3h ago", unread: 1, online: true, participantId: "agency2" },
      { id: "cg4", name: "Rahman Family", role: "guardian", avatar: "RF", lastMessage: "Can you cover next Sunday?", lastTime: "Yesterday", unread: 0, online: false, participantId: "guardian3", jobId: "job2" },
      { id: "cg5", name: "Dr. Nasrin Akter", role: "doctor", avatar: "NA", lastMessage: "Please send the care log.", lastTime: "2d ago", unread: 0, online: false, participantId: "doctor1", jobId: "job3" },
    ],
  })),
}));

vi.mock("../caregiverContacts.service", () => ({
  caregiverContactsService: {
    getAgenciesForCaregiver: vi.fn(),
    getActiveJobParticipantIds: vi.fn(),
    getActiveJobContacts: vi.fn(),
  },
}));

vi.mock("@/config/features", () => ({
  features: {
    careSeekerCaregiverContactEnabled: false,
  },
}));

import { messageService } from "../message.service";
import { caregiverContactsService } from "../caregiverContacts.service";

describe("messageService (mock mode) - Caregiver Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getConversations for caregiver role", () => {
    it("returns caregiver conversations", async () => {
      const convos = await messageService.getConversations("caregiver");
      expect(convos).toBeDefined();
      expect(Array.isArray(convos)).toBe(true);
      expect(convos.length).toBeGreaterThan(0);
    });

    it("includes conversations with participantId", async () => {
      const convos = await messageService.getConversations("caregiver");
      const convoWithParticipant = convos.find((c) => c.participantId);
      expect(convoWithParticipant).toBeDefined();
      expect(convoWithParticipant?.participantId).toBeDefined();
    });

    it("includes conversations with jobId for job-related contacts", async () => {
      const convos = await messageService.getConversations("caregiver");
      const jobConvo = convos.find((c) => c.jobId);
      expect(jobConvo).toBeDefined();
      expect(jobConvo?.jobId).toBeDefined();
    });

    it("includes agency conversations (no jobId required)", async () => {
      const convos = await messageService.getConversations("caregiver");
      const agencyConvo = convos.find((c) => c.role === "admin" || c.role === "agency");
      expect(agencyConvo).toBeDefined();
    });

    it("filters conversations to only show agency and active job contacts", async () => {
      vi.mocked(caregiverContactsService.getAgenciesForCaregiver).mockResolvedValue([
        { id: "agency2", name: "CareNet Support", role: "agency", group: "agencies", avatar: "CN" },
      ]);
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["patient1", "guardian1"])
      );

      const convos = await messageService.getConversations("caregiver");
      
      // Should include agency conversation (participantId: agency2)
      expect(convos.some((c) => c.participantId === "agency2")).toBe(true);
      // Should include active job contacts (patient1, guardian1)
      expect(convos.some((c) => c.participantId === "patient1")).toBe(true);
      expect(convos.some((c) => c.participantId === "guardian1")).toBe(true);
      // Should exclude non-eligible contacts (guardian3, doctor1)
      expect(convos.some((c) => c.participantId === "guardian3")).toBe(false);
      expect(convos.some((c) => c.participantId === "doctor1")).toBe(false);
    });

    it("shows all conversations when no agencies or active job contacts", async () => {
      vi.mocked(caregiverContactsService.getAgenciesForCaregiver).mockResolvedValue([]);
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(new Set());

      const convos = await messageService.getConversations("caregiver");
      expect(convos.length).toBe(0);
    });
  });

  describe("getEligibleChatTargets", () => {
    it("returns combined agencies and active job contacts", async () => {
      const targets = await messageService.getEligibleChatTargets("cg1");
      expect(targets).toBeDefined();
      expect(Array.isArray(targets)).toBe(true);
      expect(targets.length).toBeGreaterThan(0);
    });

    it("includes both agencies and job contacts", async () => {
      const targets = await messageService.getEligibleChatTargets("cg1");
      const agencies = targets.filter((t) => t.role === "agency");
      const jobContacts = targets.filter((t) => t.role !== "agency");
      expect(agencies.length).toBeGreaterThan(0);
      expect(jobContacts.length).toBeGreaterThan(0);
    });
  });

  describe("_isEligibleCaregiverContact", () => {
    it("returns true for agency role", async () => {
      const isEligible = await messageService._isEligibleCaregiverContact("cg1", "agency1", "agency");
      expect(isEligible).toBe(true);
    });

    it("returns true for active job contacts", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["patient1", "guardian1"])
      );
      const isEligible = await messageService._isEligibleCaregiverContact("cg1", "patient1", "patient");
      expect(isEligible).toBe(true);
    });

    it("returns false for non-eligible contacts", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["patient1", "guardian1"])
      );
      const isEligible = await messageService._isEligibleCaregiverContact("cg1", "randomUser", "guardian");
      expect(isEligible).toBe(false);
    });
  });

  describe("getOrCreateConversation - Feature Flag Bypass", () => {
    it("allows caregiver to chat with agency regardless of feature flag", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(new Set());
      const convoId = await messageService.getOrCreateConversation("agency1");
      expect(convoId).toBeDefined();
      expect(typeof convoId).toBe("string");
    });

    it("allows caregiver to chat with active job contacts when feature flag is false", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["patient1", "guardian1"])
      );
      const convoId = await messageService.getOrCreateConversation("patient1");
      expect(convoId).toBeDefined();
      expect(typeof convoId).toBe("string");
    });

    it("blocks caregiver from chatting with non-eligible care seekers when feature flag is false", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["patient1"])
      );
      await expect(messageService.getOrCreateConversation("randomGuardian"))
        .rejects.toThrow("CARENET_BLOCK_CARE_SEEKER_CAREGIVER_CONVERSATION");
    });

    it("blocks caregiver from chatting with non-eligible patients when feature flag is false", async () => {
      vi.mocked(caregiverContactsService.getActiveJobParticipantIds).mockResolvedValue(
        new Set(["guardian1"])
      );
      await expect(messageService.getOrCreateConversation("randomPatient"))
        .rejects.toThrow("CARENET_BLOCK_CARE_SEEKER_CAREGIVER_CONVERSATION");
    });
  });
});

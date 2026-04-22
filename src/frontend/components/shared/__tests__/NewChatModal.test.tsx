// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewChatModal } from "../NewChatModal";

const mockSearchContacts = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "newChat") return "New Chat";
      if (key === "searchContacts") return "Search contacts...";
      if (key === "loading") return "Loading contacts...";
      if (key === "noContactsFound") return "No contacts found";
      if (key === "noContactsAvailable") return "No contacts available";
      if (key === "section.agencies") return "Agencies";
      if (key === "section.jobContacts") return "Active Job Contacts";
      if (key === "contactRole.agency") return "Agency";
      if (key === "contactRole.guardian") return "Guardian";
      if (key === "contactRole.patient") return "Patient";
      if (key === "contactRole.caregiver") return "Fellow Caregiver";
      return key;
    },
  }),
}));

vi.mock("@/backend/store", () => ({
  useAuth: () => ({
    user: { id: "test-user-id" },
  }),
}));

vi.mock("@/backend/services/caregiverContacts.service", () => ({
  caregiverContactsService: {
    searchContacts: () => mockSearchContacts(),
  },
}));

const mockContacts = [
  { id: "agency1", name: "HealthCare Pro BD", role: "agency", group: "agencies" as const, avatar: "HP" },
  { id: "guardian1", name: "Mrs. Fatema Begum", role: "guardian", group: "active_job_contacts" as const, avatar: "FB" },
  { id: "patient1", name: "Mr. Rahim Ahmed", role: "patient", group: "active_job_contacts" as const, avatar: "RA" },
];

describe("NewChatModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectContact: vi.fn(),
    accentColor: "#DB869A",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchContacts.mockResolvedValue([]);
  });

  it("renders modal when isOpen is true", () => {
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    expect(screen.getByText("New Chat")).toBeTruthy();
    unmount();
  });

  it("does not render when isOpen is false", () => {
    const { unmount } = render(<NewChatModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("New Chat")).toBeNull();
    unmount();
  });

  it("shows contacts after loading", async () => {
    mockSearchContacts.mockResolvedValue(mockContacts);
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText("HealthCare Pro BD")).toBeTruthy();
      expect(screen.getByText("Mrs. Fatema Begum")).toBeTruthy();
      expect(screen.getByText("Mr. Rahim Ahmed")).toBeTruthy();
    });
    
    unmount();
  });

  it("groups contacts into Agencies and Active Job Contacts sections", async () => {
    mockSearchContacts.mockResolvedValue(mockContacts);
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText("Agencies")).toBeTruthy();
      expect(screen.getByText("Active Job Contacts")).toBeTruthy();
    });
    
    unmount();
  });

  it("calls onSelectContact when a contact is clicked", async () => {
    mockSearchContacts.mockResolvedValue(mockContacts);
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText("HealthCare Pro BD")).toBeTruthy();
    });
    
    fireEvent.click(screen.getByText("HealthCare Pro BD"));
    expect(defaultProps.onSelectContact).toHaveBeenCalledWith(mockContacts[0]);
    
    unmount();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    
    const backdrop = screen.getByTestId("modal-backdrop");
    fireEvent.click(backdrop);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
    
    unmount();
  });

  it("search input renders correctly", () => {
    const { unmount } = render(<NewChatModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText("Search contacts...");
    expect(searchInput).toBeTruthy();
    expect(searchInput.getAttribute("type")).toBe("text");
    
    unmount();
  });
});

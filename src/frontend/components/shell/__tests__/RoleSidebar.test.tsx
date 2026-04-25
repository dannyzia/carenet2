// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { RoleSidebar } from "../RoleSidebar";

const mockUseAuth = vi.fn();
vi.mock("@/backend/store/auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "a11y.roleNav": "Role navigation",
        "a11y.closeRoleSidebar": "Close role sidebar",
        "a11y.roleSidebarOpened": "Role menu opened",
        "a11y.roleSidebarClosed": "Role menu closed",
        "roles.caregiver": "Caregiver",
        "sidebar.dashboard": "Dashboard",
        "sidebar.messages": "Messages",
        "sidebar.noNavItems": "No items available",
      };
      return labels[key] || key;
    },
  }),
}));

vi.mock("@/frontend/hooks/usePendingProofCount", () => ({
  usePendingProofCount: () => 0,
}));

vi.mock("@/frontend/hooks/usePendingActivationCount", () => ({
  usePendingActivationCount: () => 0,
}));

vi.mock("@/frontend/hooks/UnreadCountsContext", () => ({
  UnreadCountsContext: React.createContext({ messages: 0, notifications: 0 }),
}));

describe("RoleSidebar", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { activeRole: "caregiver" as const, name: "Test User" } });
  });

  it("is hidden when isOpen is false", () => {
    render(
      <MemoryRouter>
        <RoleSidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const dialog = screen.queryByRole("dialog", { hidden: true });
    expect(dialog).toBeTruthy();
    expect(dialog?.classList.contains("-translate-x-full")).toBe(true);
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("renders when isOpen is true", () => {
    render(
      <MemoryRouter>
        <RoleSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText("Caregiver")).toBeTruthy();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <RoleSidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    );

    const closeButton = screen.getByLabelText("Close role sidebar");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <RoleSidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders navigation links for the active role", () => {
    render(
      <MemoryRouter>
        <RoleSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    const dashboardLinks = screen.getAllByText("Dashboard");
    expect(dashboardLinks.length).toBeGreaterThan(0);
    const messagesLinks = screen.getAllByText("Messages");
    expect(messagesLinks.length).toBeGreaterThan(0);
  });

  it("renders empty state when no active role", () => {
    mockUseAuth.mockReturnValue({ user: { activeRole: null, name: "Test User" } });

    render(
      <MemoryRouter>
        <RoleSidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("No items available")).toBeTruthy();
  });
});

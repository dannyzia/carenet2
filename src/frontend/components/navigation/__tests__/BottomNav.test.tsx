// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { BottomNav } from "../BottomNav";

const mockUseAuth = vi.fn();
vi.mock("@/frontend/auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "bottomNav.home": "Home",
        "bottomNav.back": "Back",
        "bottomNav.persona": "Profile",
        "bottomNav.messages": "Messages",
        "bottomNav.menu": "Menu",
        "a11y.openPersonaMenu": "Open profile menu for caregiver",
        "a11y.personaMenuDisabled": "Profile menu (no active role)",
        "roles.caregiver": "Caregiver",
      };
      return labels[key] || key;
    },
    i18n: { language: "en" },
  }),
}));

describe("BottomNav", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { activeRole: "caregiver" as const } });
  });

  it("renders five tabs with Persona button instead of Search", () => {
    render(
      <MemoryRouter initialEntries={["/caregiver/dashboard"]}>
        <Routes>
          <Route path="/caregiver/dashboard" element={<BottomNav unreadMessages={0} unreadNotifications={0} />} />
        </Routes>
      </MemoryRouter>,
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toBeTruthy();

    expect(screen.getByRole("link", { name: /^home$/i }).getAttribute("href")).toBe("/caregiver/dashboard");
    expect(screen.getByRole("button", { name: /profile menu/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^back$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^menu$/i })).toBeTruthy();
  });

  it("Persona button dispatches toggle-rolesidebar event when clicked", () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

    render(
      <MemoryRouter initialEntries={["/caregiver/dashboard"]}>
        <Routes>
          <Route path="/caregiver/dashboard" element={<BottomNav unreadMessages={0} unreadNotifications={0} />} />
        </Routes>
      </MemoryRouter>,
    );

    const personaButton = screen.getByRole("button", { name: /profile menu/i });
    fireEvent.click(personaButton);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "toggle-rolesidebar" })
    );
  });

  it("Persona button is disabled when no active role", () => {
    mockUseAuth.mockReturnValue({ user: { activeRole: null } });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<BottomNav unreadMessages={0} unreadNotifications={0} />} />
        </Routes>
      </MemoryRouter>,
    );

    const personaButton = screen.getByRole("button", { name: /profile menu/i });
    expect(personaButton.getAttribute("disabled")).not.toBeNull();
  });
});

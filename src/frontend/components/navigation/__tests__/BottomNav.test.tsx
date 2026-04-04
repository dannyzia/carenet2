// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { BottomNav } from "../BottomNav";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "bottomNav.home": "Home",
        "bottomNav.back": "Back",
        "bottomNav.search": "Search",
        "bottomNav.messages": "Messages",
        "bottomNav.menu": "Menu",
      };
      return labels[key] || key;
    },
    i18n: { language: "en" },
  }),
}));

describe("BottomNav", () => {
  it("renders five tabs and role-scoped home link for caregiver", () => {
    render(
      <MemoryRouter initialEntries={["/caregiver/dashboard"]}>
        <Routes>
          <Route path="/caregiver/dashboard" element={<BottomNav />} />
        </Routes>
      </MemoryRouter>,
    );

    const nav = screen.getByRole("navigation");
    expect(nav).toBeTruthy();

    expect(screen.getByRole("link", { name: /^home$/i }).getAttribute("href")).toBe("/caregiver/dashboard");
    expect(screen.getByRole("link", { name: /^search$/i }).getAttribute("href")).toBe("/caregiver/search");
    expect(screen.getByRole("button", { name: /^back$/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^menu$/i })).toBeTruthy();
  });
});

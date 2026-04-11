// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import AgencyPackageCreatePage from "../AgencyPackageCreatePage";

vi.mock("@/frontend/auth/AuthContext", () => ({
  useAuth: () => ({
    user: {
      activeRole: "agency" as const,
      phone: "+15555550100",
      name: "Test Agency",
    },
  }),
}));

vi.mock("@/frontend/hooks/useAriaToast", () => ({
  useAriaToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}));

function mockT(key: string, defaultValueOrOpts?: string | Record<string, string | number>) {
  if (typeof defaultValueOrOpts === "object" && defaultValueOrOpts !== null) {
    let s =
      key === "wizard.agencyReviewCareTeamSummary"
        ? "{{caregivers}} caregiver(s), {{nurses}} nurse(s), level {{level}}"
        : key;
    for (const [k, v] of Object.entries(defaultValueOrOpts)) {
      s = s.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    }
    return s;
  }
  return defaultValueOrOpts ?? key;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: "en" },
  }),
}));

vi.mock("@/backend/services", () => ({
  marketplaceService: {
    createAgencyPackage: vi.fn(),
    publishPackage: vi.fn(),
  },
}));

const TITLE_PLACEHOLDER = "e.g. Premium Elderly Home Care Package";

describe("AgencyPackageCreatePage", () => {
  it("keeps focus on package title after first controlled update (regression: inner InputField remount)", () => {
    render(
      <MemoryRouter>
        <AgencyPackageCreatePage />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(TITLE_PLACEHOLDER);
    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.change(input, { target: { value: "H" } });

    const inputAfter = screen.getByPlaceholderText(TITLE_PLACEHOLDER) as HTMLInputElement;
    expect(inputAfter.value).toBe("H");
    expect(document.activeElement).toBe(inputAfter);
  });
});

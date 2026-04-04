import { describe, it, expect, vi, beforeEach } from "vitest";

let mockLang: "en" | "bn" = "en";

vi.mock("@/frontend/i18n", () => ({
  getCurrentLanguage: () => mockLang,
}));

describe("formatters", () => {
  beforeEach(() => {
    mockLang = "en";
  });

  it("formatNumber respects en locale grouping", async () => {
    const { formatNumber } = await import("../formatters");
    expect(formatNumber(1234567)).toMatch(/1,234,567/);
  });

  it("formatCurrency formats BDT for en locale", async () => {
    const { formatCurrency } = await import("../formatters");
    const s = formatCurrency(1200);
    expect(s).toMatch(/1[,\u00a0]?200/);
    expect(s).toMatch(/BDT|৳/);
  });

  it("formatPhone normalizes leading 0 to +880", async () => {
    const { formatPhone } = await import("../formatters");
    expect(formatPhone("01712345678")).toBe("+880 1712-345678");
  });

  it("uses Bengali digits when language is bn", async () => {
    mockLang = "bn";
    const { formatNumber, toBengaliCount } = await import("../formatters");
    expect(formatNumber(42)).toMatch(/[০-৯]/);
    expect(toBengaliCount(7)).toMatch(/৭/);
  });
});

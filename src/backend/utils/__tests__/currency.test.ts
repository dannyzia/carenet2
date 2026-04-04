import { describe, it, expect } from "vitest";
import { formatBDT, parseBDT } from "../currency";

describe("formatBDT", () => {
  it("applies South Asian grouping for whole taka", () => {
    expect(formatBDT(1234567)).toContain("12,34,567");
    expect(formatBDT(999)).toBe("৳ 999");
  });

  it("supports Bangla numerals when requested", () => {
    const s = formatBDT(1234, { bangla: true });
    expect(s).toMatch(/৳/);
    expect(s).not.toMatch(/1,234/);
  });

  it("supports compact lakhs display", () => {
    expect(formatBDT(150000, { compact: true })).toMatch(/1\.5L/);
  });

  it("formats paisa when showPaisa is true", () => {
    expect(formatBDT(21760.5, { showPaisa: true })).toMatch(/21,760\.50/);
  });
});

describe("parseBDT", () => {
  it("parses grouped ASCII amounts", () => {
    expect(parseBDT("৳ 12,34,567")).toBe(1234567);
  });
});

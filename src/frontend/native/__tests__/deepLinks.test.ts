import { describe, expect, it } from "vitest";
import { parseDeepLinkToPath } from "../deepLinks";

describe("parseDeepLinkToPath", () => {
  it("maps carenet host + path to app path", () => {
    expect(parseDeepLinkToPath("carenet://shift/shift-1")).toBe("/shift/shift-1");
    expect(parseDeepLinkToPath("carenet://message/conv-1")).toBe("/message/conv-1");
  });

  it("maps https app link to pathname", () => {
    expect(parseDeepLinkToPath("https://app.carenet.com.bd/notifications?x=1")).toBe(
      "/notifications?x=1",
    );
  });

  it("returns null for unsupported schemes", () => {
    expect(parseDeepLinkToPath("mailto:test@example.com")).toBeNull();
  });
});

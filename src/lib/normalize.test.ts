import { describe, it, expect } from "vitest";
import { normPN, serialInRange } from "./normalize";

describe("normPN", () => {
  it("matches formatting variants", () => {
    expect(normPN("3-1234-a")).toBe(normPN("31234A"));
    expect(normPN(" 3 1234 A ")).toBe("31234A");
  });
});

describe("serialInRange", () => {
  it("treats missing range as affecting all serials", () => {
    expect(serialInRange("100", null, null)).toBe(true);
  });
  it("compares numeric serials numerically", () => {
    expect(serialInRange("250", "100", "300")).toBe(true);
    expect(serialInRange("99", "100", "300")).toBe(false);
    expect(serialInRange("1000", "100", "300")).toBe(false);
  });
});

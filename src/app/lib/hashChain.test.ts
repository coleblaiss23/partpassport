import { describe, it, expect } from "vitest";
import { computeEventHash } from "./hashChain";

describe("hashChain", () => {
  it("produces identical hashes regardless of object key order", () => {
    const eventA = {
      partId: "p1",
      eventType: "REMOVED",
      timestamp: "2026-09-15T12:00:00Z",
      prevEventHash: null,
      data: { hangar: "Hangar 3", bay: 12 },
    };
    const eventB = {
      data: { bay: 12, hangar: "Hangar 3" },
      timestamp: "2026-09-15T12:00:00Z",
      eventType: "REMOVED",
      partId: "p1",
      prevEventHash: null,
    };
    expect(computeEventHash(eventA)).toBe(computeEventHash(eventB));
  });
});
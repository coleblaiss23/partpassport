import { describe, it, expect } from "vitest";
import { computeEventHash } from "./hashChain";

describe("computeEventHash", () => {
  const base = {
    partId: "p1",
    organizationId: "o1",
    seq: 1,
    eventType: "CREATED",
    timestamp: "2026-01-01T00:00:00.000Z",
    prevEventHash: null as string | null,
    data: { note: "genesis" },
  };

  it("produces a stable hash for identical input", () => {
    expect(computeEventHash(base)).toBe(computeEventHash({ ...base }));
  });

  it("changes when any field changes", () => {
    const changed = { ...base, eventType: "REMOVED" };
    expect(computeEventHash(changed)).not.toBe(computeEventHash(base));
  });

  it("chains correctly across three events with no collisions", () => {
    const e1 = computeEventHash(base);
    const e2 = computeEventHash({ ...base, eventType: "INSTALLED", seq: 2, prevEventHash: e1 });
    const e3 = computeEventHash({ ...base, eventType: "REMOVED", seq: 3, prevEventHash: e2 });
    expect(new Set([e1, e2, e3]).size).toBe(3);
  });

  it("detects a tampered middle event when re-walking a chain", () => {
    const e1 = computeEventHash(base);
    const e2 = computeEventHash({ ...base, eventType: "INSTALLED", seq: 2, prevEventHash: e1 });
    const tamperedE2 = computeEventHash({ ...base, eventType: "INSTALLED", prevEventHash: e1, data: { note: "tampered" } });
    expect(tamperedE2).not.toBe(e2);
  });

  it("binds the hash to the organization and sequence number", () => {
    expect(computeEventHash({ ...base, organizationId: "o2" })).not.toBe(computeEventHash(base));
    expect(computeEventHash({ ...base, seq: 2 })).not.toBe(computeEventHash(base));
  });
});

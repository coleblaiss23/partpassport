import { describe, it, expect } from "vitest";
import { demoResult } from "./demoChain";

describe("sample passport", () => {
  it("verifies for real when untouched", () => {
    const r = demoResult(false);
    expect(r.valid).toBe(true);
    expect(r.eventsCount).toBe(7);
    expect(r.events.some((e) => e.organization.verified === false)).toBe(true);
  });
  it("fails at the edited event when tampered", () => {
    const r = demoResult(true);
    expect(r.valid).toBe(false);
    expect("reason" in r && r.reason).toBe("EVENT_DATA_TAMPERED");
    expect("brokenAtEventId" in r && r.brokenAtEventId).toBe("demo-5");
  });
});

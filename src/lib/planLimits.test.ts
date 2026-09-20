import { describe, it, expect } from "vitest";
import { DEFAULT_LIMITS, effectivePlan, evaluateLimit, monthStart } from "./planLimits";

describe("evaluateLimit", () => {
  it("allows usage under the limit", () => expect(evaluateLimit("checks", 3, 15)).toMatchObject({ allowed: true, warn: false, remaining: 12 }));
  it("warns at 80 percent", () => expect(evaluateLimit("checks", 12, 15)).toMatchObject({ allowed: true, warn: true }));
  it("blocks at the limit with an upgrade message", () => {
    const r = evaluateLimit("registrations", 10, 10);
    expect(r.allowed).toBe(false);
    expect(r.message).toMatch(/\/pricing/);
  });
});

describe("effectivePlan", () => {
  it("defaults to pilot", () => expect(effectivePlan({})).toBe("PILOT"));
  it("keeps an active paid plan", () => expect(effectivePlan({ plan: "PRO", subStatus: "active" })).toBe("PRO"));
  it("keeps a manually granted plan with no subscription status", () => expect(effectivePlan({ plan: "PRO", subStatus: null })).toBe("PRO"));
  it("falls back to pilot when the subscription lapses", () => expect(effectivePlan({ plan: "PRO", subStatus: "canceled" })).toBe("PILOT"));
  it("ignores unknown plans", () => expect(effectivePlan({ plan: "GOLD" })).toBe("PILOT"));
});

describe("monthStart", () => {
  it("returns the first of the month in UTC", () => expect(monthStart(new Date("2026-09-19T15:00:00Z")).toISOString()).toBe("2026-09-01T00:00:00.000Z"));
});

it("pricing numbers match the plan", () => {
  expect(DEFAULT_LIMITS.PILOT).toMatchObject({ checks: 15, registrations: 10 });
  expect(DEFAULT_LIMITS.PRO.checks).toBe(500);
});

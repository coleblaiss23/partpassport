import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  aircraftLimit,
  canUseFeature,
  effectivePlan,
  evaluateLimit,
  normalizePlanId,
} from "./planLimits";

describe("normalizePlanId", () => {
  it("maps legacy ids", () => {
    expect(normalizePlanId("PILOT")).toBe("STARTER");
    expect(normalizePlanId("PRO")).toBe("PROFESSIONAL");
    expect(normalizePlanId("ENTERPRISE")).toBe("ENTERPRISE");
  });
  it("defaults unknowns to starter", () => {
    expect(normalizePlanId(null)).toBe("STARTER");
    expect(normalizePlanId("GOLD")).toBe("STARTER");
  });
});

describe("effectivePlan", () => {
  it("defaults to starter", () => expect(effectivePlan({})).toBe("STARTER"));
  it("keeps an active paid plan", () =>
    expect(effectivePlan({ plan: "PROFESSIONAL", subStatus: "active" })).toBe("PROFESSIONAL"));
  it("keeps a manually granted plan with no subscription status", () =>
    expect(effectivePlan({ plan: "PROFESSIONAL", subStatus: null })).toBe("PROFESSIONAL"));
  it("falls back to starter when the subscription lapses", () =>
    expect(effectivePlan({ plan: "PROFESSIONAL", subStatus: "canceled" })).toBe("STARTER"));
  it("accepts legacy PRO in storage", () =>
    expect(effectivePlan({ plan: "PRO", subStatus: "active" })).toBe("PROFESSIONAL"));
});

describe("DEFAULT_LIMITS", () => {
  it("has starter aircraft cap of 5", () => expect(DEFAULT_LIMITS.STARTER.aircraft).toBe(5));
  it("prices match the paid ladder", () => {
    expect(DEFAULT_LIMITS.STARTER.priceMonthly).toBe(299);
    expect(DEFAULT_LIMITS.PROFESSIONAL.priceMonthly).toBe(599);
    expect(DEFAULT_LIMITS.ENTERPRISE.priceMonthly).toBe(899);
  });
  it("gates OCR to professional+", () => {
    expect(DEFAULT_LIMITS.STARTER.features.ocrUploads).toBe(false);
    expect(DEFAULT_LIMITS.PROFESSIONAL.features.ocrUploads).toBe(true);
  });
  it("gates webhooks to enterprise", () => {
    expect(DEFAULT_LIMITS.PROFESSIONAL.features.webhooks).toBe(false);
    expect(DEFAULT_LIMITS.ENTERPRISE.features.webhooks).toBe(true);
  });
});

describe("aircraftLimit / canUseFeature", () => {
  it("uses org maxAircraft override", () => {
    expect(aircraftLimit({ plan: "STARTER", maxAircraft: 12 })).toBe(12);
  });
  it("allows feature overrides via JSON", () => {
    expect(canUseFeature({ plan: "STARTER", features: '{"ocrUploads":true}' }, "ocrUploads")).toBe(true);
  });
});

describe("evaluateLimit", () => {
  it("blocks at the ceiling", () => {
    const r = evaluateLimit("checks", 100, 100);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });
  it("warns near the ceiling", () => {
    const r = evaluateLimit("checks", 80, 100);
    expect(r.allowed).toBe(true);
    expect(r.warn).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { evaluateLifeLimits, parseLifeLimitInput } from "./lifeLimits";
import { buildCfr439RtsDraft, canGenerateRtsDraft } from "./rtsDraft";

describe("lifeLimits", () => {
 it("flags expired hours", () => {
 const s = evaluateLifeLimits({
 isLifeLimited: true,
 totalTimeHours: 5000,
 totalCycles: null,
 lifeLimitHours: 4000,
 lifeLimitCycles: null,
 });
 expect(s.expired).toBe(true);
 expect(s.reasons[0]).toMatch(/meets or exceeds/);
 });

 it("flags approaching cycles", () => {
 const s = evaluateLifeLimits({
 isLifeLimited: true,
 totalTimeHours: null,
 totalCycles: 910,
 lifeLimitHours: null,
 lifeLimitCycles: 1000,
 });
 expect(s.approaching).toBe(true);
 expect(s.expired).toBe(false);
 });

 it("parses form input", () => {
 const p = parseLifeLimitInput({
 isLifeLimited: "true",
 totalTimeHours: "12.5",
 totalCycles: "3",
 lifeLimitHours: "",
 lifeLimitCycles: "100",
 });
 expect(p.isLifeLimited).toBe(true);
 expect(p.totalTimeHours).toBe(12.5);
 expect(p.lifeLimitHours).toBeNull();
 expect(p.lifeLimitCycles).toBe(100);
 });
});

describe("rtsDraft", () => {
 it("builds a 43.9 draft from extracted fields", () => {
 const draft = buildCfr439RtsDraft({
 extracted: {
 partNumber: "PN-1",
 serial: "SN-9",
 description: "actuator",
 status: "REPAIRED",
 workOrder: "WO-44",
 date: "2026-03-01",
 organization: "Test RS",
 approvalNumber: "RS1R123",
 },
 });
 expect(draft).toContain("14 CFR 43.9");
 expect(draft).toContain("P/N PN-1");
 expect(draft).toContain("repaired");
 expect(draft).toContain("WO-44");
 expect(canGenerateRtsDraft({ partNumber: "PN-1" })).toBe(true);
 });
});

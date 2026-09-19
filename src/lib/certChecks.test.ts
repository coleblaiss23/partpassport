import { describe, it, expect, beforeEach } from "vitest";
import { localFlags, parseCertDate } from "./certChecks";
import { extractCert, aiMode } from "./extract";

const NOW = new Date("2026-09-19T00:00:00Z");

describe("parseCertDate", () => {
  it("accepts common formats", () => {
    expect(parseCertDate("2026-08-12")).not.toBeNull();
    expect(parseCertDate("08/12/2026")).not.toBeNull();
    expect(parseCertDate("12 AUG 2026")).not.toBeNull();
  });
  it("rejects impossible dates", () => {
    expect(parseCertDate("02/31/2026")).toBeNull();
    expect(parseCertDate("2026-13-01")).toBeNull();
    expect(parseCertDate("soon")).toBeNull();
  });
});

describe("localFlags", () => {
  const good = { partNumber: "P1", serial: "SN-1", approvalNumber: "A1", hasSignature: true, date: "2026-08-12", remarks: "OVERHAULED. NO ADS." };
  it("passes a clean certificate", () => expect(localFlags(good, NOW)).toEqual([]));
  it("flags missing signature, approval, bad and future dates", () => {
    expect(localFlags({ ...good, hasSignature: false, approvalNumber: null }, NOW)).toHaveLength(2);
    expect(localFlags({ ...good, date: "02/31/2026" }, NOW)[0]).toMatch(/not a valid/);
    expect(localFlags({ ...good, date: "2027-01-01" }, NOW)[0]).toMatch(/future/);
  });
  it("flags serial mismatches in remarks but not matches", () => {
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "UNIT S/N SN-4420 RETURNED" }, NOW)).toHaveLength(1);
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "UNIT S/N SN-4402 RETURNED" }, NOW)).toEqual([]);
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "SN 4402 checked" }, NOW)).toEqual([]);
  });
});

describe("mock mode", () => {
  beforeEach(() => { process.env.AI_MODE = "mock"; });
  it("returns a clean fixture for cert-good and a flawed one for cert-bad", async () => {
    expect(aiMode()).toBe("mock");
    const g = await extractCert("", "cert-good.pdf");
    expect(localFlags(g.data, NOW)).toEqual([]);
    const b = await extractCert("", "cert-bad.pdf");
    expect(localFlags(b.data, NOW).length).toBeGreaterThanOrEqual(4);
  });
  it("refuses to run when not configured", async () => {
    process.env.AI_MODE = "off";
    await expect(extractCert("", "x.pdf")).rejects.toThrow(/not configured/);
  });
});

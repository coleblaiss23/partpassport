import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { localFlags, parseCertDate, parseSerialTokens } from "./certChecks";
import { extractCert, aiMode, normalizeExtracted } from "./extract";
import {
  FIXTURE_SAMPLE_1,
  FIXTURE_SAMPLE_2,
  FIXTURE_SAMPLE_3,
  FIXTURE_SAMPLE_4,
  FIXTURE_SAMPLE_5,
} from "../../tests/fixtures/forms/expected";

const NOW = new Date("2026-09-19T00:00:00Z");
/** After the latest handwritten date on the 8130-3 fixture set. */
const NOW_FIXTURES = new Date("2026-09-24T00:00:00Z");

describe("parseCertDate", () => {
  it("accepts common formats", () => {
    expect(parseCertDate("2026-08-12")).not.toBeNull();
    expect(parseCertDate("08/12/2026")).not.toBeNull();
    expect(parseCertDate("12 AUG 2026")).not.toBeNull();
    expect(parseCertDate("09/21/26")).not.toBeNull();
  });
  it("rejects impossible dates", () => {
    expect(parseCertDate("02/31/2026")).toBeNull();
    expect(parseCertDate("2026-13-01")).toBeNull();
    expect(parseCertDate("soon")).toBeNull();
  });
});

describe("parseSerialTokens", () => {
  it("splits lists and treats N/A as empty", () => {
    expect(parseSerialTokens("SN-1, SN-2")).toEqual(["SN-1", "SN-2"]);
    expect(parseSerialTokens("N/A")).toEqual([]);
    expect(parseSerialTokens("B-9912")).toEqual(["B-9912"]);
  });
});

describe("localFlags", () => {
  const good = {
    partNumber: "P1",
    serial: "SN-1",
    quantity: "1",
    approvalNumber: "A1",
    hasSignature: true,
    date: "2026-08-12",
    remarks: "OVERHAULED. NO ADS.",
    status: "NEW",
    block14ApprovedDesign: true,
    block14NonApprovedDesign: false,
    block19Cfr43_9: false,
    block19OtherRegulation: false,
  };
  it("passes a clean certificate", () => expect(localFlags(good, NOW)).toEqual([]));
  it("flags missing signature, approval, bad and future dates", () => {
    expect(localFlags({ ...good, hasSignature: false, approvalNumber: null, block16ApprovalNo: null, block21CertificateNo: null }, NOW)).toHaveLength(2);
    expect(localFlags({ ...good, date: "02/31/2026", block18Date: null, block23Date: null }, NOW)[0]).toMatch(/not a valid/);
    expect(localFlags({ ...good, date: "2027-01-01", block18Date: null, block23Date: null }, NOW)[0]).toMatch(/future/);
  });
  it("flags serial mismatches in remarks but not matches", () => {
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "UNIT S/N SN-4420 RETURNED" }, NOW)).toHaveLength(1);
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "UNIT S/N SN-4402 RETURNED" }, NOW)).toEqual([]);
    expect(localFlags({ ...good, serial: "SN-4402", remarks: "SN 4402 checked" }, NOW)).toEqual([]);
  });
  it("flags missing Block 8 part number", () => {
    expect(localFlags({ ...good, partNumber: null }, NOW).some((f) => /Block 8/i.test(f))).toBe(true);
  });
  it("flags quantity vs single serial conflicts", () => {
    const flags = localFlags({ ...good, quantity: "4", serial: "B-9912" }, NOW);
    expect(flags.some((f) => /Quantity is 4/i.test(f))).toBe(true);
  });
  it("flags missing Block 14/19 selections", () => {
    const flags = localFlags({
      ...good,
      block14ApprovedDesign: false,
      block14NonApprovedDesign: false,
      block19Cfr43_9: false,
      block19OtherRegulation: false,
    }, NOW);
    expect(flags.some((f) => /Block 14 or Block 19/i.test(f))).toBe(true);
  });
  it("flags non-approved design data without Block 13 remarks", () => {
    const flags = localFlags({
      ...good,
      block14ApprovedDesign: false,
      block14NonApprovedDesign: true,
      remarks: null,
    }, NOW);
    expect(flags.some((f) => /non-approved design data/i.test(f))).toBe(true);
  });
});

describe("fixture forms (tests/fixtures/forms)", () => {
  it("sample 1 is clean", () => {
    expect(localFlags(FIXTURE_SAMPLE_1, NOW_FIXTURES)).toEqual([]);
  });
  it("sample 2 flags missing PN, qty/serial conflict, and Block 20 signature gap", () => {
    const flags = localFlags(FIXTURE_SAMPLE_2, NOW_FIXTURES);
    expect(flags.some((f) => /Block 8/i.test(f))).toBe(true);
    expect(flags.some((f) => /Quantity is 4/i.test(f))).toBe(true);
    expect(flags.some((f) => /Block 20/i.test(f))).toBe(true);
  });
  it("sample 3 flags qty/serial conflict and missing Block 19 for maintenance status", () => {
    const flags = localFlags(FIXTURE_SAMPLE_3, NOW_FIXTURES);
    expect(flags.some((f) => /Quantity is 10/i.test(f))).toBe(true);
    expect(flags.some((f) => /Block 19/i.test(f))).toBe(true);
  });
  it("sample 4 is a clean return-to-service certificate", () => {
    expect(localFlags(FIXTURE_SAMPLE_4, NOW_FIXTURES)).toEqual([]);
  });
  it("sample 5 flags non-approved design without remarks and qty without serials", () => {
    const flags = localFlags(FIXTURE_SAMPLE_5, NOW_FIXTURES);
    expect(flags.some((f) => /non-approved design data/i.test(f))).toBe(true);
    expect(flags.some((f) => /Quantity is 2/i.test(f) || /Serial number not found/i.test(f))).toBe(true);
  });
});

describe("normalizeExtracted", () => {
  it("rolls up approval, signature, and date from block fields", () => {
    const x = normalizeExtracted({
      partNumber: "P",
      serial: "S",
      block16ApprovalNo: "CRS-1",
      block15Signature: true,
      block18Date: "09/20/2026",
      block14ApprovedDesign: true,
      redFlags: ["note"],
    });
    expect(x.approvalNumber).toBe("CRS-1");
    expect(x.hasSignature).toBe(true);
    expect(x.date).toBe("09/20/2026");
    expect(x.redFlags).toEqual(["note"]);
  });
  it("normalizes OCR confusables in part and serial fields", () => {
    const x = normalizeExtracted({
      partNumber: "APV-7742-1O1",
      serial: "SN-44l2",
    });
    expect(x.partNumber).toBe("APV-7742-101");
    expect(x.serial).toBe("SN-4412");
  });
});

describe("extractCert configuration", () => {
  const prevMode = process.env.AI_MODE;
  const prevKey = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    if (prevMode === undefined) delete process.env.AI_MODE;
    else process.env.AI_MODE = prevMode;
    if (prevKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prevKey;
  });
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.AI_MODE = "off";
  });
  it("refuses to run when not configured", async () => {
    expect(aiMode()).toBe("off");
    await expect(extractCert("dGVzdA==")).rejects.toThrow(/not configured/);
  });
  it("treats legacy AI_MODE=mock as local", () => {
    process.env.AI_MODE = "mock";
    expect(aiMode()).toBe("local");
  });
  it("supports AI_MODE=local without an API key", async () => {
    process.env.AI_MODE = "local";
    expect(aiMode()).toBe("local");
    const r = await extractCert(Buffer.from("%PDF-1.4 (Part Number: APV-1O1) (Serial: SN-1)").toString("base64"));
    expect(r.mode).toBe("local");
    expect(r.data.partNumber).toBe("APV-101");
  });
  it("maps known sample PDF hashes to verified extractions", async () => {
    process.env.AI_MODE = "local";
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const pdf = readFileSync(join(process.cwd(), "tests/fixtures/forms/FAA-8130-3-sample 1.pdf"));
    const r = await extractCert(pdf.toString("base64"));
    expect(r.mode).toBe("local");
    expect(r.data.partNumber).toBe("APV-7742-101");
    expect(r.data.serial).toBe("SN-2026-0491");
  });
});

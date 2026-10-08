import { describe, expect, it } from "vitest";
import {
  isBroadManufacturerBlob,
  makesCompatible,
  modelMatchCandidates,
  parseApplicabilityModel,
  parseManufacturerFromDescription,
  safetyFlagMatchesAircraft,
} from "./aircraftAds";
import { normalizeTailNumber, mergeRegistryEnrichment } from "./aircraftRegistry";

describe("normalizeTailNumber", () => {
  it("uppercases and ensures N prefix", () => {
    expect(normalizeTailNumber("4867w")).toBe("N4867W");
    expect(normalizeTailNumber("n-4867-w")).toBe("N4867W");
    expect(normalizeTailNumber("N4867W")).toBe("N4867W");
  });
});

describe("mergeRegistryEnrichment", () => {
  it("fills blanks from registry and lets body win", () => {
    const hit = {
      tailNumber: "N4867W",
      make: "Rockwell International",
      model: "114",
      year: 1976,
      serialNumber: "14197",
      engineModel: "Lycoming IO-540-T4A5D",
      series: null,
      source: "FAA",
    };
    const filled = mergeRegistryEnrichment({}, hit);
    expect(filled.make).toBe("Rockwell International");
    expect(filled.model).toBe("114");
    expect(filled.year).toBe(1976);
    expect(filled.enrichedFromRegistry).toBe(true);

    const override = mergeRegistryEnrichment({ make: "Custom", model: "X1" }, hit);
    expect(override.make).toBe("Custom");
    expect(override.model).toBe("X1");
    expect(override.year).toBe(1976);
    expect(override.enrichedFromRegistry).toBe(false);
  });
});

describe("modelMatchCandidates", () => {
  it("expands GA and transport models", () => {
    expect(modelMatchCandidates("172S")).toEqual(expect.arrayContaining(["172S", "172"]));
    expect(modelMatchCandidates("PA-28-181")).toEqual(
      expect.arrayContaining(["PA28181", "PA28"]),
    );
    expect(modelMatchCandidates("A320-214")).toEqual(
      expect.arrayContaining(["A320214", "A320"]),
    );
  });
});

describe("safetyFlagMatchesAircraft", () => {
  it("matches exact AD TOC model with manufacturer", () => {
    const flag = {
      partNumber: "A320-214",
      partNumberNorm: "A320214",
      source: "AD",
      description:
        "Manufacturer: Airbus SAS | Biweekly: 2026-1 | Applicability model: A320-214",
    };
    expect(
      safetyFlagMatchesAircraft(flag, { make: "Airbus", model: "A320-214" }),
    ).toBe(true);
    expect(
      safetyFlagMatchesAircraft(flag, { make: "Boeing", model: "A320-214" }),
    ).toBe(false);
  });

  it("does not match A319-114 for Rockwell 114", () => {
    const flag = {
      partNumber: "A319-114",
      partNumberNorm: "A319114",
      source: "AD",
      description:
        "Manufacturer: Airbus SAS | Biweekly: 2026-1 | Applicability model: A319-114",
    };
    expect(
      safetyFlagMatchesAircraft(flag, {
        make: "Rockwell International",
        model: "114",
      }),
    ).toBe(false);
  });

  it("rejects short model against broad multi-OEM blob", () => {
    const blob =
      "Manufacturer: Airbus Canada Limited Partnership Airbus SAS ATR – GIE Avions de Transport Régional BAE Systems Bombardier Inc. Dassault Aviation Embraer S.A. Textron Aviation Inc. The Boeing Company | Applicability model: 114";
    expect(isBroadManufacturerBlob(parseManufacturerFromDescription(blob))).toBe(true);
    const flag = {
      partNumber: "114",
      partNumberNorm: "114",
      source: "AD",
      description: blob,
    };
    expect(
      safetyFlagMatchesAircraft(flag, {
        make: "Rockwell International",
        model: "114",
      }),
    ).toBe(false);
  });

  it("parses TOC description fields", () => {
    const d =
      "Manufacturer: Cessna | Type: REVISION | Applicability model: 172S";
    expect(parseManufacturerFromDescription(d)).toBe("Cessna");
    expect(parseApplicabilityModel(d)).toBe("172S");
    expect(makesCompatible("Cessna", "Textron Aviation Inc.")).toBe(true);
  });
});

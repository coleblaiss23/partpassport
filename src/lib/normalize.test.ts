import { describe, it, expect } from "vitest";
import { normPN, normSerial, cleanIdentField, serialInRange, normalizeIdentifier } from "./normalize";

describe("normPN", () => {
 it("matches formatting variants", () => {
 expect(normPN("3-1234-a")).toBe(normPN("31234A"));
 expect(normPN(" 3 1234 A ")).toBe("31234A");
 });
 it("folds OCR confusables (O/0, I/1, l/1)", () => {
 expect(normPN("APV-7742-1O1")).toBe(normPN("APV-7742-101"));
 expect(normPN("PN-I234")).toBe(normPN("PN-1234"));
 expect(normalizeIdentifier("sn-40l2")).toBe(normalizeIdentifier("SN-4012"));
 });
});

describe("normSerial", () => {
 it("matches OCR variants of serials", () => {
 expect(normSerial("SN-4402")).toBe(normSerial("SN-44O2"));
 expect(normSerial("B-99I2")).toBe(normSerial("B-9912"));
 });
});

describe("cleanIdentField", () => {
 it("folds O/I next to digits but leaves plain letters alone", () => {
 expect(cleanIdentField("APV-7742-1O1")).toBe("APV-7742-101");
 expect(cleanIdentField("SN-44l2")).toBe("SN-4412");
 expect(cleanIdentField("OVERHAUL")).toBe("OVERHAUL");
 expect(cleanIdentField(" ")).toBeNull();
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
 it("compares OCR-folded serials", () => {
 expect(serialInRange("1O0", "100", "300")).toBe(true);
 });
});

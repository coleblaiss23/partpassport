import { describe, it, expect } from "vitest";
import { generateKeypair, signPayload, verifySignature } from "./signing";

describe("signing", () => {
  it("signs and verifies correctly", () => {
    const { publicKey, privateKey } = generateKeypair();
    const payload = { partNumber: "ABC-123", serial: "SN001", event: "REMOVED" };
    const sig = signPayload(payload, privateKey);
    expect(verifySignature(payload, sig, publicKey)).toBe(true);
  });

  it("fails when payload is mutated", () => {
    const { publicKey, privateKey } = generateKeypair();
    const payload = { partNumber: "ABC-123", serial: "SN001" };
    const sig = signPayload(payload, privateKey);
    const mutated = { ...payload, serial: "SN002" };
    expect(verifySignature(mutated, sig, publicKey)).toBe(false);
  });
});
import { describe, it, expect } from "vitest";
import { generateKeypair, signPayload, verifySignature } from "./signing";

describe("signing", () => {
  it("verifies a valid signature", () => {
    const { publicKey, privateKey } = generateKeypair();
    const payload = { foo: "bar" };
    const sig = signPayload(payload, privateKey);
    expect(verifySignature(payload, sig, publicKey)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const { publicKey, privateKey } = generateKeypair();
    const sig = signPayload({ foo: "bar" }, privateKey);
    expect(verifySignature({ foo: "baz" }, sig, publicKey)).toBe(false);
  });

  it("rejects verification with the wrong public key", () => {
    const a = generateKeypair();
    const b = generateKeypair();
    const sig = signPayload({ foo: "bar" }, a.privateKey);
    expect(verifySignature({ foo: "bar" }, sig, b.publicKey)).toBe(false);
  });
});

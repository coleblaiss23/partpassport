import { describe, it, expect } from "vitest";
import { generateKeypair } from "./signing";
import { decryptPrivateKey, encryptPrivateKey, privateKeyMatches } from "./keyVault";

describe("key vault", () => {
 const a = generateKeypair(), b = generateKeypair();
 it("encrypts and decrypts with the right passphrase", async () => {
 const blob = await encryptPrivateKey(a.privateKey, "correct horse battery");
 expect(blob.ct).not.toContain("PRIVATE");
 expect(await decryptPrivateKey(blob, "correct horse battery")).toBe(a.privateKey);
 });
 it("rejects a wrong passphrase", async () => {
 const blob = await encryptPrivateKey(a.privateKey, "correct horse battery");
 await expect(decryptPrivateKey(blob, "nope")).rejects.toThrow("Wrong passphrase");
 });
 it("detects whether a private key matches an organization's public key", async () => {
 expect(await privateKeyMatches(a.privateKey, a.publicKey)).toBe(true);
 expect(await privateKeyMatches(b.privateKey, a.publicKey)).toBe(false);
 expect(await privateKeyMatches("garbage", a.publicKey)).toBe(false);
 });
});

// Encrypts the org's private key with a passphrase before it is stored in this browser.
import { signPayload, verifySignature } from "./signing";

export type VaultBlob = { v: 1; salt: string; iv: string; ct: string };

const enc = new TextEncoder();
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pass: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 310_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(pem: string, pass: string): Promise<VaultBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    await deriveKey(pass, salt),
    enc.encode(pem)
  );
  return { v: 1, salt: toB64(salt), iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

export async function decryptPrivateKey(b: VaultBlob, pass: string): Promise<string> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromB64(b.iv) as BufferSource },
      await deriveKey(pass, fromB64(b.salt)),
      fromB64(b.ct) as BufferSource
    );
    return new TextDecoder().decode(pt);
  } catch {
    throw new Error("Wrong passphrase");
  }
}

/** True if the private key really belongs to this organization's public key. */
export async function privateKeyMatches(privPem: string, pubPem: string): Promise<boolean> {
  try {
    const testPayload = "key-pair-validation-check";
    const sig = signPayload(testPayload, privPem);
    return verifySignature(testPayload, sig, pubPem);
  } catch {
    return false;
  }
}
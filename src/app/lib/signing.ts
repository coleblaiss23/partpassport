import { generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey } from "crypto";
import { stableStringify } from "./hashChain";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export function generateKeypair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

export function signPayload(payload: string | object, privateKeyPem: string): string {
  const data = typeof payload === "string" ? payload : stableStringify(payload);
  const key = createPrivateKey(privateKeyPem);
  return sign(null, Buffer.from(data), key).toString("base64");
}

export function verifySignature(
  payload: string | object,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const data = typeof payload === "string" ? payload : stableStringify(payload);
    const key = createPublicKey(publicKeyPem);
    return verify(null, Buffer.from(data), key, Buffer.from(signatureBase64, "base64"));
  } catch {
    return false;
  }
}
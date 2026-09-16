import { generateKeyPairSync, sign, verify } from "crypto";

export function generateKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

export function signPayload(payload: object, privateKeyPem: string): string {
  const dataBuffer = Buffer.from(JSON.stringify(payload));
  return sign(null, dataBuffer, privateKeyPem).toString("base64");
}

export function verifySignature(
  payload: object,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const signatureBuffer = Buffer.from(signatureBase64, "base64");
    return verify(null, dataBuffer, publicKeyPem, signatureBuffer);
  } catch {
    return false;
  }
}

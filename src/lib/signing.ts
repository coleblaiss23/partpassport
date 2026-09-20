import {
  generateKeyPairSync,
  sign,
  verify,
  createPrivateKey,
  createPublicKey,
} from "crypto";

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

function stableStringify(obj: object): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export function signPayload(payload: object, privateKeyPem: string): string {
  const data = stableStringify(payload);
  const key = createPrivateKey(privateKeyPem);
  const signature = sign(null, Buffer.from(data), key);
  return signature.toString("base64");
}

export function verifySignature(
  payload: object,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const data = stableStringify(payload);
    const key = createPublicKey(publicKeyPem);
    return verify(
      null,
      Buffer.from(data),
      key,
      Buffer.from(signatureBase64, "base64")
    );
  } catch {
    return false;
  }
}
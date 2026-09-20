import crypto from "crypto";

export function newApiKey(): string {
  return `pk_${crypto.randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

export function signPayload(payload: any, privateKey: string): string {
  const str = typeof payload === "string" ? payload : JSON.stringify(payload);
  const signer = crypto.createSign("SHA256");
  signer.update(str);
  signer.end();
  return signer.sign(privateKey, "base64");
}

export function verifySignature(payload: any, signature: string, publicKey: string): boolean {
  try {
    const str = typeof payload === "string" ? payload : JSON.stringify(payload);
    const verifier = crypto.createVerify("SHA256");
    verifier.update(str);
    verifier.end();
    return verifier.verify(publicKey, signature, "base64");
  } catch {
    return false;
  }
}

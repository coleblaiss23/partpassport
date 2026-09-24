import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGO = "aes-256-gcm";

function shareSecret(): Buffer {
  const raw = process.env.AUDIT_SHARE_SECRET || process.env.SESSION_SECRET || "dev-audit-share-secret";
  return createHash("sha256").update(raw).digest();
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function mintShareToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Encrypt JSON package for at-rest storage; token is the only decrypt key material. */
export function encryptAuditPackage(payload: unknown, token: string): string {
  const key = createHash("sha256").update(Buffer.concat([shareSecret(), Buffer.from(token)])).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptAuditPackage(encPayload: string, token: string): unknown {
  const buf = Buffer.from(encPayload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = createHash("sha256").update(Buffer.concat([shareSecret(), Buffer.from(token)])).digest();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

export function defaultShareExpiry(hours = 72): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

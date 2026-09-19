import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const secret = () => process.env.SESSION_SECRET ?? "";
const mac = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

/** Signed token "orgId.expiry.signature". Stored only in an HTTP-only cookie. */
export function makeSession(orgId: string, now = Date.now()): string {
  if (secret().length < 32) throw new Error("SESSION_SECRET (32+ characters) is not set in .env");
  const body = `${orgId}.${Math.floor(now / 1000) + SESSION_MAX_AGE}`;
  return `${body}.${mac(body)}`;
}

export function readSession(token: string | undefined | null, now = Date.now()): string | null {
  if (!token || secret().length < 32) return null;
  const [orgId, exp, sig] = token.split(".");
  if (!orgId || !exp || !sig) return null;
  const want = Buffer.from(mac(`${orgId}.${exp}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return Number(exp) * 1000 > now ? orgId : null;
}

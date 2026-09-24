import { createHash, createHmac, timingSafeEqual } from "crypto";
import { SESSION_MAX_AGE } from "@/lib/session";

export const ADMIN_COOKIE = "pp_admin";
export const ADMIN_MAX_AGE = SESSION_MAX_AGE; // 8 hours

function sessionSecret() {
 return process.env.SESSION_SECRET ?? "";
}

function adminToken() {
 return process.env.ADMIN_TOKEN ?? "";
}

/** ADMIN_TOKEN must be configured and strong enough to mint sessions. */
export function adminConfigured(): boolean {
 return adminToken().length >= 16 && sessionSecret().length >= 32;
}

function tokenFingerprint(): string {
 return createHash("sha256").update(adminToken()).digest("hex").slice(0, 32);
}

function mac(body: string): string {
 return createHmac("sha256", sessionSecret()).update(`${body}.${tokenFingerprint()}`).digest("base64url");
}

/** Signed token "admin.expiry.signature" bound to the current ADMIN_TOKEN. */
export function makeAdminSession(now = Date.now()): string {
 if (!adminConfigured()) throw new Error("ADMIN_TOKEN (16+) and SESSION_SECRET (32+) required for admin sessions");
 const body = `admin.${Math.floor(now / 1000) + ADMIN_MAX_AGE}`;
 return `${body}.${mac(body)}`;
}

export function readAdminSession(token: string | undefined | null, now = Date.now()): boolean {
 if (!token || !adminConfigured()) return false;
 const [role, exp, sig] = token.split(".");
 if (role !== "admin" || !exp || !sig) return false;
 const want = Buffer.from(mac(`admin.${exp}`));
 const got = Buffer.from(sig);
 if (want.length !== got.length || !timingSafeEqual(want, got)) return false;
 return Number(exp) * 1000 > now;
}

export function verifyAdminToken(candidate: string): boolean {
 const want = adminToken();
 if (want.length < 16 || !candidate) return false;
 const a = Buffer.from(want);
 const b = Buffer.from(candidate);
 return a.length === b.length && timingSafeEqual(a, b);
}

function cookieValue(req: Request, name: string) {
 const hit = (req.headers.get("cookie") ?? "")
 .split(/;\s*/)
 .find((c) => c.startsWith(name + "="));
 return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

function sameOrigin(req: Request) {
 if (req.method === "GET" || req.method === "HEAD") return true;
 const origin = req.headers.get("origin");
 if (!origin) return false;
 try {
 return new URL(origin).host === req.headers.get("host");
 } catch {
 return false;
 }
}

/**
 * Platform owner gate: x-admin-token header OR signed pp_admin session cookie.
 * Cookie-authenticated writes require same-origin (CSRF).
 */
export function requireAdmin(req: Request): boolean {
 const headerTok = req.headers.get("x-admin-token") ?? "";
 if (headerTok && verifyAdminToken(headerTok)) return true;
 if (!sameOrigin(req)) return false;
 return readAdminSession(cookieValue(req, ADMIN_COOKIE));
}

export const adminCookieOptions = {
 httpOnly: true,
 sameSite: "strict" as const,
 path: "/",
 secure: process.env.NODE_ENV === "production",
};

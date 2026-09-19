import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, readSession } from "@/lib/session";

export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");
export const newApiKey = () => "pp_live_" + randomBytes(24).toString("hex");

function cookieValue(req: Request, name: string) {
  const hit = (req.headers.get("cookie") ?? "").split(/;\s*/).find((c) => c.startsWith(name + "="));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

// Cookie-authenticated writes must originate from our own site (CSRF defense on top of SameSite=Strict).
function sameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.get("host"); } catch { return false; }
}

/** Accepts either "Authorization: Bearer pp_live_..." (integrations) or the browser session cookie. */
export async function orgFromRequest(req: Request) {
  const bearer = /^Bearer (pp_live_[a-f0-9]{48})$/.exec(req.headers.get("authorization") ?? "");
  if (bearer) {
    const org = await prisma.organization.findUnique({ where: { apiKeyHash: hashKey(bearer[1]) } });
    return org?.active ? org : null;
  }
  const orgId = readSession(cookieValue(req, SESSION_COOKIE));
  if (!orgId || !sameOrigin(req)) return null;
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  return org?.active ? org : null;
}

/** Only the platform owner can onboard organizations (permissioned network). */
export function isAdmin(req: Request) {
  const want = process.env.ADMIN_TOKEN ?? "";
  if (want.length < 16) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(req.headers.get("x-admin-token") ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

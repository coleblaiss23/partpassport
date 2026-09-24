import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { requireAdmin } from "@/lib/adminAuth";

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
 try {
 return new URL(origin).host === req.headers.get("host");
 } catch {
 return false;
 }
}

/** Looks up an organization by raw API key (ApiKey table; revoked keys are rejected). */
export async function orgFromApiKey(raw: string) {
 const key = await prisma.apiKey.findUnique({
 where: { hash: hashKey(raw) },
 include: { organization: true },
 });
 if (!key || key.revokedAt || !key.organization.active) return null;
 void prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
 return key.organization;
}

/** Accepts either "Authorization: Bearer pp_live_..." (integrations) or the browser session cookie. */
export async function orgFromRequest(req: Request) {
 const bearer = /^Bearer (pp_live_[a-f0-9]{48})$/.exec(req.headers.get("authorization") ?? "");
 if (bearer) return orgFromApiKey(bearer[1]);
 const orgId = readSession(cookieValue(req, SESSION_COOKIE));
 if (!orgId || !sameOrigin(req)) return null;
 const org = await prisma.organization.findUnique({ where: { id: orgId } });
 return org?.active ? org : null;
}

/** Browser-session only (no Bearer keys). Used for sensitive actions such as API key management. */
export async function sessionOrgFromRequest(req: Request) {
 const orgId = readSession(cookieValue(req, SESSION_COOKIE));
 if (!orgId || !sameOrigin(req)) return null;
 const org = await prisma.organization.findUnique({ where: { id: orgId } });
 return org?.active ? org : null;
}

/** Platform owner: x-admin-token header or signed pp_admin session cookie. */
export function isAdmin(req: Request) {
 return requireAdmin(req);
}

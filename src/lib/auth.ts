import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");
export const newApiKey = () => "pp_live_" + randomBytes(24).toString("hex");

/** Resolve the calling organization from "Authorization: Bearer pp_live_..." */
export async function orgFromRequest(req: Request) {
  const m = /^Bearer (pp_live_[a-f0-9]{48})$/.exec(req.headers.get("authorization") ?? "");
  if (!m) return null;
  const org = await prisma.organization.findUnique({ where: { apiKeyHash: hashKey(m[1]) } });
  return org && org.active ? org : null;
}

/** Only the platform owner can onboard organizations (permissioned network). */
export function isAdmin(req: Request) {
  const want = process.env.ADMIN_TOKEN ?? "";
  if (want.length < 16) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(req.headers.get("x-admin-token") ?? "");
  return a.length === b.length && timingSafeEqual(a, b);
}

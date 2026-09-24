import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashKey, newApiKey, sessionOrgFromRequest } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { PLAN_LIMITS, effectivePlan } from "@/lib/planLimits";
import { readJson, unauthorized } from "@/lib/api";

const MAX_KEYS = { PILOT: 1, PRO: 5, ENTERPRISE: 50 } as const;

// Key management is limited to a signed-in browser session, so a leaked API key cannot mint more keys.
export async function GET(request: Request) {
 const org = await sessionOrgFromRequest(request);
 if (!org) return unauthorized();
 const plan = effectivePlan(org);
 const [keys, usage] = await Promise.all([
 prisma.apiKey.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true, revokedAt: true } }),
 getUsage(org.id),
 ]);
 return NextResponse.json({ keys, usage, limits: PLAN_LIMITS[plan], plan, maxKeys: MAX_KEYS[plan] });
}

export async function POST(request: Request) {
 const org = await sessionOrgFromRequest(request);
 if (!org) return unauthorized();
 const plan = effectivePlan(org);
 const active = await prisma.apiKey.count({ where: { organizationId: org.id, revokedAt: null } });
 if (active >= MAX_KEYS[plan]) return NextResponse.json({ error: `Your plan allows ${MAX_KEYS[plan]} active API key${MAX_KEYS[plan] > 1 ? "s" : ""}. Revoke one first or upgrade.` }, { status: 402 });
 const b = await readJson(request);
 const name = typeof b?.name === "string" && b.name.trim() ? b.name.trim().slice(0, 60) : "API key";
 const raw = newApiKey();
 const key = await prisma.apiKey.create({ data: { organizationId: org.id, name, prefix: raw.slice(0, 12), hash: hashKey(raw) } });
 await prisma.auditLog.create({ data: { organizationId: org.id, action: "API_KEY_CREATED", meta: JSON.stringify({ keyId: key.id, name }) } });
 return NextResponse.json({ id: key.id, name, apiKey: raw, warning: "Copy this key now. It will not be shown again." }, { status: 201 });
}

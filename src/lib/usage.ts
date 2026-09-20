import { prisma } from "./prisma";
import { PLAN_LIMITS, effectivePlan, evaluateLimit, monthStart, type LimitKind } from "./planLimits";

/** Usage this calendar month (UTC), counted from tables we already keep. */
export async function getUsage(orgId: string, now = new Date()) {
  const from = monthStart(now);
  const [checks, registrations] = await Promise.all([
    prisma.certificateCheck.count({ where: { organizationId: orgId, createdAt: { gte: from } } }),
    prisma.partEvent.count({ where: { organizationId: orgId, eventType: "CREATED", createdAt: { gte: from } } }),
  ]);
  return { checks, registrations };
}

/** Soft limit: two simultaneous requests at the boundary could each slip through. Fine for plan limits. */
export async function gate(org: { id: string; plan?: string | null; subStatus?: string | null }, kind: LimitKind) {
  const plan = effectivePlan(org);
  const usage = await getUsage(org.id);
  return { plan, usage, ...evaluateLimit(kind, usage[kind], PLAN_LIMITS[plan][kind]) };
}

/** Checks across ALL organizations today (UTC). Protects you from a runaway AI bill. */
export async function globalChecksToday(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return prisma.certificateCheck.count({ where: { createdAt: { gte: start } } });
}

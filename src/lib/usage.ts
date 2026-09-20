import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, effectivePlan, PlanType } from "@/lib/planLimits";

export async function getUsage(orgId: string) {
  const eventsCount = await prisma.partEvent.count({ where: { organizationId: orgId } });
  return {
    eventsLogged: eventsCount,
    checks: 0,
    registrations: eventsCount,
  };
}

export async function gate(orgOrId: any, action?: string) {
  const orgId = typeof orgOrId === "string" ? orgOrId : orgOrId?.id;
  const plan: PlanType = effectivePlan(orgOrId);
  const usage = await getUsage(orgId);
  const limits = PLAN_LIMITS[plan];

  const used = action === "checks" ? usage.checks : usage.registrations;
  const limit = action === "checks" ? limits.checks : limits.registrations;

  return {
    allowed: used < limit,
    plan,
    usage,
    used,
    limit,
    message: used >= limit ? `Plan limit reached for ${action || "this feature"}` : undefined,
  };
}

export async function globalChecksToday() {
  return 0;
}

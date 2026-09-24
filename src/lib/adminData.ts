import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, effectivePlan, monthStart, type PlanId } from "@/lib/planLimits";
import { aiStatus } from "@/lib/extract";
import { billingDevMockEnabled, stripeCheckoutConfigured } from "@/lib/billing";
import { getAdminDevFlags } from "@/lib/adminFlags";

/** List prices used for estimated MRR (matches pricing page). */
export const PLAN_MRR_USD: Record<PlanId, number> = {
 PILOT: 0,
 PRO: 499,
 ENTERPRISE: 1999,
};

export async function adminOverviewMetrics() {
 const from = monthStart();
 const [activeOrgs, totalChecks, paidOrgs, checksThisMonth, leadsOpen] = await Promise.all([
 prisma.organization.count({ where: { active: true } }),
 prisma.certificateCheck.count(),
 prisma.organization.findMany({
 where: {
 active: true,
 plan: { in: ["PRO", "ENTERPRISE"] },
 OR: [{ subStatus: null }, { subStatus: { notIn: ["canceled", "unpaid", "incomplete_expired"] } }],
 },
 select: { plan: true, subStatus: true },
 }),
 prisma.certificateCheck.count({ where: { createdAt: { gte: from } } }),
 prisma.lead.count({ where: { status: { in: ["NEW", "OPEN"] } } }),
 ]);

 let mrr = 0;
 for (const o of paidOrgs) {
 const plan = effectivePlan(o);
 mrr += PLAN_MRR_USD[plan] ?? 0;
 }

 return {
 activeOrganizations: activeOrgs,
 certificatesScanned: totalChecks,
 checksThisMonth,
 estimatedMrrUsd: mrr,
 openLeads: leadsOpen,
 paidTenants: paidOrgs.length,
 };
}

export async function adminSystemHealth() {
 let database: "ok" | "down" = "down";
 try {
 await prisma.$queryRaw`SELECT 1`;
 database = "ok";
 } catch {
 database = "down";
 }

 const ai = aiStatus();
 const flags = getAdminDevFlags();

 return {
 system: "ok" as const,
 database,
 ocr: {
 mode: flags.aiModeOverride ?? ai.mode,
 message: ai.message,
 effective: flags.aiModeOverride ? `override:${flags.aiModeOverride}` : ai.mode,
 },
 billing: {
 stripeCheckout: stripeCheckoutConfigured(),
 devMock: flags.billingDevMock ?? billingDevMockEnabled(),
 },
 flags,
 uptimeSec: Math.floor(process.uptime()),
 nodeEnv: process.env.NODE_ENV ?? "unknown",
 };
}

export async function adminTenantDirectory() {
 const from = monthStart();
 const orgs = await prisma.organization.findMany({
 orderBy: { createdAt: "desc" },
 select: {
 id: true,
 name: true,
 plan: true,
 subStatus: true,
 active: true,
 verification: true,
 faaCertNumber: true,
 createdAt: true,
 currentPeriodEnd: true,
 stripeCustomerId: true,
 _count: {
 select: {
 checks: true,
 parts: true,
 },
 },
 },
 });

 const usageRows = await prisma.certificateCheck.groupBy({
 by: ["organizationId"],
 where: { createdAt: { gte: from } },
 _count: { _all: true },
 });
 const regRows = await prisma.partEvent.groupBy({
 by: ["organizationId"],
 where: { eventType: "CREATED", createdAt: { gte: from } },
 _count: { _all: true },
 });
 const checksMap = new Map(usageRows.map((r) => [r.organizationId, r._count._all]));
 const regsMap = new Map(regRows.map((r) => [r.organizationId, r._count._all]));

 return orgs.map((o) => {
 const plan = effectivePlan(o);
 const limits = PLAN_LIMITS[plan];
 const checksUsed = checksMap.get(o.id) ?? 0;
 const regsUsed = regsMap.get(o.id) ?? 0;
 return {
 id: o.id,
 name: o.name,
 plan,
 listedPlan: o.plan,
 subStatus: o.subStatus,
 active: o.active,
 verification: o.verification,
 faaCertNumber: o.faaCertNumber,
 createdAt: o.createdAt.toISOString(),
 currentPeriodEnd: o.currentPeriodEnd?.toISOString() ?? null,
 stripeCustomerId: o.stripeCustomerId,
 totals: { checks: o._count.checks, parts: o._count.parts },
 usage: {
 checks: checksUsed,
 checksLimit: limits.checks,
 registrations: regsUsed,
 registrationsLimit: limits.registrations,
 },
 mrrUsd: PLAN_MRR_USD[plan] ?? 0,
 };
 });
}

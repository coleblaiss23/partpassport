// Pure plan logic (no database). Usage counting lives in usage.ts.
export type PlanId = "PILOT" | "PRO" | "ENTERPRISE";
export type LimitKind = "checks" | "registrations";

const num = (v: string | undefined, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };

/** Public numbers shown on the pricing page. */
export const DEFAULT_LIMITS: Record<PlanId, { name: string; checks: number; registrations: number }> = {
 PILOT: { name: "Pilot", checks: 15, registrations: 10 },
 PRO: { name: "MRO Professional", checks: 500, registrations: 10_000 }, // registrations: "unlimited" with a fair-use ceiling
 ENTERPRISE: { name: "Enterprise Fleet", checks: 100_000, registrations: 1_000_000 },
};

/** Enforced numbers. PILOT_CHECK_LIMIT / PILOT_REG_LIMIT in .env override the Pilot plan (handy for testing). */
export const PLAN_LIMITS = {
 ...DEFAULT_LIMITS,
 PILOT: { ...DEFAULT_LIMITS.PILOT, checks: num(process.env.PILOT_CHECK_LIMIT, 15), registrations: num(process.env.PILOT_REG_LIMIT, 10) },
};

/** A lapsed paid subscription falls back to Pilot limits. */
export function effectivePlan(org: { plan?: string | null; subStatus?: string | null }): PlanId {
 const p = (org.plan ?? "PILOT") as PlanId;
 const plan: PlanId = p in DEFAULT_LIMITS ? p : "PILOT";
 if (plan !== "PILOT" && ["canceled", "unpaid", "incomplete_expired"].includes(org.subStatus ?? "")) return "PILOT";
 return plan;
}

export const monthStart = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

const LABEL: Record<LimitKind, string> = { checks: "certificate checks", registrations: "part registrations" };

export function evaluateLimit(kind: LimitKind, used: number, limit: number) {
 if (used >= limit)
 return { allowed: false, warn: false, used, limit, remaining: 0, message: `Monthly limit reached: ${used} of ${limit} ${LABEL[kind]} used. Upgrade your plan at /pricing to continue.` };
 const warn = used >= Math.floor(limit * 0.8);
 return { allowed: true, warn, used, limit, remaining: limit - used, message: warn ? `You have used ${used} of ${limit} ${LABEL[kind]} this month.` : undefined };
}

export type PlanType = "PILOT" | "PRO" | "ENTERPRISE";

export interface PlanLimitDetails {
  name: string;
  checks: number;
  registrations: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimitDetails> = {
  PILOT: { name: "Pilot", checks: 100, registrations: 100 },
  PRO: { name: "Professional", checks: 5000, registrations: 10000 },
  ENTERPRISE: { name: "Enterprise", checks: 50000, registrations: 100000 },
};

export const MAX_KEYS: Record<PlanType, number> = {
  PILOT: 1,
  PRO: 5,
  ENTERPRISE: 50,
};

export const DEFAULT_LIMITS = PLAN_LIMITS;

export function effectivePlan(orgOrPlan?: any): PlanType {
  const planStr = typeof orgOrPlan === "string" ? orgOrPlan : orgOrPlan?.plan;
  if (planStr === "PRO" || planStr === "ENTERPRISE") return planStr;
  return "PILOT";
}

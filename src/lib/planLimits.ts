// Pure plan logic (no database). Usage counting lives in usage.ts.
export type PlanId = "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
export type LimitKind = "checks" | "registrations";
export type FeatureFlag =
  | "ocrUploads"
  | "auditReports"
  | "multiShop"
  | "workOrders"
  | "stripeInvoicing"
  | "webhooks"
  | "adFullTextParse"
  | "mechanicCertificates";

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

export type PlanLimits = {
  name: string;
  priceMonthly: number;
  checks: number;
  registrations: number;
  /** Max aircraft tails; Infinity = unlimited */
  aircraft: number;
  features: Record<FeatureFlag, boolean>;
};

const ALL_OFF: Record<FeatureFlag, boolean> = {
  ocrUploads: false,
  auditReports: false,
  multiShop: false,
  workOrders: false,
  stripeInvoicing: false,
  webhooks: false,
  adFullTextParse: false,
  mechanicCertificates: false,
};

/** Public numbers shown on the pricing page. */
export const DEFAULT_LIMITS: Record<PlanId, PlanLimits> = {
  STARTER: {
    name: "Starter",
    priceMonthly: 299,
    checks: 100,
    registrations: 500,
    aircraft: 5,
    features: {
      ...ALL_OFF,
      auditReports: false,
    },
  },
  PROFESSIONAL: {
    name: "Professional",
    priceMonthly: 599,
    checks: 2_000,
    registrations: 50_000,
    aircraft: Infinity,
    features: {
      ...ALL_OFF,
      ocrUploads: true,
      auditReports: true,
      adFullTextParse: true,
      workOrders: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise / MRO Shop",
    priceMonthly: 899,
    checks: 100_000,
    registrations: 1_000_000,
    aircraft: Infinity,
    features: {
      ocrUploads: true,
      auditReports: true,
      multiShop: true,
      workOrders: true,
      stripeInvoicing: true,
      webhooks: true,
      adFullTextParse: true,
      mechanicCertificates: true,
    },
  },
};

/** Enforced numbers. STARTER_* env overrides handy for testing. */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  ...DEFAULT_LIMITS,
  STARTER: {
    ...DEFAULT_LIMITS.STARTER,
    checks: num(process.env.STARTER_CHECK_LIMIT ?? process.env.PILOT_CHECK_LIMIT, DEFAULT_LIMITS.STARTER.checks),
    registrations: num(
      process.env.STARTER_REG_LIMIT ?? process.env.PILOT_REG_LIMIT,
      DEFAULT_LIMITS.STARTER.registrations,
    ),
  },
};

const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  PILOT: "STARTER",
  PRO: "PROFESSIONAL",
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
};

/** Normalize legacy plan ids from DB / env / query params. */
export function normalizePlanId(raw: string | null | undefined): PlanId {
  if (!raw) return "STARTER";
  const mapped = LEGACY_PLAN_MAP[raw.toUpperCase()];
  return mapped ?? "STARTER";
}

/** A lapsed paid subscription falls back to Starter limits (trial may still apply). */
export function effectivePlan(org: { plan?: string | null; subStatus?: string | null }): PlanId {
  const plan = normalizePlanId(org.plan);
  if (plan !== "STARTER" && ["canceled", "unpaid", "incomplete_expired"].includes(org.subStatus ?? "")) {
    return "STARTER";
  }
  return plan;
}

export function aircraftLimit(org: {
  plan?: string | null;
  subStatus?: string | null;
  maxAircraft?: number | null;
}): number {
  if (org.maxAircraft != null && org.maxAircraft > 0) return org.maxAircraft;
  return PLAN_LIMITS[effectivePlan(org)].aircraft;
}

export function canUseFeature(
  org: { plan?: string | null; subStatus?: string | null; features?: string | null },
  feature: FeatureFlag,
): boolean {
  if (org.features) {
    try {
      const overrides = JSON.parse(org.features) as Partial<Record<FeatureFlag, boolean>>;
      if (typeof overrides[feature] === "boolean") return overrides[feature]!;
    } catch {
      /* ignore bad JSON */
    }
  }
  return PLAN_LIMITS[effectivePlan(org)].features[feature];
}

export const monthStart = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

const LABEL: Record<LimitKind, string> = { checks: "certificate checks", registrations: "part registrations" };

export function evaluateLimit(kind: LimitKind, used: number, limit: number) {
  if (used >= limit)
    return {
      allowed: false,
      warn: false,
      used,
      limit,
      remaining: 0,
      message: `Monthly limit reached: ${used} of ${limit} ${LABEL[kind]} used. Upgrade your plan at /pricing to continue.`,
    };
  const warn = used >= Math.floor(limit * 0.8);
  return {
    allowed: true,
    warn,
    used,
    limit,
    remaining: limit - used,
    message: warn ? `You have used ${used} of ${limit} ${LABEL[kind]} this month.` : undefined,
  };
}

export const TRIAL_DAYS = 14;

export function defaultTrialEndsAt(from = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 86_400_000);
}

import { prisma } from "@/lib/prisma";
import type { PlanId } from "@/lib/planLimits";

/** Real Stripe Checkout requires both a secret key and a Pro price id. */
export function stripeCheckoutConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_PRO?.trim());
}

export function stripePortalConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Local / test billing without Stripe.
 * - Enabled when BILLING_DEV_MOCK=1 (or true/on)
 * - Enabled by default outside production when Stripe is incomplete
 * - Disabled when BILLING_DEV_MOCK=0/off/false
 * - Never enabled in production
 */
export function billingDevMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const flag = (process.env.BILLING_DEV_MOCK ?? "").toLowerCase().trim();
  if (flag === "0" || flag === "off" || flag === "false") return false;
  if (flag === "1" || flag === "true" || flag === "on" || flag === "yes") return true;
  // Default on in development when Stripe is incomplete.
  return !stripeCheckoutConfigured();
}

export function isDevStripeCustomer(customerId: string | null | undefined): boolean {
  return Boolean(customerId?.startsWith("dev_cus_"));
}

/** Upgrade or change plan locally when Stripe is not configured. */
export async function applyDevPlan(orgId: string, plan: PlanId) {
  const isPaid = plan === "PRO" || plan === "ENTERPRISE";
  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan,
      subStatus: isPaid ? "active" : null,
      stripeCustomerId: isPaid ? `dev_cus_${orgId.slice(0, 18)}` : null,
      stripeSubId: isPaid ? `dev_sub_${orgId.slice(0, 18)}` : null,
      currentPeriodEnd: isPaid ? new Date(Date.now() + 30 * 86_400_000) : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: "BILLING_UPDATED",
      meta: JSON.stringify({ source: "billing_dev_mock", plan }),
    },
  });
  return org;
}

/** @deprecated use applyDevPlan */
export async function applyDevProUpgrade(orgId: string) {
  return applyDevPlan(orgId, "PRO");
}

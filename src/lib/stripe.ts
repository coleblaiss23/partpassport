import { createHmac, timingSafeEqual } from "crypto";

/** Verifies a Stripe webhook signature header ("t=...,v1=...") against the raw request body. */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300, nowMs = Date.now()): boolean {
  if (!header || !secret) return false;
  const items = header.split(",").map((p) => p.trim().split("="));
  const t = items.find(([k]) => k === "t")?.[1];
  const sigs = items.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length || Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

export type OrgMatch = { orgId?: string; customerId?: string; subId?: string };
export type OrgPatch = { plan?: "PILOT" | "PRO"; subStatus?: string; stripeCustomerId?: string; stripeSubId?: string; currentPeriodEnd?: Date | null };
type StripeEventLike = { id: string; type: string; data: { object: Record<string, any> } };

const LIVE = ["active", "trialing", "past_due"];
const periodEnd = (o: Record<string, any>) => {
  const s = o.current_period_end ?? o.items?.data?.[0]?.current_period_end;
  return typeof s === "number" ? new Date(s * 1000) : null;
};

/** Decides how a Stripe event changes an organization. Pure, so it can be unit tested. */
export function interpretStripeEvent(evt: StripeEventLike): { match: OrgMatch; patch: OrgPatch } | null {
  const o = evt.data.object;
  switch (evt.type) {
    case "checkout.session.completed":
      if (o.mode !== "subscription") return null;
      return { match: { orgId: o.client_reference_id || undefined, customerId: o.customer }, patch: { plan: "PRO", subStatus: "active", stripeCustomerId: o.customer, stripeSubId: o.subscription } };
    case "customer.subscription.created":
    case "customer.subscription.updated":
      return { match: { subId: o.id, customerId: o.customer }, patch: { subStatus: o.status, plan: LIVE.includes(o.status) ? "PRO" : "PILOT", currentPeriodEnd: periodEnd(o) } };
    case "customer.subscription.deleted":
      return { match: { subId: o.id, customerId: o.customer }, patch: { subStatus: "canceled", plan: "PILOT", currentPeriodEnd: periodEnd(o) } };
    case "invoice.payment_failed":
      return { match: { customerId: o.customer }, patch: { subStatus: "past_due" } };
    case "invoice.paid":
      return { match: { customerId: o.customer }, patch: { subStatus: "active" } };
    default:
      return null;
  }
}

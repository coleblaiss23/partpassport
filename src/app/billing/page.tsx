import { getSessionOrg } from "@/lib/sessionOrg";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";
import BillingButton from "@/components/BillingButton";
import { PlanSwitcher } from "@/components/PlanSwitcher";
import {
  billingDevMockEnabled,
  isDevStripeCustomer,
  stripeCheckoutConfigured,
  stripePortalConfigured,
} from "@/lib/billing";
import { DeleteOrganizationSection } from "@/app/dashboard/settings/billing/DeleteOrganizationSection";
import { PLAN_LIMITS, effectivePlan } from "@/lib/planLimits";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ updated?: string }>;
}) {
  const org = await getSessionOrg();
  if (!org) redirect("/signup");
  const params = (await searchParams) ?? {};
  const organization = await prisma.organization.findUnique({
    where: { id: org.id },
    select: { name: true, plan: true, stripeCustomerId: true, subStatus: true },
  });
  if (!organization) redirect("/signup");

  const plan = effectivePlan(organization);
  const limits = PLAN_LIMITS[plan];
  const mock = billingDevMockEnabled() || isDevStripeCustomer(organization.stripeCustomerId);
  const stripeReady = stripeCheckoutConfigured() && stripePortalConfigured();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Billing</h1>
        <p className="text-sm text-slate-400">
          Manage your plan for <span className="text-slate-200">{organization.name}</span>.
        </p>
      </div>

      {params.updated && (
        <p className="rounded border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          Plan set to {params.updated}.
        </p>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">Current plan: {limits.name}</h2>
          <span className="text-xs text-slate-500">
            {limits.checks.toLocaleString()} checks / month
          </span>
        </div>

        {mock ? (
          <PlanSwitcher currentPlan={organization.plan} />
        ) : stripeReady ? (
          <div className="space-y-3">
            {plan === "PILOT" ? (
              <Link href="/checkout?plan=PRO" className={btnPrimary}>
                Upgrade to MRO Professional
              </Link>
            ) : (
              <BillingButton />
            )}
            <Link href="/pricing" className={`${btnSecondary} inline-block`}>
              Compare plans
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Stripe is not configured. Set <code className="font-mono text-slate-300">STRIPE_SECRET_KEY</code> and{" "}
            <code className="font-mono text-slate-300">STRIPE_PRICE_PRO</code>, or enable{" "}
            <code className="font-mono text-slate-300">BILLING_DEV_MOCK=1</code>.
          </p>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-white">Shortcuts</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Dashboard
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/dashboard/records" className="text-emerald-400 hover:underline">
            Manage records
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/checkout" className="text-emerald-400 hover:underline">
            Checkout
          </Link>
          <span className="text-slate-600">·</span>
          <Link href="/pricing" className="text-emerald-400 hover:underline">
            Pricing
          </Link>
        </div>
      </Card>

      <DeleteOrganizationSection orgName={organization.name} />
    </main>
  );
}

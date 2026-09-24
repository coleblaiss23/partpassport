import { getSessionOrg } from "@/lib/sessionOrg";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader } from "@/components/ui";
import BillingButton from "@/components/BillingButton";
import { PricingMatrix } from "@/components/PricingMatrix";
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
  const mock =
    billingDevMockEnabled() || isDevStripeCustomer(organization.stripeCustomerId);
  const stripeReady = stripeCheckoutConfigured() && stripePortalConfigured();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <PageHeader
        title="Billing"
        subtitle={`Plan for ${organization.name} · ${limits.checks.toLocaleString()} checks / month`}
        actions={
          plan !== "PILOT" && !mock && stripeReady ? <BillingButton /> : undefined
        }
      />

      {params.updated && (
        <p className="rounded-[4px] border border-[#1F6B47] bg-[#14281F] px-3 py-2 text-sm text-white">
          Plan set to {params.updated}.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C8495]">
          Choose a plan
        </h2>
        <PricingMatrix
          currentPlan={organization.plan}
          orgId={organization.name ? org.id : null}
          mock={mock}
          stripeReady={stripeReady}
          mode="billing"
        />
      </section>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-white">Shortcuts</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/dashboard" className="text-[#1F6B47] hover:underline">
            Dashboard
          </Link>
          <span className="text-[#7C8495]">·</span>
          <Link href="/dashboard/records" className="text-[#1F6B47] hover:underline">
            Manage records
          </Link>
          <span className="text-[#7C8495]">·</span>
          <Link href="/pricing" className="text-[#1F6B47] hover:underline">
            Public pricing
          </Link>
        </div>
      </Card>

      <DeleteOrganizationSection orgName={organization.name} />
    </main>
  );
}

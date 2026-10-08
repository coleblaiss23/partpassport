import type { ReactNode } from "react";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";
import { DEFAULT_LIMITS as L } from "@/lib/planLimits";
import { getSessionOrg } from "@/lib/sessionOrg";
import { PricingMatrix } from "@/components/PricingMatrix";

export const metadata = { title: "Pricing | PartPassport" };

function Cta({
  href,
  primary,
  children,
}: {
  href: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <a href={href} className={`${primary ? btnPrimary : btnSecondary} w-full`}>
      {children}
    </a>
  );
}

export default async function PricingPage() {
  const org = await getSessionOrg().catch(() => null);

  const faq: [string, string][] = [
    [
      "What counts as a certificate check?",
      "One PDF analyzed. Limits reset on the first day of each month (UTC).",
    ],
    [
      "Do you store my PDFs?",
      "No. We keep extracted fields, findings, AVL results, and a file hash. The PDF is processed by the Deterministic OCR Pipeline only to run the check.",
    ],
    [
      "Does this approve a part for installation?",
      "No. PartPassport checks whether records are consistent. Only authorized persons determine airworthiness.",
    ],
    [
      "How does billing work?",
      "Select a plan, review the payment summary, then continue to Stripe (or local mock in development). New orgs get a 14-day trial window.",
    ],
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-6 py-16 md:px-12">
      <div className="max-w-2xl">
        <p className="pp-track text-[11px] uppercase tracking-[0.32em] text-[#c4893a]">Plans</p>
        <h1 className="mt-4 text-5xl text-[#f4f1ea] md:text-7xl">Pricing</h1>
        <p className="mt-5 text-base leading-relaxed text-[#c8c2b8]">
          Fleet compliance, AD tracking, and shop invoicing for Part 135 operators, flight schools,
          and MRO shops — from ${L.STARTER.priceMonthly} to ${L.ENTERPRISE.priceMonthly}/month.
        </p>
      </div>

      <PricingMatrix
        currentPlan={org?.plan ?? null}
        orgId={org?.id ?? null}
        mode="public"
        stripeReady
      />

      {!org && (
        <div className="flex flex-wrap gap-2">
          <Cta href="/signup?plan=starter" primary>
            Start Starter trial
          </Cta>
          <Cta href="/request-access?plan=enterprise">Talk to sales</Cta>
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-white">Fair use</h2>
        <p className="mt-2 text-sm text-[#c8c2b8]">
          Professional includes {L.PROFESSIONAL.checks.toLocaleString()} certificate checks per
          month and unlimited tails. Starter caps fleet size at {L.STARTER.aircraft} aircraft.
          Enterprise adds multi-shop, work orders, Stripe invoicing, and webhooks.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {faq.map(([q, a]) => (
          <Card key={q}>
            <h3 className="text-sm font-medium text-white">{q}</h3>
            <p className="mt-1 text-sm text-[#c8c2b8]">{a}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}

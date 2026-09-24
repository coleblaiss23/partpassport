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
      "Select a plan, review the payment summary, then continue to Stripe (or local mock in development).",
    ],
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div className="max-w-xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Pricing</h1>
        <p className="text-sm text-[#B0B6C3]">
          Deterministic OCR Pipeline, AVL enforcement, and Chain of Custody Ledger for shops that
          handle 8130-3 / Form 1 paperwork. Not an airworthiness determination.
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
          <Cta href="/signup?plan=pilot" primary>
            Start free Pilot
          </Cta>
          <Cta href="/request-access?plan=enterprise">Talk to sales</Cta>
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-white">Fair use</h2>
        <p className="mt-2 text-sm text-[#B0B6C3]">
          MRO Professional includes {L.PRO.checks} certificate checks per month. Part registrations
          are unlimited within reasonable use (up to {L.PRO.registrations.toLocaleString()} per
          month). Higher sustained volume is an Enterprise conversation.
        </p>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {faq.map(([q, a]) => (
          <Card key={q}>
            <h3 className="text-sm font-medium text-white">{q}</h3>
            <p className="mt-1 text-sm text-[#B0B6C3]">{a}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}

import type { ReactNode } from "react";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";
import { DEFAULT_LIMITS as L } from "@/lib/planLimits";
import { getSessionOrg } from "@/lib/sessionOrg";
import { CheckoutButton } from "./CheckoutButton";

export const metadata = { title: "Pricing | PartPassport" };

function Cta({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return (
    <a href={href} className={`${primary ? btnPrimary : btnSecondary} w-full`}>
      {children}
    </a>
  );
}

export default async function PricingPage() {
  const org = await getSessionOrg().catch(() => null);
  const tiers = [
    {
      name: "Pilot",
      price: "Free",
      note: "For trying your own certificates",
      features: [
        `${L.PILOT.checks} certificate checks per month`,
        `${L.PILOT.registrations} part registrations per month`,
        "Shareable audit reports",
        "Public verification pages",
      ],
      cta: org ? (
        <Cta href="/dashboard" primary>Go to dashboard</Cta>
      ) : (
        <Cta href="/signup?plan=pilot" primary>Start free</Cta>
      ),
      highlight: false,
    },
    {
      name: "MRO Professional",
      price: "$499",
      per: "/month",
      note: "Repair stations, traders, distributors",
      features: [
        `${L.PRO.checks} certificate checks per month`,
        "Unlimited part registrations (fair use)",
        "Batch PDF scanning",
        "Shareable audit reports",
        "Safety-data matching (ADs / UPNs)",
        "Signed part passports",
        "Email support",
      ],
      cta: <CheckoutButton orgId={org?.id ?? null} />,
      highlight: true,
    },
    {
      name: "Enterprise Fleet",
      price: "Custom",
      note: "Typically from $1,999/month",
      features: [
        "Higher check volume (fair use)",
        "API keys for integrations",
        "SLA and SSO on request",
        "Onboarding support",
      ],
      cta: <Cta href="/request-access?plan=enterprise">Contact us</Cta>,
      highlight: false,
    },
  ];

  const faq: [string, string][] = [
    [
      "What counts as a certificate check?",
      "One PDF analyzed. Limits reset on the first day of each month (UTC).",
    ],
    [
      "Do you store my PDFs?",
      "No. We keep extracted fields, findings, and a file hash. The PDF is sent to a document-analysis provider only to run the check.",
    ],
    [
      "Does this approve a part for installation?",
      "No. PartPassport checks whether records are consistent. Only authorized persons determine airworthiness.",
    ],
    [
      "How does billing work?",
      "Paid plans are billed monthly via Stripe. You can manage or cancel anytime from the dashboard.",
    ],
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div className="max-w-xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Pricing</h1>
        <p className="text-sm text-slate-400">
          Certificate checks and signed part histories for shops that handle 8130-3 / Form 1 paperwork. Not an airworthiness determination.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={`flex flex-col gap-4 ${t.highlight ? "border-emerald-700" : ""}`}>
            <div>
              <h2 className="text-base font-semibold text-white">{t.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{t.note}</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {t.price}{t.per ? <span className="text-sm font-normal text-slate-400">{t.per}</span> : null}
              </p>
            </div>
            <ul className="flex-1 space-y-2 text-sm text-slate-300">
              {t.features.map((f) => (<li key={f}>{f}</li>))}
            </ul>
            {t.cta}
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-sm font-semibold text-white">Fair use</h2>
        <p className="mt-2 text-sm text-slate-400">
          MRO Professional includes {L.PRO.checks} certificate checks per month. Part registrations are unlimited within reasonable use (up to {L.PRO.registrations.toLocaleString()} per month). Higher sustained volume is an Enterprise conversation.
        </p>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        {faq.map(([q, a]) => (
          <Card key={q}>
            <h3 className="text-sm font-medium text-white">{q}</h3>
            <p className="mt-1 text-sm text-slate-400">{a}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}

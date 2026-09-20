import type { ReactNode } from "react";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";
import { DEFAULT_LIMITS as L } from "@/lib/planLimits";
import { getSessionOrg } from "@/lib/sessionOrg";

export const metadata = { title: "Pricing | Part Passport" };

// Set NEXT_PUBLIC_STRIPE_PAYMENT_LINK (a Stripe Payment Link URL) in .env
const STRIPE = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

function Cta({ href, primary, children }: { href: string; primary?: boolean; children: ReactNode }) {
  return <a href={href} className={`${primary ? btnPrimary : btnSecondary} w-full`}>{children}</a>;
}

const tiers = [
  {
    name: "Pilot", price: "Free", note: "Try it on your own certificates",
    features: [`${L.PILOT.checks} certificate checks per month`, `${L.PILOT.registrations} part registrations per month`, "Shareable audit reports", "Public verification pages"],
    cta: <Cta href={"/request-access?plan=pilot"}>Request pilot access</Cta>,
  },
  {
    name: "MRO Professional", price: "$499", per: "/month", highlight: true, note: "For repair stations, traders and distributors",
    features: [`${L.PRO.checks} certificate checks per month`, "Unlimited part registrations (fair use)", "Batch PDF scanning", "Shareable audit reports", "Safety-data matching (ADs and SDRs)", "Signed, tamper-evident part passports", "Email support"],
    cta: STRIPE ? <Cta href={STRIPE} primary>Subscribe with Stripe</Cta> : <Cta href={"/request-access?plan=pro"} primary>Get MRO Professional</Cta>,
  },
  {
    name: "Enterprise Fleet", price: "Custom", note: "Starting at $1,999/month",
    features: ["High-volume certificate checks (fair use)", "Dedicated API keys for ERP integrations", "Custom SLA and single sign-on on request", "Onboarding and integration support"],
    cta: <Cta href={"/request-access?plan=enterprise"}>Contact us</Cta>,
  },
];

const faq: [string, string][] = [
  ["What counts as a certificate check?", "One PDF analyzed. Limits reset on the first day of each month (UTC)."],
  ["Do you store my PDFs?", "No. We keep the extracted fields, the findings and a hash of the file. The PDF is sent to an AI provider only to perform the analysis."],
  ["Does this approve a part for installation?", "No. Part Passport checks whether records are consistent. Only authorized persons can determine airworthiness."],
  ["How does billing work?", "Paid plans are billed monthly. After you subscribe we activate your plan and confirm by email."],
];

const withRef = (url: string, orgId: string) => `${url}${url.includes("?") ? "&" : "?"}client_reference_id=${encodeURIComponent(orgId)}`;

export default async function PricingPage() {
  // Signed-in organizations get a Stripe link tagged with their ID, so the webhook can activate the plan automatically.
  const org = await getSessionOrg().catch(() => null);
  const proCta = STRIPE && org
    ? <Cta href={withRef(STRIPE, org.id)} primary>Subscribe with Stripe</Cta>
    : <Cta href="/request-access?plan=pro" primary>Get MRO Professional</Cta>;
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Simple pricing for parts paperwork you can trust</h1>
        <p className="text-slate-400">Catch missing signatures and inconsistent certificates before a part reaches your shelf, and give every part a signed history.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <Card key={t.name} className={`flex flex-col gap-4 ${t.highlight ? "border-emerald-600 ring-1 ring-emerald-600" : ""}`}>
            <div>
              <h2 className="text-lg font-medium text-white">{t.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{t.note}</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{t.price}<span className="text-base font-normal text-slate-400">{t.per}</span></p>
            </div>
            <ul className="flex-1 space-y-2 text-sm text-slate-300">
              {t.features.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
            </ul>
            {t.highlight ? proCta : t.cta}
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">Already have an account? Connect your organization first, and the Subscribe button activates your plan automatically after payment.</p>

      <Card className="space-y-2">
        <h2 className="font-medium text-white">Fair use</h2>
        <p className="text-sm text-slate-300">
          MRO Professional includes {L.PRO.checks} certificate checks per month. Part registrations are unlimited within reasonable use (up to {L.PRO.registrations.toLocaleString()} per month).
          If you regularly need more, contact us and we&apos;ll set up a plan that fits. Usage that puts the service at risk for others may be limited.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {faq.map(([q, a]) => (
          <Card key={q}><h3 className="font-medium text-white">{q}</h3><p className="mt-1 text-sm text-slate-400">{a}</p></Card>
        ))}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

const PRO_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ||
  "https://buy.stripe.com/test_REPLACE_ME";

export default function PricingPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 space-y-10">
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pricing
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Documentation integrity and signed audit trails for aircraft parts.
            Not an airworthiness determination.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-semibold">Pilot</h2>
            <p className="mt-2 text-3xl font-bold">
              $0
              <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
              <li>25 parts</li>
              <li>50 certificate checks per month</li>
              <li>Public verify links</li>
              <li>No custody transfers</li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 rounded-lg border border-slate-700 py-2.5 text-center text-sm hover:border-emerald-600"
            >
              Start free
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              Recommended
            </p>
            <h2 className="mt-1 text-lg font-semibold">Pro</h2>
            <p className="mt-2 text-3xl font-bold">
              $499
              <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
              <li>Unlimited parts</li>
              <li>Unlimited certificate checks</li>
              <li>Custody transfer when org is verified</li>
              <li>API key access</li>
            </ul>
            <a
              href={PRO_LINK}
              className="mt-6 rounded-lg bg-emerald-600 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-500"
            >
              Pay with Stripe
            </a>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-semibold">Enterprise</h2>
            <p className="mt-2 text-3xl font-bold">Custom</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
              <li>Dedicated support</li>
              <li>Custom integrations</li>
              <li>Service level agreements</li>
              <li>Optional bring-your-own-key</li>
            </ul>
            <a
              href="mailto:sales@partpassport.example?subject=PartPassport%20Enterprise"
              className="mt-6 rounded-lg border border-slate-700 py-2.5 text-center text-sm hover:border-emerald-600"
            >
              Contact sales
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 text-xs leading-relaxed text-slate-500 space-y-2">
          <p>
            Certificate uploads may be processed by document-analysis tools only
            to extract fields and flag gaps. Do not upload documents you are not
            authorized to process.
          </p>
          <p>
            A completed check or valid hash chain is not approval for
            installation or return to service.
          </p>
        </div>
      </div>
    </main>
  );
}

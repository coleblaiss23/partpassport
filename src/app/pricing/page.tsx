"use client";
import Link from "next/link";

const PRO_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PRO ||
  "https://buy.stripe.com/test_REPLACE_ME";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="text-center space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-500">
            Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Plans for documentation integrity
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Cryptographic audit trails and certificate checks for aviation parts.
            PartPassport does not determine airworthiness — that remains with
            qualified personnel.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col">
            <h2 className="text-lfont-semibold">Pilot</h2>
            <p className="text-3xl font-bold mt-2">
              $0
              <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300 flex-1">
              <li>25 parts in custody</li>
              <li>50 certificate checks per month</li>
              <li>Public verify links</li>
              <li>No custody transfers</li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 inline-block text-center rounded-lg border border-slate-700 py-2.5 text-sm hover:border-emerald-600 transition-colors"
            >
              Continue free
            </Link>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 flex flex-col">
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-1">
              Most popular
            </p>
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="text-3xl font-bold mt-2">
              $499
              <span className="text-sm font-normal text-slate-500"> / month</span>
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300 flex-1">
              <li>Unlimited parts</li>
              <li>Unlimited certificate checks</li>
              <li>Custody transfers (when org is verified)</li>
              <li>API key access</li>
            </ul>
            <a
              href={PRO_LINK}
              className="mt-6 inline-block text-center rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold py-2.5 text-sm transition-colors"
            >
              Upgrade with Stripe
            </a>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col">
            <h2 className="text-lg font-semibold">Enterprise</h2>
            <p className="text-3xl font-bold mt-2">Custom</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300 flex-1">
              <li>Dedicated support</li>
              <li>Custom integrations</li>
              <li>Service level agreements</li>
              <li>Optional bring-your-own-key</li>
            </ul>
            <a
              href="mailto:sales@partpassport.example?subject=PartPassport%20Enterprise"
              className="mt-6 inline-block text-center rounded-lg border border-slate-700 py-2.5 text-sm hover:border-emerald-600 transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 text-xs text-slate-500 space-y-2 leading-relaxed">
          <p>
            <span className="text-slate-300">Fair use.</span> Certificate scanning
            is subject to fair-use limits on Pilot. Pro is intended for production
            shop volume; abusive automation may still be rate-limited.
          </p>
          <p>
            <span className="text-slate-300">Document processing.</span> Uploaded
            certificates may be processed by secure AI or document-analysis
            providers only to extract fields and flag documentation gaps.
          </p>
          <p>
            <span className="text-slate-300">Not airworthiness.</span> A check or
            valid hash chain is not approval for installation or return to service.
          </p>
        </div>
      </div>
    </main>
  );
}

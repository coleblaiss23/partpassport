"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import type { PlanId } from "@/lib/planLimits";
import { DEFAULT_LIMITS as L } from "@/lib/planLimits";

type Tier = {
  id: PlanId;
  name: string;
  price: string;
  per?: string;
  note: string;
  features: string[];
  highlight?: boolean;
  cta: "current" | "checkout" | "contact" | "dashboard";
};

export function PricingMatrix({
  currentPlan,
  orgId,
  mock,
  stripeReady,
  mode = "billing",
}: {
  currentPlan?: string | null;
  orgId?: string | null;
  mock?: boolean;
  stripeReady?: boolean;
  mode?: "billing" | "public";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mockBusy, setMockBusy] = useState<string | null>(null);

  const tiers: Tier[] = [
    {
      id: "PILOT",
      name: "Pilot",
      price: "Free",
      note: "For trying your own certificates",
      features: [
        `${L.PILOT.checks} certificate checks / month`,
        `${L.PILOT.registrations} part registrations / month`,
        "Shareable audit reports",
        "Public verification pages",
      ],
      cta: currentPlan === "PILOT" ? "current" : orgId ? "dashboard" : "checkout",
    },
    {
      id: "PRO",
      name: "MRO Professional",
      price: "$499",
      per: "/month",
      note: "Repair stations, traders, distributors",
      features: [
        `${L.PRO.checks} certificate checks / month`,
        "Unlimited registrations (fair use)",
        "AVL enforcement + bulk vendor import",
        "LLP tracking & custody workflows",
        "UPN / AD monitoring alerts",
        "Encrypted auditor share links",
      ],
      highlight: true,
      cta: currentPlan === "PRO" ? "current" : "checkout",
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise Fleet",
      price: "Custom",
      note: "Typically from $1,999/month",
      features: [
        "Higher check volume (fair use)",
        "API keys for integrations",
        "SLA and SSO on request",
        "Onboarding support",
      ],
      cta: currentPlan === "ENTERPRISE" ? "current" : "contact",
    },
  ];

  async function applyMockPlan(plan: PlanId) {
    setMockBusy(plan);
    setErr("");
    try {
      const r = await fetch("/api/billing/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Could not update plan");
        setMockBusy(null);
        return;
      }
      setSelected(null);
      setMockBusy(null);
      router.push(`/billing?updated=${plan}`);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
      setMockBusy(null);
    }
  }

  async function startCheckout(plan: PlanId) {
    if (plan === "ENTERPRISE") {
      router.push("/request-access?plan=enterprise");
      return;
    }
    if (plan === "PILOT" && !orgId) {
      router.push("/signup?plan=pilot");
      return;
    }
    if (plan === "PILOT" && orgId) {
      router.push("/dashboard");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      const body: { plan: string; companyName?: string } = { plan: "PRO" };
      if (companyName.trim()) body.companyName = companyName.trim();

      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));

      if (r.status === 401 && j.needsCompanyName) {
        setNeedsName(true);
        setErr("Enter your company name to continue.");
        setBusy(false);
        return;
      }
      if (!r.ok || !j.url) {
        setErr(j.error ?? "Checkout failed.");
        setBusy(false);
        return;
      }
      const url = String(j.url);
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }
      setSelected(null);
      router.push(url);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  const sel = selected ? tiers.find((t) => t.id === selected) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((t) => {
          const isCurrent = currentPlan === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setErr("");
                setSelected(t.id);
              }}
              className={`flex flex-col gap-3 rounded-[4px] border p-5 text-left transition ${
                t.highlight ? "border-[#1F6B47]" : "border-[#1F2430]"
              } ${selected === t.id ? "bg-[#161B24]" : "bg-[#12151C] hover:border-[#B0B6C3]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white">{t.name}</h3>
                  <p className="mt-1 text-xs text-[#B0B6C3]">{t.note}</p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 rounded-[4px] border border-[#1F6B47] bg-[#14281F] px-2 py-0.5 text-[10px] font-semibold text-white">
                    CURRENT
                  </span>
                )}
              </div>
              <p className="text-3xl font-semibold text-white">
                {t.price}
                {t.per ? <span className="text-sm font-normal text-[#B0B6C3]">{t.per}</span> : null}
              </p>
              <ul className="flex-1 space-y-1.5 text-sm text-[#B0B6C3]">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <span className="text-xs font-medium text-[#B0B6C3]">
                {isCurrent ? "Selected plan" : "Select to continue →"}
              </span>
            </button>
          );
        })}
      </div>

      {sel && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-summary-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-md border border-[#222A3B] bg-[#0B0F14] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#7C8495]">Payment summary</p>
                <h2 id="payment-summary-title" className="mt-1 text-xl font-semibold text-white">
                  {sel.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-[#B0B6C3] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 border border-[#1F2430] bg-[#12151C] p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#B0B6C3]">Plan</span>
                <span className="text-sm font-medium text-white">{sel.name}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-[#1F2430] pt-2">
                <span className="text-sm text-[#B0B6C3]">Amount</span>
                <span className="text-2xl font-semibold text-white">
                  {sel.price}
                  {sel.per ? <span className="text-sm font-normal text-[#B0B6C3]">{sel.per}</span> : null}
                </span>
              </div>
            </div>

            {mock && mode === "billing" && sel.id !== "ENTERPRISE" && (
              <div className="mt-4 border border-[#B45309] bg-[#1C1408] p-3 text-xs text-[#FFEDD5]">
                Local billing mock — selecting a plan updates your org without Stripe. Payment
                inputs stay separate from plan tiers.
              </div>
            )}

            {!mock && !stripeReady && sel.cta === "checkout" && sel.id === "PRO" && (
              <p className="mt-4 text-xs text-[#FFE4E6]">
                Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_PRO, or enable
                BILLING_DEV_MOCK=1.
              </p>
            )}

            {needsName && (
              <div className="mt-4 space-y-1">
                <label className="text-xs font-medium text-[#B0B6C3]">
                  Company / Repair Station Name
                </label>
                <input
                  className={inputCls}
                  placeholder="e.g. Apex Aero Repair"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoFocus
                  disabled={busy}
                />
              </div>
            )}

            {err && <p className="mt-3 text-xs text-[#FFE4E6]">{err}</p>}

            <div className="mt-5 space-y-2">
              {sel.cta === "current" && (
                <p className="text-center text-sm text-[#B0B6C3]">This is your current plan.</p>
              )}
              {sel.cta === "contact" && (
                <Link href="/request-access?plan=enterprise" className={`${btnPrimary} w-full`}>
                  Contact sales
                </Link>
              )}
              {sel.cta === "dashboard" && (
                <Link href="/dashboard" className={`${btnPrimary} w-full`}>
                  Go to dashboard
                </Link>
              )}
              {sel.cta === "checkout" && mock && mode === "billing" && (
                <button
                  type="button"
                  disabled={mockBusy !== null}
                  onClick={() => applyMockPlan(sel.id)}
                  className={`${btnPrimary} w-full text-base`}
                >
                  {mockBusy === sel.id ? "Applying…" : `Switch to ${sel.name}`}
                </button>
              )}
              {sel.cta === "checkout" && !(mock && mode === "billing") && (
                <button
                  type="button"
                  disabled={busy || (!stripeReady && sel.id === "PRO" && !mock)}
                  onClick={() => startCheckout(sel.id)}
                  className={`${btnPrimary} w-full text-base`}
                >
                  {busy
                    ? "Working…"
                    : sel.id === "PILOT"
                      ? "Start free Pilot"
                      : "Continue to payment"}
                </button>
              )}
              <button type="button" onClick={() => setSelected(null)} className={`${btnSecondary} w-full`}>
                Back to plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

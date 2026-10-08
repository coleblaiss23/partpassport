"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import type { PlanId } from "@/lib/planLimits";
import { normalizePlanId } from "@/lib/planLimits";

type Tier = {
  id: PlanId;
  name: string;
  price: string;
  per?: string;
  note: string;
  features: string[];
  highlight?: boolean;
  cta: "current" | "checkout" | "contact";
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
  const current = normalizePlanId(currentPlan);
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [mockBusy, setMockBusy] = useState<string | null>(null);

  const tiers: Tier[] = [
    {
      id: "STARTER",
      name: "Starter",
      price: "$299",
      per: "/month",
      note: "Part 135 operators & flight schools getting started",
      features: [
        "Up to 5 aircraft tails",
        "Automated AD alerts",
        "Safety flag lookups",
        "Basic fleet tracking",
        "14-day trial available",
      ],
      cta: current === "STARTER" ? "current" : "checkout",
    },
    {
      id: "PROFESSIONAL",
      name: "Professional",
      price: "$599",
      per: "/month",
      note: "Unlimited fleet + OCR & compliance reports",
      features: [
        "Unlimited tail numbers",
        "Full-text AD applicability parsing",
        "Logbook / invoice OCR scanning",
        "Compliance audit reports",
        "Work order support",
      ],
      highlight: true,
      cta: current === "PROFESSIONAL" ? "current" : "checkout",
    },
    {
      id: "ENTERPRISE",
      name: "Enterprise / MRO Shop",
      price: "$899",
      per: "/month",
      note: "Multi-shop operations & Stripe invoicing",
      features: [
        "Multi-shop management",
        "Mechanic certificate tracking",
        "Custom work orders",
        "Stripe invoicing",
        "API webhooks",
      ],
      cta: current === "ENTERPRISE" ? "current" : "checkout",
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
    setBusy(true);
    setErr("");
    try {
      const body: { plan: string; companyName?: string } = { plan };
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
      <div className="grid border border-[#3d3d3d] md:grid-cols-3">
        {tiers.map((t) => {
          const isCurrent = current === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setErr("");
                setSelected(t.id);
              }}
              className={`relative flex flex-col gap-4 border-b border-[#3d3d3d] p-6 text-left transition-colors last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${
                t.highlight ? "bg-[#141210] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[#c4893a]" : "bg-[#0a0a0a]"
              } ${selected === t.id ? "bg-[#171717]" : "hover:bg-[#141414]"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-3xl font-normal text-[#f4f1ea]">{t.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#c8c2b8]">{t.note}</p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 rounded-[4px] border border-[#1F6B47] bg-[#14281F] px-2 py-0.5 text-[10px] font-semibold text-white">
                    CURRENT
                  </span>
                )}
              </div>
              <p className="font-display text-5xl text-[#f4f1ea]">
                {t.price}
                {t.per ? <span className="font-sans text-sm font-normal text-[#8d877e]">{t.per}</span> : null}
              </p>
              <ul className="flex-1 space-y-1.5 text-sm text-[#c8c2b8]">
                {t.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#8d877e]">
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
          <div className="w-full max-w-md border border-[#3d3d3d] bg-[#0a0a0a] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#8d877e]">Payment summary</p>
                <h2 id="payment-summary-title" className="mt-1 text-xl font-semibold text-white">
                  {sel.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-[#c8c2b8] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 border border-[#2c2c2c] bg-[#111111] p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#c8c2b8]">Plan</span>
                <span className="text-sm font-medium text-white">{sel.name}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-[#2c2c2c] pt-2">
                <span className="text-sm text-[#c8c2b8]">Amount</span>
                <span className="text-2xl font-semibold text-white">
                  {sel.price}
                  {sel.per ? <span className="text-sm font-normal text-[#c8c2b8]">{sel.per}</span> : null}
                </span>
              </div>
            </div>

            {mock && mode === "billing" && (
              <div className="mt-4 border border-[#B45309] bg-[#1C1408] p-3 text-xs text-[#FFEDD5]">
                Local billing mock — selecting a plan updates your org without Stripe. Payment
                inputs stay separate from plan tiers.
              </div>
            )}

            {!mock && !stripeReady && sel.cta === "checkout" && (
              <p className="mt-4 text-xs text-[#FFE4E6]">
                Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_* ids, or enable
                BILLING_DEV_MOCK=1.
              </p>
            )}

            {needsName && (
              <div className="mt-4 space-y-1">
                <label className="text-xs font-medium text-[#c8c2b8]">
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
                <p className="text-center text-sm text-[#c8c2b8]">This is your current plan.</p>
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
                  disabled={busy || (!stripeReady && !mock && !orgId)}
                  onClick={() => {
                    if (!orgId && !companyName.trim()) {
                      setNeedsName(true);
                      setErr("Enter your company name to continue.");
                      return;
                    }
                    startCheckout(sel.id);
                  }}
                  className={`${btnPrimary} w-full text-base`}
                >
                  {busy ? "Working…" : "Continue to payment"}
                </button>
              )}
              {!orgId && mode === "public" && (
                <Link href={`/signup?plan=${sel.id.toLowerCase()}`} className={`${btnSecondary} w-full`}>
                  Or start with signup
                </Link>
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

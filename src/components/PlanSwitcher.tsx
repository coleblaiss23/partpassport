"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary } from "@/components/ui";
import type { PlanId } from "@/lib/planLimits";
import { DEFAULT_LIMITS } from "@/lib/planLimits";

const OPTIONS: { plan: PlanId; label: string; blurb: string }[] = [
  {
    plan: "STARTER",
    label: `Starter ($${DEFAULT_LIMITS.STARTER.priceMonthly}/mo)`,
    blurb: "Up to 5 tails, AD alerts, basic safety flags.",
  },
  {
    plan: "PROFESSIONAL",
    label: `Professional ($${DEFAULT_LIMITS.PROFESSIONAL.priceMonthly}/mo)`,
    blurb: "Unlimited fleet, OCR, full-text AD parsing.",
  },
  {
    plan: "ENTERPRISE",
    label: `Enterprise ($${DEFAULT_LIMITS.ENTERPRISE.priceMonthly}/mo)`,
    blurb: "Multi-shop, work orders, Stripe invoicing, webhooks.",
  },
];

export function PlanSwitcher({ currentPlan }: { currentPlan?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function switchPlan(plan: PlanId) {
    setBusy(plan);
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
        setBusy(null);
        return;
      }
      router.refresh();
      setBusy(null);
    } catch {
      setErr("Network error");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {OPTIONS.map((o) => (
        <div
          key={o.plan}
          className="flex flex-wrap items-center justify-between gap-3 border border-[#2c2c2c] bg-[#111111] p-3"
        >
          <div>
            <p className="text-sm font-medium text-white">{o.label}</p>
            <p className="text-xs text-[#8d877e]">{o.blurb}</p>
          </div>
          {currentPlan === o.plan ? (
            <span className="text-xs text-[#1F6B47]">Current</span>
          ) : (
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => switchPlan(o.plan)}
              className={btnSecondary}
            >
              {busy === o.plan ? "…" : "Select"}
            </button>
          )}
        </div>
      ))}
      {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
      <a href="/checkout?plan=PROFESSIONAL" className={btnPrimary}>
        Open checkout
      </a>
    </div>
  );
}

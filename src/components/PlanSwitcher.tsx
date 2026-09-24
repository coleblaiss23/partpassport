"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, btnSecondary } from "@/components/ui";
import type { PlanId } from "@/lib/planLimits";

const OPTIONS: { plan: PlanId; label: string; blurb: string }[] = [
  { plan: "PILOT", label: "Pilot (Free)", blurb: "Try certificate checks with monthly limits." },
  { plan: "PRO", label: "MRO Professional", blurb: "Higher check volume for shops and traders." },
  { plan: "ENTERPRISE", label: "Enterprise Fleet", blurb: "Custom volume for fleets and networks." },
];

export function PlanSwitcher({ currentPlan }: { currentPlan: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function setPlan(plan: PlanId) {
    if (plan === currentPlan) return;
    setBusy(plan);
    setErr("");
    setOk("");
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
      setOk(`Plan updated to ${plan}.`);
      setBusy(null);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Local billing mock — change plans in the browser without Stripe.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const active = o.plan === currentPlan;
          return (
            <button
              key={o.plan}
              type="button"
              disabled={busy !== null || active}
              onClick={() => setPlan(o.plan)}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? "border-emerald-600 bg-emerald-950/40"
                  : "border-slate-700 bg-slate-900/40 hover:border-slate-500"
              } disabled:opacity-60`}
            >
              <div className="text-sm font-semibold text-white">{o.label}</div>
              <p className="mt-1 text-xs text-slate-400">{o.blurb}</p>
              <span className={`mt-3 inline-block text-xs ${active ? "text-emerald-400" : "text-slate-300"}`}>
                {busy === o.plan ? "Updating…" : active ? "Current plan" : "Select"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="/checkout?plan=PRO" className={btnPrimary}>
          Go to checkout
        </a>
        <a href="/pricing" className={btnSecondary}>
          View pricing
        </a>
      </div>
      {err && <p className="text-xs text-rose-400">{err}</p>}
      {ok && <p className="text-xs text-emerald-400">{ok}</p>}
    </div>
  );
}

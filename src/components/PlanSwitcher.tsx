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
 <p className="text-sm text-[#B0B6C3]">
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
 className={`rounded-[4px] border p-4 text-left transition ${
 active
 ? "border-[#1F6B47] bg-[#14281F]"
 : "border-[#222A3B] bg-[#12151C] hover:border-[#B0B6C3]"
 } disabled:opacity-60`}
 >
 <div className="text-sm font-semibold text-white">{o.label}</div>
 <p className="mt-1 text-xs text-[#B0B6C3]">{o.blurb}</p>
 <span className={`mt-3 inline-block text-xs ${active ? "text-[#1F6B47]" : "text-[#B0B6C3]"}`}>
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
 {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
 {ok && <p className="text-xs text-[#1F6B47]">{ok}</p>}
 </div>
 );
}

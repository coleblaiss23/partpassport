"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams.get("plan") ?? "PRO").toUpperCase();
  const success = searchParams.get("success") === "1";
  const isPilot = plan === "PILOT";
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [needsName, setNeedsName] = useState(false);

  async function startCheckout(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const body: { plan: string; companyName?: string } = { plan: isPilot ? "PILOT" : "PRO" };
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
      router.push(url);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (success) {
    return (
      <Card className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white">You&apos;re on MRO Professional</h1>
        <p className="text-sm text-slate-400">
          {searchParams.get("dev") === "1"
            ? "Local billing mock applied this upgrade (no Stripe charge)."
            : "Your subscription is active."}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/dashboard" className={btnPrimary}>
            Go to dashboard
          </Link>
          <Link href="/billing" className={btnSecondary}>
            Manage billing
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold text-white">
          {isPilot ? "Start free Pilot" : "Checkout — MRO Professional"}
        </h1>
        <p className="text-sm text-slate-400">
          {isPilot
            ? "Create your organization and open the dashboard."
            : "Confirm purchase. In development this uses the billing mock when Stripe keys are unset."}
        </p>
      </div>

      <form onSubmit={startCheckout} className="space-y-4">
        {needsName && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Company / Repair Station Name</label>
            <input
              className={inputCls}
              placeholder="e.g. Apex Aero Repair"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
              disabled={busy}
              required
            />
          </div>
        )}
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? "Working…" : isPilot ? "Start free" : "Upgrade now"}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        No account yet?{" "}
        <Link href={`/signup?plan=${isPilot ? "pilot" : "pro"}`} className="text-emerald-400 hover:underline">
          Sign up
        </Link>
        {" · "}
        <Link href="/billing" className="text-emerald-400 hover:underline">
          Billing
        </Link>
      </p>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <Suspense fallback={<Card className="p-6 text-sm text-slate-400">Loading checkout…</Card>}>
        <CheckoutForm />
      </Suspense>
    </main>
  );
}

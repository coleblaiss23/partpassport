"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { PricingMatrix } from "@/components/PricingMatrix";

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
      const body: { plan: string; companyName?: string } = {
        plan: isPilot ? "PILOT" : "PRO",
      };
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
        <p className="text-sm text-[#B0B6C3]">
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
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Checkout</h1>
        <p className="text-sm text-[#B0B6C3]">
          Confirm your plan below. Payment details stay on the next step — not mixed into the
          pricing matrix.
        </p>
      </div>

      <PricingMatrix mode="public" stripeReady />

      <Card className="mx-auto max-w-md space-y-4">
        <h2 className="text-sm font-semibold text-white">
          {isPilot ? "Start free Pilot" : "Payment summary — MRO Professional"}
        </h2>
        <form onSubmit={startCheckout} className="space-y-4">
          {needsName && (
            <div className="space-y-1">
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
                required
              />
            </div>
          )}
          {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full text-base`}>
            {busy ? "Working…" : isPilot ? "Start free" : "Continue to payment"}
          </button>
        </form>
        <p className="text-center text-xs text-[#7C8495]">
          No account yet?{" "}
          <Link
            href={`/signup?plan=${isPilot ? "pilot" : "pro"}`}
            className="text-[#1F6B47] hover:underline"
          >
            Sign up
          </Link>
          {" · "}
          <Link href="/billing" className="text-[#1F6B47] hover:underline">
            Billing
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Suspense fallback={<Card className="p-6 text-sm text-[#B0B6C3]">Loading checkout…</Card>}>
        <CheckoutForm />
      </Suspense>
    </main>
  );
}

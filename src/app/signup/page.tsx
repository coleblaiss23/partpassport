"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, btnPrimary, inputCls } from "@/components/ui";
import { DEFAULT_LIMITS, normalizePlanId } from "@/lib/planLimits";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = normalizePlanId(searchParams.get("plan"));
  const planName = DEFAULT_LIMITS[plan].name;
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (trimmed.length < 2) {
      setErr("Please enter a valid company or shop name.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: trimmed, plan }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) {
        setErr(j.error ?? "Could not initialize account session.");
        setBusy(false);
        return;
      }
      const url = String(j.url);
      if (url.startsWith("http://") || url.startsWith("https://")) {
        window.location.href = url;
        return;
      }
      router.push(url.startsWith("/") ? url : `/${url}`);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold text-white">Create your organization</h1>
        <p className="text-sm text-[#c8c2b8]">
          Get started on {planName} (${DEFAULT_LIMITS[plan].priceMonthly}/mo). Includes a 14-day
          trial window.
        </p>
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#c8c2b8]">Company / Repair Station Name</label>
          <input
            className={inputCls}
            placeholder="e.g. Apex Aero Repair"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoFocus
            disabled={busy}
          />
        </div>
        {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? "Setting up..." : "Continue to Payment"}
        </button>
      </form>
      <div className="text-center">
        <a href="/connect" className="text-xs text-[#c8c2b8] hover:text-white">
          Already have an API key or existing org? Connect here
        </a>
      </div>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Suspense fallback={<Card className="w-full p-6 text-sm text-[#c8c2b8]">Loading…</Card>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}

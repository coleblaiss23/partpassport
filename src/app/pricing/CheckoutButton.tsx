"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary } from "@/components/ui";

export function CheckoutButton({ orgId }: { orgId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleClick() {
    if (!orgId) {
      router.push("/signup?plan=professional");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "PROFESSIONAL" }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) {
        const url = String(j.url);
        if (url.startsWith("http://") || url.startsWith("https://")) {
          window.location.href = url;
          return;
        }
        router.push(url);
        router.refresh();
        return;
      }
      setErr(j.error ?? "Checkout is unavailable right now.");
      setBusy(false);
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" onClick={handleClick} disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Starting…" : "Get Professional"}
      </button>
      {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
      <a
        href="/checkout?plan=PROFESSIONAL"
        className="block text-center text-xs text-[#8d877e] hover:text-[#c8c2b8]"
      >
        Open checkout page
      </a>
    </div>
  );
}

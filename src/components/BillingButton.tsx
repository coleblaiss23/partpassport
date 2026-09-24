"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnSecondary } from "./ui";

export default function BillingButton() {
 const router = useRouter();
 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState("");
 async function open() {
 setBusy(true);
 setErr("");
 const r = await fetch("/api/billing/portal", { method: "POST" });
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
 setErr(j.error ?? "Could not open billing");
 setBusy(false);
 }
 return (
 <div className="space-y-1">
 <button onClick={open} disabled={busy} className={`${btnSecondary} w-full`}>
 {busy ? "Opening…" : "Manage billing and invoices"}
 </button>
 {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
 </div>
 );
}

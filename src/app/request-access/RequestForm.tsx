"use client";
import { useState } from "react";
import { Card, Field, PageHeader, btnPrimary, inputCls } from "@/components/ui";

const VOLUMES = ["Under 50", "50 to 200", "200 to 1,000", "Over 1,000"];

export default function RequestForm({ source }: { source?: string }) {
 const [f, setF] = useState({ name: "", email: "", company: "", role: "", volume: "", message: "", website: "", source: source ?? "" });
 const [state, setState] = useState<"idle" | "busy" | "done">("idle");
 const [err, setErr] = useState("");
 const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });


 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setState("busy"); setErr("");
 const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }).catch(() => null);
 const j = await r?.json().catch(() => ({}));
 if (r?.ok) setState("done"); else { setErr(j?.error ?? "Something went wrong. Please try again."); setState("idle"); }
 }

 if (state === "done")
 return (
 <main className="mx-auto max-w-xl px-4 py-16">
 <Card className="space-y-2 text-center"><h1 className="text-2xl font-semibold text-white">Thanks, we&apos;ll be in touch</h1><p className="text-[#B0B6C3]">We&apos;ll email you within one business day to set up your account.</p></Card>
 </main>
 );

 return (
 <main className="mx-auto max-w-xl space-y-6 px-4 py-10">
 <PageHeader title="Request access" subtitle="Tell us a little about your shop and we'll set up your account." />
 <Card>
 <form onSubmit={submit} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="Name"><input className={inputCls} value={f.name} onChange={set("name")} required /></Field>
 <Field label="Work email"><input className={inputCls} type="email" value={f.email} onChange={set("email")} required /></Field>
 <Field label="Company"><input className={inputCls} value={f.company} onChange={set("company")} required /></Field>
 <Field label="Role"><input className={inputCls} placeholder="e.g. Quality manager" value={f.role} onChange={set("role")} /></Field>
 </div>
 <Field label="Certificates you review per month">
 <select className={inputCls} value={f.volume} onChange={set("volume")}><option value="">Select…</option>{VOLUMES.map((v) => <option key={v}>{v}</option>)}</select>
 </Field>
 <Field label="Anything we should know?"><textarea className={inputCls} rows={3} value={f.message} onChange={set("message")} /></Field>
 <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} className="hidden" aria-hidden />
 {err && <p className="rounded-[4px] border border-[#9F1239] bg-[#1A0A10] p-3 text-sm text-[#FFE4E6]">{err}</p>}
 <button className={btnPrimary} disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Request access"}</button>
 </form>
 </Card>
 </main>
 );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

type Initial = { pn?: string; sn?: string; desc?: string; cert?: string };
type Created = { part: { id: string; partNumber: string; serialNumber: string } };

export default function PartForm({ initial }: { initial: Initial }) {
 const { signedPost } = useVault();
 const [f, setF] = useState({
 partNumber: initial.pn ?? "",
 serialNumber: initial.sn ?? "",
 description: initial.desc ?? "",
 certificateHash: initial.cert ?? "",
 birthCertificateHash: initial.cert ?? "",
 isLifeLimited: false,
 totalTimeHours: "",
 totalCycles: "",
 lifeLimitHours: "",
 lifeLimitCycles: "",
 });
 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState("");
 const [done, setDone] = useState<{ id: string; verify: string } | null>(null);
 const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
 setF({ ...f, [k]: e.target.value });

 async function submit(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setErr("");
 setDone(null);
 try {
 const payload: Record<string, unknown> = {
 partNumber: f.partNumber,
 serialNumber: f.serialNumber,
 description: f.description || null,
 certificateHash: f.certificateHash || null,
 birthCertificateHash: f.birthCertificateHash || f.certificateHash || null,
 isLifeLimited: f.isLifeLimited,
 };
 if (f.isLifeLimited) {
 payload.totalTimeHours = f.totalTimeHours === "" ? null : Number(f.totalTimeHours);
 payload.totalCycles = f.totalCycles === "" ? null : Number(f.totalCycles);
 payload.lifeLimitHours = f.lifeLimitHours === "" ? null : Number(f.lifeLimitHours);
 payload.lifeLimitCycles = f.lifeLimitCycles === "" ? null : Number(f.lifeLimitCycles);
 }
 const r = await signedPost<Created>(
 "/api/parts/prepare",
 "/api/parts",
 payload
 );
 setDone({
 id: r.part.id,
 verify: `/verify/${encodeURIComponent(r.part.partNumber)}/${encodeURIComponent(r.part.serialNumber)}`,
 });
 } catch (x) {
 setErr((x as Error).message);
 }
 setBusy(false);
 }

 return (
 <Card>
 <form onSubmit={submit} className="space-y-4">
 <div className="grid gap-4 sm:grid-cols-2">
 <Field label="Part number">
 <input className={`${inputCls} pp-track`} value={f.partNumber} onChange={set("partNumber")} required />
 </Field>
 <Field label="Serial number">
 <input className={`${inputCls} pp-track`} value={f.serialNumber} onChange={set("serialNumber")} required />
 </Field>
 </div>
 <Field label="Description">
 <input className={inputCls} value={f.description} onChange={set("description")} />
 </Field>
 <Field
 label="Certificate file hash (optional)"
 hint="Filled automatically when you come from the certificate check."
 >
 <input className={`${inputCls} pp-track`} value={f.certificateHash} onChange={set("certificateHash")} />
 </Field>
 <Field
 label="Digital birth certificate hash (optional)"
 hint="Manufacture / first-release file hash for LLP genealogy. Defaults to the certificate hash when set."
 >
 <input
 className={`${inputCls} pp-track`}
 value={f.birthCertificateHash}
 onChange={set("birthCertificateHash")}
 />
 </Field>

 <p className="text-xs text-[#7C8495]">
 New parts enter <span className="text-white">Quarantine</span> custody. Assign to Serviceable
 shelf from Operations → Custody after inspection.
 </p>

 <div className="border border-[#1F2430] bg-[#0B0F14] p-3 space-y-3">
 <label className="flex items-center gap-2 text-sm text-white">
 <input
 type="checkbox"
 checked={f.isLifeLimited}
 onChange={(e) => setF({ ...f, isLifeLimited: e.target.checked })}
 className="border-[#1F2430]"
 />
 Life-limited / serialized assembly (track time &amp; cycles)
 </label>
 <p className="text-xs text-[#7C8495]">
 Component genealogy: record total time and cycles so expired units cannot be
 recorded as installed.
 </p>
 {f.isLifeLimited && (
 <div className="grid gap-3 sm:grid-cols-2">
 <Field label="Total time (hours)">
 <input
 type="number"
 min={0}
 step="0.1"
 className={`${inputCls} pp-track`}
 value={f.totalTimeHours}
 onChange={set("totalTimeHours")}
 />
 </Field>
 <Field label="Total cycles">
 <input
 type="number"
 min={0}
 step={1}
 className={`${inputCls} pp-track`}
 value={f.totalCycles}
 onChange={set("totalCycles")}
 />
 </Field>
 <Field label="Life limit (hours)">
 <input
 type="number"
 min={0}
 step="0.1"
 className={`${inputCls} pp-track`}
 value={f.lifeLimitHours}
 onChange={set("lifeLimitHours")}
 />
 </Field>
 <Field label="Life limit (cycles)">
 <input
 type="number"
 min={0}
 step={1}
 className={`${inputCls} pp-track`}
 value={f.lifeLimitCycles}
 onChange={set("lifeLimitCycles")}
 />
 </Field>
 </div>
 )}
 </div>

 {err && (
 <p className="border border-[#9F1239] bg-[#1A0A10] p-3 text-sm text-[#FFE4E6]">{err}</p>
 )}
 <button className={btnPrimary} disabled={busy}>
 {busy ? "Signing…" : "Register and sign passport"}
 </button>
 </form>
 {done && (
 <div className="mt-5 space-y-3 border-t border-[#1F2430] pt-4">
 <p className="text-sm text-white">Passport registered and signed.</p>
 <p className="break-all text-xs text-[#B0B6C3]">
 Part ID: <span className="pp-track text-white">{done.id}</span>
 </p>
 <div className="flex flex-wrap gap-2">
 <Link href={done.verify} className={btnPrimary}>
 View verification page
 </Link>
 <Link href={`/dashboard/events/new?partId=${done.id}`} className={btnSecondary}>
 Add a lifecycle event
 </Link>
 </div>
 </div>
 )}
 </Card>
 );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

type Initial = { pn?: string; sn?: string; desc?: string; cert?: string };
type Created = { part: { id: string; partNumber: string; serialNumber: string } };

export default function PartForm({ initial }: { initial: Initial }) {
  const { signedPost } = useVault();
  const [f, setF] = useState({ partNumber: initial.pn ?? "", serialNumber: initial.sn ?? "", description: initial.desc ?? "", certificateHash: initial.cert ?? "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: string; verify: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setDone(null);
    try {
      const r = await signedPost<Created>("/api/parts/prepare", "/api/parts", { ...f, description: f.description || null, certificateHash: f.certificateHash || null });
      setDone({ id: r.part.id, verify: `/verify/${encodeURIComponent(r.part.partNumber)}/${encodeURIComponent(r.part.serialNumber)}` });
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Part number"><input className={`${inputCls} font-mono`} value={f.partNumber} onChange={set("partNumber")} required /></Field>
          <Field label="Serial number"><input className={`${inputCls} font-mono`} value={f.serialNumber} onChange={set("serialNumber")} required /></Field>
        </div>
        <Field label="Description"><input className={inputCls} value={f.description} onChange={set("description")} /></Field>
        <Field label="Certificate file hash (optional)" hint="Filled automatically when you come from the certificate check."><input className={`${inputCls} font-mono`} value={f.certificateHash} onChange={set("certificateHash")} /></Field>
        {err && <p className="rounded-md border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-300">{err}</p>}
        <button className={btnPrimary} disabled={busy}>{busy ? "Signing…" : "Register and sign passport"}</button>
      </form>
      {done && (
        <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
          <p className="text-sm text-emerald-300">Passport registered and signed.</p>
          <p className="break-all text-xs text-slate-400">Part ID: <span className="font-mono text-slate-200">{done.id}</span></p>
          <div className="flex flex-wrap gap-2">
            <Link href={done.verify} className={btnPrimary}>View verification page</Link>
            <Link href={`/dashboard/events/new?partId=${done.id}`} className={btnSecondary}>Add a lifecycle event</Link>
          </div>
        </div>
      )}
    </Card>
  );
}

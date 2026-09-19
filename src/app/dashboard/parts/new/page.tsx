"use client";
import { useState } from "react";
import Link from "next/link";
import { prepareSignCommit } from "@/lib/signedFlow";
import { Button, Field, Shell, inputClass } from "../../ui";

export default function NewPartPage() {
  const [f, setF] = useState({ apiKey: "", privateKey: "", partNumber: "", serialNumber: "", description: "", certificateHash: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; verify: string } | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in your browser..."); setDone(null); setBusy(true);
    try {
      const r = await prepareSignCommit({
        apiKey: f.apiKey, privateKey: f.privateKey, prepareUrl: "/api/parts/prepare", commitUrl: "/api/parts",
        body: { partNumber: f.partNumber, serialNumber: f.serialNumber, description: f.description || null, certificateHash: f.certificateHash || null },
      });
      setStatus("Registered and signed.");
      setDone({ id: r.part.id, verify: `/verify/${encodeURIComponent(r.part.partNumber)}/${encodeURIComponent(r.part.serialNumber)}` });
    } catch (err) { setStatus(`ERROR: ${(err as Error).message}`); }
    setBusy(false);
  }

  return (
    <Shell tag="PART_REGISTRATION" title="Register Part">
      <form onSubmit={submit} className="space-y-4">
        <Field label="API key"><input className={inputClass} type="password" value={f.apiKey} onChange={set("apiKey")} required /></Field>
        <Field label="Private key (stays in this browser)"><textarea className={inputClass} rows={3} autoComplete="off" value={f.privateKey} onChange={set("privateKey")} required /></Field>
        <Field label="Part number"><input className={inputClass} value={f.partNumber} onChange={set("partNumber")} required /></Field>
        <Field label="Serial number"><input className={inputClass} value={f.serialNumber} onChange={set("serialNumber")} required /></Field>
        <Field label="Description"><input className={inputClass} value={f.description} onChange={set("description")} /></Field>
        <Field label="Certificate SHA-256 (optional)"><input className={inputClass} value={f.certificateHash} onChange={set("certificateHash")} /></Field>
        <Button disabled={busy}>{busy ? "SIGNING..." : "SIGN_AND_REGISTER"}</Button>
      </form>
      {status && <p className={`text-xs font-mono break-all ${status.startsWith("ERROR") ? "text-rose-400" : "text-slate-300"}`}>{status}</p>}
      {done && (
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <p className="text-xs font-mono text-slate-400 break-all">Part ID: <span className="text-white">{done.id}</span></p>
          <div className="grid grid-cols-1 gap-2">
            <Link href={done.verify} className="block text-center bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs py-2.5 rounded">VIEW_VERIFICATION_PAGE</Link>
            <Link href={`/dashboard/events/new?partId=${done.id}`} className="block text-center border border-slate-700 hover:border-emerald-500 text-slate-200 font-mono text-xs py-2.5 rounded">ADD_AN_EVENT_TO_THIS_PART</Link>
          </div>
        </div>
      )}
    </Shell>
  );
}

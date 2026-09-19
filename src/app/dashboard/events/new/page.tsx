"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { prepareSignCommit } from "@/lib/signedFlow";
import { Button, Field, Shell, inputClass } from "../../ui";

const TYPES = ["INSPECTED", "REPAIRED", "OVERHAULED", "INSTALLED", "REMOVED", "SOLD", "TRANSFERRED", "SCRAPPED"];

export default function NewEventPage() {
  const [f, setF] = useState({ apiKey: "", privateKey: "", partId: "", eventType: "INSPECTED", notes: "", toOrganizationId: "", certificateHash: "" });
  const [status, setStatus] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const transfer = f.eventType === "SOLD" || f.eventType === "TRANSFERRED";

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("partId");
    if (id) setF((p) => ({ ...p, partId: id }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in your browser..."); setOk(false); setBusy(true);
    try {
      const data: Record<string, string> = { notes: f.notes };
      if (transfer) data.toOrganizationId = f.toOrganizationId;
      await prepareSignCommit({
        apiKey: f.apiKey, privateKey: f.privateKey, prepareUrl: `/api/parts/${f.partId}/events/prepare`,
        commitUrl: `/api/parts/${f.partId}/events`,
        body: { eventType: f.eventType, data, certificateHash: f.certificateHash || null },
      });
      setStatus("Event signed and added to the part's history."); setOk(true);
    } catch (err) { setStatus(`ERROR: ${(err as Error).message}`); }
    setBusy(false);
  }

  return (
    <Shell tag="LIFECYCLE_EVENT" title="Append Lifecycle Event">
      <form onSubmit={submit} className="space-y-4">
        <Field label="API key"><input className={inputClass} type="password" value={f.apiKey} onChange={set("apiKey")} required /></Field>
        <Field label="Private key (stays in this browser)"><textarea className={inputClass} rows={3} autoComplete="off" value={f.privateKey} onChange={set("privateKey")} required /></Field>
        <Field label="Part ID"><input className={inputClass} value={f.partId} onChange={set("partId")} required /></Field>
        <Field label="Event type">
          <select className={inputClass} value={f.eventType} onChange={set("eventType")}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        {transfer && <Field label="Destination organization ID"><input className={inputClass} value={f.toOrganizationId} onChange={set("toOrganizationId")} required /></Field>}
        <Field label="Notes"><input className={inputClass} value={f.notes} onChange={set("notes")} /></Field>
        <Field label="Certificate SHA-256 (optional)"><input className={inputClass} value={f.certificateHash} onChange={set("certificateHash")} /></Field>
        <Button disabled={busy}>{busy ? "SIGNING..." : "SIGN_AND_APPEND"}</Button>
      </form>
      {status && <p className={`text-xs font-mono break-all ${status.startsWith("ERROR") ? "text-rose-400" : "text-emerald-400"}`}>{status}</p>}
      {ok && <Link href="/dashboard" className="block text-center border border-slate-700 hover:border-emerald-500 text-slate-200 font-mono text-xs py-2.5 rounded">BACK_TO_DASHBOARD</Link>}
    </Shell>
  );
}

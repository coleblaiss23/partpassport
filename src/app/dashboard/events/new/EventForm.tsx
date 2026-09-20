"use client";
import { useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

const TYPES = [
  ["INSPECTED", "Inspected"], ["REPAIRED", "Repaired"], ["OVERHAULED", "Overhauled"], ["INSTALLED", "Installed"],
  ["REMOVED", "Removed"], ["SOLD", "Sold (transfers custody)"], ["TRANSFERRED", "Transferred (transfers custody)"], ["SCRAPPED", "Scrapped (final)"],
];

export default function EventForm({ partId }: { partId?: string }) {
  const { signedPost } = useVault();
  const [f, setF] = useState({ partId: partId ?? "", eventType: "INSPECTED", notes: "", toOrganizationId: "", certificateHash: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const transfer = f.eventType === "SOLD" || f.eventType === "TRANSFERRED";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setOk(false);
    try {
      const data: Record<string, string> = { notes: f.notes };
      if (transfer) data.toOrganizationId = f.toOrganizationId.trim();
      const id = f.partId.trim();
      await signedPost(`/api/parts/${id}/events/prepare`, `/api/parts/${id}/events`, { eventType: f.eventType, data, certificateHash: f.certificateHash || null });
      setOk(true);
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Part ID" hint="Shown after you register a part."><input className={`${inputCls} font-mono`} value={f.partId} onChange={set("partId")} required /></Field>
        <Field label="Event type"><select className={inputCls} value={f.eventType} onChange={set("eventType")}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        {transfer && <Field label="Destination organization ID" hint="The receiving organization's ID."><input className={`${inputCls} font-mono`} value={f.toOrganizationId} onChange={set("toOrganizationId")} required /></Field>}
        <Field label="Notes"><input className={inputCls} value={f.notes} onChange={set("notes")} /></Field>
        <Field label="Certificate file hash (optional)"><input className={`${inputCls} font-mono`} value={f.certificateHash} onChange={set("certificateHash")} /></Field>
        {err && <p className="rounded-md border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-300">{err}</p>}
        <button className={btnPrimary} disabled={busy}>{busy ? "Signing…" : "Add event"}</button>
      </form>
      {ok && (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <p className="text-sm text-emerald-300">Event signed and added to the part&apos;s history.</p>
          <Link href="/dashboard" className={btnSecondary}>Back to dashboard</Link>
        </div>
      )}
    </Card>
  );
}

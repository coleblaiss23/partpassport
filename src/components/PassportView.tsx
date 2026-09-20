import type { ReactNode } from "react";
import type { VerifyResult } from "@/lib/verifyChain";
import { Badge, Card } from "./ui";

const REASONS: Record<string, string> = {
  EVENT_DATA_TAMPERED: "An event's contents no longer match its signed hash.",
  HASH_CHAIN_BROKEN: "An event does not link to the one before it.",
  SEQUENCE_GAP: "An event is missing from the sequence.",
  INVALID_SIGNATURE: "An event's signature does not match the recording organization.",
  CHAIN_TOO_LONG: "This history is too long to verify online. Contact support.",
};
const TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  CREATED: "blue", INSPECTED: "slate", REPAIRED: "amber", OVERHAULED: "green", INSTALLED: "green",
  REMOVED: "slate", SCRAPPED: "red", SOLD: "blue", TRANSFERRED: "blue",
};
const notes = (d: string) => { try { const j = JSON.parse(d); return typeof j.notes === "string" ? j.notes : ""; } catch { return ""; } };

export default function PassportView({ r, exportHref, actions, banner }: { r: VerifyResult; exportHref?: string; actions?: ReactNode; banner?: ReactNode }) {
  const broken = "brokenAtEventId" in r ? r.brokenAtEventId : null;
  return (
    <div className="space-y-5">
      {banner}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-white">{r.partNumber} / {r.serialNumber}</h1>
          {r.description && <p className="mt-1 text-sm text-slate-400">{r.description}</p>}
          <p className="mt-1 text-xs text-slate-500">Current custodian: {r.custodian ?? "unknown"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions}
          {exportHref && <a href={exportHref} className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">Export audit package (PDF)</a>}
        </div>
      </div>

      {r.valid ? (
        <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
          <p className="font-medium text-emerald-300">Record chain intact</p>
          <p className="mt-1 text-sm text-slate-300">All {r.eventsCount} events link correctly and every signature matches its organization. Nothing has been altered since it was recorded.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4">
          <p className="font-medium text-rose-300">Record chain failed verification</p>
          <p className="mt-1 text-sm text-slate-300">{"reason" in r ? (REASONS[r.reason] ?? r.reason) : ""} Do not rely on this history.</p>
        </div>
      )}
      {r.scrapped && <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-4 text-sm text-rose-300">This part was recorded as scrapped. Treat any new paperwork for it as suspect.</div>}
      {r.safetyFlags.length > 0 && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/40 p-4">
          <p className="font-medium text-amber-300">Safety data matches ({r.safetyFlags.length})</p>
          <ul className="mt-1 space-y-1 text-sm text-amber-100/80">{r.safetyFlags.map((f) => <li key={f.id}><span className="font-mono">{f.source} {f.referenceId}</span>: {f.description}</li>)}</ul>
        </div>
      )}

      <Card className="space-y-1 p-3">
        <h2 className="px-2 pb-1 text-sm font-medium text-white">History{r.truncated ? ` (latest ${r.events.length} of ${r.eventsCount})` : ""}</h2>
        {r.events.map((e) => (
          <details key={e.id} open={e.id === broken} className={`group rounded-lg border px-3 py-2 ${e.id === broken ? "border-rose-700 bg-rose-950/30" : "border-slate-800 bg-slate-950/40"}`}>
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-slate-500">#{e.seq}</span>
              <Badge tone={TONE[e.eventType] ?? "slate"}>{e.eventType.charAt(0) + e.eventType.slice(1).toLowerCase()}</Badge>
              <span className="text-slate-200">{e.organization.name}</span>
              <Badge tone={e.organization.verified ? "green" : "slate"}>{e.organization.verified ? "Verified issuer" : "Unverified issuer"}</Badge>
              <span className="ml-auto text-xs text-slate-500">{e.timestamp.slice(0, 16).replace("T", " ")} UTC</span>
            </summary>
            <dl className="mt-3 space-y-2 text-xs">
              {e.id === broken && <div className="rounded border border-rose-800 bg-rose-950/50 p-2 text-rose-300">This is the first event that fails verification.</div>}
              {notes(e.data) && <div><dt className="text-slate-500">Notes</dt><dd className="text-slate-200">{notes(e.data)}</dd></div>}
              <div><dt className="text-slate-500">Event hash</dt><dd className="break-all font-mono text-slate-300">{e.eventHash}</dd></div>
              <div><dt className="text-slate-500">Previous hash</dt><dd className="break-all font-mono text-slate-400">{e.prevEventHash ?? "none (first event)"}</dd></div>
              <div><dt className="text-slate-500">Signature</dt><dd className="break-all font-mono text-slate-400">{e.signature}</dd></div>
              {e.certificateHash && <div><dt className="text-slate-500">Attached certificate hash</dt><dd className="break-all font-mono text-slate-400">{e.certificateHash}</dd></div>}
            </dl>
          </details>
        ))}
      </Card>
      <p className="text-xs text-slate-500">PartPassport provides cryptographic record integrity and does not certify airworthiness. Safety-data matches cover only the FAA and other sources imported into PartPassport and are not exhaustive.</p>
    </div>
  );
}

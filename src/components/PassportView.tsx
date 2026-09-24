import type { ReactNode } from "react";
import type { VerifyResult } from "@/lib/verifyChain";
import { evaluateLifeLimits } from "@/lib/lifeLimits";
import {
 Badge,
 Card,
 TrackingBlock,
 bannerFail,
 bannerPass,
 bannerWarn,
 btnPrimary,
} from "./ui";

const REASONS: Record<string, string> = {
 EVENT_DATA_TAMPERED: "An event's contents no longer match its signed hash.",
 HASH_CHAIN_BROKEN: "An event does not link to the one before it.",
 SEQUENCE_GAP: "An event is missing from the sequence.",
 INVALID_SIGNATURE: "An event's signature does not match the recording organization.",
 CHAIN_TOO_LONG: "This history is too long to verify online. Contact support.",
};
const TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
 CREATED: "blue",
 INSPECTED: "slate",
 REPAIRED: "amber",
 OVERHAULED: "green",
 INSTALLED: "green",
 REMOVED: "slate",
 SCRAPPED: "red",
 SOLD: "blue",
 TRANSFERRED: "blue",
};
const notes = (d: string) => {
 try {
 const j = JSON.parse(d);
 return typeof j.notes === "string" ? j.notes : "";
 } catch {
 return "";
 }
};

export default function PassportView({
 r,
 exportHref,
 actions,
 banner,
}: {
 r: VerifyResult;
 exportHref?: string;
 actions?: ReactNode;
 banner?: ReactNode;
}) {
 const broken = "brokenAtEventId" in r ? r.brokenAtEventId : null;
 const life = evaluateLifeLimits({
 isLifeLimited: r.isLifeLimited,
 totalTimeHours: r.totalTimeHours,
 totalCycles: r.totalCycles,
 lifeLimitHours: r.lifeLimitHours,
 lifeLimitCycles: r.lifeLimitCycles,
 });

 return (
 <div className="space-y-5">
 {banner}
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <h1 className="pp-track text-2xl font-semibold text-white">
 {r.partNumber} / {r.serialNumber}
 </h1>
 {r.description && <p className="mt-1 text-sm text-[#B0B6C3]">{r.description}</p>}
 <p className="mt-1 text-xs text-[#7C8495]">
 Current custodian: {r.custodian ?? "unknown"}
 {r.custodyStatus ? (
 <>
 {" · "}
 <span className="text-white">{r.custodyStatus}</span>
 </>
 ) : null}
 </p>
 {r.birthCertificateHash ? (
 <p className="mt-1 break-all text-xs text-[#7C8495]">
 Birth certificate:{" "}
 <span className="pp-track text-[#B0B6C3]">{r.birthCertificateHash.slice(0, 16)}…</span>
 </p>
 ) : null}
 </div>
 <div className="flex flex-wrap gap-2">
 {actions}
 {exportHref && (
 <a href={exportHref} className={btnPrimary}>
 Export audit package (PDF)
 </a>
 )}
 </div>
 </div>

 {r.isLifeLimited && (
 <div
 className={
 life.expired ? bannerFail : life.approaching ? bannerWarn : "rounded-[4px] border border-[#1F2430] bg-[#12151C] p-4"
 }
 >
 <p className="text-sm font-medium text-white">Component genealogy / life limits</p>
 <div className="mt-3 grid gap-2 sm:grid-cols-2">
 <TrackingBlock
 label="Total time (h)"
 value={r.totalTimeHours != null ? String(r.totalTimeHours) : "—"}
 />
 <TrackingBlock
 label="Life limit (h)"
 value={r.lifeLimitHours != null ? String(r.lifeLimitHours) : "—"}
 />
 <TrackingBlock
 label="Total cycles"
 value={r.totalCycles != null ? String(r.totalCycles) : "—"}
 />
 <TrackingBlock
 label="Life limit (cycles)"
 value={r.lifeLimitCycles != null ? String(r.lifeLimitCycles) : "—"}
 />
 </div>
 {life.reasons.length > 0 && (
 <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#B0B6C3]">
 {life.reasons.map((msg) => (
 <li key={msg}>{msg}</li>
 ))}
 </ul>
 )}
 {life.expired && (
 <p className="mt-2 text-sm font-medium text-white">
 Installation blocked — component is past life limit.
 </p>
 )}
 </div>
 )}

 {r.valid ? (
 <div className={bannerPass}>
 <p className="font-medium text-white">Chain of custody ledger intact</p>
 <p className="mt-1 text-sm text-[#B0B6C3]">
 All {r.eventsCount} events link correctly and every signature matches its organization.
 Nothing has been altered since it was recorded.
 </p>
 </div>
 ) : (
 <div className={bannerFail}>
 <p className="font-medium text-white">Chain of custody ledger failed verification</p>
 <p className="mt-1 text-sm text-[#B0B6C3]">
 {"reason" in r ? (REASONS[r.reason] ?? r.reason) : ""} Do not rely on this history.
 </p>
 </div>
 )}
 {r.scrapped && (
 <div className={`${bannerFail} text-sm`}>
 This part was recorded as scrapped. Treat any new paperwork for it as suspect.
 </div>
 )}
 {r.safetyFlags.length > 0 && (
 <div className={bannerWarn}>
 <p className="font-medium text-white">
 Automated FAA UPN / safety cross-reference ({r.safetyFlags.length})
 </p>
 <ul className="mt-1 space-y-1 text-sm text-[#FFEDD5]">
 {r.safetyFlags.map((f) => (
 <li key={f.id}>
 <span className="pp-track">
 {f.source} {f.referenceId}
 </span>
 : {f.description}
 </li>
 ))}
 </ul>
 </div>
 )}

 <Card className="space-y-1 p-3">
 <h2 className="px-2 pb-1 text-sm font-medium text-white">
 Chain of custody ledger
 {r.truncated ? ` (latest ${r.events.length} of ${r.eventsCount})` : ""}
 </h2>
 {r.events.map((e) => (
 <details
 key={e.id}
 open={e.id === broken}
 className={`group rounded-[4px] border px-3 py-2 ${
 e.id === broken
 ? "border-[#9F1239] bg-[#1A0A10]"
 : "border-[#1F2430] bg-[#0B0F14]"
 }`}
 >
 <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
 <span className="pp-track text-[#7C8495]">#{e.seq}</span>
 <Badge tone={TONE[e.eventType] ?? "slate"}>
 {e.eventType.charAt(0) + e.eventType.slice(1).toLowerCase()}
 </Badge>
 <span className="text-white">{e.organization.name}</span>
 <Badge tone={e.organization.verified ? "green" : "slate"}>
 {e.organization.verified ? "Verified issuer" : "Unverified issuer"}
 </Badge>
 <span className="ml-auto pp-track text-xs text-[#7C8495]">
 {e.timestamp.slice(0, 16).replace("T", " ")} UTC
 </span>
 </summary>
 <dl className="mt-3 space-y-2 text-xs">
 {e.id === broken && (
 <div className="rounded-[4px] border border-[#9F1239] bg-[#1A0A10] p-2 text-[#FFE4E6]">
 This is the first event that fails verification.
 </div>
 )}
 {notes(e.data) && (
 <div>
 <dt className="text-[#7C8495]">Notes</dt>
 <dd className="text-white">{notes(e.data)}</dd>
 </div>
 )}
 <div>
 <dt className="text-[#7C8495]">Event hash</dt>
 <dd className="break-all pp-track text-[#B0B6C3]">{e.eventHash}</dd>
 </div>
 <div>
 <dt className="text-[#7C8495]">Previous hash</dt>
 <dd className="break-all pp-track text-[#B0B6C3]">
 {e.prevEventHash ?? "none (first event)"}
 </dd>
 </div>
 <div>
 <dt className="text-[#7C8495]">Signature</dt>
 <dd className="break-all pp-track text-[#B0B6C3]">{e.signature}</dd>
 </div>
 {e.certificateHash && (
 <div>
 <dt className="text-[#7C8495]">Attached certificate hash</dt>
 <dd className="break-all pp-track text-[#B0B6C3]">{e.certificateHash}</dd>
 </div>
 )}
 </dl>
 </details>
 ))}
 </Card>
 <p className="text-xs text-[#7C8495]">
 PartPassport provides cryptographic record integrity and does not certify airworthiness.
 Safety-data matches cover only the FAA and other sources imported into PartPassport and are
 not exhaustive.
 </p>
 </div>
 );
}

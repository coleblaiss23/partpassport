"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnSecondary } from "@/components/ui";

type CheckRow = { id: string; fileName: string; createdAt: string; findings: number };
type PartRow = { id: string; partNumber: string; serialNumber: string; description: string | null; scrapped: boolean };

export function RecordsManager({
 checks,
 parts,
}: {
 checks: CheckRow[];
 parts: PartRow[];
}) {
 const router = useRouter();
 const [busy, setBusy] = useState<string | null>(null);
 const [err, setErr] = useState("");
 const [clearConfirm, setClearConfirm] = useState("");

 async function del(path: string, key: string, body?: object) {
 setBusy(key);
 setErr("");
 try {
 const r = await fetch(path, {
 method: "DELETE",
 headers: body ? { "Content-Type": "application/json" } : undefined,
 body: body ? JSON.stringify(body) : undefined,
 });
 const j = await r.json().catch(() => ({}));
 if (!r.ok) {
 setErr(j.error ?? "Delete failed");
 setBusy(null);
 return;
 }
 setBusy(null);
 setClearConfirm("");
 router.refresh();
 } catch {
 setErr("Network error");
 setBusy(null);
 }
 }

 function ask(message: string) {
 return typeof window !== "undefined" ? window.confirm(message) : false;
 }

 return (
 <div className="space-y-8">
 {err && <p className="text-sm text-[#FFE4E6]">{err}</p>}

 <section className="space-y-3">
 <div className="flex flex-wrap items-center justify-between gap-2">
 <h2 className="text-base font-semibold text-white">Certificate checks ({checks.length})</h2>
 {checks.length > 0 && (
 <div className="flex flex-wrap items-center gap-2">
 <input
 value={clearConfirm}
 onChange={(e) => setClearConfirm(e.target.value)}
 placeholder='Type DELETE CHECKS'
 className="rounded border border-[#222A3B] bg-[#12151C] px-2 py-1 text-xs text-white"
 />
 <button
 type="button"
 disabled={busy !== null || clearConfirm !== "DELETE CHECKS"}
 className={`${btnSecondary} text-xs text-[#FFE4E6] disabled:opacity-40`}
 onClick={() => {
 if (!ask("Clear all certificate checks for this organization?")) return;
 void del("/api/certificates", "clear-checks", { confirm: "DELETE CHECKS" });
 }}
 >
 {busy === "clear-checks" ? "Clearing…" : "Clear all checks"}
 </button>
 </div>
 )}
 </div>
 {checks.length === 0 ? (
 <p className="text-sm text-[#B0B6C3]">No certificate checks yet.</p>
 ) : (
 <ul className="divide-y divide-[#1F2430] rounded border border-[#1F2430]">
 {checks.map((c) => (
 <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
 <div>
 <Link href={`/report/${c.id}`} className="text-white hover:text-[#1F6B47]">
 {c.fileName}
 </Link>
 <span className="ml-2 text-xs text-[#7C8495]">
 {c.createdAt.slice(0, 10)}
 {c.findings ? ` · ${c.findings} findings` : ""}
 </span>
 </div>
 <button
 type="button"
 disabled={busy !== null}
 className="text-xs text-[#FFE4E6] hover:text-[#FFE4E6] disabled:opacity-40"
 onClick={() => {
 if (!ask(`Delete check “${c.fileName}”?`)) return;
 void del(`/api/certificates/${c.id}`, c.id);
 }}
 >
 {busy === c.id ? "Deleting…" : "Delete"}
 </button>
 </li>
 ))}
 </ul>
 )}
 </section>

 <section className="space-y-3">
 <h2 className="text-base font-semibold text-white">Parts in custody ({parts.length})</h2>
 {parts.length === 0 ? (
 <p className="text-sm text-[#B0B6C3]">No parts in custody.</p>
 ) : (
 <ul className="divide-y divide-[#1F2430] rounded border border-[#1F2430]">
 {parts.map((p) => (
 <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
 <div>
 <Link
 href={`/verify/${encodeURIComponent(p.partNumber)}/${encodeURIComponent(p.serialNumber)}`}
 className="font-mono text-[#1F6B47] hover:underline"
 >
 {p.partNumber} / {p.serialNumber}
 </Link>
 {p.description && <span className="ml-2 text-xs text-[#7C8495]">{p.description}</span>}
 {p.scrapped && <span className="ml-2 text-xs text-[#FFE4E6]">scrapped</span>}
 </div>
 <button
 type="button"
 disabled={busy !== null}
 className="text-xs text-[#FFE4E6] hover:text-[#FFE4E6] disabled:opacity-40"
 onClick={() => {
 if (
 !ask(
 `Remove part ${p.partNumber} / ${p.serialNumber}? This deletes your org’s events on it.`
 )
 )
 return;
 void del(`/api/parts/${p.id}`, p.id);
 }}
 >
 {busy === p.id ? "Removing…" : "Remove"}
 </button>
 </li>
 ))}
 </ul>
 )}
 </section>
 </div>
 );
}

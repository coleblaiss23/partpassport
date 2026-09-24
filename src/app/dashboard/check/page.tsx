"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Badge, Card, PageHeader, btnPrimary, btnSecondary } from "@/components/ui";
import { AvlWarningBadge } from "@/components/certificates/AvlWarningBadge";
import { RtsDraftGenerator } from "@/components/certificates/RtsDraftGenerator";
import type { AvlCheckResult } from "@/lib/avl";
import type { Extracted } from "@/lib/certChecks";

type Result = {
 id: string;
 mode: string;
 certificateHash: string;
 extracted: Record<string, unknown>;
 redFlags: string[];
 avl?: AvlCheckResult | null;
};

type Item = {
 id: string;
 file: File;
 url: string;
 status: "queued" | "running" | "done" | "error";
 result?: Result;
 error?: string;
 avl?: AvlCheckResult | null;
};

const FIELDS: [string, string][] = [
 ["trackingNumber", "Tracking no. (Block 3)"],
 ["organization", "Organization (Block 4)"],
 ["description", "Description (Block 7)"],
 ["partNumber", "Part number (Block 8)"],
 ["eligibility", "Eligibility (Block 9)"],
 ["quantity", "Quantity (Block 10)"],
 ["serial", "Serial / batch (Block 11)"],
 ["status", "Status / work (Block 12)"],
 ["remarks", "Remarks (Block 13)"],
 ["approvalNumber", "Approval no."],
 ["date", "Date"],
 ["hasSignature", "Signature present"],
];

const show = (v: unknown) =>
 v == null || v === "" ? "not found" : v === true ? "Yes" : v === false ? "No" : String(v);

const tone = (i: Item) =>
 i.status === "error"
 ? "red"
 : i.status === "done"
 ? i.result?.redFlags.length
 ? "amber"
 : "green"
 : "slate";

const text = (i: Item) =>
 i.status === "done"
 ? i.result?.redFlags.length
 ? `${i.result.redFlags.length} findings`
 : "Clear"
 : i.status === "error"
 ? "Error"
 : i.status === "running"
 ? "Running pipeline…"
 : "Queued";

export default function ScannerPage() {
 const v = useVault();
 const [items, setItems] = useState<Item[]>([]);
 const [sel, setSel] = useState<string | null>(null);
 const [ai, setAi] = useState<{ mode: string; message: string } | null>(null);
 const [drag, setDrag] = useState(false);
 const ref = useRef<Item[]>([]);

 useEffect(() => {
 ref.current = items;
 }, [items]);

 useEffect(() => {
 fetch("/api/ai-status")
 .then((r) => r.json())
 .then(setAi)
 .catch(() => {});
 }, []);

 useEffect(() => () => ref.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

 const patch = (id: string, p: Partial<Item>) =>
 setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));

 async function analyze(it: Item) {
 patch(it.id, { status: "running", avl: null });
 try {
 const fd = new FormData();
 fd.append("file", it.file);
 const r = await fetch("/api/certificates/analyze", { method: "POST", body: fd });
 const j = await r.json();
 if (!r.ok) throw new Error(j.error ?? "Analysis failed");

 const avlResult: AvlCheckResult | null = j.avl ?? null;
 patch(it.id, { status: "done", result: j, avl: avlResult });
 } catch (e) {
 patch(it.id, { status: "error", error: (e as Error).message });
 }
 }

 async function addFiles(list: FileList | File[]) {
 const pdfs = Array.from(list)
 .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
 .slice(0, 20);

 const fresh: Item[] = pdfs.map((file) => ({
 id: crypto.randomUUID(),
 file,
 url: URL.createObjectURL(file),
 status: "queued",
 }));

 if (!fresh.length) return;
 setItems((p) => [...p, ...fresh]);
 setSel((s) => s ?? fresh[0].id);

 for (const it of fresh) await analyze(it);
 }

 const cur = items.find((i) => i.id === sel);

 const banner = ai && (
 <div
 className={`border p-3 text-sm ${
 ai.mode === "anthropic" || ai.mode === "local"
 ? "border-[#1F6B47] bg-[#14281F] text-white"
 : "border-[#9F1239] bg-[#1A0A10] text-[#FFE4E6]"
 }`}
 >
 {ai.message}
 </div>
 );

 if (v.ready && !v.org)
 return (
 <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
 <PageHeader title="Certificate intake" />
 <Card className="space-y-3">
 <p className="text-[#B0B6C3]">Connect your organization to run the deterministic OCR pipeline.</p>
 <Link href="/connect" className={btnPrimary}>
 Connect organization
 </Link>
 </Card>
 </main>
 );

 return (
 <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
 <PageHeader
 title="Certificate intake"
 subtitle="8130-3 / Form 1 PDF → Deterministic OCR Pipeline → AVL enforcement → Automated FAA UPN cross-reference."
 />

 {banner}

 <div className="grid gap-5 lg:grid-cols-2">
 <div className="space-y-4">
 <label
 onDragOver={(e) => {
 e.preventDefault();
 setDrag(true);
 }}
 onDragLeave={() => setDrag(false)}
 onDrop={(e) => {
 e.preventDefault();
 setDrag(false);
 addFiles(e.dataTransfer.files);
 }}
 className={`flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed p-8 text-center transition ${
 drag ? "border-[#1F6B47] bg-[#14281F]" : "border-[#1F2430] hover:border-[#B0B6C3]"
 }`}
 >
 <span className="font-medium text-white">Drop PDFs here or click to browse</span>
 <span className="text-xs text-[#7C8495]">Up to 20 files, 10 MB each</span>
 <input
 type="file"
 accept="application/pdf"
 multiple
 className="hidden"
 onChange={(e) => {
 if (e.target.files) addFiles(e.target.files);
 e.target.value = "";
 }}
 />
 </label>

 {items.length > 0 && (
 <Card className="space-y-1 p-2">
 {items.map((i) => (
 <button
 key={i.id}
 onClick={() => setSel(i.id)}
 className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
 i.id === sel ? "bg-[#161B24]" : "hover:bg-[#0B0F14]"
 }`}
 >
 <span className="truncate text-white">{i.file.name}</span>
 <Badge tone={tone(i)}>{text(i)}</Badge>
 </button>
 ))}
 </Card>
 )}

 {cur && (
 <iframe
 title="Certificate preview"
 src={cur.url}
 className="h-[65vh] w-full border border-[#1F2430] bg-white"
 />
 )}
 </div>

 <div className="space-y-4">
 {!cur && (
 <Card>
 <p className="text-sm text-[#B0B6C3]">Pipeline results appear here.</p>
 </Card>
 )}

 {cur?.status === "running" && (
 <Card>
 <p className="pp-track text-sm text-[#B0B6C3]">
 Running deterministic OCR pipeline on {cur.file.name}…
 </p>
 </Card>
 )}

 {cur?.status === "error" && (
 <p className="border border-[#9F1239] bg-[#1A0A10] p-3 text-sm text-[#FFE4E6]">
 Error: {cur.error}
 </p>
 )}

 {cur?.result &&
 (() => {
 const r = cur.result;
 const reg = `/dashboard/parts/new?${new URLSearchParams({
 pn: String(r.extracted.partNumber ?? ""),
 sn: String(r.extracted.serial ?? ""),
 desc: String(r.extracted.description ?? ""),
 cert: r.certificateHash,
 })}`;
 const clear =
 !r.redFlags.some((f) => f.startsWith("AVL ENFORCEMENT") && f.includes("not on the Approved"));

 return (
 <>
 {cur.avl && (
 <AvlWarningBadge
 isOnAvl={cur.avl.isOnAvl}
 warning={cur.avl.warning}
 matchedSupplierName={cur.avl.matchedSupplierName}
 severity={cur.avl.severity}
 />
 )}

 <section
 className={`border p-4 ${
 r.redFlags.length
 ? "border-[#B45309] bg-[#1C1408]"
 : "border-[#1F6B47] bg-[#14281F]"
 }`}
 >
 <h2 className="font-medium text-white">
 {r.redFlags.length
 ? `Review required: ${r.redFlags.length} finding${
 r.redFlags.length > 1 ? "s" : ""
 }`
 : "No issues detected in the document"}
 </h2>
 {r.redFlags.length > 0 && (
 <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-[#B0B6C3]">
 {r.redFlags.map((f) => (
 <li key={f}>{f}</li>
 ))}
 </ul>
 )}
 </section>

 <Card className="p-0">
 <table className="w-full text-sm">
 <tbody>
 {FIELDS.map(([k, l]) => (
 <tr key={k} className="border-b border-[#1F2430] last:border-0">
 <td className="w-44 p-3 text-[#B0B6C3]">{l}</td>
 <td
 className={`p-3 ${
 k === "partNumber" || k === "serial" || k === "trackingNumber" || k === "approvalNumber"
 ? "pp-track"
 : ""
 } ${
 r.extracted[k] == null || r.extracted[k] === ""
 ? "text-[#FFE4E6]"
 : "text-white"
 }`}
 >
 {show(r.extracted[k])}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </Card>

 <p className="break-all text-xs text-[#7C8495]">
 File SHA-256: <span className="pp-track">{r.certificateHash}</span>
 </p>

 {(clear || r.extracted.block19Cfr43_9 || r.extracted.status) && (
 <RtsDraftGenerator extracted={r.extracted as Extracted} />
 )}

 <div className="flex flex-wrap gap-2">
 <Link href={`/report/${r.id}`} className={btnPrimary}>
 Open shareable report
 </Link>
 <Link href={reg} className={btnSecondary}>
 Register this part
 </Link>
 </div>

 <p className="text-xs text-[#7C8495]">
 Automated records review only. This is not an airworthiness determination.
 </p>
 </>
 );
 })()}
 </div>
 </div>
 </main>
 );
}

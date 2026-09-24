import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normPN, serialInRange } from "@/lib/normalize";
import type { Extracted } from "@/lib/extract";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit report | PartPassport", robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await prisma.certificateCheck.findUnique({ where: { id }, include: { organization: { select: { name: true } } } });
  if (!check) notFound();
  const x: Extracted = JSON.parse(check.extracted);
  const flags: string[] = JSON.parse(check.redFlags);
  const safety = x.partNumber
    ? (await prisma.safetyFlag.findMany({ where: { partNumberNorm: normPN(x.partNumber) } })).filter((f) => serialInRange(x.serial ?? "", f.serialRangeStart, f.serialRangeEnd))
    : [];
  const rows: [string, unknown][] = [
    ["Tracking no. (Block 3)", x.trackingNumber],
    ["Organization (Block 4)", x.organization],
    ["Part number (Block 8)", x.partNumber],
    ["Serial / batch (Block 11)", x.serial],
    ["Description (Block 7)", x.description],
    ["Quantity (Block 10)", x.quantity],
    ["Eligibility (Block 9)", x.eligibility],
    ["Status / work (Block 12)", x.status],
    ["Approval no.", x.approvalNumber],
    ["Date", x.date],
    ["Signature present", x.hasSignature == null ? undefined : x.hasSignature ? "Yes" : "No"],
    ["Remarks (Block 13)", x.remarks],
    ["Block 14 approved design", x.block14ApprovedDesign == null ? undefined : x.block14ApprovedDesign ? "Yes" : "No"],
    ["Block 14 non-approved design", x.block14NonApprovedDesign == null ? undefined : x.block14NonApprovedDesign ? "Yes" : "No"],
    ["Block 19 14 CFR 43.9", x.block19Cfr43_9 == null ? undefined : x.block19Cfr43_9 ? "Yes" : "No"],
  ];

  return (
    <main className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">Paperwork audit report</span>
          <h1 className="text-2xl font-bold text-white mt-1">{x.partNumber ?? "Unknown part"} / {x.serial ?? "?"}</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Prepared by {check.organization.name} on {check.createdAt.toISOString().slice(0, 10)}</p>
        </div>
        <section className={`rounded-lg border p-4 ${flags.length ? "border-amber-600 bg-amber-950/30" : "border-emerald-700 bg-emerald-950/30"}`}>
          <h2 className="font-semibold">{flags.length ? `Review recommended (${flags.length} finding${flags.length > 1 ? "s" : ""})` : "No issues detected in the document"}</h2>
          <ul className="list-disc ml-5 mt-2 text-sm text-slate-300 space-y-1">{flags.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>
        {safety.length > 0 && (
          <section className="rounded-lg border border-red-700 bg-red-950/30 p-4">
            <h2 className="font-semibold">Safety data matches ({safety.length})</h2>
            <ul className="mt-2 text-sm text-slate-300 space-y-1">{safety.map((f) => <li key={f.id}><span className="font-mono">{f.source} {f.referenceId}</span>: {f.description}</li>)}</ul>
          </section>
        )}
        <table className="w-full text-sm border border-slate-800 rounded"><tbody>
          {rows.map(([k, v]) => <tr key={k} className="border-b border-slate-800"><td className="p-2 text-slate-400 font-mono w-40">{k}</td><td className="p-2">{v == null || v === "" ? "not found" : String(v)}</td></tr>)}
        </tbody></table>
        <p className="text-xs font-mono text-slate-500 break-all">File SHA-256: {check.sha256}</p>
        <p className="text-xs text-slate-500">This report is an automated records review. It is not an airworthiness determination. Safety-data matches cover only the FAA and other sources imported into PartPassport and are not exhaustive. A qualified, authorized person must decide whether a part may be installed.</p>
      </div>
    </main>
  );
}

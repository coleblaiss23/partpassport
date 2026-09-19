import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normPN, serialInRange } from "@/lib/normalize";
import type { Extracted } from "@/lib/extract";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await prisma.certificateCheck.findUnique({ where: { id }, include: { organization: { select: { name: true } } } });
  if (!check) notFound();
  const x: Extracted = JSON.parse(check.extracted);
  const flags: string[] = JSON.parse(check.redFlags);
  const safety = x.partNumber
    ? (await prisma.safetyFlag.findMany({ where: { partNumberNorm: normPN(x.partNumber) } })).filter((f) => serialInRange(x.serial ?? "", f.serialRangeStart, f.serialRangeEnd))
    : [];
  const rows: [string, unknown][] = [["Part number", x.partNumber], ["Serial", x.serial], ["Description", x.description], ["Status", x.status], ["Approval no.", x.approvalNumber], ["Date", x.date], ["Signature present", x.hasSignature == null ? undefined : x.hasSignature ? "Yes" : "No"], ["Remarks", x.remarks]];

  return (
    <main className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {x._mode === "mock" && (
          <div className="rounded border border-amber-600 bg-amber-950/40 p-3 text-xs font-mono text-amber-300">
            TEST REPORT: generated in mock mode. The values below are canned samples, not a real analysis of the file.
          </div>
        )}
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
        <p className="text-xs text-slate-500">This report is an automated records review. It is not an airworthiness determination. A qualified, authorized person must decide whether a part may be installed.</p>
      </div>
    </main>
  );
}

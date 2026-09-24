import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normPN, serialInRange } from "@/lib/normalize";
import type { Extracted } from "@/lib/extract";
import type { AvlCheckResult } from "@/lib/avl";
import { AvlWarningBadge } from "@/components/certificates/AvlWarningBadge";
import { RtsDraftGenerator } from "@/components/certificates/RtsDraftGenerator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit report | PartPassport", robots: { index: false, follow: false } };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 const check = await prisma.certificateCheck.findUnique({
 where: { id },
 include: { organization: { select: { name: true, faaCertNumber: true } } },
 });
 if (!check) notFound();
 const x: Extracted & { _avl?: AvlCheckResult } = JSON.parse(check.extracted);
 const flags: string[] = JSON.parse(check.redFlags);
 const avl = x._avl ?? null;
 const safety = x.partNumber
 ? (await prisma.safetyFlag.findMany({ where: { partNumberNorm: normPN(x.partNumber) } })).filter((f) =>
 serialInRange(x.serial ?? "", f.serialRangeStart, f.serialRangeEnd)
 )
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
 <main className="min-h-[calc(100vh-57px)] bg-[#0B0F14] p-6 text-white md:p-12">
 <div className="mx-auto max-w-2xl space-y-6">
 <div>
 <span className="pp-track text-xs uppercase tracking-widest text-[#1F6B47]">
 Compliance audit report
 </span>
 <h1 className="pp-track mt-1 text-2xl font-bold text-white">
 {x.partNumber ?? "Unknown part"} / {x.serial ?? "?"}
 </h1>
 <p className="pp-track mt-1 text-xs text-[#7C8495]">
 Prepared by {check.organization.name} on {check.createdAt.toISOString().slice(0, 10)}
 </p>
 </div>

 {avl && (
 <AvlWarningBadge
 isOnAvl={avl.isOnAvl}
 warning={avl.warning}
 matchedSupplierName={avl.matchedSupplierName}
 severity={avl.severity}
 />
 )}

 <section
 className={`border p-4 ${
 flags.length ? "border-[#B45309] bg-[#1C1408]" : "border-[#1F6B47] bg-[#14281F]"
 }`}
 >
 <h2 className="font-semibold">
 {flags.length
 ? `Review required (${flags.length} finding${flags.length > 1 ? "s" : ""})`
 : "No issues detected in the document"}
 </h2>
 <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-[#B0B6C3]">
 {flags.map((f) => (
 <li key={f}>{f}</li>
 ))}
 </ul>
 </section>

 {safety.length > 0 && (
 <section className="border border-[#9F1239] bg-[#1A0A10] p-4">
 <h2 className="font-semibold">Automated FAA UPN / safety cross-reference ({safety.length})</h2>
 <ul className="mt-2 space-y-1 text-sm text-[#B0B6C3]">
 {safety.map((f) => (
 <li key={f.id}>
 <span className="pp-track">
 {f.source} {f.referenceId}
 </span>
 : {f.description}
 </li>
 ))}
 </ul>
 </section>
 )}

 <table className="w-full border border-[#1F2430] text-sm">
 <tbody>
 {rows.map(([k, v]) => (
 <tr key={k} className="border-b border-[#1F2430]">
 <td className="w-44 p-2 font-mono text-[#B0B6C3]">{k}</td>
 <td
 className={`p-2 ${
 String(k).includes("Part") || String(k).includes("Serial") || String(k).includes("Tracking")
 ? "pp-track"
 : ""
 }`}
 >
 {v == null || v === "" ? "not found" : String(v)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 <RtsDraftGenerator
 extracted={x}
 organizationName={check.organization.name}
 faaCertNumber={check.organization.faaCertNumber}
 />

 <p className="pp-track break-all text-xs text-[#7C8495]">File SHA-256: {check.sha256}</p>
 <p className="text-xs text-[#7C8495]">
 This report is an automated records review. It is not an airworthiness determination.
 Safety-data matches cover only the FAA and other sources imported into PartPassport and are
 not exhaustive. A qualified, authorized person must decide whether a part may be installed.
 </p>
 </div>
 </main>
 );
}

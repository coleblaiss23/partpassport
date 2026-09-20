import Link from "next/link";
import type { ReactNode } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui";

export const metadata = { title: "Sample audit report" };

const findings = [
  "Approval/authorization number is missing",
  "Authorized signature appears to be missing",
  "Date \"02/31/2026\" is not a valid calendar date",
  "Serial in remarks (SN-4420) does not match serial field (SN-4402)",
];
const fields: [string, string][] = [
  ["Part number", "DEMO-CERT-200"], ["Serial", "SN-4402"], ["Description", "ACTUATOR ASSY, FLAP"], ["Status", "REPAIRED"],
  ["Approval no.", "not found"], ["Date", "02/31/2026"], ["Signature present", "No"], ["Remarks", "REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE."],
];

function Pin({ n }: { n: number }) {
  return <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">{n}</span>;
}
function Block({ no, label, children, flag, className = "" }: { no: string; label: string; children?: ReactNode; flag?: number; className?: string }) {
  return (
    <div className={`relative border border-slate-400 px-2 pb-1.5 pt-1 ${flag ? "bg-rose-50 outline outline-2 outline-rose-500" : "bg-white"} ${className}`}>
      <p className="text-[9px] uppercase tracking-wide text-slate-500">{no}. {label}</p>
      <p className="min-h-[1.25rem] font-mono text-[13px] text-slate-900">{children}</p>
      {flag && <Pin n={flag} />}
    </div>
  );
}

export default function SampleReport() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 rounded-md border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">Sample report built from a fictional certificate, so you can see exactly what a customer receives.</div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-500">Paperwork audit report</p>
        <h1 className="mt-1 font-mono text-2xl font-semibold text-white">DEMO-CERT-200 / SN-4402</h1>
        <p className="mt-1 text-xs text-slate-500">Prepared by Ridgeline Aero Repair (fictional) on 2026-09-14</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative self-start overflow-hidden rounded-lg bg-slate-200 p-4 shadow-xl">
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold uppercase tracking-widest text-slate-400/30 [transform:rotate(-24deg)]">Sample</p>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Authorized Release Certificate (FAA Form 8130-3 layout)</p>
          <div className="grid grid-cols-2 gap-px">
            <Block no="4" label="Organization">RIDGELINE AERO REPAIR</Block>
            <Block no="5" label="Work order">WO-10046</Block>
            <Block no="6-7" label="Item / description" className="col-span-2">1 / ACTUATOR ASSY, FLAP</Block>
            <Block no="8" label="Part number">DEMO-CERT-200</Block>
            <Block no="11" label="Serial number">SN-4402</Block>
            <Block no="12" label="Status / work">REPAIRED</Block>
            <Block no="19" label="Date" flag={3}>02/31/2026</Block>
            <Block no="13" label="Remarks" flag={4} className="col-span-2">REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE.</Block>
            <Block no="16" label="Authorized signature" flag={2} />
            <Block no="17" label="Approval / authorization no." flag={1} />
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-amber-700 bg-amber-950/30 p-4">
            <h2 className="font-medium text-white">Review recommended ({findings.length} findings)</h2>
            <ol className="mt-3 space-y-2">
              {findings.map((f, i) => (
                <li key={f} className="flex gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">{i + 1}</span>{f}
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-xl border border-red-800 bg-red-950/30 p-4">
            <h2 className="font-medium text-white">Safety data matches (1)</h2>
            <p className="mt-2 text-sm text-slate-300"><span className="font-mono">AD TEST-AD-0002</span>: fictional directive used for demonstration</p>
          </section>
          <table className="w-full overflow-hidden rounded-lg border border-slate-800 text-sm">
            <tbody>
              {fields.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-800 last:border-0">
                  <td className="w-40 p-2.5 text-slate-400">{k}</td>
                  <td className={`p-2.5 ${v === "not found" || v === "No" ? "text-rose-400" : "text-slate-100"}`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="break-all font-mono text-[11px] text-slate-500">File SHA-256: 9f2c41d0a7e35b18c6d94f0e2a7b53c8d1e6f4a90b2c7d5e83f1a6b4c09d7e21</p>
          <p className="text-xs text-slate-500">Automated records review only. It is not an airworthiness determination. Safety-data matches cover only the FAA and other sources imported into PartPassport and are not exhaustive. A qualified, authorized person decides whether a part may be installed.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/request-access" className={btnPrimary}>Request access</Link>
            <Link href="/sample-part" className={btnSecondary}>See a signed part history</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

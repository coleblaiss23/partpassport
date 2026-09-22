import Link from "next/link";
import type { ReactNode } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui";

export const metadata = { title: "Sample audit report" };

const findings = [
  "Approval/authorization number is missing",
  "Authorized signature appears to be missing",
  'Date "02/31/2026" is not a valid calendar date',
  "Serial in remarks (SN-4420) does not match serial field (SN-4402)",
];

const fields: [string, string][] = [
  ["Part number", "DEMO-CERT-200"],
  ["Serial", "SN-4402"],
  ["Description", "ACTUATOR ASSY, FLAP"],
  ["Status", "REPAIRED"],
  ["Approval no.", "not found"],
  ["Date", "02/31/2026"],
  ["Signature present", "No"],
  [
    "Remarks",
    "REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE.",
  ],
];

function Pin({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-[11px] font-bold text-white">
      {n}
    </span>
  );
}

function Block({
  no,
  label,
  children,
  flag,
  className = "",
}: {
  no: string;
  label: string;
  children?: ReactNode;
  flag?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative border border-slate-400 px-2 pb-1.5 pt-1 ${
        flag ? "bg-rose-50 outline outline-2 outline-rose-600" : "bg-white"
      } ${className}`}
    >
      <p className="text-[9px] uppercase tracking-wide text-slate-500">
        {no}. {label}
      </p>
      <p className="min-h-[1.25rem] font-mono text-[13px] text-slate-900">{children}</p>
      {flag ? <Pin n={flag} /> : null}
    </div>
  );
}

export default function SampleReport() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="mb-6 text-sm text-slate-400">
        Fictional certificate for demonstration. Shows the same report layout a shop
        would get after a check.
      </p>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-semibold text-white">
          DEMO-CERT-200 / SN-4402
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ridgeline Aero Repair (fictional) · 2026-09-14
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="self-start overflow-hidden rounded border border-slate-700 bg-slate-200 p-4">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-slate-600">
            Authorized release certificate (FAA Form 8130-3 layout)
          </p>
          <div className="grid grid-cols-2 gap-0 border border-slate-400 bg-white text-left">
            <Block no="4" label="Organization">
              RIDGELINE AERO REPAIR
            </Block>
            <Block no="5" label="Work order">
              WO-10046
            </Block>
            <Block no="6-7" label="Item / description" className="col-span-2">
              1 / ACTUATOR ASSY, FLAP
            </Block>
            <Block no="8" label="Part number">
              DEMO-CERT-200
            </Block>
            <Block no="11" label="Serial number">
             SN-4402
            </Block>
            <Block no="12" label="Status / work">
              REPAIRED
            </Block>
            <Block no="19" label="Date" flag={3}>
              02/31/2026
            </Block>
            <Block no="13" label="Remarks" flag={4} className="col-span-2">
              REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE.
            </Block>
            <Block no="16" label="Authorized signature" flag={2} />
            <Block no="17" label="Approval / authorization no." flag={1} />
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded border border-slate-700 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-white">
              Review recommended ({findings.length} findings)
            </h2>
            <ol className="mt-3 space-y-2">
              {findings.map((f, i) => (
                <li key={f} className="flex gap-3 text-sm text-slate-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-700 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  {f}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded border border-slate-700 bg-slate-900/50 p-4">
            <h2 className="text-sm font-semibold text-white">Safety data matches (1)</h2>
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-mono">AD TEST-AD-0002</span>: fictional directive
              for demonstration
            </p>
          </section>

          <table className="w-full border border-slate-800 text-sm">
            <tbody>
              {fields.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-800 last:border-0">
                  <td className="w-40 p-2.5 text-slate-400">{k}</td>
                  <td
                    className={`p-2.5 ${
                      v === "not found" || v === "No" ? "text-rose-400" : "text-slate-100"
                    }`}
                  >
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="break-all font-mono text-[11px] text-slate-500">
            File SHA-256:
            9f2c41d0a7e35b18c6d94f0e2a7b53c8d1e6f4a90b2c7d5e83f1a6b4c09d7e21
          </p>

          <p className="text-xs text-slate-500">
            Automated records review only. Not an airworthiness determination.
            Safety-data matches cover only sources imported into PartPassport.
          </p>

          <div className="flex flex-wrap gap-2">
            <Link href="/request-access" className={btnPrimary}>
              Request access
            </Link>
            <Link href="/sample-part" className={btnSecondary}>
              Signed history sample
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

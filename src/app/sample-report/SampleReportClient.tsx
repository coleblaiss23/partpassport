"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui";

/**
 * Sample audit report with OCR discrepancy pins aligned to standard
 * FAA Form 8130-3 (Authorized Release Certificate) and Form 8330-1
 * (Malfunction or Defect Report) block coordinates.
 */

const findings8130 = [
  { n: 1, block: "17", text: "Approval/authorization number is missing" },
  { n: 2, block: "15", text: "Authorized signature appears to be missing" },
  { n: 3, block: "18", text: 'Date "02/31/2026" is not a valid calendar date' },
  {
    n: 4,
    block: "13",
    text: "Serial in remarks (SN-4420) does not match serial field (SN-4402)",
  },
];

const findings8330 = [
  { n: 1, block: "A", text: "Operator / submitter identification incomplete" },
  { n: 2, block: "C", text: "Part number field blank — required for UPN correlation" },
  { n: 3, block: "E", text: "Date of discovery is not a valid calendar date" },
  { n: 4, block: "G", text: "Narrative references a different serial than Block C" },
];

const fields8130: [string, string][] = [
  ["Part number (Block 8)", "DEMO-CERT-200"],
  ["Serial (Block 11)", "SN-4402"],
  ["Description (Block 7)", "ACTUATOR ASSY, FLAP"],
  ["Status (Block 12)", "REPAIRED"],
  ["Approval no. (Block 17)", "not found"],
  ["Date (Block 18)", "02/31/2026"],
  ["Signature (Block 15)", "No"],
  ["Remarks (Block 13)", "REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE."],
];

function Pin({ n }: { n: number }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#9F1239] text-[11px] font-bold text-white">
      {n}
    </span>
  );
}

function Cell({
  no,
  label,
  children,
  flag,
  className = "",
  span,
}: {
  no: string;
  label: string;
  children?: ReactNode;
  flag?: number;
  className?: string;
  span?: string;
}) {
  return (
    <div
      className={`relative border border-[#7C8495] px-1.5 pb-1 pt-0.5 ${
        flag ? "bg-rose-50 outline outline-2 outline-offset-[-1px] outline-rose-600" : "bg-white"
      } ${span ?? ""} ${className}`}
    >
      <p className="text-[8px] font-semibold uppercase leading-tight tracking-wide text-[#7C8495]">
        {no}. {label}
      </p>
      <p className="min-h-[1.1rem] font-mono text-[11px] leading-snug text-[#0B0F14]">{children}</p>
      {flag ? <Pin n={flag} /> : null}
    </div>
  );
}

/** Standard FAA Form 8130-3 block grid (approximate printable layout). */
function Form8130Preview() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#222A3B] bg-[#E8EAED] p-3">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-[#7C8495]">
        FAA Form 8130-3 · Authorized Release Certificate (block coordinates)
      </p>
      <div className="border border-[#7C8495] bg-white text-left">
        {/* Header row: Blocks 1–3 */}
        <div className="grid grid-cols-12">
          <Cell no="1" label="Approving CAA / Country" className="col-span-4">
            USA / FAA
          </Cell>
          <Cell
            no="2"
            label="AUTHORIZED RELEASE CERTIFICATE"
            className="col-span-5 text-center"
          >
            <span className="text-[10px] font-bold">FAA Form 8130-3</span>
          </Cell>
          <Cell no="3" label="Form Tracking Number" className="col-span-3">
            TRK-DEMO-10046
          </Cell>
        </div>
        {/* Blocks 4–5 */}
        <div className="grid grid-cols-12">
          <Cell no="4" label="Organization Name and Address" className="col-span-8">
            RIDGELINE AERO REPAIR · 1200 Hangar Rd, Wichita KS
          </Cell>
          <Cell no="5" label="Work Order / Contract / Invoice" className="col-span-4">
            WO-10046
          </Cell>
        </div>
        {/* Blocks 6–12 item table */}
        <div className="grid grid-cols-12">
          <Cell no="6" label="Item" className="col-span-1">
            1
          </Cell>
          <Cell no="7" label="Description" className="col-span-3">
            ACTUATOR ASSY, FLAP
          </Cell>
          <Cell no="8" label="Part No." className="col-span-2">
            DEMO-CERT-200
          </Cell>
          <Cell no="9" label="Eligibility" className="col-span-1">
            —
          </Cell>
          <Cell no="10" label="Qty" className="col-span-1">
            1
          </Cell>
          <Cell no="11" label="Serial / Batch" className="col-span-2">
            SN-4402
          </Cell>
          <Cell no="12" label="Status / Work" className="col-span-2">
            REPAIRED
          </Cell>
        </div>
        {/* Block 13 Remarks — full width */}
        <Cell no="13" label="Remarks" flag={4}>
          REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE.
        </Cell>
        {/* Blocks 14–18 approval strip */}
        <div className="grid grid-cols-12">
          <Cell no="14" label="New / Used / Rebuilt / Inspected" className="col-span-3">
            ☐ New ☐ Used ☑ Repaired
          </Cell>
          <Cell no="15" label="Authorized Signature" flag={2} className="col-span-3" />
          <Cell no="16" label="Name (Typed or Printed)" className="col-span-2">
            J. DOE
          </Cell>
          <Cell no="17" label="Approval / Authorization No." flag={1} className="col-span-2" />
          <Cell no="18" label="Date" flag={3} className="col-span-2">
            02/31/2026
          </Cell>
        </div>
        {/* Block 19 RTS */}
        <Cell no="19" label="14 CFR 43.9 Return to Service">
          ☐ Approved for return to service
        </Cell>
      </div>
    </div>
  );
}

/** FAA Form 8330-1 style Malfunction or Defect Report sections. */
function Form8330Preview() {
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#222A3B] bg-[#E8EAED] p-3">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-[#7C8495]">
        FAA Form 8330-1 · Malfunction or Defect Report (section coordinates)
      </p>
      <div className="border border-[#7C8495] bg-white text-left">
        <div className="border-b border-[#7C8495] bg-[#0B0F14] px-2 py-1 text-center text-[10px] font-bold text-white">
          MALFUNCTION OR DEFECT REPORT
        </div>
        <div className="grid grid-cols-2">
          <Cell no="A" label="Operator / Submitter" flag={1}>
            RIDGELINE AERO · incomplete address
          </Cell>
          <Cell no="B" label="Date of Report">
            2026-09-14
          </Cell>
        </div>
        <div className="grid grid-cols-3">
          <Cell no="C" label="Part Number" flag={2} />
          <Cell no="D" label="Serial / Batch">
            SN-4402
          </Cell>
          <Cell no="E" label="Date of Discovery" flag={3}>
            02/31/2026
          </Cell>
        </div>
        <div className="grid grid-cols-2">
          <Cell no="F" label="Aircraft / Engine / Appliance Make-Model">
            B737-800 / CFM56
          </Cell>
          <Cell no="G" label="Nature of Condition / Narrative" flag={4}>
            ACTUATOR BINDING. UNIT S/N SN-4420 REMOVED FOR EVALUATION.
          </Cell>
        </div>
        <div className="grid grid-cols-2">
          <Cell no="H" label="How Discovered">
            Scheduled inspection
          </Cell>
          <Cell no="I" label="Precautionary / Corrective Action">
            Quarantined pending engineering disposition
          </Cell>
        </div>
      </div>
    </div>
  );
}

export default function SampleReportClient() {
  const [form, setForm] = useState<"8130-3" | "8330-1">("8130-3");
  const findings = form === "8130-3" ? findings8130 : findings8330;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="mb-6 text-sm text-[#B0B6C3]">
        Fictional certificate for demonstration. OCR discrepancy pins map to the same block
        coordinates shops see on standard FAA forms.
      </p>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-white">
            DEMO-CERT-200 / SN-4402
          </h1>
          <p className="mt-1 text-sm text-[#7C8495]">
            Ridgeline Aero Repair (fictional) · 2026-09-14
          </p>
        </div>
        <div className="flex rounded-[4px] border border-[#1F2430] p-0.5">
          <button
            type="button"
            onClick={() => setForm("8130-3")}
            className={`rounded-[4px] px-3 py-1.5 text-sm ${
              form === "8130-3" ? "bg-[#161B24] text-white" : "text-[#B0B6C3] hover:text-white"
            }`}
          >
            Form 8130-3
          </button>
          <button
            type="button"
            onClick={() => setForm("8330-1")}
            className={`rounded-[4px] px-3 py-1.5 text-sm ${
              form === "8330-1" ? "bg-[#161B24] text-white" : "text-[#B0B6C3] hover:text-white"
            }`}
          >
            Form 8330-1
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {form === "8130-3" ? <Form8130Preview /> : <Form8330Preview />}

        <div className="space-y-4">
          <section className="rounded-[4px] border border-[#222A3B] bg-[#12151C] p-4">
            <h2 className="text-sm font-semibold text-white">
              Review recommended ({findings.length} findings)
            </h2>
            <ol className="mt-3 space-y-2">
              {findings.map((f) => (
                <li key={f.n} className="flex gap-3 text-sm text-white">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] bg-[#9F1239] text-[11px] font-bold text-white">
                    {f.n}
                  </span>
                  <span>
                    <span className="pp-track text-[#7C8495]">Blk {f.block}</span> · {f.text}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[4px] border border-[#222A3B] bg-[#12151C] p-4">
            <h2 className="text-sm font-semibold text-white">Safety data matches (1)</h2>
            <p className="mt-2 text-sm text-[#B0B6C3]">
              <span className="font-mono">AD TEST-AD-0002</span>: fictional directive for
              demonstration
            </p>
          </section>

          {form === "8130-3" && (
            <table className="w-full border border-[#1F2430] text-sm">
              <tbody>
                {fields8130.map(([k, v]) => (
                  <tr key={k} className="border-b border-[#1F2430] last:border-0">
                    <td className="w-44 p-2.5 text-[#B0B6C3]">{k}</td>
                    <td
                      className={`p-2.5 ${
                        v === "not found" || v === "No" ? "text-[#FFE4E6]" : "text-white"
                      }`}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="break-all font-mono text-[11px] text-[#7C8495]">
            File SHA-256:
            9f2c41d0a7e35b18c6d94f0e2a7b53c8d1e6f4a90b2c7d5e83f1a6b4c09d7e21
          </p>

          <p className="text-xs text-[#7C8495]">
            Automated records review only. Not an airworthiness determination. Safety-data matches
            cover only sources imported into PartPassport.
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

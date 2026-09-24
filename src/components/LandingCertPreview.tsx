/** Static high-density preview of a cleared 8130-3 intake — solid matte surfaces. */

import type { ReactNode } from "react";

const ROWS: { block: string; label: string; value: string }[] = [
 { block: "3", label: "Tracking", value: "TRK-2026-9011" },
 { block: "4", label: "Organization", value: "AeroPrecise Mfg · Wichita KS" },
 { block: "8", label: "Part number", value: "APV-7742-101" },
 { block: "11", label: "Serial", value: "SN-2026-0491" },
 { block: "12", label: "Status", value: "NEW" },
 { block: "16", label: "Approval", value: "CRS XYZW 123V" },
];

function StatusChip({
 tone,
 children,
}: {
 tone: "pass" | "warn";
 children: ReactNode;
}) {
 const cls =
 tone === "pass"
 ? "border-[#1F6B47] bg-[#1F6B47] text-white"
 : "border-[#B45309] bg-[#B45309] text-white";
 return (
 <span
 className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 pp-track text-[10px] font-semibold tracking-wide ${cls}`}
 >
 {children}
 </span>
 );
}

export default function LandingCertPreview() {
 return (
 <div className="bg-[#0B0F14]">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2430] px-4 py-3">
 <div>
 <p className="pp-track text-[10px] uppercase tracking-[0.18em] text-[#7C8495]">
 Certificate intake · FAA Form 8130-3
 </p>
 <p className="pp-track mt-0.5 text-sm text-white">APV-7742-101 / SN-2026-0491</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <StatusChip tone="pass">AVL PASS</StatusChip>
 <StatusChip tone="pass">LIFETIME OK</StatusChip>
 <StatusChip tone="pass">CHAIN INTACT</StatusChip>
 </div>
 </div>

 <div className="border-b border-[#1F6B47] bg-[#14281F] px-4 py-2.5">
 <p className="text-sm font-medium text-white">
 Clear — 0 findings · Deterministic OCR Pipeline complete
 </p>
 <p className="mt-0.5 text-xs text-[#B0B6C3]">
 Block integrity verified · Automated FAA UPN cross-reference: no matches
 </p>
 </div>

 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[#1F2430] text-left text-[10px] uppercase tracking-wider text-[#7C8495]">
 <th className="px-4 py-2 font-medium">Blk</th>
 <th className="px-4 py-2 font-medium">Field</th>
 <th className="px-4 py-2 font-medium">Extracted</th>
 <th className="px-4 py-2 font-medium text-right">State</th>
 </tr>
 </thead>
 <tbody>
 {ROWS.map((r) => (
 <tr key={r.block} className="border-b border-[#1F2430] last:border-0">
 <td className="pp-track px-4 py-2 text-[#7C8495]">{r.block}</td>
 <td className="px-4 py-2 text-[#B0B6C3]">{r.label}</td>
 <td className="pp-track px-4 py-2 text-white">{r.value}</td>
 <td className="px-4 py-2 text-right">
 <span className="inline-flex items-center gap-1 text-[#1F6B47]">
 <span aria-hidden>✓</span>
 <span className="pp-track text-[10px] font-semibold">OK</span>
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>

 <div className="grid grid-cols-3 divide-x divide-[#1F2430] border-t border-[#1F2430]">
 <div className="px-4 py-3">
 <p className="text-[10px] uppercase tracking-wider text-[#7C8495]">AVL</p>
 <p className="pp-track mt-1 text-xs text-white">On list · CRS XYZW 123V</p>
 </div>
 <div className="px-4 py-3">
 <p className="text-[10px] uppercase tracking-wider text-[#7C8495]">Life limits</p>
 <p className="pp-track mt-1 text-xs text-white">4200 / 8000 h</p>
 </div>
 <div className="px-4 py-3">
 <p className="text-[10px] uppercase tracking-wider text-[#7C8495]">UPN</p>
 <p className="pp-track mt-1 text-xs text-[#B0B6C3]">No flag</p>
 </div>
 </div>
 </div>
 );
}

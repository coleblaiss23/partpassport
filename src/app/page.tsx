import Link from "next/link";
import PartSearch from "@/components/PartSearch";
import LandingCertPreview from "@/components/LandingCertPreview";
import Logo from "@/components/Logo";
import { btnPrimary, btnSecondary } from "@/components/ui";

const pipelineNotes = [
 {
 title: "Deterministic OCR Pipeline",
 detail: "Blocks 3–23 extracted and validated — missing fields, blank signatures, impossible dates.",
 },
 {
 title: "AVL enforcement",
 detail: "Block 4 issuer checked against your Approved Vendor List. Failures surface as AVL FAIL.",
 },
 {
 title: "Automated FAA UPN cross-reference",
 detail: "Part number matched against imported unapproved-parts notices and related flags.",
 },
 {
 title: "Chain of Custody Ledger",
 detail: "Signed event sequence per serial. Tamper one link and verification fails at that point.",
 },
];

export default function Home() {
 return (
 <main className="bg-[#0B0F14]">
 <section className="border-b border-[#1F2430]">
 <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-2">
 <div className="border-b border-[#1F2430] px-4 py-14 lg:border-b-0 lg:border-r lg:px-8 lg:py-16">
 <div className="mb-5">
 <Logo size={36} />
 </div>
 <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
 Release certificate control before the part hits the shelf
 </h1>
 <p className="mt-5 max-w-lg text-base leading-relaxed text-[#B0B6C3]">
 Deterministic OCR on 8130-3 / Form 1. AVL enforcement. FAA UPN
 cross-reference. Signed custody ledger per serial.
 </p>
 <div className="mt-8 flex flex-wrap gap-2">
 <Link href="/request-access" className={btnPrimary}>
 Request pilot access
 </Link>
 <Link href="/sample-report" className={btnSecondary}>
 Sample report
 </Link>
 </div>
 <p className="mt-4 text-xs text-[#7C8495]">
 Not an airworthiness determination. For MROs and repair stations.
 </p>
 </div>

 <div className="bg-[#12151C] px-4 py-14 lg:px-8 lg:py-16">
 <div className="mb-5 flex items-center justify-between gap-2">
 <div>
 <p className="pp-track text-[10px] uppercase tracking-[0.18em] text-[#7C8495]">
 Public registry
 </p>
 <p className="mt-1 text-sm font-medium text-white">Look up a serialized part</p>
 </div>
 <span className="rounded-[4px] border border-[#1F6B47] bg-[#1F6B47] px-2 py-0.5 pp-track text-[10px] font-semibold text-white">
 LIVE
 </span>
 </div>
 <PartSearch compact />
 <p className="mt-5 border-t border-[#1F2430] pt-4 text-xs text-[#7C8495]">
 Try the demo:{" "}
 <Link href="/sample-part" className="text-white underline-offset-2 hover:underline">
 sample custody ledger
 </Link>
 {" · "}
 <Link href="/sample-report" className="text-white underline-offset-2 hover:underline">
 sample 8130-3 report
 </Link>
 </p>
 </div>
 </div>
 </section>

 <section className="border-b border-[#1F2430]">
 <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
 <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
 <div>
 <h2 className="text-lg font-semibold text-white">What the pipeline checks</h2>
 <p className="mt-1 max-w-xl text-sm text-[#B0B6C3]">
 Receiving inspection lives in tables and status badges. Below is the intake
 surface when an 8130-3 clears.
 </p>
 </div>
 <div className="flex flex-wrap gap-2">
 <span className="rounded-[4px] border border-[#1F6B47] bg-[#1F6B47] px-2 py-1 pp-track text-[10px] font-semibold text-white">
 AVL PASS
 </span>
 <span className="rounded-[4px] border border-[#1F6B47] bg-[#1F6B47] px-2 py-1 pp-track text-[10px] font-semibold text-white">
 LIFETIME OK
 </span>
 <span className="rounded-[4px] border border-[#B45309] bg-[#B45309] px-2 py-1 pp-track text-[10px] font-semibold text-white">
 REVIEW
 </span>
 </div>
 </div>

 <div className="grid border border-[#1F2430] lg:grid-cols-[1.35fr_1fr]">
 <LandingCertPreview />
 <ul className="divide-y divide-[#1F2430] border-t border-[#1F2430] lg:border-l lg:border-t-0">
 {pipelineNotes.map((item) => (
 <li key={item.title} className="bg-[#12151C] px-4 py-3.5">
 <p className="text-sm font-medium text-white">{item.title}</p>
 <p className="mt-1 text-sm leading-relaxed text-[#B0B6C3]">{item.detail}</p>
 </li>
 ))}
 </ul>
 </div>
 </div>
 </section>

 <section className="border-b border-[#1F2430] bg-[#12151C]">
 <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
 <div>
 <h2 className="text-base font-semibold text-white">Chain of Custody Ledger</h2>
 <p className="mt-2 max-w-md text-sm text-[#B0B6C3]">
 Inspections, repairs, and transfers are signed by the recording organization and
 linked in sequence. Tamper one event and verification fails at that point.
 </p>
 </div>
 <div className="flex shrink-0 flex-wrap gap-2">
 <Link href="/sample-part" className={btnPrimary}>
 Sample ledger
 </Link>
 <Link href="/sample-part?tamper=1" className={btnSecondary}>
 Broken chain
 </Link>
 </div>
 </div>
 </section>

 <section className="border-b border-[#1F2430]">
 <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
 <h2 className="text-base font-semibold text-white">Built for the hangar floor</h2>
 <div className="mt-6 grid border border-[#1F2430] sm:grid-cols-3">
 {[
 {
 t: "Receiving inspection",
 d: "Run the PDF on arrival. Catch AVL failures and missing blocks before put-away.",
 },
 {
 t: "Traders and distributors",
 d: "Put a public verify link on the quote so the buyer can open the custody ledger without another email thread.",
 },
 {
 t: "Repair station quality",
 d: "Generate a 14 CFR 43.9 RTS draft from a verified certificate, and block installation of expired life-limited assemblies.",
 },
 ].map((item, i) => (
 <div
 key={item.t}
 className={`bg-[#12151C] p-4 text-sm text-[#B0B6C3] ${i > 0 ? "border-t border-[#1F2430] sm:border-l sm:border-t-0" : ""}`}
 >
 <p className="font-medium text-white">{item.t}</p>
 <p className="mt-1 leading-relaxed">{item.d}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section>
 <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-10 lg:px-8">
 <p className="text-sm text-[#B0B6C3]">
 Pilot plan is free. Paid plans when volume grows.
 </p>
 <div className="flex gap-2">
 <Link href="/request-access" className={btnPrimary}>
 Request access
 </Link>
 <Link href="/pricing" className={btnSecondary}>
 Pricing
 </Link>
 </div>
 </div>
 </section>
 </main>
 );
}

import Link from "next/link";
import PartSearch from "@/components/PartSearch";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";

const steps = [
  ["1", "Scan the certificate", "Drop in an 8130-3 or EASA Form 1 PDF. We read it and check it for missing, inconsistent or suspicious details."],
  ["2", "Review the findings", "Missing signatures, impossible dates, serial mismatches and matches against airworthiness directives and service difficulty reports appear in a shareable report."],
  ["3", "Give the part a signed history", "Register the part and sign each inspection, repair, sale and installation. Anyone can verify the chain and see if it was altered."],
];
const features = [
  ["AI certificate review", "Reads scanned or digital certificates and extracts the key fields."],
  ["Built-in consistency checks", "Flags missing signatures, invalid dates and serial numbers that don't match."],
  ["Safety-data matching", "Compares part and serial numbers against imported AD and SDR data."],
  ["Tamper-evident history", "Every event is hash-chained and digitally signed. Changes break the chain."],
  ["Batch scanning", "Upload up to 20 PDFs at once and review each beside its findings."],
  ["Shareable reports", "Send a clean audit report to a buyer, seller or auditor with one link."],
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-4xl space-y-6 px-4 pb-8 pt-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Know a part&apos;s paperwork is right before it reaches your shelf</h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">Part Passport reviews release certificates for problems and gives every part a signed, tamper-evident history.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/request-access" className={btnPrimary}>Request access</Link>
          <Link href="/sample-report" className={btnSecondary}>See a sample report</Link>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-6">
        <p className="mb-2 text-center text-sm text-slate-400">Look up a part in the public registry</p>
        <PartSearch />
        <p className="mt-2 text-center text-xs text-slate-500">No part handy? <Link href="/verify/DEMO-881-2001/DEMO-0001" className="text-emerald-400 hover:underline">Try a sample part</Link></p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">How it works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <Card key={n}><span className="text-sm font-medium text-emerald-400">Step {n}</span><h3 className="mt-1 font-medium text-white">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">Built for parts buyers, sellers and repair stations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => <Card key={t}><h3 className="font-medium text-white">{t}</h3><p className="mt-1 text-sm text-slate-400">{d}</p></Card>)}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">Part Passport checks whether records are consistent. It is not an airworthiness determination.</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-2xl font-semibold text-white">Try it on your own certificates</h2>
        <p className="mt-2 text-slate-400">Start with the free Pilot plan. Upgrade when your team is ready.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/request-access" className={btnPrimary}>Request access</Link>
          <Link href="/pricing" className={btnSecondary}>View pricing</Link>
        </div>
      </section>
    </main>
  );
}

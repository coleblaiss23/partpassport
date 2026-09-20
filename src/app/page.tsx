import Link from "next/link";
import PartSearch from "@/components/PartSearch";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";

const catches = [
  ["Blank signature block", "No authorized signature in block 16, so the release means nothing."],
  ["Dates that don't exist", "A release dated 02/31/2026, or one dated in the future."],
  ["Serial numbers that disagree", "Block 11 says SN-4402, the remarks say SN-4420."],
  ["Parts named in a safety directive", "Part and serial match an imported AD or service difficulty report."],
];
const roles = [
  ["Receiving inspection", "A used actuator arrives with a certificate that looks fine at a glance. Drop the PDF in and get the problems in seconds, with the flagged blocks marked on the page."],
  ["Parts traders and distributors", "Buyers hesitate when paperwork is thin. A signed history plus a clean report they can open with one link shortens the conversation."],
  ["Repair station quality", "Each inspection, repair and transfer is signed by your organization, so the record holds up when someone asks who did what and when."],
];
const findings = ["Approval/authorization number is missing", "Authorized signature appears to be missing", "Date \"02/31/2026\" is not a valid calendar date", "Serial in remarks (SN-4420) does not match serial field (SN-4402)"];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-10 pt-16 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <p className="text-sm font-medium text-emerald-400">Release certificate review for aircraft parts</p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">Catch paperwork problems before the part is on your shelf.</h1>
          <p className="max-w-xl text-lg text-slate-400">PartPassport reads 8130-3 and EASA Form 1 certificates, flags what is missing or doesn&apos;t add up, and gives each part a signed history that anyone can check.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/request-access" className={btnPrimary}>Request access</Link>
            <Link href="/sample-report" className={btnSecondary}>See a sample report</Link>
          </div>
          <p className="text-sm text-slate-500">Pilot access is free.</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-white">DEMO-CERT-200 / SN-4402</p>
            <span className="rounded-full border border-amber-800 bg-amber-950 px-2 py-0.5 text-xs text-amber-300">4 findings</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {findings.map((f) => (
              <li key={f} className="flex gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />{f}</li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Example output from a fictional certificate</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className="text-lg font-medium text-white">Look up a part</h2>
          <PartSearch />
          <p className="text-sm text-slate-500">Nothing to hand? <Link href="/sample-part" className="text-emerald-400 hover:underline">Open a sample passport</Link></p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-white">What it catches</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catches.map(([t, d]) => <Card key={t}><h3 className="font-medium text-white">{t}</h3><p className="mt-1.5 text-sm leading-relaxed text-slate-400">{d}</p></Card>)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid items-center gap-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 lg:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white">A history nobody can quietly edit</h2>
            <p className="text-slate-400">Every inspection, repair, sale and installation is signed by the organization that did it and linked to the event before. Change one record and every check after it fails, and the failure points to the exact event.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/sample-part" className={btnPrimary}>Open a signed history</Link>
            <Link href="/sample-part?tamper=1" className={btnSecondary}>See what an edit looks like</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold tracking-tight text-white">How shops use it</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {roles.map(([t, d]) => <div key={t} className="border-t border-slate-700 pt-4"><h3 className="font-medium text-white">{t}</h3><p className="mt-2 text-sm leading-relaxed text-slate-400">{d}</p></div>)}
        </div>
      </section>

      <section className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-12">
          <div>
            <h2 className="text-xl font-semibold text-white">Start with your own certificates</h2>
            <p className="mt-1 text-slate-400">The Pilot plan is free. Upgrade when your volume grows.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/request-access" className={btnPrimary}>Request access</Link>
            <Link href="/pricing" className={btnSecondary}>See pricing</Link>
          </div>
        </div>
      </section>
      <p className="px-4 pb-10 text-center text-xs text-slate-600">PartPassport checks whether records are consistent. It is not an airworthiness determination.</p>
    </main>
  );
}

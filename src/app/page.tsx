import Link from "next/link";
import PartSearch from "@/components/PartSearch";
import { btnPrimary, btnSecondary } from "@/components/ui";

const catches = [
  {
    title: "Blank signature block",
    detail: "No authorized signature in block 16 — the release is incomplete.",
  },
  {
    title: "Impossible dates",
    detail: "Values like 02/31/2026, or a release dated in the future.",
  },
  {
    title: "Serial numbers that disagree",
    detail: "Block 11 says one serial; remarks list another.",
  },
  {
    title: "Safety data on the part number",
    detail: "Part number matches an imported FAA unapproved-parts notice or related flag.",
  },
];

export default function Home() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-2xl px-4 pb-12 pt-14">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Check relee certificates before the part hits the shelf
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            PartPassport reads FAA Form 8130-3 and EASA Form 1 PDFs, flags missing
            blocks and internal contradictions, and keeps a signed event history per
            serial. It does not determine airworthiness.
          </p>
          <div className="mt-8 rounded border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm text-slate-300">Look up a part</p>
            <PartSearch />
            <p className="mt-3 text-sm text-slate-500">
              No serial handy?{" "}
              <Link href="/sample-report" className="text-emerald-500 hover:underline">
                Sample certificate report
              </Link>
              {" · "}
              <Link href="/sample-part" className="text-emerald-500 hover:underline">
                Sample signed history
              </Link>
            </p>
          </div>
          <p clssName="mt-4 text-sm text-slate-500">
            Shop access:{" "}
            <Link href="/request-access" className="text-slate-300 hover:underline">
              request pilot access
            </Link>{" "}
            (free).
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12">
        <h2 className="text-base font-semibold text-white">What the check looks for</h2>
        <ul className="mt-4 divide-y divide-slate-800 rounded border border-slate-800">
          {catches.map((item) => (
            <li key={item.title} className="px-4 py-3">
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-slate-900 bg-slate-900/30">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Signed event history</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">
              Inspections, repairs, and transfers are signed by the organization that
              recorded them and linked in sequence. Change one event and later checks
              fail at that point.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/sample-part" className={btnPrimary}>
              Sample history
            </Link>
            <Link href="/sample-part?tamper=1" className={btnSecondary}>
              Broken chain
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-12">
        <h2 className="text-base font-semibold text-white">Who uses it</h2>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-400">
          <div>
            <p className="font-medium text-slate-200">Receiving inspection</p>
            <p className="mt-1">
              Run the PDF when the part arrives. See missing blocks before the unit is
              put away.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-200">Traders and distributors</p>
            <p className="mt-1">
              Put a public verify link on the quote so the buyer can open the history
              without another email thread.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-200">Repair station quality</p>
            <p className="mt-1">
              Events are tied to your organization. When someone asks who signed what,
              the chain is the record.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-900">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-10">
          <p className="text-sm text-slate-400">
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

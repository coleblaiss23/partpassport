import Link from "next/link";

const ROWS = [
  {
    step: "1",
    title: "Identify the part",
    body: "Buyer or inspector enters the part number and serial from the data plate or shipping documents.",
  },
  {
    step: "2",
    title: "Review the event chain",
    body: "Each lifecycle event (created, installed, overhauled, inspected) is hash-linked and signed by the organization that recorded it.",
  },
  {
    step: "3",
    title: "Check certificate hashes",
    body: "When an 8130-3 or Form 1 was attached, only a SHA-256 hash is stored. Anyone with the original PDF can re-hash and compare.",
  },
  {
    step: "4",
    title: "Read the verdict",
    body: "Clear means the recorded chain checks out. Watch means documentation gaps. Hold means a serious flag or broken chain—not a shop floor release.",
  },
];

export default function SampleReportPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 space-y-10">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">
            Sample report
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            What a PartPassport verify page shows
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            This walkthrough uses demo serials. It exains the product for
            buyers and quality managers. It is not a real aircraft record and
            not an airworthiness finding.
          </p>
        </div>

        <ol className="space-y-4">
          {ROWS.map((row) => (
            <li
              key={row.step}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
            >
              <p className="text-xs font-mono text-slate-500">Step {row.step}</p>
              <h2 className="mt-1 font-semibold text-white">{row.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {row.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <h2 className="font-semibold">Open a live demo serial</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/verify/TFE731-5BR/P-88211"
                className="font-mono text-emerald-400 hover:underline"
              >
                TFE731-5BR / P-88211
              </Link>
              <span className="text-slate-500"> — clear</span>
            </li>
            <li>
              <Link
                href="/verify/APU-36-150/SN-77401"
                className="font-mono text-emerald-400 hover:underline"
              >
                APU-36-150 / SN-77401
              </Link>
              <span className="text-slate-500"> — watch</span>
            </li>
            <li>
              <Link
                href="/verify/CSD-400-1/44102"
                className="font-mono text-emerald-400 hover:underline"
              >
                CSD-400-1 / 44102
              </Link>
              <span className="text-slate-500"> — hold</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-600">
          Documentation integrity only. Not an airworthiness determination.
  </p>
      </div>
    </main>
  );
}

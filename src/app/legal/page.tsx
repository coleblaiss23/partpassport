import Link from "next/link";

export default function LegalPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms and limits</h1>
        <div className="space-y-4 text-sm leading-relaxed text-slate-400">
          <p>
            PartPassport records documentation events and cryptographic hashes
            related to aircraft parts. A verified chain means the recorded events
            and signatures check mathematically. It does not mean a part is
            airworthy, eligible for installation, or free of unapproved parts.
          </p>
          <p>
            Airworthiness and return-to-service decisions remain with persons and
            organizations authorized under applicable aviation regulations
            (including 14 CFR Parts 21, 43, and 145 and equivalent authorities).
          </p>
          <p>
            Users are responsible for the accuracy of data they submit and for
            only uploading documents they are permitted to process.
          </p>
        </div>

        <Link href="/" className="text-sm text-emerald-500 hover:underline">
          ← Home
        </Link>
      </div>
    </main>
  );
}

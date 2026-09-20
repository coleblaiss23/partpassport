import Link from "next/link";
import PassportView from "@/components/PassportView";
import { demoResult } from "@/lib/demoChain";
import { btnSecondary } from "@/components/ui";

export const metadata = { title: "Sample part passport" };
export const dynamic = "force-dynamic";

export default async function SamplePart({ searchParams }: { searchParams: Promise<{ tamper?: string }> }) {
  const tamper = (await searchParams).tamper === "1";
  const r = demoResult(tamper);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PassportView
        r={r}
        banner={
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
            <span>Sample passport with fictional organizations. The signatures are real and checked when this page loads.</span>
            {tamper
              ? <Link href="/sample-part" className={btnSecondary}>Show the untouched record</Link>
              : <Link href="/sample-part?tamper=1" className={btnSecondary}>Edit one event and re-check</Link>}
          </div>
        }
      />
    </main>
  );
}

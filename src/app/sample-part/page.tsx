import Link from "next/link";
import PassportView from "@/components/PassportView";
import { demoResult } from "@/lib/demoChain";
import { btnSecondary } from "@/components/ui";

export const metadata = { title: "Sample part passport" };
export const dynamic = "force-dynamic";

export default async function SamplePart({
 searchParams,
}: {
 searchParams: Promise<{ tamper?: string }>;
}) {
 const tamper = (await searchParams).tamper === "1";
 const r = demoResult(tamper);
 return (
 <main className="mx-auto max-w-3xl px-4 py-10">
 <PassportView
 r={r}
 banner={
 <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#1F2430] bg-[#12151C] p-3 text-sm text-[#B0B6C3]">
 <span>
 Sample passport. Organizations are fictional; signatures are checked when
 this page loads.
 </span>
 {tamper ? (
 <Link href="/sample-part" className={btnSecondary}>
 Untouched record
 </Link>
 ) : (
 <Link href="/sample-part?tamper=1" className={btnSecondary}>
 Show a broken chain
 </Link>
 )}
 </div>
 }
 />
 </main>
 );
}

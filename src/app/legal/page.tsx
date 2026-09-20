import Link from "next/link";
import { Card } from "@/components/ui";

export const metadata = { title: "Legal | PartPassport" };

export default function LegalHub() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Legal</h1>
      <Card className="border-amber-700"><p className="text-sm text-amber-200">PartPassport provides cryptographic record integrity and does not certify airworthiness. It is not an FAA or EASA approved document, and it does not replace required inspections or approvals.</p></Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/terms"><Card className="hover:border-emerald-600"><h2 className="font-medium text-white">Terms of Service</h2><p className="mt-1 text-sm text-slate-400">Rules for using the service.</p></Card></Link>
        <Link href="/privacy"><Card className="hover:border-emerald-600"><h2 className="font-medium text-white">Privacy Policy</h2><p className="mt-1 text-sm text-slate-400">What we collect and how documents are processed.</p></Card></Link>
      </div>
    </main>
  );
}

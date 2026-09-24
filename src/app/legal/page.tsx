import Link from "next/link";
import { Card } from "@/components/ui";

export const metadata = { title: "Legal | PartPassport" };

export default function LegalHub() {
 return (
 <main className="mx-auto max-w-2xl space-y-5 px-4 py-10">
 <h1 className="text-2xl font-semibold tracking-tight text-white">Legal</h1>
 <p className="text-sm text-[#B0B6C3]">
 PartPassport provides record integrity checks and signed event histories. It
 does not certify airworthiness, replace required inspections, or act as an
 FAA or EASA approval.
 </p>
 <div className="grid gap-3 sm:grid-cols-2">
 <Link href="/terms">
 <Card className="hover:border-[#222A3B]">
 <h2 className="text-sm font-medium text-white">Terms of Service</h2>
 <p className="mt-1 text-sm text-[#B0B6C3]">Rules for using the service.</p>
 </Card>
 </Link>
 <Link href="/privacy">
 <Card className="hover:border-[#222A3B]">
 <h2 className="text-sm font-medium text-white">Privacy Policy</h2>
 <p className="mt-1 text-sm text-[#B0B6C3]">
 What we collect and how documents are processed.
 </p>
 </Card>
 </Link>
 </div>
 </main>
 );
}

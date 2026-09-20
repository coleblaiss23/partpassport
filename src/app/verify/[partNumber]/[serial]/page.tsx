import Link from "next/link";
import { verifyPart } from "@/lib/verifyChain";
import PassportView from "@/components/PassportView";
import { Card, btnSecondary } from "@/components/ui";

export const revalidate = 15; // brief cache so a busy part doesn't hit the database on every view

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export default async function VerifyPage({ params }: { params: Promise<{ partNumber: string; serial: string }> }) {
  const p = await params;
  const pn = decode(p.partNumber), sn = decode(p.serial);
  const r = await verifyPart(pn, sn);

  if (!r)
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Card>
          <h1 className="text-xl font-semibold text-white">No record found</h1>
          <p className="mt-2 text-sm text-slate-400"><span className="font-mono">{pn} / {sn}</span> has no passport in the registry. That doesn&apos;t mean the part is bad. It means no organization has registered it here.</p>
        </Card>
        <Link href="/" className={btnSecondary}>Search again</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <PassportView r={r} exportHref={`/api/verify/${encodeURIComponent(pn)}/${encodeURIComponent(sn)}/export`} />
    </main>
  );
}

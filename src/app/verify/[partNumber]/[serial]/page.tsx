import Link from "next/link";
import { verifyPart } from "@/lib/verifyChain";
import PassportView from "@/components/PassportView";
import { Card, btnSecondary } from "@/components/ui";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const revalidate = 15; // brief cache so a busy part doesn't hit the database on every view

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export default async function VerifyPage({ params }: { params: Promise<{ partNumber: string; serial: string }> }) {
  const p = await params;
  const pn = decode(p.partNumber), sn = decode(p.serial);
  const r = await verifyPart(pn, sn);

  // Normalize the part number to match database safety flag records
  const normalizedPartNumber = pn.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Query live FAA UPN safety flags from your database
  const safetyFlags = await prisma.safetyFlag.findMany({
    where: { partNumberNorm: normalizedPartNumber },
  });

  if (!r && safetyFlags.length === 0)
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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      {/* Active FAA Safety Flags / UPN Warning Banner */}
      {safetyFlags.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-5 text-red-200 shadow-lg">
          <div className="flex items-center space-x-2 font-semibold text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>FAA Safety Alert: Unapproved Parts Notification (UPN) Detected</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {safetyFlags.map((flag) => (
              <li key={flag.id} className="border-t border-red-900/50 pt-2 first:border-0 first:pt-0">
                <p className="font-medium text-white">{flag.description}</p>
                <div className="mt-1 flex items-center space-x-3 text-xs text-red-300">
                  <span>Reference: {flag.referenceId}</span>
                  {flag.url && (
                    <a href={flag.url} target="_blank" rel="noreferrer" className="underline hover:text-white">
                      View FAA Notice &rarr;
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r ? (
        <PassportView r={r} exportHref={`/api/verify/${encodeURIComponent(pn)}/${encodeURIComponent(sn)}/export`} />
      ) : (
        <Card>
          <h1 className="text-xl font-semibold text-white">Unverified Passport Registry Status</h1>
          <p className="mt-2 text-sm text-slate-400">Although safety flags exist for this part number, no specific asset passport has been committed for serial number <span className="font-mono">{sn}</span>.</p>
        </Card>
      )}
    </main>
  );
}
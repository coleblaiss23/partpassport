import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { AuditShareManager } from "./AuditShareManager";
import { safeAuditShareBundle } from "@/lib/mroQueries";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit share | PartPassport" };

export default async function AuditSharePage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const { shares, checks, parts, error } = await safeAuditShareBundle(org.id);

  return (
    <>
      {error && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <Card className="border-[#B45309] bg-[#1C1408] text-sm text-[#FFEDD5]">{error}</Card>
        </div>
      )}
      <AuditShareManager
        initial={shares.map((s) => ({
          id: s.id,
          label: s.label,
          packageType: s.packageType,
          resourceId: s.resourceId,
          expiresAt: s.expiresAt.toISOString(),
          revokedAt: s.revokedAt?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
        }))}
        checks={checks.map((c) => ({
          id: c.id,
          fileName: c.fileName,
          createdAt: c.createdAt.toISOString(),
        }))}
        parts={parts}
      />
    </>
  );
}

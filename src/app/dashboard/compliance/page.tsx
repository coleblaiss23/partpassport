import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { ComplianceManager } from "@/components/mro/ComplianceAndCustody";
import { SafetyMonitorBanner } from "@/components/SafetyMonitorBanner";
import { normPN } from "@/lib/normalize";
import { safeComplianceBundle } from "@/lib/mroQueries";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compliance | PartPassport" };

export default async function CompliancePage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const { items, vendorExpiring, held, safety, error } = await safeComplianceBundle(org.id);

  const heldNorm = new Set(held.map((p) => normPN(p.partNumber)));
  const alerts = safety
    .filter((f) => heldNorm.has(f.partNumberNorm))
    .slice(0, 20)
    .map((f) => ({
      id: f.id,
      source: f.source,
      referenceId: f.referenceId,
      description: f.description,
      partNumber: f.partNumber,
      issuedDate: f.issuedDate,
      url: f.url,
    }));

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-4xl space-y-4 px-4 pt-8">
        {error && (
          <Card className="border-[#B45309] bg-[#1C1408] text-sm text-[#FFEDD5]">{error}</Card>
        )}
        <SafetyMonitorBanner alerts={alerts} />
      </div>
      <ComplianceManager
        initial={items.map((i) => ({
          id: i.id,
          category: i.category,
          name: i.name,
          reference: i.reference,
          expiresAt: i.expiresAt.toISOString(),
          notes: i.notes,
        }))}
        vendorExpiring={vendorExpiring
          .filter((v) => v.expiresAt)
          .map((v) => ({
            supplierName: v.supplierName,
            certificateNumber: v.certificateNumber,
            expiresAt: v.expiresAt!.toISOString(),
          }))}
      />
    </div>
  );
}

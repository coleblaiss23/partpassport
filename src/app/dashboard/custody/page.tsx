import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { CustodyBoard } from "@/components/mro/ComplianceAndCustody";
import { safeCustodyParts } from "@/lib/mroQueries";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Custody | PartPassport" };

export default async function CustodyPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  let parts: Awaited<ReturnType<typeof safeCustodyParts>> = [];
  let loadError: string | null = null;
  try {
    parts = await safeCustodyParts(org.id);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load custody data";
  }

  return (
    <>
      {loadError && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <Card className="border-[#B45309] bg-[#1C1408] text-sm text-[#FFEDD5]">
            Could not load custody shelves. {loadError}
          </Card>
        </div>
      )}
      <CustodyBoard initial={parts} />
    </>
  );
}

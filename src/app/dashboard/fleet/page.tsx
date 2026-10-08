import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { FleetManager } from "@/components/fleet/FleetManager";
import { aircraftLimit } from "@/lib/planLimits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fleet | PartPassport" };

export default async function FleetPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const aircraft = await prisma.aircraft.findMany({
    where: { organizationId: org.id },
    orderBy: { tailNumber: "asc" },
    include: {
      adStatuses: {
        where: { status: { in: ["OPEN", "OVERDUE"] } },
        select: { id: true },
      },
    },
  });

  const limit = aircraftLimit(org);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <PageHeader
        title="Fleet"
        subtitle="Tail number hub — AD status, life-limited parts, and invoices per aircraft."
      />
      <FleetManager
        aircraftLimit={limit}
        initial={aircraft.map((a) => ({
          id: a.id,
          tailNumber: a.tailNumber,
          make: a.make,
          model: a.model,
          year: a.year,
          airframeHours: a.airframeHours,
          openAds: a.adStatuses.length,
        }))}
      />
    </main>
  );
}

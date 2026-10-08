import { notFound, redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { TailDashboard } from "@/components/fleet/TailDashboard";

export const dynamic = "force-dynamic";

export default async function TailPage({
  params,
}: {
  params: Promise<{ tail: string }>;
}) {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const { tail } = await params;
  const tailNumber = decodeURIComponent(tail).toUpperCase();

  const aircraft = await prisma.aircraft.findUnique({
    where: {
      organizationId_tailNumber: { organizationId: org.id, tailNumber },
    },
    include: {
      adStatuses: {
        include: {
          safetyFlag: {
            select: {
              referenceId: true,
              description: true,
              source: true,
              url: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
      lifeLimitedComponents: { orderBy: { dueAt: "asc" } },
      invoices: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!aircraft) notFound();

  const openAds = aircraft.adStatuses.filter(
    (s) => s.status === "OPEN" || s.status === "OVERDUE",
  ).length;
  const overdueLlp = aircraft.lifeLimitedComponents.filter(
    (c) => c.dueAt && c.dueAt < new Date(),
  ).length;
  const pendingInvoices = aircraft.invoices.filter((i) => i.paymentStatus === "PENDING").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <TailDashboard
        aircraft={{
          id: aircraft.id,
          tailNumber: aircraft.tailNumber,
          make: aircraft.make,
          model: aircraft.model,
          year: aircraft.year,
          series: aircraft.series,
          serialNumber: aircraft.serialNumber,
          engineModel: aircraft.engineModel,
          airframeHours: aircraft.airframeHours,
          hobbsHours: aircraft.hobbsHours,
          openAds,
          overdueLlp,
          pendingInvoices,
        }}
        adStatuses={aircraft.adStatuses.map((s) => ({
          id: s.id,
          status: s.status,
          dueAt: s.dueAt?.toISOString() ?? null,
          compliedAt: s.compliedAt?.toISOString() ?? null,
          signedOffByName: s.signedOffByName,
          notes: s.notes,
          safetyFlag: s.safetyFlag,
        }))}
        lifeLimited={aircraft.lifeLimitedComponents.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          limitBasis: c.limitBasis,
          dueAt: c.dueAt?.toISOString() ?? null,
          currentHours: c.currentHours,
          currentCycles: c.currentCycles,
          intervalHours: c.intervalHours,
          intervalDays: c.intervalDays,
          lastCompliedAt: c.lastCompliedAt?.toISOString() ?? null,
        }))}
        invoices={aircraft.invoices.map((i) => ({
          id: i.id,
          number: i.number,
          amountCents: i.amountCents,
          currency: i.currency,
          paymentStatus: i.paymentStatus,
          createdAt: i.createdAt.toISOString(),
          paidAt: i.paidAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}

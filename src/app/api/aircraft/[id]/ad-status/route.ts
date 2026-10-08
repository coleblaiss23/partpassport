import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import type { ComplianceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUSES: ComplianceStatus[] = ["OPEN", "COMPLIED", "NOT_APPLICABLE", "OVERDUE"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const aircraft = await prisma.aircraft.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!aircraft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await prisma.aircraftADStatus.findMany({
    where: { aircraftId: id },
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
  });

  return NextResponse.json({ items });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const aircraft = await prisma.aircraft.findFirst({
    where: { id, organizationId: org.id },
    select: { id: true },
  });
  if (!aircraft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const statusId = typeof body.statusId === "string" ? body.statusId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!statusId || !STATUSES.includes(status as ComplianceStatus)) {
    return NextResponse.json(
      { error: "statusId and status (OPEN|COMPLIED|NOT_APPLICABLE|OVERDUE) required" },
      { status: 400 },
    );
  }

  const existing = await prisma.aircraftADStatus.findFirst({
    where: { id: statusId, aircraftId: id },
  });
  if (!existing) return NextResponse.json({ error: "AD status not found" }, { status: 404 });

  const updated = await prisma.aircraftADStatus.update({
    where: { id: statusId },
    data: {
      status: status as ComplianceStatus,
      notes: typeof body.notes === "string" ? body.notes : existing.notes,
      compliedAt:
        status === "COMPLIED"
          ? body.compliedAt
            ? new Date(body.compliedAt)
            : new Date()
          : existing.compliedAt,
      signedOffByName:
        typeof body.signedOffByName === "string"
          ? body.signedOffByName
          : existing.signedOffByName,
      signedOffByUserId:
        typeof body.signedOffByUserId === "string"
          ? body.signedOffByUserId
          : existing.signedOffByUserId,
      signedOffAt: status === "COMPLIED" ? new Date() : existing.signedOffAt,
      certificateRef:
        typeof body.certificateRef === "string"
          ? body.certificateRef
          : existing.certificateRef,
    },
  });

  return NextResponse.json({ item: updated });
}

import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/planLimits";
import type { WorkOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workOrders = await prisma.workOrder.findMany({
    where: { organizationId: org.id },
    orderBy: { openedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ workOrders });
}

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canUseFeature(org, "workOrders")) {
    return NextResponse.json(
      { error: "Custom work orders require Professional or Enterprise." },
      { status: 402 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const count = await prisma.workOrder.count({ where: { organizationId: org.id } });
  const number =
    typeof body.number === "string" && body.number.trim()
      ? body.number.trim().toUpperCase()
      : `WO-${String(count + 1).padStart(4, "0")}`;

  const status = (
    ["DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELED"] as WorkOrderStatus[]
  ).includes(body.status)
    ? (body.status as WorkOrderStatus)
    : "DRAFT";

  const workOrder = await prisma.workOrder.create({
    data: {
      organizationId: org.id,
      number,
      title,
      description: typeof body.description === "string" ? body.description : null,
      status,
      shopId: typeof body.shopId === "string" ? body.shopId : null,
      aircraftId: typeof body.aircraftId === "string" ? body.aircraftId : null,
      assignedMechanicUserId:
        typeof body.assignedMechanicUserId === "string"
          ? body.assignedMechanicUserId
          : null,
    },
  });

  return NextResponse.json({ workOrder }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionOrgFromRequest } from "@/lib/auth";

/**
 * Delete a part in this org's custody (and this org's events on it).
 * If other orgs still have events on the part, only this org's events are removed
 * and custody is cleared; otherwise the part row is removed.
 */
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const org = await sessionOrgFromRequest(request);
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await props.params;

  const part = await prisma.part.findFirst({
    where: {
      id,
      OR: [{ currentOrgId: org.id }, { events: { some: { organizationId: org.id } } }],
    },
    include: { events: { select: { id: true, organizationId: true } } },
  });
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const foreignEvents = part.events.filter((e) => e.organizationId !== org.id);
  await prisma.$transaction(async (tx) => {
    await tx.partEvent.deleteMany({ where: { partId: id, organizationId: org.id } });
    if (foreignEvents.length === 0) {
      await tx.part.delete({ where: { id } });
    } else if (part.currentOrgId === org.id) {
      await tx.part.update({ where: { id }, data: { currentOrgId: null } });
    }
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      action: "PART_DELETED",
      meta: JSON.stringify({
        partId: id,
        partNumber: part.partNumber,
        serialNumber: part.serialNumber,
        removedEntirely: foreignEvents.length === 0,
      }),
    },
  });
  return NextResponse.json({ ok: true, removedEntirely: foreignEvents.length === 0 });
}

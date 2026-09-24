import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  custodyStatus: z.enum(["QUARANTINE", "SERVICEABLE", "UNSERVICEABLE"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid custody status" }, { status: 400 });
  }

  const part = await prisma.part.findFirst({
    where: { id, currentOrgId: org.id },
  });
  if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

  const updated = await prisma.part.update({
    where: { id },
    data: { custodyStatus: parsed.data.custodyStatus },
    select: { id: true, custodyStatus: true },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      action: "CUSTODY_STATUS",
      meta: JSON.stringify({ partId: id, custodyStatus: parsed.data.custodyStatus }),
    },
  });

  return NextResponse.json(updated);
}

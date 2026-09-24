import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionOrgFromRequest } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

const clearCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export async function POST(request: Request) {
  const org = await sessionOrgFromRequest(request);
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== org.name) {
    return NextResponse.json({ error: "Type the organization name to confirm deletion" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.approvedVendor.deleteMany({ where: { organizationId: org.id } });
      await tx.apiKey.deleteMany({ where: { organizationId: org.id } });
      await tx.auditLog.deleteMany({ where: { organizationId: org.id } });
      await tx.certificateCheck.deleteMany({ where: { organizationId: org.id } });
      await tx.partEvent.deleteMany({ where: { organizationId: org.id } });

      // Remove parts that no longer have any events (fully owned by this org).
      const orphaned = await tx.part.findMany({
        where: {
          OR: [{ currentOrgId: org.id }, { events: { none: {} } }],
        },
        select: { id: true, _count: { select: { events: true } } },
      });
      const toDelete = orphaned.filter((p) => p._count.events === 0).map((p) => p.id);
      if (toDelete.length) {
        await tx.part.deleteMany({ where: { id: { in: toDelete } } });
      }
      await tx.part.updateMany({ where: { currentOrgId: org.id }, data: { currentOrgId: null } });
      await tx.organization.delete({ where: { id: org.id } });
    });
  } catch (e) {
    console.error("[organization/delete]", e);
    return NextResponse.json(
      { error: "Could not delete organization. Some related records may still be locked." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearCookie);
  return res;
}

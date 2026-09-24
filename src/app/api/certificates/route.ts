import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionOrgFromRequest } from "@/lib/auth";

/** Delete all certificate checks for the session org (with confirmation). */
export async function DELETE(request: Request) {
 const org = await sessionOrgFromRequest(request);
 if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await request.json().catch(() => ({}));
 if (body.confirm !== "DELETE CHECKS") {
 return NextResponse.json(
 { error: 'Type "DELETE CHECKS" to confirm clearing certificate checks' },
 { status: 400 }
 );
 }

 const result = await prisma.certificateCheck.deleteMany({ where: { organizationId: org.id } });
 await prisma.auditLog.create({
 data: {
 organizationId: org.id,
 action: "CHECKS_CLEARED",
 meta: JSON.stringify({ count: result.count }),
 },
 });
 return NextResponse.json({ ok: true, deleted: result.count });
}

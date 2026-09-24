import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionOrgFromRequest } from "@/lib/auth";

/** Delete one certificate check belonging to the session org. */
export async function DELETE(
 request: Request,
 props: { params: Promise<{ id: string }> }
) {
 const org = await sessionOrgFromRequest(request);
 if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const { id } = await props.params;

 const check = await prisma.certificateCheck.findFirst({
 where: { id, organizationId: org.id },
 });
 if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 });

 await prisma.certificateCheck.delete({ where: { id } });
 await prisma.auditLog.create({
 data: {
 organizationId: org.id,
 action: "CHECK_DELETED",
 meta: JSON.stringify({ checkId: id, fileName: check.fileName }),
 },
 });
 return NextResponse.json({ ok: true });
}

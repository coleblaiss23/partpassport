import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionOrgFromRequest } from "@/lib/auth";
import { unauthorized } from "@/lib/api";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
 const org = await sessionOrgFromRequest(request);
 if (!org) return unauthorized();
 const { id } = await props.params;
 const key = await prisma.apiKey.findFirst({ where: { id, organizationId: org.id } });
 if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });
 const active = await prisma.apiKey.count({ where: { organizationId: org.id, revokedAt: null } });
 if (!key.revokedAt && active <= 1) return NextResponse.json({ error: "Create a replacement key before revoking your last one" }, { status: 400 });
 await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
 await prisma.auditLog.create({ data: { organizationId: org.id, action: "API_KEY_REVOKED", meta: JSON.stringify({ keyId: id }) } });
 return NextResponse.json({ ok: true });
}

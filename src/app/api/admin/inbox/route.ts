import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const url = new URL(req.url);
 const status = url.searchParams.get("status");
 const leads = await prisma.lead.findMany({
 where: status ? { status } : undefined,
 orderBy: { createdAt: "desc" },
 take: 200,
 });
 return NextResponse.json({
 leads: leads.map((l) => ({
 id: l.id,
 name: l.name,
 email: l.email,
 company: l.company,
 role: l.role,
 volume: l.volume,
 message: l.message,
 source: l.source,
 status: l.status,
 createdAt: l.createdAt.toISOString(),
 })),
 webhookConfigured: Boolean(process.env.LEAD_WEBHOOK_URL?.trim()),
 });
}

export async function PATCH(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const body = await readJson(req);
 const id = typeof body?.id === "string" ? body.id : "";
 const status = typeof body?.status === "string" ? body.status.trim().slice(0, 40) : "";
 if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
 const lead = await prisma.lead.update({ where: { id }, data: { status } });
 return NextResponse.json({
 lead: { id: lead.id, status: lead.status },
 });
}

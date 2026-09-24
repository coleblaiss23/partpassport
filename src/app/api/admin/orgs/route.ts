import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { adminTenantDirectory } from "@/lib/adminData";
import { prisma } from "@/lib/prisma";
import type { PlanId } from "@/lib/planLimits";
import { readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const tenants = await adminTenantDirectory();
 return NextResponse.json({ tenants });
}

export async function PATCH(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const body = await readJson(req);
 if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
 const id = typeof body.id === "string" ? body.id : "";
 if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

 const data: {
 plan?: PlanId;
 subStatus?: string | null;
 active?: boolean;
 } = {};

 if (typeof body.plan === "string") {
 if (!["PILOT", "PRO", "ENTERPRISE"].includes(body.plan)) {
 return NextResponse.json({ error: "plan must be PILOT, PRO, or ENTERPRISE" }, { status: 400 });
 }
 data.plan = body.plan as PlanId;
 data.subStatus = body.plan === "PILOT" ? null : "active";
 }
 if (typeof body.active === "boolean") data.active = body.active;

 if (!Object.keys(data).length) {
 return NextResponse.json({ error: "No changes" }, { status: 400 });
 }

 const org = await prisma.organization.update({ where: { id }, data });
 await prisma.auditLog.create({
 data: {
 organizationId: id,
 action: "ADMIN_ORG_UPDATED",
 meta: JSON.stringify({ ...data, by: "admin-dashboard" }),
 },
 });
 return NextResponse.json({
 organization: {
 id: org.id,
 name: org.name,
 plan: org.plan,
 subStatus: org.subStatus,
 active: org.active,
 },
 });
}

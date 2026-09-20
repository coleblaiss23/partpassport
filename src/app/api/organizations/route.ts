import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { createOrgWithKeys } from "@/lib/orgs";
import { orgFromRequest, readJson } from "@/lib/api";
import type { PlanId } from "@/lib/planLimits";

// Admin-only: onboard an organization. Returns API key + private key ONCE.
export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Admin token required" }, { status: 401 });
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const plan = (body?.plan ?? "PILOT") as PlanId;
  if (!["PILOT", "PRO", "ENTERPRISE"].includes(plan)) return NextResponse.json({ error: "plan must be PILOT, PRO or ENTERPRISE" }, { status: 400 });

  const { org, apiKey, privateKey } = await createOrgWithKeys(name, plan);
  return NextResponse.json(
    { organization: { id: org.id, name: org.name, publicKey: org.publicKey, plan: org.plan }, apiKey, privateKey, warning: "Save both secrets now. They are never stored or shown again." },
    { status: 201 }
  );
}

// Authenticated: list active organizations (id + name) for choosing a transfer destination.
export async function GET(request: Request) {
  if (!(await orgFromRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgs = await prisma.organization.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ organizations: orgs });
}

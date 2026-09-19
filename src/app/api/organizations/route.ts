import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKeypair } from "@/lib/signing";
import { hashKey, isAdmin, newApiKey } from "@/lib/auth";
import { orgFromRequest, readJson } from "@/lib/api";

// Admin-only: onboard an organization. Returns API key + private key ONCE.
export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Admin token required" }, { status: 401 });
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const { publicKey, privateKey } = generateKeypair();
  const apiKey = newApiKey();
  const org = await prisma.organization.create({
    data: { name, publicKey, apiKeyHash: hashKey(apiKey) },
    select: { id: true, name: true, publicKey: true },
  });
  return NextResponse.json(
    { organization: org, apiKey, privateKey, warning: "Save both secrets now. They are never stored or shown again." },
    { status: 201 }
  );
}

// Authenticated: list active organizations (id + name) for choosing a transfer destination.
export async function GET(request: Request) {
  if (!(await orgFromRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgs = await prisma.organization.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ organizations: orgs });
}

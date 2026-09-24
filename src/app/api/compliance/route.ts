import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  category: z.enum(["TOOL_CALIBRATION", "VENDOR_CERT", "INSPECTION_AUTH"]),
  name: z.string().min(1),
  reference: z.string().optional(),
  expiresAt: z.string().min(4),
  notes: z.string().optional(),
});

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.complianceItem.findMany({
    where: { organizationId: org.id },
    orderBy: { expiresAt: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const expiresAt = new Date(parsed.data.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Invalid expiration date" }, { status: 400 });
  }

  const item = await prisma.complianceItem.create({
    data: {
      organizationId: org.id,
      category: parsed.data.category,
      name: parsed.data.name.trim(),
      reference: parsed.data.reference?.trim() || null,
      expiresAt,
      notes: parsed.data.notes?.trim() || null,
    },
  });

  return NextResponse.json({
    item: {
      id: item.id,
      category: item.category,
      name: item.name,
      reference: item.reference,
      expiresAt: item.expiresAt.toISOString(),
      notes: item.notes,
    },
  });
}

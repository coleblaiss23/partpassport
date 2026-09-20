import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLead } from "@/lib/leads";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const v = validateLead(body);

    if (!v.ok || !v.data) {
      return NextResponse.json({ error: v.error || "Invalid payload" }, { status: 400 });
    }

    const leadData = v.data;
    await prisma.lead.create({ data: leadData as any });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to capture lead" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { signPayload } from "@/lib/signing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partNumber, serialNumber, description, organizationId, privateKeyPem } = body;

    const existing = await prisma.part.findUnique({
      where: { partNumber_serialNumber: { partNumber, serialNumber } },
    });
    if (existing) {
      return NextResponse.json({ error: "Part already exists" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const part = await prisma.part.create({
      data: {
        partNumber,
        serialNumber,
        description,
        currentOrgId: organizationId,
      },
    });

    const timestamp = new Date();
    const eventData = { description: description ?? "Initial part registration" };
    const eventHash = computeEventHash({
      partId: part.id,
      eventType: "CREATED",
      timestamp: timestamp.toISOString(),
      prevEventHash: null,
      data: eventData,
    });

    const signature = signPayload(
      { partId: part.id, eventHash, timestamp: timestamp.toISOString() },
      privateKeyPem
    );

    const genesisEvent = await prisma.partEvent.create({
      data: {
        partId: part.id,
        organizationId,
        eventType: "CREATED",
        timestamp,
        prevEventHash: null,
        eventHash,
        signature,
        data: JSON.stringify(eventData),
      },
    });

    return NextResponse.json({ part, genesisEvent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Part registration failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
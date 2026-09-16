import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { signPayload } from "@/lib/signing";

// POST /api/parts — registers a brand new part and writes its genesis (CREATED) event.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partNumber, serialNumber, description, organizationId, privateKeyPem, certificateHash } = body;

    if (!partNumber || !serialNumber || !organizationId || !privateKeyPem) {
      return NextResponse.json(
        { error: "partNumber, serialNumber, organizationId, and privateKeyPem are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.part.findUnique({
      where: { partNumber_serialNumber: { partNumber, serialNumber } },
    });
    if (existing) {
      return NextResponse.json({ error: "Part already exists" }, { status: 40});
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const part = await prisma.part.create({
      data: { partNumber, serialNumber, description, currentOrgId: organizationId },
    });

    const timestamp = new Date();
    const eventData = { description: description ?? "Initial part registration" };
    const eventHash = computeEventHash({
      partId: part.id,
      eventType: "CREATED",
      timestamp: timestamp.toISOString(),
      prevEventHash: null,
      data: eventData,
      certificateHash: certificateHash ?? null,
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
        certificateHash: certificateHash ?? null,
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

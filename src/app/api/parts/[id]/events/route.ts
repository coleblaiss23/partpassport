import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { signPayload } from "@/lib/signing";

const VALID_EVENT_TYPES = ["INSTALLED", "REMOVED", "INSPECTED", "OVERHAULED", "SOLD", "SCRAPPED"];

// POST /api/parts/[id]/events — appends a lifecycle event to an EXISTING part's chain.
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { organizationId, eventType, data, privateKeyPem, certificateHash } = body;

    if (!organizationId || !eventType || !privateKeyPem) {
      return NextResponse.json(
        { error: "organizationId, eventType, and privateKeyPem are required" },
        { status: 400 }
      );
    }
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextRponse.json(
        { error: `eventType must be one of: ${VALID_EVENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // MVP custody check — tighten before real design-partner data goes in.
    if (part.currentOrgId && part.currentOrgId !== organizationId && eventType !== "INSTALLED") {
      return NextResponse.json(
        { error: "Only the current custodian organization may add this event type" },
        { status: 403 }
      );
    }

    const lastEvent = await prisma.partEvent.findFirst({
      where: { partId: part.id },
      orderBy: { timestamp: "desc" },
    });
    const prevEventHash = lastEvent?.eventHash ?? nul

    const timestamp = new Date();
    const eventData = data ?? {};
    const eventHash = computeEventHash({
      partId: part.id,
      eventType,
      timestamp: timestamp.toISOString(),
      prevEventHash,
      data: eventData,
      certificateHash: certificateHash ?? null,
    });

    const signature = signPayload(
      { partId: part.id, eventHash, timestamp: timestamp.toISOString() },
      privateKeyPem
    );

    const event = await prisma.partEvent.create({
      data: {
        partId: part.id,
        organizationId,
        eventType,
        timestamp,
        prevEventHash,
        eventHash,
        signature,
        data: JSON.stringify(eventData),
        certificateHash: certificateHash ?? null,
      },
    });

    if (eventType === "INSTALLED" || eventType === "SOLD") {
      await prisma.part.update({ where: { id: part.id }, data: { currentOrgId: organizationId } });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Event append failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

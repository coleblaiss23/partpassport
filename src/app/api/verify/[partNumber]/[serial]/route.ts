import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { verifySignature } from "@/lib/signing";

export async function GET(
  request: Request,
  props: { params: Promise<{ partNumber: string; serial: string }> }
) {
  try {
    const params = await props.params;
    const part = await prisma.part.findUnique({
      where: {
        partNumber_serialNumber: {
          partNumber: params.partNumber,
          serialNumber: params.serial,
        },
      },
      include: {
        events: {
          orderBy: { timestamp: "asc" },
          include: { organization: true },
        },
      },
    });

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const safetyFlags = await prisma.safetyFlag.findMany({
      where: { partNumber: params.partNumber },
    });

    let expectedPrevHash: string | null = null;

    for (const event of part.events) {
      if (event.prevEventHash !== expectedPrevHash) {
        return NextResponse.json({
          valid: false,
          reason: "HASH_CHAIN_BROKEN",
          brokenAtEventId: event.id,
          safetyFlags,
        });
      }

      const eventData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      const recomputedHash = computeEventHash({
        partId: event.partId,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        prevEventHash: event.prevEventHash,
        data: eventData,
        certificateHash: event.certificateHash,
      });

      if (recomputedHash !== event.eventHash) {
        return NextResponse.json({
          valid: false,
          reason: "EVENT_DATA_TAMPERED",
          brokenAtEventId: event.id,
          safetyFlags,
        });
      }

      const isSigValid = verifySignature(
        { partId: event.partId, eventHash: event.eventHash, timestamp: event.timestamp.toISOString() },
        event.signature,
        event.organization.publicKey
      );

      if (!isSigValid) {
        return NextResponse.json({
          valid: false,
          reason: "INVALID_SIGNATURE",
          brokenAtEventId: event.id,
          safetyFlags,
        });
      }

      expectedPrevHash = event.eventHash;
    }

    return NextResponse.json({
      valid: true,
      eventsCount: part.events.length,
      events: part.events,
      safetyFlags,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Verification failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

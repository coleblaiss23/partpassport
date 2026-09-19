import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { verifySignature } from "@/lib/signing";
import { normPN, serialInRange } from "@/lib/normalize";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const safe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export async function GET(request: Request, props: { params: Promise<{ partNumber: string; serial: string }> }) {
  if (!rateLimit(`verify:${clientIp(request)}`, 60, 60_000))
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const p = await props.params;
    const partNumber = safe(p.partNumber), serialNumber = safe(p.serial);
    const part = await prisma.part.findUnique({
      where: { partNumber_serialNumber: { partNumber, serialNumber } },
      include: { events: { orderBy: { seq: "asc" }, include: { organization: { select: { id: true, name: true, publicKey: true } } } } },
    });
    if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });

    const candidates = await prisma.safetyFlag.findMany({ where: { partNumberNorm: normPN(partNumber) } });
    const safetyFlags = candidates.filter((f) => serialInRange(serialNumber, f.serialRangeStart, f.serialRangeEnd));

    const events = part.events.map(({ organization, ...e }) => ({ ...e, organization: { id: organization.id, name: organization.name } }));
    const base = { partNumber, serialNumber, scrapped: part.scrapped, currentOrgId: part.currentOrgId, safetyFlags };

    let expectedPrev: string | null = null;
    for (const [i, e] of part.events.entries()) {
      const bad = (reason: string) =>
        NextResponse.json({ ...base, valid: false, reason, brokenAtEventId: e.id, events });
      if (e.seq !== i + 1) return bad("SEQUENCE_GAP");
      if (e.prevEventHash !== expectedPrev) return bad("HASH_CHAIN_BROKEN");
      const h = computeEventHash({
        partId: e.partId, organizationId: e.organizationId, seq: e.seq, eventType: e.eventType,
        timestamp: e.timestamp.toISOString(), prevEventHash: e.prevEventHash, data: e.data, certificateHash: e.certificateHash,
      });
      if (h !== e.eventHash) return bad("EVENT_DATA_TAMPERED");
      const ok = verifySignature(
        { partId: e.partId, eventHash: e.eventHash, timestamp: e.timestamp.toISOString() },
        e.signature, e.organization.publicKey
      );
      if (!ok) return bad("INVALID_SIGNATURE");
      expectedPrev = e.eventHash;
    }
    return NextResponse.json({ ...base, valid: true, eventsCount: events.length, events });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

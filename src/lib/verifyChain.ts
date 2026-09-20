import { prisma } from "./prisma";
import { checkChain, type ChainCheck } from "./chainCheck";
import { normPN, serialInRange } from "./normalize";

export { checkChain };
export type { ChainCheck, ChainEvent } from "./chainCheck";

export const MAX_CHAIN = 5000; // longer histories are refused instead of loading unbounded rows
const SHOWN = 200; // events returned to the page/API (all are still verified)

export async function verifyPart(partNumber: string, serialNumber: string) {
  const part = await prisma.part.findUnique({
    where: { partNumber_serialNumber: { partNumber, serialNumber } },
    include: {
      currentOrg: { select: { name: true } },
      events: { orderBy: { seq: "asc" }, take: MAX_CHAIN + 1, include: { organization: { select: { id: true, name: true, publicKey: true, verification: true } } } },
    },
  });
  if (!part) return null;

  const tooLong = part.events.length > MAX_CHAIN;
  const list = part.events.slice(0, MAX_CHAIN);
  const flags = (await prisma.safetyFlag.findMany({ where: { partNumberNorm: normPN(partNumber) } }))
    .filter((f) => serialInRange(serialNumber, f.serialRangeStart, f.serialRangeEnd));

  const chain: ChainCheck = tooLong
    ? { valid: false, reason: "CHAIN_TOO_LONG", brokenAtEventId: list[list.length - 1].id }
    : checkChain(list.map((e) => ({ ...e, publicKey: e.organization.publicKey })));

  return {
    partNumber, serialNumber, description: part.description, scrapped: part.scrapped, custodian: part.currentOrg?.name ?? null,
    safetyFlags: flags.map((f) => ({ id: f.id, source: f.source, referenceId: f.referenceId, description: f.description, url: f.url })),
    eventsCount: list.length, truncated: list.length > SHOWN,
    events: list.slice(-SHOWN).map((e) => ({
      id: e.id, seq: e.seq, eventType: e.eventType, timestamp: e.timestamp.toISOString(), eventHash: e.eventHash,
      prevEventHash: e.prevEventHash, signature: e.signature, data: e.data, certificateHash: e.certificateHash,
      organization: { id: e.organization.id, name: e.organization.name, verified: e.organization.verification === "VERIFIED" },
    })),
    ...chain,
  };
}
export type VerifyResult = NonNullable<Awaited<ReturnType<typeof verifyPart>>>;

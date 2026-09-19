import { randomUUID } from "crypto";
import { Prisma, type Organization } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeEventHash } from "@/lib/hashChain";
import { verifySignature } from "@/lib/signing";

export const EVENT_TYPES = [
  "CREATED", "INSPECTED", "REPAIRED", "OVERHAULED", "INSTALLED",
  "REMOVED", "SCRAPPED", "SOLD", "TRANSFERRED",
] as const;
const TRANSFERS = ["SOLD", "TRANSFERRED"];
const MAX_SKEW_MS = 10 * 60 * 1000;

export type Draft = {
  partId: string;
  organizationId: string;
  seq: number;
  eventType: string;
  timestamp: string;
  prevEventHash: string | null;
  data: string; // exact JSON text that is hashed and stored
  certificateHash: string | null;
  eventHash: string;
};
export type Fail = { error: string; status: number };
const fail = (status: number, error: string): Fail => ({ status, error });
export const isFail = (x: unknown): x is Fail =>
  !!x && typeof x === "object" && "error" in x && "status" in x;

const str = (v: unknown, max = 128) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null;

/** Step 1: server proposes the next event. The client signs {partId,eventHash,timestamp}. */
export async function buildDraft(
  org: Organization,
  partId: string | null,
  eventType: string,
  data: Record<string, unknown>,
  certificateHash: string | null
): Promise<Draft | Fail> {
  if (!(EVENT_TYPES as readonly string[]).includes(eventType)) return fail(400, "Invalid eventType");
  if (certificateHash && !/^[a-f0-9]{64}$/.test(certificateHash)) return fail(400, "certificateHash must be SHA-256 hex");
  let seq = 1;
  let prev: string | null = null;
  let id: string;

  if (eventType === "CREATED") {
    if (partId) return fail(400, "CREATED is only for new parts");
    const pn = str(data.partNumber), sn = str(data.serialNumber);
    if (!pn || !sn) return fail(400, "partNumber and serialNumber are required");
    const exists = await prisma.part.findUnique({ where: { partNumber_serialNumber: { partNumber: pn, serialNumber: sn } } });
    if (exists) return fail(409, "Part already exists");
    id = randomUUID();
  } else {
    if (!partId) return fail(400, "partId required");
    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) return fail(404, "Part not found");
    if (part.scrapped) return fail(409, "Part was scrapped; no further events allowed");
    if (part.currentOrgId !== org.id) return fail(403, "Only the current custodian can add events");
    if (TRANSFERS.includes(eventType)) {
      const to = str(data.toOrganizationId);
      if (!to || to === org.id) return fail(400, "data.toOrganizationId (another organization) is required");
      const target = await prisma.organization.findUnique({ where: { id: to } });
      if (!target?.active) return fail(400, "Destination organization not found");
    }
    const last = await prisma.partEvent.findFirst({ where: { partId }, orderBy: { seq: "desc" } });
    seq = (last?.seq ?? 0) + 1;
    prev = last?.eventHash ?? null;
    id = partId;
  }

  const timestamp = new Date().toISOString();
  const dataStr = JSON.stringify(data);
  const eventHash = computeEventHash({
    partId: id, organizationId: org.id, seq, eventType, timestamp,
    prevEventHash: prev, data: dataStr, certificateHash,
  });
  return { partId: id, organizationId: org.id, seq, eventType, timestamp, prevEventHash: prev, data: dataStr, certificateHash, eventHash };
}

/** Step 2: verify everything independently, then append. Nothing from the client is trusted. */
export async function commitDraft(org: Organization, d: Draft, signature: unknown, expectedPartId?: string) {
  if (!d || typeof d !== "object" || typeof signature !== "string") return fail(400, "draft and signature required");
  if (d.organizationId !== org.id) return fail(403, "Draft belongs to a different organization");
  if (expectedPartId && d.partId !== expectedPartId) return fail(400, "partId mismatch");
  if (!(EVENT_TYPES as readonly string[]).includes(d.eventType)) return fail(400, "Invalid eventType");
  const ts = Date.parse(d.timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return fail(400, "Draft expired; prepare again");

  const recomputed = computeEventHash({
    partId: d.partId, organizationId: d.organizationId, seq: d.seq, eventType: d.eventType,
    timestamp: d.timestamp, prevEventHash: d.prevEventHash, data: d.data, certificateHash: d.certificateHash ?? null,
  });
  if (recomputed !== d.eventHash) return fail(400, "Hash mismatch");
  if (!verifySignature({ partId: d.partId, eventHash: d.eventHash, timestamp: d.timestamp }, signature, org.publicKey))
    return fail(401, "Invalid signature for this organization");

  let data: Record<string, unknown>;
  try { data = JSON.parse(d.data); } catch { return fail(400, "data is not valid JSON"); }

  try {
    return await prisma.$transaction(async (tx) => {
      const base = {
        partId: d.partId, organizationId: org.id, seq: d.seq, eventType: d.eventType,
        timestamp: new Date(d.timestamp), prevEventHash: d.prevEventHash, eventHash: d.eventHash,
        signature, data: d.data, certificateHash: d.certificateHash ?? null,
      };
      if (d.eventType === "CREATED") {
        if (d.seq !== 1 || d.prevEventHash !== null) return fail(400, "Invalid genesis event");
        const part = await tx.part.create({
          data: {
            id: d.partId, partNumber: String(data.partNumber), serialNumber: String(data.serialNumber),
            description: typeof data.description === "string" ? data.description : null, currentOrgId: org.id,
          },
        });
        const event = await tx.partEvent.create({ data: base });
        return { status: 201, part, event };
      }
      const part = await tx.part.findUnique({ where: { id: d.partId } });
      if (!part) return fail(404, "Part not found");
      if (part.scrapped) return fail(409, "Part was scrapped");
      if (part.currentOrgId !== org.id) return fail(403, "Only the current custodian can add events");
      const last = await tx.partEvent.findFirst({ where: { partId: d.partId }, orderBy: { seq: "desc" } });
      if (!last || d.seq !== last.seq + 1 || d.prevEventHash !== last.eventHash)
        return fail(409, "Chain moved; prepare again");
      const to = String(data.toOrganizationId ?? "");
      if (TRANSFERS.includes(d.eventType)) {
        const target = to && to !== org.id ? await tx.organization.findUnique({ where: { id: to } }) : null;
        if (!target?.active) return fail(400, "Destination organization not found");
      }
      const event = await tx.partEvent.create({ data: base });
      if (TRANSFERS.includes(d.eventType)) {
        await tx.part.update({ where: { id: part.id }, data: { currentOrgId: to } });
      }
      if (d.eventType === "SCRAPPED") await tx.part.update({ where: { id: part.id }, data: { scrapped: true } });
      return { status: 201, event };
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail(409, "Conflict; prepare again");
    throw e;
  }
}

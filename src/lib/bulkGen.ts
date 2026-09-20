import { randomUUID } from "crypto";
import { computeEventHash } from "./hashChain";
import { signPayload } from "./signing";

/** Builds a valid, signed, hash-chained history for one part. Used to create large test datasets. */
export function generateChain(o: { orgId: string; privateKey: string; partNumber: string; serialNumber: string; description?: string; start: Date; extra: string[] }) {
  const partId = randomUUID();
  let prev: string | null = null;
  const events = ["CREATED", ...o.extra].map((eventType, i) => {
    const seq = i + 1;
    const ts = new Date(o.start.getTime() + i * 60_000);
    const data = JSON.stringify(i === 0 ? { partNumber: o.partNumber, serialNumber: o.serialNumber, description: o.description ?? null } : { notes: `${eventType.toLowerCase()} #${seq}` });
    const eventHash = computeEventHash({ partId, organizationId: o.orgId, seq, eventType, timestamp: ts.toISOString(), prevEventHash: prev, data, certificateHash: null });
    const signature = signPayload({ partId, eventHash, timestamp: ts.toISOString() }, o.privateKey);
    const ev = { partId, organizationId: o.orgId, seq, eventType, timestamp: ts, prevEventHash: prev, eventHash, signature, data, certificateHash: null as string | null };
    prev = eventHash;
    return ev;
  });
  return { part: { id: partId, partNumber: o.partNumber, serialNumber: o.serialNumber, description: o.description ?? null }, events };
}

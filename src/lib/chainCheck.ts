import { computeEventHash } from "./hashChain";
import { verifySignature } from "./signing";

export type ChainEvent = {
  id: string; partId: string; organizationId: string; seq: number; eventType: string; timestamp: Date;
  prevEventHash: string | null; eventHash: string; signature: string; data: string; certificateHash: string | null; publicKey: string;
};
export type ChainCheck = { valid: true } | { valid: false; reason: string; brokenAtEventId: string };

/** Checks sequence, hash links, recomputed hashes and signatures. No database access. */
export function checkChain(events: ChainEvent[]): ChainCheck {
  let prev: string | null = null;
  for (const [i, e] of events.entries()) {
    const bad = (reason: string): ChainCheck => ({ valid: false, reason, brokenAtEventId: e.id });
    const ts = e.timestamp.toISOString();
    if (e.seq !== i + 1) return bad("SEQUENCE_GAP");
    if (e.prevEventHash !== prev) return bad("HASH_CHAIN_BROKEN");
    const h = computeEventHash({ partId: e.partId, organizationId: e.organizationId, seq: e.seq, eventType: e.eventType, timestamp: ts, prevEventHash: e.prevEventHash, data: e.data, certificateHash: e.certificateHash });
    if (h !== e.eventHash) return bad("EVENT_DATA_TAMPERED");
    if (!verifySignature({ partId: e.partId, eventHash: e.eventHash, timestamp: ts }, e.signature, e.publicKey)) return bad("INVALID_SIGNATURE");
    prev = e.eventHash;
  }
  return { valid: true };
}

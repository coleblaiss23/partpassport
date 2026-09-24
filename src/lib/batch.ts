import { randomUUID } from "crypto";
import { Prisma, type Organization } from "@prisma/client";
import { prisma } from "./prisma";
import { computeEventHash } from "./hashChain";
import { verifySignature } from "./signing";
import type { Draft } from "./eventService";

export const MAX_BATCH = 100;
type Item = { partNumber?: unknown; serialNumber?: unknown; description?: unknown; certificateHash?: unknown };
export type PrepResult = { ok: true; draft: Draft } | { ok: false; error: string };
export type CommitResult = { ok: boolean; partId?: string; error?: string };
const LIMIT_MSG = "Monthly registration limit reached. Upgrade at /pricing";
const str = (v: unknown, max = 128) => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);
const key = (pn: string, sn: string) => `${pn}\u0000${sn}`;

/** Builds up to MAX_BATCH registration drafts with ONE lookup for existing parts. */
export async function prepareBatch(org: Organization, items: Item[], allowance: number): Promise<PrepResult[]> {
 const parsed = items.map((it) => ({
 pn: str(it.partNumber), sn: str(it.serialNumber),
 desc: typeof it.description === "string" && it.description.trim() ? it.description.trim().slice(0, 300) : null,
 ch: typeof it.certificateHash === "string" && it.certificateHash.trim() ? it.certificateHash.trim().toLowerCase() : null,
 }));
 const cand = parsed.filter((p) => p.pn && p.sn);
 const existing = cand.length
 ? await prisma.part.findMany({ where: { OR: cand.map((p) => ({ partNumber: p.pn!, serialNumber: p.sn! })) }, select: { partNumber: true, serialNumber: true } })
 : [];
 const exists = new Set(existing.map((e) => key(e.partNumber, e.serialNumber)));
 const seen = new Set<string>();
 const ts = new Date().toISOString();
 let left = allowance;

 return parsed.map((p): PrepResult => {
 if (!p.pn || !p.sn) return { ok: false, error: "partNumber and serialNumber are required" };
 if (p.ch && !/^[a-f0-9]{64}$/.test(p.ch)) return { ok: false, error: "certificateHash must be SHA-256 hex" };
 const k = key(p.pn, p.sn);
 if (exists.has(k) || seen.has(k)) return { ok: false, error: "Part already exists" };
 if (left <= 0) return { ok: false, error: LIMIT_MSG };
 seen.add(k); left--;
 const partId = randomUUID();
 const data = JSON.stringify({ partNumber: p.pn, serialNumber: p.sn, description: p.desc });
 const eventHash = computeEventHash({ partId, organizationId: org.id, seq: 1, eventType: "CREATED", timestamp: ts, prevEventHash: null, data, certificateHash: p.ch });
 return { ok: true, draft: { partId, organizationId: org.id, seq: 1, eventType: "CREATED", timestamp: ts, prevEventHash: null, data, certificateHash: p.ch, eventHash } };
 });
}

/** Verifies every signature, then inserts all valid registrations with two bulk inserts. Nothing from the client is trusted. */
export async function commitBatch(org: Organization, items: { draft: Draft; signature: string }[], allowance: number): Promise<CommitResult[]> {
 const out: CommitResult[] = items.map(() => ({ ok: false, error: "Not processed" }));
 const valid: { i: number; d: Draft; sig: string; pn: string; sn: string; desc: string | null }[] = [];
 let left = allowance;

 items.forEach((it, i) => {
 const fail = (error: string) => { out[i] = { ok: false, error }; };
 const d = it?.draft, sig = it?.signature;
 if (!d || typeof sig !== "string") return fail("draft and signature required");
 if (d.organizationId !== org.id || d.eventType !== "CREATED" || d.seq !== 1 || d.prevEventHash !== null) return fail("Invalid draft");
 const t = Date.parse(d.timestamp);
 if (!Number.isFinite(t) || Math.abs(Date.now() - t) > 10 * 60_000) return fail("Draft expired; prepare again");
 const h = computeEventHash({ partId: d.partId, organizationId: d.organizationId, seq: 1, eventType: "CREATED", timestamp: d.timestamp, prevEventHash: null, data: d.data, certificateHash: d.certificateHash ?? null });
 if (h !== d.eventHash) return fail("Hash mismatch");
 if (!verifySignature({ partId: d.partId, eventHash: d.eventHash, timestamp: d.timestamp }, sig, org.publicKey)) return fail("Invalid signature");
 let data: Record<string, unknown>;
 try { data = JSON.parse(d.data); } catch { return fail("data is not valid JSON"); }
 const pn = str(data.partNumber), sn = str(data.serialNumber);
 if (!pn || !sn) return fail("Invalid part data");
 if (left <= 0) return fail(LIMIT_MSG);
 left--;
 valid.push({ i, d, sig, pn, sn, desc: typeof data.description === "string" ? data.description : null });
 });
 if (!valid.length) return out;

 const existing = await prisma.part.findMany({ where: { OR: valid.map((v) => ({ partNumber: v.pn, serialNumber: v.sn })) }, select: { partNumber: true, serialNumber: true } });
 const taken = new Set(existing.map((e) => key(e.partNumber, e.serialNumber)));
 const todo = valid.filter((v) => {
 const k = key(v.pn, v.sn);
 if (taken.has(k)) { out[v.i] = { ok: false, error: "Part already exists" }; return false; }
 taken.add(k);
 return true;
 });
 if (!todo.length) return out;

 const partRow = (v: (typeof todo)[number]) => ({ id: v.d.partId, partNumber: v.pn, serialNumber: v.sn, description: v.desc, currentOrgId: org.id });
 const eventRow = (v: (typeof todo)[number]) => ({
 partId: v.d.partId, organizationId: org.id, seq: 1, eventType: "CREATED", timestamp: new Date(v.d.timestamp), prevEventHash: null,
 eventHash: v.d.eventHash, signature: v.sig, data: v.d.data, certificateHash: v.d.certificateHash ?? null,
 });
 try {
 await prisma.$transaction([prisma.part.createMany({ data: todo.map(partRow) }), prisma.partEvent.createMany({ data: todo.map(eventRow) })]);
 todo.forEach((v) => { out[v.i] = { ok: true, partId: v.d.partId }; });
 } catch (e) {
 if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
 for (const v of todo) { // a concurrent insert collided: fall back to one at a time
 try {
 await prisma.$transaction([prisma.part.create({ data: partRow(v) }), prisma.partEvent.create({ data: eventRow(v) })]);
 out[v.i] = { ok: true, partId: v.d.partId };
 } catch { out[v.i] = { ok: false, error: "Part already exists" }; }
 }
 }
 return out;
}

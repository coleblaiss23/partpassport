import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Prisma } from "@prisma/client";
import { generateKeypair, signPayload } from "./signing";

// In-memory stand-in for Prisma so the custody/forgery/fork rules run without a database.
const store = vi.hoisted(() => ({ orgs: new Map<string, any>(), parts: [] as any[], events: [] as any[] }));
vi.mock("@/lib/prisma", () => {
  const client: any = {
    organization: { findUnique: async ({ where }: any) => store.orgs.get(where.id) ?? null },
    part: {
      findUnique: async ({ where }: any) =>
        (where.id
          ? store.parts.find((p) => p.id === where.id)
          : store.parts.find((p) => p.partNumber === where.partNumber_serialNumber.partNumber && p.serialNumber === where.partNumber_serialNumber.serialNumber)) ?? null,
      create: async ({ data }: any) => { const p = { scrapped: false, ...data }; store.parts.push(p); return p; },
      update: async ({ where, data }: any) => Object.assign(store.parts.find((p) => p.id === where.id), data),
    },
    partEvent: {
      findFirst: async ({ where }: any) => store.events.filter((e) => e.partId === where.partId).sort((a, b) => b.seq - a.seq)[0] ?? null,
      create: async ({ data }: any) => {
        if (store.events.some((e) => e.partId === data.partId && e.seq === data.seq))
          throw new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" });
        store.events.push(data); return data;
      },
    },
    $transaction: async (cb: any) => cb(client),
  };
  return { prisma: client };
});

import { buildDraft, commitDraft, isFail, type Draft } from "./eventService";

const mkOrg = (id: string) => {
  const k = generateKeypair();
  const org: any = { id, name: id, publicKey: k.publicKey, active: true };
  store.orgs.set(id, org);
  return { org, priv: k.privateKey };
};
const sign = (d: Draft, priv: string) => signPayload({ partId: d.partId, eventHash: d.eventHash, timestamp: d.timestamp }, priv);

async function step(o: { org: any; priv: string }, partId: string | null, type: string, data: any = {}) {
  const d = await buildDraft(o.org, partId, type, data, null);
  if (isFail(d)) return { prep: d } as any;
  return { d, res: await commitDraft(o.org, d, sign(d, o.priv)) };
}
const create = async (o: any) => (await step(o, null, "CREATED", { partNumber: "PN-1", serialNumber: "S1" })).d.partId as string;

let A: ReturnType<typeof mkOrg>, B: ReturnType<typeof mkOrg>;
beforeEach(() => { store.orgs.clear(); store.parts.length = 0; store.events.length = 0; A = mkOrg("A"); B = mkOrg("B"); });
afterEach(() => { vi.useRealTimers(); });

describe("event service", () => {
  it("registers a part and appends a linked event", async () => {
    const id = await create(A);
    const r = await step(A, id, "INSPECTED", { notes: "ok" });
    expect(r.res.status).toBe(201);
    expect(store.events.map((e) => e.seq)).toEqual([1, 2]);
    expect(store.events[1].prevEventHash).toBe(store.events[0].eventHash);
  });

  it("rejects a signature made with another organization's key", async () => {
    const d = (await buildDraft(A.org, null, "CREATED", { partNumber: "X", serialNumber: "1" }, null)) as Draft;
    const res: any = await commitDraft(A.org, d, sign(d, B.priv));
    expect(res.status).toBe(401);
  });

  it("rejects a draft altered after it was prepared", async () => {
    const d = (await buildDraft(A.org, null, "CREATED", { partNumber: "X", serialNumber: "1" }, null)) as Draft;
    const sig = sign(d, A.priv);
    const res: any = await commitDraft(A.org, { ...d, data: JSON.stringify({ partNumber: "EVIL", serialNumber: "1" }) }, sig);
    expect(res.status).toBe(400);
  });

  it("blocks non-custodians", async () => {
    const id = await create(A);
    const r = await step(B, id, "INSPECTED");
    expect(r.prep.status).toBe(403);
  });

  it("prevents chain forks: second draft from the same head is refused", async () => {
    const id = await create(A);
    const d1 = (await buildDraft(A.org, id, "INSPECTED", {}, null)) as Draft;
    const d2 = (await buildDraft(A.org, id, "REPAIRED", {}, null)) as Draft;
    expect((await commitDraft(A.org, d1, sign(d1, A.priv)) as any).status).toBe(201);
    expect((await commitDraft(A.org, d2, sign(d2, A.priv)) as any).status).toBe(409);
  });

  it("moves custody on SOLD and locks out the seller", async () => {
    const id = await create(A);
    expect((await step(A, id, "SOLD", { toOrganizationId: "B" })).res.status).toBe(201);
    expect((await step(A, id, "INSPECTED")).prep.status).toBe(403);
    expect((await step(B, id, "INSTALLED")).res.status).toBe(201);
  });

  it("requires a valid destination for transfers", async () => {
    const id = await create(A);
    expect((await step(A, id, "SOLD", {})).prep.status).toBe(400);
    expect((await step(A, id, "SOLD", { toOrganizationId: "nope" })).prep.status).toBe(400);
  });

  it("refuses any event after SCRAPPED", async () => {
    const id = await create(A);
    expect((await step(A, id, "SCRAPPED")).res.status).toBe(201);
    expect((await step(A, id, "INSTALLED")).prep.status).toBe(409);
  });

  it("expires stale drafts", async () => {
    vi.useFakeTimers();
    const d = (await buildDraft(A.org, null, "CREATED", { partNumber: "X", serialNumber: "1" }, null)) as Draft;
    vi.advanceTimersByTime(11 * 60 * 1000);
    expect((await commitDraft(A.org, d, sign(d, A.priv)) as any).status).toBe(400);
  });

  it("rejects duplicate part registration", async () => {
    await create(A);
    const r = await step(A, null, "CREATED", { partNumber: "PN-1", serialNumber: "S1" });
    expect(r.prep.status).toBe(409);
  });
});

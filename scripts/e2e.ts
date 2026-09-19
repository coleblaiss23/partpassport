// Live smoke test against a running server + real database.
//   terminal 1: npm run dev      terminal 2: npm run test:e2e
import { PrismaClient } from "@prisma/client";
import { signPayload } from "../src/lib/signing";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN = process.env.ADMIN_TOKEN ?? "";
const prisma = new PrismaClient();
let failed = 0;
const check = (name: string, ok: boolean) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) failed++; };

async function call(method: string, path: string, opts: { key?: string; admin?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.key) headers.Authorization = `Bearer ${opts.key}`;
  if (opts.admin) headers["x-admin-token"] = opts.admin;
  const r = await fetch(BASE + path, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  return { status: r.status, json: (await r.json().catch(() => ({}))) as any };
}
async function signed(org: { apiKey: string; privateKey: string }, prep: string, commit: string, body: object) {
  const p = await call("POST", prep, { key: org.apiKey, body });
  if (p.status !== 200) return p;
  const d = p.json.draft;
  const signature = signPayload({ partId: d.partId, eventHash: d.eventHash, timestamp: d.timestamp }, org.privateKey);
  return call("POST", commit, { key: org.apiKey, body: { draft: d, signature } });
}

(async () => {
  const tag = Date.now().toString(36);
  check("org creation rejected without admin token", (await call("POST", "/api/organizations", { body: { name: "x" } })).status === 401);
  const a = (await call("POST", "/api/organizations", { admin: ADMIN, body: { name: `A-${tag}` } })).json;
  const b = (await call("POST", "/api/organizations", { admin: ADMIN, body: { name: `B-${tag}` } })).json;
  check("orgs created", !!a.apiKey && !!b.apiKey);
  const A = { apiKey: a.apiKey, privateKey: a.privateKey }, B = { apiKey: b.apiKey, privateKey: b.privateKey };

  check("part registration rejected without API key", (await call("POST", "/api/parts/prepare", { body: {} })).status === 401);
  const pn = `PN-${tag}`, sn = "0001";
  const created = await signed(A, "/api/parts/prepare", "/api/parts", { partNumber: pn, serialNumber: sn });
  check("part registered", created.status === 201);
  const partId = created.json.part?.id as string;

  check("non-custodian blocked", (await call("POST", `/api/parts/${partId}/events/prepare`, { key: B.apiKey, body: { eventType: "INSPECTED" } })).status === 403);
  const forged = await call("POST", `/api/parts/${partId}/events/prepare`, { key: A.apiKey, body: { eventType: "INSPECTED" } });
  const fs = signPayload({ partId, eventHash: forged.json.draft.eventHash, timestamp: forged.json.draft.timestamp }, B.privateKey);
  check("forged signature rejected", (await call("POST", `/api/parts/${partId}/events`, { key: A.apiKey, body: { draft: forged.json.draft, signature: fs } })).status === 401);
  check("valid event appended", (await signed(A, `/api/parts/${partId}/events/prepare`, `/api/parts/${partId}/events`, { eventType: "INSPECTED", data: { notes: "ok" } })).status === 201);

  let v = await call("GET", `/api/verify/${pn}/${sn}`);
  check("verify: chain valid with 2 events", v.json.valid === true && v.json.eventsCount === 2);

  check("transfer to org B", (await signed(A, `/api/parts/${partId}/events/prepare`, `/api/parts/${partId}/events`, { eventType: "SOLD", data: { toOrganizationId: b.organization.id } })).status === 201);
  check("seller locked out after sale", (await call("POST", `/api/parts/${partId}/events/prepare`, { key: A.apiKey, body: { eventType: "INSPECTED" } })).status === 403);
  check("buyer can now add events", (await signed(B, `/api/parts/${partId}/events/prepare`, `/api/parts/${partId}/events`, { eventType: "INSTALLED" })).status === 201);

  await prisma.safetyFlag.upsert({
    where: { source_referenceId_partNumberNorm: { source: "AD", referenceId: `T-${tag}`, partNumberNorm: pn.toUpperCase().replace(/[^A-Z0-9]/g, "") } },
    create: { partNumber: pn, partNumberNorm: pn.toUpperCase().replace(/[^A-Z0-9]/g, ""), source: "AD", referenceId: `T-${tag}`, description: "Test AD", issuedDate: new Date() }, update: {},
  });
  v = await call("GET", `/api/verify/${pn}/${sn}`);
  check("safety flag surfaced", v.json.safetyFlags?.length === 1);

  const first = await prisma.partEvent.findFirst({ where: { partId, seq: 2 } });
  await prisma.partEvent.update({ where: { id: first!.id }, data: { data: '{"notes":"tampered"}' } });
  v = await call("GET", `/api/verify/${pn}/${sn}`);
  check("tampering detected", v.json.valid === false && v.json.reason === "EVENT_DATA_TAMPERED");

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
})();

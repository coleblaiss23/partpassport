// Creates demo organizations, parts with valid signed histories, and one deliberately tampered part.
// Usage: npm run seed:demo      (writes demo-credentials.json, which is git-ignored)
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { generateKeypair, signPayload } from "../src/lib/signing";
import { hashKey, newApiKey } from "../src/lib/auth";
import { buildDraft, commitDraft, isFail, type Draft } from "../src/lib/eventService";

const prisma = new PrismaClient();
const tag = Date.now().toString(36).slice(-4).toUpperCase();

async function mkOrg(name: string) {
  const { publicKey, privateKey } = generateKeypair();
  const apiKey = newApiKey();
  const org = await prisma.organization.create({ data: { name: `${name} (${tag})`, publicKey, apiKeyHash: hashKey(apiKey) } });
  return { org, apiKey, privateKey };
}
type O = Awaited<ReturnType<typeof mkOrg>>;

async function add(o: O, partId: string | null, type: string, data: Record<string, unknown> = {}) {
  const d = await buildDraft(o.org, partId, type, data, null);
  if (isFail(d)) throw new Error(`${type}: ${d.error}`);
  const draft = d as Draft;
  const signature = signPayload({ partId: draft.partId, eventHash: draft.eventHash, timestamp: draft.timestamp }, o.privateKey);
  const r: any = await commitDraft(o.org, draft, signature);
  if (r.error) throw new Error(`${type}: ${r.error}`);
  return draft.partId;
}
const create = (o: O, partNumber: string, serialNumber: string, description: string) =>
  add(o, null, "CREATED", { partNumber, serialNumber, description });

(async () => {
  const mro = await mkOrg("Demo MRO");
  const dist = await mkOrg("Demo Distributor");
  const airline = await mkOrg("Demo Airline");
  const urls: Record<string, string> = {};

  // 1. Clean, multi-owner history
  const sn1 = `S-${tag}-1`;
  const p1 = await create(mro, "DEMO-881-2001", sn1, "Fuel control unit (demo)");
  await add(mro, p1, "INSPECTED", { notes: "Incoming inspection, no defects" });
  await add(mro, p1, "OVERHAULED", { notes: "Overhauled per sample manual" });
  await add(mro, p1, "SOLD", { toOrganizationId: dist.org.id });
  await add(dist, p1, "INSPECTED", { notes: "Received and inspected" });
  await add(dist, p1, "SOLD", { toOrganizationId: airline.org.id });
  await add(airline, p1, "INSTALLED", { notes: "Installed on tail N-DEMO1" });
  urls["1 CLEAN history (green)"] = `/verify/DEMO-881-2001/${sn1}`;

  // 2. Scrapped part (should be flagged)
  const sn2 = `S-${tag}-2`;
  const p2 = await create(mro, "DEMO-KLT-450", sn2, "Bracket (demo)");
  await add(mro, p2, "INSPECTED", { notes: "Cracked, beyond limits" });
  await add(mro, p2, "SCRAPPED", { notes: "Scrapped and mutilated" });
  urls["2 SCRAPPED part (warning)"] = `/verify/DEMO-KLT-450/${sn2}`;

  // 3. Matches a safety flag (serial inside 1000-1999)
  const sn3 = String(1000 + Math.floor(Math.random() * 900));
  const p3 = await create(dist, "DEMO-AD-100", sn3, "Hydraulic pump (demo)");
  await prisma.safetyFlag.upsert({
    where: { source_referenceId_partNumberNorm: { source: "AD", referenceId: "TEST-AD-0001", partNumberNorm: "DEMOAD100" } },
    create: { partNumber: "DEMO-AD-100", partNumberNorm: "DEMOAD100", source: "AD", referenceId: "TEST-AD-0001", description: "TEST DATA (fictional): repetitive inspection required", serialRangeStart: "1000", serialRangeEnd: "1999", issuedDate: new Date("2026-02-01") },
    update: {},
  });
  urls["3 SAFETY FLAG match (amber)"] = `/verify/DEMO-AD-100/${sn3}`;
  void p3;

  // 4. Tampered after signing (should fail)
  const sn4 = `S-${tag}-4`;
  const p4 = await create(mro, "DEMO-TMP-777", sn4, "Valve (demo)");
  await add(mro, p4, "INSPECTED", { notes: "Original honest note" });
  const ev = await prisma.partEvent.findFirst({ where: { partId: p4, seq: 2 } });
  await prisma.partEvent.update({ where: { id: ev!.id }, data: { data: '{"notes":"edited after signing"}' } });
  urls["4 TAMPERED (red)"] = `/verify/DEMO-TMP-777/${sn4}`;

  urls["5 NO RECORD"] = "/verify/NOT-A-PART/000";

  const creds = Object.fromEntries([["mro", mro], ["distributor", dist], ["airline", airline]].map(([k, v]: any) => [k, { organizationId: v.org.id, apiKey: v.apiKey, privateKey: v.privateKey }]));
  writeFileSync("demo-credentials.json", JSON.stringify({ creds, urls, partIdsForEventsPage: { cleanPart: p1, mroOwnedScrapped: p2 } }, null, 2));

  console.log("\nDemo data created. Open these at http://localhost:3000 :\n");
  for (const [k, v] of Object.entries(urls)) console.log(`  ${k}\n    ${v}`);
  console.log("\nLogin secrets for the dashboard forms are in demo-credentials.json (local only, git-ignored).");
})()
  .catch((e) => { console.error("Seed failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

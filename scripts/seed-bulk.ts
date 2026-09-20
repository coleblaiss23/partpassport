// Creates a big, VALID dataset for load testing.   npm run seed:bulk -- 20000 3
//   args: number of parts (default 10000), extra events per part (default 3)
// Writes bulk-sample.json (part/serial pairs) for npm run loadtest, and bulk-credentials.json (git-ignored).
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { createOrgWithKeys } from "../src/lib/orgs";
import { generateChain } from "../src/lib/bulkGen";

const prisma = new PrismaClient();
const N = Number(process.argv[2] ?? 10_000);
const EXTRA = ["INSPECTED", "OVERHAULED", "INSTALLED", "REMOVED", "REPAIRED"].slice(0, Math.max(0, Math.min(5, Number(process.argv[3] ?? 3))));
const CHUNK = 500;

(async () => {
  const t0 = Date.now();
  const tag = Date.now().toString(36).toUpperCase();
  const { org, apiKey, privateKey } = await createOrgWithKeys(`Bulk Test Org ${tag}`, "ENTERPRISE");
  console.log(`Org ${org.id}. Generating ${N.toLocaleString()} parts x ${EXTRA.length + 1} events...`);
  const sample: [string, string][] = [];
  let events = 0;
  for (let i = 0; i < N; i += CHUNK) {
    const parts: any[] = [], evs: any[] = [];
    for (let j = i; j < Math.min(i + CHUNK, N); j++) {
      const pn = `BULK-${j % 200}`, sn = `${tag}-${j}`;
      const c = generateChain({ orgId: org.id, privateKey, partNumber: pn, serialNumber: sn, description: "Load test part", start: new Date(Date.now() - (N - j) * 1000), extra: EXTRA });
      parts.push({ ...c.part, currentOrgId: org.id });
      evs.push(...c.events);
      if (j % Math.max(1, Math.floor(N / 200)) === 0) sample.push([pn, sn]);
    }
    await prisma.part.createMany({ data: parts });
    await prisma.partEvent.createMany({ data: evs });
    events += evs.length;
    if ((i / CHUNK) % 5 === 0) console.log(`  ${Math.min(i + CHUNK, N).toLocaleString()} parts, ${events.toLocaleString()} events (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  writeFileSync("bulk-sample.json", JSON.stringify(sample));
  writeFileSync("bulk-credentials.json", JSON.stringify({ organizationId: org.id, apiKey, privateKey }, null, 2));
  console.log(`Done: ${N.toLocaleString()} parts and ${events.toLocaleString()} events in ${Math.round((Date.now() - t0) / 1000)}s.`);
  console.log("Next: DISABLE_RATE_LIMIT=1 npm run dev, then npm run loadtest");
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

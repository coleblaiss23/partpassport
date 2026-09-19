// Usage: npm run flags:import -- data/flags.csv
// CSV header: partNumber,source,referenceId,description,serialRangeStart,serialRangeEnd,issuedDate,url
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { normPN } from "../src/lib/normalize";

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(Boolean)) rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const prisma = new PrismaClient();
(async () => {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: npm run flags:import -- path/to/flags.csv");
  const [head, ...rows] = parseCsv(readFileSync(file, "utf8"));
  const idx = (n: string) => head.indexOf(n);
  let n = 0;
  for (const r of rows) {
    const get = (k: string) => (r[idx(k)] ?? "").trim() || null;
    const partNumber = get("partNumber"), source = get("source"), referenceId = get("referenceId"), issued = get("issuedDate");
    if (!partNumber || !source || !referenceId || !issued) continue;
    const key = { source, referenceId, partNumberNorm: normPN(partNumber) };
    const data = { ...key, partNumber, description: get("description") ?? "", serialRangeStart: get("serialRangeStart"), serialRangeEnd: get("serialRangeEnd"), issuedDate: new Date(issued), url: get("url") };
    await prisma.safetyFlag.upsert({ where: { source_referenceId_partNumberNorm: key }, create: data, update: data });
    n++;
  }
  console.log(`Imported ${n} safety flags`);
})().finally(() => prisma.$disconnect());

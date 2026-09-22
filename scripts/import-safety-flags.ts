// Generic safety-flag importer for a CSV you curate by hand (e.g. ADs naming specific part numbers).
// Columns: part_number, source, reference_id, description, url, issued_date, serial_range_start, serial_range_end
//   npm run flags:import -- /path/to/flags.csv
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { parseCsv } from "../src/lib/csv";
import { normPN } from "../src/lib/normalize";

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("Usage: npm run flags:import -- /path/to/flags.csv"); process.exit(1); }
  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const get = (row: string[], name: string) => (idx(name) >= 0 ? (row[idx(name)] ?? "").trim() : "");

  let saved = 0, skipped = 0;
  for (const row of rows.slice(1)) {
    if (!row.some((c) => c.trim())) continue;
    const partNumber = get(row, "part_number");
    const referenceId = get(row, "reference_id");
    const description = get(row, "description");
    if (!partNumber || !referenceId || !description) { skipped++; continue; }
    const issued = get(row, "issued_date");
    const key = { source: get(row, "source") || "UPN", referenceId, partNumberNorm: normPN(partNumber) };
    const data = {
      ...key, partNumber, description,
      url: get(row, "url") || null,
      serialRangeStart: get(row, "serial_range_start") || null,
      serialRangeEnd: get(row, "serial_range_end") || null,
      issuedDate: issued ? new Date(issued) : new Date(),
    };
    await prisma.safetyFlag.upsert({ where: { source_referenceId_partNumberNorm: key }, create: data, update: data });
    saved++;
  }
  console.log(`Saved ${saved} safety flags. Skipped ${skipped} rows missing part_number, reference_id or description.`);
}

main().catch((e) => { console.error("Import failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());

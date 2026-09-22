// Imports FAA Service Difficulty Reports into SafetyFlag.
// Get the CSV from faa.gov (Aviation Data & Statistics > Service Difficulty Reporting System),
// save it OUTSIDE the repo, then run:
//   npm run flags:import:sdr -- /path/to/2026_SDR.csv
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { parseCsv } from "../src/lib/csv";
import { normPN } from "../src/lib/normalize";

const prisma = new PrismaClient();
const BATCH = 1000;

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "\u2026" : s;
}

// M/D/YYYY (as published) -> Date, or null if unparseable.
function parseFaaDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run flags:import:sdr -- /path/to/file.csv");
    process.exit(1);
  }
  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`Expected column "${name}" in the SDR export. Found: ${header.join(", ")}`);
    return i;
  };
  const col = {
    controlNumber: idx("OperatorControlNumber"),
    difficultyDate: idx("DifficultyDate"),
    partNumber: idx("PartNumber"),
    partName: idx("PartName"),
    discrepancy: idx("Discrepancy"),
  };

  type Row = { partNumber: string; partNumberNorm: string; source: string; referenceId: string; description: string; issuedDate: Date; url: string };
  let batch: Row[] = [];
  let seen = 0, withPart = 0, inserted = 0;
  const flush = async () => {
    if (!batch.length) return;
    const r = await prisma.safetyFlag.createMany({ data: batch, skipDuplicates: true });
    inserted += r.count;
    batch = [];
  };

  for (const row of rows.slice(1)) {
    if (!row.some((c) => c.trim())) continue;
    seen++;
    const partNumber = (row[col.partNumber] ?? "").trim();
    const referenceId = (row[col.controlNumber] ?? "").trim();
    if (!partNumber || !referenceId) continue; // most SDRs are aircraft-level, not part-level; those are skipped on purpose
    withPart++;

    const partName = (row[col.partName] ?? "").trim();
    const discrepancy = truncate((row[col.discrepancy] ?? "").trim(), 500) || "No description provided in the SDR.";
    const issuedDate = parseFaaDate(row[col.difficultyDate] ?? "") ?? new Date();

    batch.push({
      partNumber, partNumberNorm: normPN(partNumber), source: "SDR", referenceId,
      description: partName ? `${partName}: ${discrepancy}` : discrepancy,
      issuedDate, url: `https://sdrs.faa.gov/report/${encodeURIComponent(referenceId)}`,
    });
    if (batch.length >= BATCH) { await flush(); console.log(`  processed ${seen.toLocaleString()} rows, ${inserted.toLocaleString()} flags saved so far`); }
  }
  await flush();
  console.log(`Done. ${seen.toLocaleString()} rows read, ${withPart.toLocaleString()} named a part, ${inserted.toLocaleString()} flags saved (duplicates skipped).`);
}

main().catch((e) => { console.error("Import failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());

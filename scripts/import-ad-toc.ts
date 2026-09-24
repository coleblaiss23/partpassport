/**
 * Ingest FAA AD Table of Contents (Large + Small aircraft biweekly TOCs).
 * 
 * Usage:
 *   npx tsx --env-file=.env scripts/import-ad-toc.ts \
 *     data/ad/LG2026-19_TOC.xlsx data/ad/SM2026-19_TOC.xlsx
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

type TocRow = {
  biweekly: string;
  adNumber: string;
  information: string;
  manufacturer: string;
  applicability: string;
};

function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normPart(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/** Parse "R 2025-13-12", "A 2024-19-02", "COR", "E", etc. */
function parseInfo(info: string): { kind: string; related: string | null; note: string } {
  const t = clean(info);
  if (!t) return { kind: "", related: null, note: "" };
  const rev = /^R\s+(\d{4}-\d{2}-\d{2})\b/i.exec(t);
  if (rev) return { kind: "REVISION", related: rev[1], note: t };
  const amd = /^A\s+(\d{4}-\d{2}-\d{2})\b/i.exec(t);
  if (amd) return { kind: "AMENDS", related: amd[1], note: t };
  if (/^COR\b/i.test(t)) return { kind: "CORRECTION", related: null, note: t };
  if (/^E\b/i.test(t)) return { kind: "EMERGENCY", related: null, note: t };
  return { kind: "", related: null, note: t };
}

function splitApplicability(raw: string): string[] {
  const t = clean(raw);
  if (!t || /^no\s+ads$/i.test(t)) return [];
  return t
    .split(",")
    .map((x) => clean(x))
    .filter(Boolean);
}

function yearFromAd(adNumber: string, biweekly: string): Date {
  const m = /^(\d{4})-/.exec(adNumber);
  if (m) return new Date(`${m[1]}-01-01T00:00:00.000Z`);
  const b = /^(\d{4})-/.exec(biweekly);
  if (b) return new Date(`${b[1]}-01-01T00:00:00.000Z`);
  return new Date();
}

function readSheet(filePath: string): TocRow[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return [];
  }
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const rows: TocRow[] = [];
  for (const r of json) {
    const biweekly = clean(r["Biweekly"] ?? r["biweekly"] ?? r["Bi-Weekly"]);
    const adNumber = clean(r["AD Number"] ?? r["ADNumber"] ?? r["ad number"] ?? r["AD"]);
    const information = clean(r["Information"] ?? r["information"] ?? r["Info"]);
    const manufacturer = clean(r["Manufacturer"] ?? r["manufacturer"]);
    const applicability = clean(r["Applicability"] ?? r["applicability"]);
    if (!adNumber || /^no\s+ads$/i.test(adNumber)) continue;
    rows.push({ biweekly, adNumber, information, manufacturer, applicability });
  }
  return rows;
}

async function main() {
  const args = process.argv.slice(2);
  const defaults = [
    path.join(process.cwd(), "data/ad/LG2026-19_TOC.xlsx"),
    path.join(process.cwd(), "data/ad/SM2026-19_TOC.xlsx"),
  ];
  const files = args.length ? args : defaults.filter((f) => fs.existsSync(f));
  if (!files.length) {
    console.error(
      "No TOC Excel files found. Place LG2026-19_TOC.xlsx and SM2026-19_TOC.xlsx inside data/ad/"
    );
    process.exit(1);
  }
  const allRows = files.flatMap(readSheet);
  console.log(`Parsed ${allRows.length} AD TOC rows from ${files.length} file(s)`);

  type FlagRow = {
    partNumber: string;
    partNumberNorm: string;
    source: string;
    referenceId: string;
    description: string;
    issuedDate: Date;
    url: string | null;
  };

  const batch: FlagRow[] = [];
  const seen = new Set<string>();

  for (const row of allRows) {
    const info = parseInfo(row.information);
    const models = splitApplicability(row.applicability);
    const targets =
      models.length > 0
        ? models
        : [row.manufacturer || "UNKNOWN-PRODUCT"].map(clean).filter(Boolean);

    for (const model of targets) {
      const partNumber = model.slice(0, 200);
      const partNumberNorm = normPart(partNumber);
      if (!partNumberNorm) continue;
      const key = `AD|${row.adNumber}|${partNumberNorm}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const bits = [
        row.manufacturer && `Manufacturer: ${row.manufacturer}`,
        info.kind && `Type: ${info.kind}`,
        info.related && `Related AD: ${info.related}`,
        info.note && info.note !== info.kind && `Info: ${info.note}`,
        row.biweekly && `Biweekly: ${row.biweekly}`,
        `Applicability model: ${model}`,
      ].filter(Boolean);

      batch.push({
        partNumber,
        partNumberNorm,
        source: "AD",
        referenceId: row.adNumber,
        description: bits.join(" | ").slice(0, 2000),
        issuedDate: yearFromAd(row.adNumber, row.biweekly),
        url: null,
      });
    }
  }

  console.log(`Prepared ${batch.length} SafetyFlag rows`);

  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    const result = await prisma.safetyFlag.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    written += result.count;
    console.log(`  upserted chunk ${i / CHUNK + 1}: +${result.count}`);
  }
  console.log(`Done. Inserted ${written} new AD safety flags (${batch.length - written} skipped duplicates).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
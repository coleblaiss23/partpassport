/**
 * Upsert FAA-style N-number rows into AircraftRegistry.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/import-aircraft-registry.ts data/registry/sample.json
 *
 * JSON format: [{ "tailNumber":"N4867W", "make":"...", "model":"...", "year":1976, ... }]
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { normalizeTailNumber } from "../src/lib/aircraftRegistry";

const prisma = new PrismaClient();

type Row = {
  tailNumber: string;
  make: string;
  model: string;
  year?: number | null;
  serialNumber?: string | null;
  engineModel?: string | null;
  series?: string | null;
  source?: string;
};

async function main() {
  const file = process.argv[2] ?? path.join(process.cwd(), "data/registry/sample.json");
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(file, "utf8")) as Row[];
  let n = 0;
  for (const r of rows) {
    const tailNumber = normalizeTailNumber(r.tailNumber);
    if (!tailNumber || !r.make?.trim() || !r.model?.trim()) continue;
    await prisma.aircraftRegistry.upsert({
      where: { tailNumber },
      create: {
        tailNumber,
        make: r.make.trim(),
        model: r.model.trim(),
        year: r.year ?? null,
        serialNumber: r.serialNumber ?? null,
        engineModel: r.engineModel ?? null,
        series: r.series ?? null,
        source: r.source ?? "IMPORT",
      },
      update: {
        make: r.make.trim(),
        model: r.model.trim(),
        year: r.year ?? null,
        serialNumber: r.serialNumber ?? null,
        engineModel: r.engineModel ?? null,
        series: r.series ?? null,
        source: r.source ?? "IMPORT",
      },
    });
    n += 1;
  }
  console.log(`Upserted ${n} AircraftRegistry rows from ${file}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

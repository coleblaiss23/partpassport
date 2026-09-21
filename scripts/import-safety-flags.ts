import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cols: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        q = !q;
        continue;
      }
      if (ch === "," && !q) {
        cols.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  });
}

async function main() {
  const path = process.argv[2] || "data/upn/csv/safety_flags.csv";
  const raw = readFileSync(path, "utf8");
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  let n = 0;

  for (const row of rows.slice(1)) {
    if (!row.length || row.every((c) => !c)) continue;
    const partNumber = (row[idx("part_number")] || "").toUpperCase();
    const source = row[idx("source")] || "UPN";
    const referenceId = row[idx("reference_id")] || "";
    const description = row[idx("description")] || "";
    const url = row[idx("url")] || null;
    const issued = row[idx("issued_date")] || null;

    if (!referenceId || !description) {
      console.warn("skip row missing reference_id/description", row);
      continue;
    }
    if (!partNumber) {
      console.warn("skip row with no part_number", referenceId);
      continue;
    }

    const partNumberNorm = partNumber.replace(/[^a-zA-Z0-9]/g, "");

    await prisma.safetyFlag.create({
      data: {
        partNumber,
        partNumberNorm,
        source,
        referenceId,
        description,
        url,
        issuedDate: issued ? new Date(issued) : new Date(),
      },
    });
    n++;
  }
  console.log("Successfully imported", n, "safety flags");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

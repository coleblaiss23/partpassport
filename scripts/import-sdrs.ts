import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importSDRs() {
  const filePath = path.join(process.cwd(), '2026_SDR.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let batch: any[] = [];
  let totalInserted = 0;
  let isHeader = true;
  let lineIndex = 0;

  console.log('🚀 Writing SDR Safety Flags to database...');

  for await (const line of rl) {
    if (isHeader) { 
      isHeader = false; 
      continue; 
    }

    lineIndex++;
    const cols = line.split(',');
    const rawPartNumber = cols[3]?.replace(/"/g, '').trim();
    const reasonCode = cols[10]?.replace(/"/g, '').trim() || 'O';
    const descriptionText = cols[11]?.replace(/"/g, '').trim() || 'Service Difficulty Report entry';
    const controlNum = cols[0]?.replace(/"/g, '').trim() || `SDR-2026-${lineIndex}`;

    if (rawPartNumber) {
      const partNumberNorm = rawPartNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      batch.push({
        partNumber: rawPartNumber,
        partNumberNorm: partNumberNorm,
        source: 'FAA_SDR_2026',
        referenceId: controlNum,
        reason: reasonCode,
        description: descriptionText,
        severity: 'WARNING',
      });
    }

    if (batch.length >= 1000) {
      await prisma.safetyFlag.createMany({ 
        data: batch, 
        skipDuplicates: true 
      });
      totalInserted += batch.length;
      console.log(`Saved ${totalInserted} safety flags...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.safetyFlag.createMany({ 
      data: batch, 
      skipDuplicates: true 
    });
    totalInserted += batch.length;
  }

  console.log(`✅ Finished! ${totalInserted} safety flags written to database.`);
}

importSDRs()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
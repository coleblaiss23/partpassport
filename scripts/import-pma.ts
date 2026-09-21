import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importPMA() {
  const filePath = path.join(process.cwd(), 'pma_database.csv');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let batch: any[] = [];
  let totalInserted = 0;
  let isHeader = true;

  console.log('🚀 Writing PMA records to database...');

  for await (const line of rl) {
    if (isHeader) { 
      isHeader = false; 
      continue; 
    }

    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 14) continue;

    const partName = matches[0]?.replace(/"/g, '').trim();
    const pmaHolder = matches[1]?.replace(/"/g, '').trim();
    const rawPmaPartNum = matches[22]?.replace(/"/g, '').trim();
    const pmaPartNumber = rawPmaPartNum?.split('#')[0]?.trim();

    if (pmaPartNumber) {
      const partNumberNorm = pmaPartNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      batch.push({
        partNumber: pmaPartNumber,
        partNumberNorm: partNumberNorm,
        name: partName || 'PMA Replacement Part',
        description: `PMA Holder: ${pmaHolder}`,
      });
    }

    if (batch.length >= 2000) {
      await prisma.part.createMany({ 
        data: batch, 
        skipDuplicates: true 
      });
      totalInserted += batch.length;
      console.log(`Saved ${totalInserted} PMA records...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.part.createMany({ 
      data: batch, 
      skipDuplicates: true 
    });
    totalInserted += batch.length;
  }

  console.log(`✅ Finished! ${totalInserted} PMA parts successfully written to database.`);
}

importPMA()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
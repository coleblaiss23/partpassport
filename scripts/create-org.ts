import { PrismaClient } from "@prisma/client";
import { generateKeypair } from "../src/lib/signing";
import { hashKey, newApiKey } from "../src/lib/auth";

const prisma = new PrismaClient();
const name = process.argv[2];
if (!name) { console.error('Usage: npm run org:create -- "Org Name"'); process.exit(1); }

(async () => {
  const { publicKey, privateKey } = generateKeypair();
  const apiKey = newApiKey();
  const org = await prisma.organization.create({ data: { name, publicKey, apiKeyHash: hashKey(apiKey) } });
  console.log("Organization ID:", org.id);
  console.log("API KEY (save now):", apiKey);
  console.log("\nPRIVATE KEY (save now, never stored):\n" + privateKey);
})().finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import { generateKeypair, newApiKey, hashApiKey } from "../src/lib/signing";

const prisma = new PrismaClient();

async function main() {
  const orgName = process.argv[2] || "Demo Org";
  const { publicKey } = generateKeypair();
  const rawApiKey = newApiKey();
  const apiKeyHash = hashApiKey(rawApiKey);

  const org = await prisma.organization.create({
    data: {
      name: orgName,
      publicKey,
      plan: "PILOT",
      verification: "UNVERIFIED",
      apiKeys: {
        create: {
          name: "Default Key",
          prefix: rawApiKey.slice(0, 8),
          hash: apiKeyHash,
        },
      },
    },
  });

  console.log("Created Org ID:", org.id);
  console.log("API Key (save this now):", rawApiKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

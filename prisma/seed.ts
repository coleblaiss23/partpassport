import { PrismaClient } from "@prisma/client";
import { generateKeypair } from "@/lib/signing";

const prisma = new PrismaClient();

async function main() {
  const keys = generateKeypair();

  const org = await prisma.organization.create({
    data: {
      name: "AeroTech Components LLC",
      publicKey: keys.publicKey,
    },
  });

  console.log("Seeded Organization ID:", org.id);
  console.log("\n--- SAVE THIS PRIVATE KEY FOR TESTING API POST REQUESTS ---");
  console.log(keys.privateKey);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
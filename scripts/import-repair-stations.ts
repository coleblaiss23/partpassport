import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Ingesting baseline certified repair stations...");
  
  await prisma.repairStation.upsert({
    where: { certNumber: "EX-PART145-TEST" },
    update: {},
    create: {
      certNumber: "EX-PART145-TEST",
      name: "Sample Certified Repair Station LLC",
      location: "Provo, UT",
      status: "ACTIVE",
    },
  });

  console.log("Successfully seeded repair station verification data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

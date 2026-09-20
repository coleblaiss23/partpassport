import { PrismaClient } from "@prisma/client";
import { generateKeypair } from "../src/lib/signing";

const prisma = new PrismaClient();

async function main() {
  await prisma.certificateCheck.deleteMany().catch(() => {});
  await prisma.partEvent.deleteMany().catch(() => {});
  await prisma.part.deleteMany().catch(() => {});
  await prisma.userOrg.deleteMany().catch(() => {});
  await prisma.apiKey.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.organization.deleteMany().catch(() => {});

  const keys = generateKeypair();
  const org = await prisma.organization.create({
    data: {
      name: "Demo MRO (Pilot)",
      publicKey: keys.publicKey,
      encPrivateKey: null,
      plan: "PILOT",
      verification: "UNVERIFIED",
    },
  });

  console.log("Demo org id:", org.id);
  console.log("Plan: PILOT — 25 parts,  checks/mo, no custody transfer");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

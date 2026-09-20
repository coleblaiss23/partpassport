// After you check an organization's FAA/EASA certificate:  npm run org:verify -- <orgId> [FAA-certificate-number]
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const [id, cert] = process.argv.slice(2);
if (!id) { console.error("Usage: npm run org:verify -- <orgId> [certificateNumber]"); process.exit(1); }
(async () => {
  const org = await prisma.organization.update({ where: { id }, data: { verification: "VERIFIED", verifiedAt: new Date(), ...(cert ? { faaCertNumber: cert } : {}) } });
  await prisma.auditLog.create({ data: { organizationId: id, action: "ORG_VERIFIED", meta: JSON.stringify({ cert: cert ?? null, by: "admin-script" }) } });
  console.log(`${org.name} is now a Verified issuer`);
})().catch((e) => { console.error("Failed:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());

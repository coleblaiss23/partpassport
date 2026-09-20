// npm run org:list  (shows each organization, its plan and this month's usage)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
(async () => {
  const from = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: "asc" } });
  for (const o of orgs) {
    const [checks, regs] = await Promise.all([
      prisma.certificateCheck.count({ where: { organizationId: o.id, createdAt: { gte: from } } }),
      prisma.partEvent.count({ where: { organizationId: o.id, eventType: "CREATED", createdAt: { gte: from } } }),
    ]);
    console.log(`${o.id}  ${o.plan.padEnd(10)} checks ${String(checks).padStart(4)}  regs ${String(regs).padStart(4)}  ${o.name}`);
  }
})().finally(() => prisma.$disconnect());

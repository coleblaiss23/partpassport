// Use after a customer pays: npm run org:plan -- <orgId> <STARTER|PROFESSIONAL|ENTERPRISE>
import { PrismaClient } from "@prisma/client";
import { normalizePlanId } from "../src/lib/planLimits";

const prisma = new PrismaClient();
const [id, planRaw] = process.argv.slice(2);
const allowed = ["STARTER", "PROFESSIONAL", "ENTERPRISE", "PILOT", "PRO"];
if (!id || !planRaw || !allowed.includes(planRaw.toUpperCase())) {
  console.error("Usage: npm run org:plan -- <orgId> <STARTER|PROFESSIONAL|ENTERPRISE>");
  process.exit(1);
}

const plan = normalizePlanId(planRaw);

(async () => {
  const org = await prisma.organization.update({
    where: { id },
    data: { plan, subStatus: "active" },
  });
  await prisma.auditLog.create({
    data: {
      organizationId: id,
      action: "PLAN_CHANGED",
      meta: JSON.stringify({ plan, by: "admin-script" }),
    },
  });
  console.log(`${org.name} is now on ${org.plan}`);
})()
  .catch((e) => {
    console.error("Failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// Use after a customer pays (until Stripe webhooks exist): npm run org:plan -- <orgId> <PILOT|PRO|ENTERPRISE>
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const [id, plan] = process.argv.slice(2);
if (!id || !["PILOT", "PRO", "ENTERPRISE"].includes(plan)) {
  console.error("Usage: npm run org:plan -- <orgId> <PILOT|PRO|ENTERPRISE>");
  process.exit(1);
}

(async () => {
  const org = await prisma.organization.update({
    where: { id },
    data: { plan: plan as "PILOT" | "PRO" | "ENTERPRISE", subStatus: plan === "PILOT" ? null : "active" },
  });
  await prisma.auditLog.create({ data: { organizationId: id, action: "PLAN_CHANGED", meta: JSON.stringify({ plan, by: "admin-script" }) } });
  console.log(`${org.name} is now on ${org.plan}`);
})()
  .catch((e) => { console.error("Failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

// Usage: npm run org:create -- "Org Name" [STARTER|PROFESSIONAL|ENTERPRISE]
import { PrismaClient } from "@prisma/client";
import { createOrgWithKeys } from "../src/lib/orgs";
import { normalizePlanId, type PlanId } from "../src/lib/planLimits";

const prisma = new PrismaClient();
const [name, planRaw = "STARTER"] = process.argv.slice(2);
const plan = normalizePlanId(planRaw);
const allowed = ["STARTER", "PROFESSIONAL", "ENTERPRISE", "PILOT", "PRO"];
if (!name || !allowed.includes(planRaw.toUpperCase())) {
  console.error('Usage: npm run org:create -- "Org Name" [STARTER|PROFESSIONAL|ENTERPRISE]');
  process.exit(1);
}

(async () => {
  const { org, apiKey, privateKey } = await createOrgWithKeys(name, plan as PlanId);
  console.log("Organization ID:", org.id, `(plan: ${org.plan})`);
  console.log("API KEY (save now):", apiKey);
  console.log("\nPRIVATE KEY (save now, never stored):\n" + privateKey);
})().finally(() => prisma.$disconnect());

// Usage: npm run org:create -- "Org Name" [PILOT|PRO|ENTERPRISE]
import { PrismaClient } from "@prisma/client";
import { createOrgWithKeys } from "../src/lib/orgs";
import type { PlanId } from "../src/lib/planLimits";

const prisma = new PrismaClient();
const [name, plan = "PILOT"] = process.argv.slice(2);
if (!name || !["PILOT", "PRO", "ENTERPRISE"].includes(plan)) {
  console.error('Usage: npm run org:create -- "Org Name" [PILOT|PRO|ENTERPRISE]');
  process.exit(1);
}

(async () => {
  const { org, apiKey, privateKey } = await createOrgWithKeys(name, plan as PlanId);
  console.log("Organization ID:", org.id, `(plan: ${org.plan})`);
  console.log("API KEY (save now):", apiKey);
  console.log("\nPRIVATE KEY (save now, never stored):\n" + privateKey);
})().finally(() => prisma.$disconnect());

// npm run leads   (newest 50 leads)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  if (!leads.length) console.log("No leads yet.");
  for (const l of leads) console.log(`${l.createdAt.toISOString().slice(0, 16)}  ${l.name} <${l.email}>  ${l.company}  ${l.role ?? ""}  vol:${l.volume ?? "-"}  src:${l.source ?? "-"}${l.message ? "\n    " + l.message.replace(/\n/g, " ") : ""}`);
})().finally(() => prisma.$disconnect());

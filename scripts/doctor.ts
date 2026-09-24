// npm run doctor   Checks environment variables and database health before you test or deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let fails = 0;
const out = (level: "PASS" | "WARN" | "FAIL", msg: string) => { if (level === "FAIL") fails++; console.log(`${level}  ${msg}`); };
const env = (k: string) => process.env[k] ?? "";
const prod = env("NODE_ENV") === "production";

(async () => {
  console.log("Environment");
  env("DATABASE_URL").startsWith("postgres") ? out("PASS", "DATABASE_URL is a Postgres URL") : out("FAIL", "DATABASE_URL missing or not postgresql://");
  env("ADMIN_TOKEN").length >= 32 ? out("PASS", "ADMIN_TOKEN is strong") : out("WARN", "ADMIN_TOKEN should be 32+ characters (openssl rand -hex 32)");
  env("SESSION_SECRET").length >= 32 ? out("PASS", "SESSION_SECRET is strong") : out("FAIL", "SESSION_SECRET missing or under 32 characters");
  if (env("AI_MODE") === "mock") out("WARN", "AI_MODE=mock is treated as local; prefer AI_MODE=local");
  else if (env("AI_MODE") === "off") out("WARN", "AI_MODE=off: certificate analysis is disabled");
  else if (env("AI_MODE") === "local") out("PASS", "AI_MODE=local (free PDF text extraction; scanned forms need Anthropic)");
  else env("ANTHROPIC_API_KEY") ? out("PASS", "ANTHROPIC_API_KEY set (real AI analysis)") : out(prod ? "WARN" : "PASS", prod ? "No ANTHROPIC_API_KEY: certificate analysis is off" : "No ANTHROPIC_API_KEY: development defaults to local PDF text extraction");
  env("NEXT_PUBLIC_APP_URL") && !(prod && env("NEXT_PUBLIC_APP_URL").includes("localhost")) ? out("PASS", "NEXT_PUBLIC_APP_URL set") : out("WARN", "NEXT_PUBLIC_APP_URL missing or localhost");
  env("NEXT_PUBLIC_STRIPE_PAYMENT_LINK") ? out("PASS", "Stripe Payment Link set") : out("WARN", "NEXT_PUBLIC_STRIPE_PAYMENT_LINK not set (pricing button falls back to request-access)");
  env("STRIPE_WEBHOOK_SECRET") ? out("PASS", "STRIPE_WEBHOOK_SECRET set") : out("WARN", "STRIPE_WEBHOOK_SECRET not set: paid plans will not activate automatically");
  if (env("STRIPE_SECRET_KEY") && env("STRIPE_PRICE_PRO")) out("PASS", "Stripe Checkout configured (STRIPE_SECRET_KEY + STRIPE_PRICE_PRO)");
  else if (env("STRIPE_SECRET_KEY")) out("WARN", "STRIPE_SECRET_KEY set but STRIPE_PRICE_PRO missing (checkout incomplete)");
  else out(prod ? "WARN" : "PASS", prod ? "STRIPE_SECRET_KEY not set: Manage billing button is off" : "Stripe unset: development uses local billing mock");
  if (env("BILLING_DEV_MOCK") === "1" || env("BILLING_DEV_MOCK") === "true") out("PASS", "BILLING_DEV_MOCK enabled (browser plan switching)");
  else if (env("BILLING_DEV_MOCK") === "0" || env("BILLING_DEV_MOCK") === "off") out("WARN", "BILLING_DEV_MOCK disabled");
  env("UPSTASH_REDIS_REST_URL") ? out("PASS", "Shared rate limiting (Upstash)") : out("WARN", "Rate limits are per server instance. Add Upstash for production");
  env("LEAD_WEBHOOK_URL") ? out("PASS", "Lead alerts enabled") : out("WARN", "LEAD_WEBHOOK_URL not set (check leads with npm run leads)");
  if (env("DISABLE_RATE_LIMIT") === "1") out(prod ? "FAIL" : "WARN", "DISABLE_RATE_LIMIT=1 is on (load testing only)");

  console.log("\nDatabase");
  try {
    await prisma.$queryRaw`SELECT 1`;
    out("PASS", "Connected");
    const counts = await Promise.all([prisma.organization.count(), prisma.apiKey.count(), prisma.part.count(), prisma.partEvent.count(), prisma.certificateCheck.count(), prisma.safetyFlag.count(), prisma.lead.count(), prisma.stripeEvent.count()]);
    out("PASS", `Schema in sync. orgs ${counts[0]}, api keys ${counts[1]}, parts ${counts[2]}, events ${counts[3]}, checks ${counts[4]}, safety flags ${counts[5]}, leads ${counts[6]}`);
    const idx = await prisma.$queryRaw<{ indexname: string }[]>`SELECT indexname FROM pg_indexes WHERE tablename = 'PartEvent'`;
    idx.length >= 4 ? out("PASS", `PartEvent has ${idx.length} indexes`) : out("WARN", "PartEvent indexes missing. Run npx prisma migrate dev");
    if (counts[3] > 0 && counts[5] === 0) out("WARN", "No safety flags imported yet (npm run flags:import -- file.csv)");
  } catch (e) {
    out("FAIL", `Database problem: ${(e as Error).message.split("\n").pop()}. Run: npx prisma migrate dev`);
  }
  console.log(fails ? `\n${fails} problem(s) to fix` : "\nReady to test");
  process.exit(fails ? 1 : 0);
})().finally(() => prisma.$disconnect());

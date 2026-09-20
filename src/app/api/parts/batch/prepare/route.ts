import { NextResponse } from "next/server";
import { prepareBatch, MAX_BATCH } from "@/lib/batch";
import { gate } from "@/lib/usage";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { rateLimit } from "@/lib/rateLimit";
import { orgFromRequest, readJson, unauthorized } from "@/lib/api";

export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  if (!(await rateLimit(`batch:${org.id}`, 120, 60_000))) return NextResponse.json({ error: "Rate limit: 120 batch requests per minute" }, { status: 429 });
  const b = await readJson(request);
  if (!b || !Array.isArray(b.items) || !b.items.length) return NextResponse.json({ error: "items array required" }, { status: 400 });
  if (b.items.length > MAX_BATCH) return NextResponse.json({ error: `At most ${MAX_BATCH} items per request` }, { status: 400 });
  const g = await gate(org, "registrations");
  const allowance = Math.max(0, PLAN_LIMITS[g.plan].registrations - g.usage.registrations);
  return NextResponse.json({ results: await prepareBatch(org, b.items, allowance), allowance });
}

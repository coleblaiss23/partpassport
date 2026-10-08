import { NextResponse } from "next/server";
import { orgFromRequest, unauthorized } from "@/lib/api";
import { applyDevPlan, billingDevMockEnabled } from "@/lib/billing";
import { normalizePlanId, type PlanId } from "@/lib/planLimits";

const PLANS: PlanId[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

/** Change plan in local/mock billing mode (no Stripe). */
export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  if (!billingDevMockEnabled()) {
    return NextResponse.json(
      {
        error:
          "Mock plan changes are only available when BILLING_DEV_MOCK is enabled and Stripe is not configured.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const plan = normalizePlanId(typeof body?.plan === "string" ? body.plan : "");
  if (!PLANS.includes(plan)) {
    return NextResponse.json(
      { error: "plan must be STARTER, PROFESSIONAL, or ENTERPRISE" },
      { status: 400 },
    );
  }

  const updated = await applyDevPlan(org.id, plan);
  return NextResponse.json({
    ok: true,
    plan: updated.plan,
    url: `/billing?updated=${updated.plan}`,
  });
}

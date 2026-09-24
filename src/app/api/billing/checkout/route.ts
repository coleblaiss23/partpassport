import { NextResponse } from "next/server";
import { orgFromRequest } from "@/lib/api";
import {
 applyDevProUpgrade,
 billingDevMockEnabled,
 stripeCheckoutConfigured,
} from "@/lib/billing";
import { createOrgWithKeys } from "@/lib/orgs";
import { makeSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

const cookieOpts = {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "lax" as const,
 path: "/",
 maxAge: SESSION_MAX_AGE,
};

function withSession(res: NextResponse, token: string | null) {
 if (token) res.cookies.set(SESSION_COOKIE, token, cookieOpts);
 return res;
}

export async function POST(request: Request) {
 const body = await request.json().catch(() => ({}));
 const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
 const planRaw = typeof body?.plan === "string" ? body.plan.trim().toUpperCase() : "PRO";
 const wantPilot = planRaw === "PILOT";

 let org = await orgFromRequest(request);
 let sessionToken: string | null = null;

 if (!org) {
 if (!companyName || companyName.length < 2 || companyName.length > 120) {
 return NextResponse.json(
 { error: "Company name is required", needsCompanyName: true },
 { status: 401 }
 );
 }
 const created = await createOrgWithKeys(companyName, "PILOT");
 org = created.org;
 try {
 sessionToken = makeSession(org.id);
 } catch (e) {
 return NextResponse.json({ error: (e as Error).message }, { status: 500 });
 }
 }

 // Free Pilot: org + session cookie, then dashboard (no Stripe).
 if (wantPilot) {
 return withSession(NextResponse.json({ url: "/dashboard" }), sessionToken);
 }

 const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

 // Local / test fallback when Stripe is not configured.
 if (!stripeCheckoutConfigured()) {
 if (!billingDevMockEnabled()) {
 return NextResponse.json(
 { error: "Checkout is not configured (missing STRIPE_SECRET_KEY or STRIPE_PRICE_PRO)" },
 { status: 503 }
 );
 }
 await applyDevProUpgrade(org.id);
 return withSession(
 NextResponse.json({
 url: `/checkout?success=1&plan=PRO&dev=1`,
 devMock: true,
 }),
 sessionToken
 );
 }

 const key = process.env.STRIPE_SECRET_KEY!;
 const priceId = process.env.STRIPE_PRICE_PRO!;
 const params = new URLSearchParams({
 mode: "subscription",
 "line_items[0][price]": priceId,
 "line_items[0][quantity]": "1",
 success_url: `${base}/dashboard?checkout=success`,
 cancel_url: `${base}/pricing?checkout=cancel`,
 client_reference_id: org.id,
 "subscription_data[metadata][organizationId]": org.id,
 });
 if (org.stripeCustomerId) {
 params.set("customer", org.stripeCustomerId);
 } else {
 params.set("customer_creation", "always");
 }
 const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
 method: "POST",
 headers: {
 Authorization: `Bearer ${key}`,
 "Content-Type": "application/x-www-form-urlencoded",
 },
 body: params,
 });
 const j = await r.json();
 if (!r.ok || !j.url) {
 console.error("[checkout]", j);
 return NextResponse.json({ error: "Could not create checkout session" }, { status: 502 });
 }
 return withSession(NextResponse.json({ url: j.url as string }), sessionToken);
}

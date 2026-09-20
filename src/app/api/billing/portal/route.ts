import { NextResponse } from "next/server";
import { orgFromRequest, unauthorized } from "@/lib/api";

// Creates a Stripe customer-portal session (manage card, cancel, download invoices).
export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Billing portal is not configured" }, { status: 503 });
  if (!org.stripeCustomerId) return NextResponse.json({ error: "No active subscription on this account" }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const r = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ customer: org.stripeCustomerId, return_url: `${base}/dashboard` }),
  });
  const j = await r.json();
  if (!r.ok || !j.url) return NextResponse.json({ error: "Could not open the billing portal" }, { status: 502 });
  return NextResponse.json({ url: j.url });
}

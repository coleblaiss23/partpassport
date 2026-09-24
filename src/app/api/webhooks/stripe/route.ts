import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { interpretStripeEvent, verifyStripeSignature, type StripeEventLike } from "@/lib/stripe";

// In Stripe: Developers > Webhooks > add endpoint <your-domain>/api/webhooks/stripe
// Events: checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
export async function POST(req: Request) {
 const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
 const raw = await req.text(); // must be the raw body for signature checking
 if (!secret || !verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret))
 return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

 let evt: StripeEventLike;
 try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

 try { await prisma.stripeEvent.create({ data: { id: evt.id, type: evt.type } }); }
 catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return NextResponse.json({ ok: true, duplicate: true }); throw e; }

 const act = interpretStripeEvent(evt);
 if (!act) return NextResponse.json({ ok: true, ignored: true });

 const { match, patch } = act;
 const or = [match.orgId && { id: match.orgId }, match.subId && { stripeSubId: match.subId }, match.customerId && { stripeCustomerId: match.customerId }].filter(Boolean) as Prisma.OrganizationWhereInput[];
 const org = or.length ? await prisma.organization.findFirst({ where: { OR: or } }) : null;
 if (!org) { console.warn(`[stripe] ${evt.type} ${evt.id}: no matching organization. Activate manually with npm run org:plan.`); return NextResponse.json({ ok: true, unmatched: true }); }

 const data: Prisma.OrganizationUpdateInput = { ...patch };
 if (org.plan === "ENTERPRISE") delete data.plan; // enterprise plans are managed manually
 await prisma.organization.update({ where: { id: org.id }, data });
 await prisma.auditLog.create({ data: { organizationId: org.id, action: "BILLING_UPDATED", meta: JSON.stringify({ stripeEvent: evt.id, type: evt.type, patch }) } });
 return NextResponse.json({ ok: true });
}

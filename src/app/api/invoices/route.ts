import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/planLimits";
import type { InvoicePaymentStatus, PaymentMethodHint } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const aircraftId = searchParams.get("aircraftId");

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: org.id,
      ...(aircraftId ? { aircraftId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canUseFeature(org, "stripeInvoicing") && !canUseFeature(org, "workOrders")) {
    return NextResponse.json(
      { error: "Shop invoicing requires Professional or Enterprise." },
      { status: 402 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const amountCents = typeof body.amountCents === "number" ? body.amountCents : NaN;
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    return NextResponse.json({ error: "amountCents is required" }, { status: 400 });
  }

  const count = await prisma.invoice.count({ where: { organizationId: org.id } });
  const number =
    typeof body.number === "string" && body.number.trim()
      ? body.number.trim().toUpperCase()
      : `INV-${String(count + 1).padStart(4, "0")}`;

  const paymentStatus = (
    ["PENDING", "PAID", "CHECK_RECEIVED", "VOID"] as InvoicePaymentStatus[]
  ).includes(body.paymentStatus)
    ? (body.paymentStatus as InvoicePaymentStatus)
    : "PENDING";

  const paymentMethodHint = (
    ["CARD", "APPLE_PAY", "GOOGLE_PAY", "CHECK", "MANUAL"] as PaymentMethodHint[]
  ).includes(body.paymentMethodHint)
    ? (body.paymentMethodHint as PaymentMethodHint)
    : null;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      number,
      amountCents: Math.round(amountCents),
      currency: typeof body.currency === "string" ? body.currency.toLowerCase() : "usd",
      paymentStatus,
      paymentMethodHint,
      shopId: typeof body.shopId === "string" ? body.shopId : null,
      aircraftId: typeof body.aircraftId === "string" ? body.aircraftId : null,
      workOrderId: typeof body.workOrderId === "string" ? body.workOrderId : null,
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : null,
      lineItems:
        body.lineItems != null ? JSON.stringify(body.lineItems) : null,
      stripePaymentIntentId:
        typeof body.stripePaymentIntentId === "string"
          ? body.stripePaymentIntentId
          : null,
      stripeCheckoutSessionId:
        typeof body.stripeCheckoutSessionId === "string"
          ? body.stripeCheckoutSessionId
          : null,
    },
  });

  return NextResponse.json({ invoice }, { status: 201 });
}

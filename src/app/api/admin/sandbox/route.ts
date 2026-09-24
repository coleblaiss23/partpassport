import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDevFlags, resetAdminDevFlags, setAdminDevFlags } from "@/lib/adminFlags";
import { readJson } from "@/lib/api";
import { extractCert, localFlags } from "@/lib/extract";
import {
 FIXTURE_SAMPLE_1,
 FIXTURE_SAMPLE_2,
 FIXTURE_SAMPLE_3,
 FIXTURE_SAMPLE_4,
 FIXTURE_SAMPLE_5,
 KNOWN_SAMPLE_BY_SHA256,
} from "@/lib/ai/knownSamples";
import { interpretStripeEvent, type StripeEventLike } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FIXTURE_DIR = path.join(process.cwd(), "tests/fixtures/forms");

const FIXTURES = [
 { id: "sample-1", file: "FAA-8130-3-sample 1.pdf", expected: FIXTURE_SAMPLE_1 },
 { id: "sample-2", file: "FAA-8130-3-sample 2.pdf", expected: FIXTURE_SAMPLE_2 },
 { id: "sample-3", file: "FAA-8130-3-sample 3.pdf", expected: FIXTURE_SAMPLE_3 },
 { id: "sample-4", file: "FAA-8130-3-sample 4.pdf", expected: FIXTURE_SAMPLE_4 },
 { id: "sample-5", file: "FAA-8130-3-sample 5.pdf", expected: FIXTURE_SAMPLE_5 },
] as const;

export async function GET(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 return NextResponse.json({
 flags: getAdminDevFlags(),
 fixtures: FIXTURES.map((f) => ({
 id: f.id,
 file: f.file,
 expectedPartNumber: f.expected.partNumber,
 })),
 knownSampleCount: Object.keys(KNOWN_SAMPLE_BY_SHA256).length,
 });
}

export async function POST(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const body = await readJson(req);
 if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
 const action = typeof body.action === "string" ? body.action : "";

 if (action === "flags") {
 const patch = (body.flags ?? {}) as Record<string, unknown>;
 const next = setAdminDevFlags({
 disableRateLimit:
 typeof patch.disableRateLimit === "boolean" ? patch.disableRateLimit : undefined,
 aiModeOverride:
 patch.aiModeOverride === null ||
 patch.aiModeOverride === "anthropic" ||
 patch.aiModeOverride === "local" ||
 patch.aiModeOverride === "off"
 ? patch.aiModeOverride
 : undefined,
 billingDevMock:
 patch.billingDevMock === null || typeof patch.billingDevMock === "boolean"
 ? (patch.billingDevMock as boolean | null)
 : undefined,
 });
 return NextResponse.json({ flags: next });
 }

 if (action === "flags-reset") {
 return NextResponse.json({ flags: resetAdminDevFlags() });
 }

 if (action === "ocr-fixture") {
 const fixtureId = typeof body.fixtureId === "string" ? body.fixtureId : "";
 const fixture = FIXTURES.find((f) => f.id === fixtureId);
 if (!fixture) return NextResponse.json({ error: "Unknown fixtureId" }, { status: 400 });
 const filePath = path.join(FIXTURE_DIR, fixture.file);
 let buf: Buffer;
 try {
 buf = await readFile(filePath);
 } catch {
 return NextResponse.json({ error: `Fixture file missing: ${fixture.file}` }, { status: 404 });
 }
 const sha256 = createHash("sha256").update(buf).digest("hex");
 const started = Date.now();
 const { data, mode } = await extractCert(buf.toString("base64"));
 const flags = localFlags(data);
 const pnMatch = (data.partNumber ?? "") === (fixture.expected.partNumber ?? "");
 const snMatch = (data.serial ?? "") === (fixture.expected.serial ?? "");
 return NextResponse.json({
 fixtureId: fixture.id,
 file: fixture.file,
 sha256,
 mode,
 elapsedMs: Date.now() - started,
 extracted: {
 partNumber: data.partNumber,
 serial: data.serial,
 organization: data.organization,
 approvalNumber: data.approvalNumber,
 status: data.status,
 },
 expected: {
 partNumber: fixture.expected.partNumber,
 serial: fixture.expected.serial,
 },
 match: { partNumber: pnMatch, serial: snMatch },
 redFlags: flags,
 knownSampleHit: Boolean(KNOWN_SAMPLE_BY_SHA256[sha256]),
 });
 }

 if (action === "stripe-simulate") {
 const orgId = typeof body.orgId === "string" ? body.orgId : "";
 const eventType =
 typeof body.eventType === "string" ? body.eventType : "checkout.session.completed";
 if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
 const org = await prisma.organization.findUnique({ where: { id: orgId } });
 if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

 const customerId = org.stripeCustomerId ?? `sim_cus_${orgId.slice(0, 12)}`;
 const subId = org.stripeSubId ?? `sim_sub_${orgId.slice(0, 12)}`;
 const evtId = `evt_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

 let evt: StripeEventLike;
 switch (eventType) {
 case "customer.subscription.deleted":
 evt = {
 id: evtId,
 type: eventType,
 data: { object: { id: subId, customer: customerId, status: "canceled" } },
 };
 break;
 case "invoice.payment_failed":
 evt = {
 id: evtId,
 type: eventType,
 data: { object: { customer: customerId } },
 };
 break;
 case "invoice.paid":
 evt = {
 id: evtId,
 type: eventType,
 data: { object: { customer: customerId } },
 };
 break;
 case "customer.subscription.updated":
 evt = {
 id: evtId,
 type: eventType,
 data: {
 object: {
 id: subId,
 customer: customerId,
 status: "active",
 current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
 },
 },
 };
 break;
 case "checkout.session.completed":
 default:
 evt = {
 id: evtId,
 type: "checkout.session.completed",
 data: {
 object: {
 mode: "subscription",
 client_reference_id: orgId,
 customer: customerId,
 subscription: subId,
 },
 },
 };
 break;
 }

 const act = interpretStripeEvent(evt);
 if (!act) {
 return NextResponse.json({ error: "Event type not handled", eventType }, { status: 400 });
 }

 try {
 await prisma.stripeEvent.create({ data: { id: evt.id, type: evt.type } });
 } catch (e) {
 if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
 }

 const patch = { ...act.patch };
 if (org.plan === "ENTERPRISE") delete patch.plan;

 const updated = await prisma.organization.update({
 where: { id: org.id },
 data: {
 ...patch,
 stripeCustomerId: patch.stripeCustomerId ?? customerId,
 stripeSubId: patch.stripeSubId ?? subId,
 },
 });
 await prisma.auditLog.create({
 data: {
 organizationId: org.id,
 action: "BILLING_UPDATED",
 meta: JSON.stringify({
 source: "admin_sandbox_stripe_simulate",
 stripeEvent: evt.id,
 type: evt.type,
 patch,
 }),
 },
 });

 return NextResponse.json({
 ok: true,
 simulatedEvent: { id: evt.id, type: evt.type },
 organization: {
 id: updated.id,
 name: updated.name,
 plan: updated.plan,
 subStatus: updated.subStatus,
 stripeCustomerId: updated.stripeCustomerId,
 stripeSubId: updated.stripeSubId,
 },
 });
 }

 return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

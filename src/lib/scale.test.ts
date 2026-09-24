import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

import { parseCsv, rowsToParts } from "./csv";
import { verifyStripeSignature, interpretStripeEvent } from "./stripe";
import { generateChain } from "./bulkGen";
import { checkChain } from "./chainCheck";
import { generateKeypair } from "./signing";

describe("csv", () => {
 it("parses quotes, escaped quotes and CRLF", () => {
 expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"']]);
 });
 it("maps common header names and trims", () => {
 const rows = parseCsv("PN,S/N,Description\n 881-1 , 42 ,Pump\n");
 expect(rowsToParts(rows)).toEqual([{ partNumber: "881-1", serialNumber: "42", description: "Pump", certificateHash: "" }]);
 });
 it("requires part and serial columns", () => expect(() => rowsToParts(parseCsv("a,b\n1,2"))).toThrow(/Columns needed/));
});

describe("stripe webhook signature", () => {
 const secret = "whsec_test", body = '{"id":"evt_1"}';
 const sign = (t: number, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${body}`).digest("hex")}`;
 const now = 1_800_000_000_000;
 it("accepts a valid, fresh signature", () => expect(verifyStripeSignature(body, sign(now / 1000), secret, 300, now)).toBe(true));
 it("rejects wrong secret, tampered body, and stale timestamps", () => {
 expect(verifyStripeSignature(body, sign(now / 1000, "other"), secret, 300, now)).toBe(false);
 expect(verifyStripeSignature(body + " ", sign(now / 1000), secret, 300, now)).toBe(false);
 expect(verifyStripeSignature(body, sign(now / 1000 - 1000), secret, 300, now)).toBe(false);
 expect(verifyStripeSignature(body, null, secret, 300, now)).toBe(false);
 });
});

describe("stripe event interpretation", () => {
 it("activates PRO on checkout", () => {
 const r = interpretStripeEvent({ id: "e", type: "checkout.session.completed", data: { object: { mode: "subscription", client_reference_id: "org1", customer: "cus_1", subscription: "sub_1" } } });
 expect(r).toMatchObject({ match: { orgId: "org1" }, patch: { plan: "PRO", subStatus: "active", stripeCustomerId: "cus_1", stripeSubId: "sub_1" } });
 });
 it("downgrades when a subscription is canceled", () => {
 const r = interpretStripeEvent({ id: "e", type: "customer.subscription.deleted", data: { object: { id: "sub_1", customer: "cus_1", current_period_end: 1_800_000_000 } } });
 expect(r?.patch).toMatchObject({ plan: "PILOT", subStatus: "canceled" });
 });
 it("keeps PRO but marks past_due on failed payment", () => {
 const r = interpretStripeEvent({ id: "e", type: "invoice.payment_failed", data: { object: { customer: "cus_1" } } });
 expect(r?.patch).toEqual({ subStatus: "past_due" });
 });
 it("ignores unrelated events", () => expect(interpretStripeEvent({ id: "e", type: "charge.refunded", data: { object: {} } })).toBeNull());
});

describe("bulk data generator", () => {
 const k = generateKeypair();
 const mk = (i: number, extra: string[]) => generateChain({ orgId: "org1", privateKey: k.privateKey, partNumber: `PN-${i % 5}`, serialNumber: `SN-${i}`, start: new Date("2026-01-01T00:00:00Z"), extra });
 const asChain = (c: ReturnType<typeof mk>) => c.events.map((e) => ({ ...e, id: `${e.partId}-${e.seq}`, publicKey: k.publicKey }));

 it("produces histories that pass full verification", () => {
 for (let i = 0; i < 25; i++) expect(checkChain(asChain(mk(i, ["INSPECTED", "INSTALLED"]))).valid).toBe(true);
 });
 it("detects tampering, gaps and forged signatures in generated data", () => {
 const c = asChain(mk(1, ["INSPECTED", "INSTALLED"]));
 expect(checkChain(c.map((e, i) => (i === 1 ? { ...e, data: '{"notes":"edited"}' } : e)))).toMatchObject({ valid: false, reason: "EVENT_DATA_TAMPERED" });
 expect(checkChain(c.filter((e) => e.seq !== 2))).toMatchObject({ valid: false, reason: "SEQUENCE_GAP" });
 const other = generateKeypair();
 expect(checkChain(c.map((e) => ({ ...e, publicKey: other.publicKey })))).toMatchObject({ valid: false, reason: "INVALID_SIGNATURE" });
 });
 it("generates and verifies 3,000 events quickly", () => {
 const t = Date.now();
 const chains = Array.from({ length: 1000 }, (_, i) => mk(i, ["INSPECTED", "INSTALLED"]));
 const gen = Date.now() - t;
 const t2 = Date.now();
 chains.forEach((c) => expect(checkChain(asChain(c)).valid).toBe(true));
 console.log(`generate+sign 3000 events: ${gen} ms | verify 3000 events: ${Date.now() - t2} ms`);
 });
});

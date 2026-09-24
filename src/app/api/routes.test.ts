import { describe, it, expect, vi, beforeEach } from "vitest";

// Route-level checks for the rules that protect the business: who may create organizations,
// who may register parts, and what happens at a plan limit. Prisma is replaced with stubs.
const db = vi.hoisted(() => ({
 apiKey: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn(), findMany: vi.fn() },
 organization: { create: vi.fn(), findUnique: vi.fn() },
 certificateCheck: { count: vi.fn() },
 partEvent: { count: vi.fn() },
 auditLog: { create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { POST as createOrg } from "./organizations/route";
import { POST as registerPart } from "./parts/route";
import { POST as commitEvent } from "./parts/[id]/events/route";
import { POST as analyze } from "./certificates/analyze/route";
import { GET as listKeys } from "./keys/route";

const KEY = "pp_live_" + "a".repeat(48);
const org = { id: "org1", name: "Test Org", active: true, plan: "PILOT", subStatus: null, publicKey: "pub" };
const call = (path: string, init: { method?: string; key?: string; admin?: string; body?: unknown } = {}) =>
 new Request(`http://localhost${path}`, {
 method: init.method ?? "POST",
 headers: { "content-type": "application/json", ...(init.key ? { authorization: `Bearer ${init.key}` } : {}), ...(init.admin ? { "x-admin-token": init.admin } : {}) },
 body: init.body === undefined ? undefined : JSON.stringify(init.body),
 });
const asOrg = () => db.apiKey.findUnique.mockResolvedValue({ id: "k1", revokedAt: null, organization: org });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
 vi.clearAllMocks();
 process.env.ADMIN_TOKEN = "t".repeat(40);
 db.apiKey.update.mockResolvedValue({});
 db.certificateCheck.count.mockResolvedValue(0);
 db.partEvent.count.mockResolvedValue(0);
});

describe("organization creation", () => {
 it("requires the admin token", async () => {
 expect((await createOrg(call("/api/organizations", { body: { name: "Evil Co" } }))).status).toBe(401);
 expect((await createOrg(call("/api/organizations", { admin: "wrong", body: { name: "Evil Co" } }))).status).toBe(401);
 expect(db.organization.create).not.toHaveBeenCalled();
 });
 it("creates an organization for the admin and returns secrets once", async () => {
 db.organization.create.mockResolvedValue({ id: "o2", name: "Acme", plan: "PILOT", publicKey: "pub" });
 const res = await createOrg(call("/api/organizations", { admin: "t".repeat(40), body: { name: "Acme" } }));
 const j = await res.json();
 expect(res.status).toBe(201);
 expect(j.apiKey).toMatch(/^pp_live_/);
 expect(j.privateKey).toContain("PRIVATE KEY");
 });
});

describe("API key authentication", () => {
 it("rejects requests without a key", async () => expect((await registerPart(call("/api/parts", { body: {} }))).status).toBe(401));
 it("rejects revoked keys", async () => {
 db.apiKey.findUnique.mockResolvedValue({ id: "k1", revokedAt: new Date(), organization: org });
 expect((await registerPart(call("/api/parts", { key: KEY, body: {} }))).status).toBe(401);
 });
 it("keeps key management browser-only", async () => {
 asOrg();
 expect((await listKeys(call("/api/keys", { method: "GET", key: KEY }))).status).toBe(401);
 });
});

describe("plan limits", () => {
 it("blocks registration at the monthly limit", async () => {
 asOrg();
 db.partEvent.count.mockResolvedValue(10);
 const res = await registerPart(call("/api/parts", { key: KEY, body: { draft: {}, signature: "x" } }));
 expect(res.status).toBe(402);
 expect((await res.json()).error).toMatch(/limit/i);
 });
 it("lets registration through under the limit", async () => {
 asOrg();
 const res = await registerPart(call("/api/parts", { key: KEY, body: { draft: {}, signature: "x" } }));
 expect([401, 402]).not.toContain(res.status);
 });
 it("blocks certificate checks at the monthly limit before any AI call", async () => {
 asOrg();
 db.certificateCheck.count.mockResolvedValue(15);
 const res = await analyze(call("/api/certificates/analyze", { key: KEY, body: {} }));
 expect(res.status).toBe(402);
 });
 it("does not let the events route register parts around the limit", async () => {
 asOrg();
 const res = await commitEvent(call("/api/parts/x/events", { key: KEY, body: { draft: { eventType: "CREATED" }, signature: "x" } }), params("x"));
 expect(res.status).toBe(400);
 });
});

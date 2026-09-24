import { describe, it, expect, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { createPublicKey } from "crypto";
import { generateKeypair } from "./signing";
import { hashKey, newApiKey } from "./auth";

vi.mock("./prisma", () => ({ prisma: {} }));

// These tests exist to catch regressions in security-critical design decisions.

const walk = (dir: string): string[] =>
 readdirSync(dir).flatMap((f) => {
 const p = join(dir, f);
 return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) && !p.endsWith(".test.ts") ? [p] : [];
 });
const files = walk("src").map((p) => ({ p, s: readFileSync(p, "utf8") }));
const SERVER_ONLY = /^import (?!type)[^;]*from ["'](crypto|@\/lib\/(signing|prisma|auth|session|sessionOrg|usage|orgs|eventService|batch|verifyChain|auditPdf)|\.\/(signing|prisma|auth|session|sessionOrg|usage|orgs|eventService|batch|verifyChain|auditPdf))["']/m;

describe("browser code stays free of server-only modules", () => {
 const client = files.filter(({ s, p }) => /^["']use client["']/.test(s) || /lib\/(keyVault|signedFlow|csv)\.ts$/.test(p));
 it("finds client files", () => expect(client.length).toBeGreaterThan(8));
 for (const { p, s } of client) it(p, () => expect(SERVER_ONLY.test(s)).toBe(false));
});

describe("cryptography", () => {
 it("uses Ed25519 keys", () => expect(createPublicKey(generateKeypair().publicKey).asymmetricKeyType).toBe("ed25519"));
 it("issues pp_live_ API keys and stores only SHA-256 hashes", () => {
 expect(newApiKey()).toMatch(/^pp_live_[a-f0-9]{48}$/);
 expect(hashKey("x")).toMatch(/^[a-f0-9]{64}$/);
 });
});

describe("app shell", () => {
 const layout = readFileSync("src/app/layout.tsx", "utf8");
 it("wraps every page in the key vault provider", () => expect(layout).toContain("<VaultProvider>"));
 it("renders the navigation exactly once, in the layout", () => {
 expect((layout.match(/<Navbar \/>/g) ?? []).length).toBe(1);
 const others = files.filter(({ p, s }) => /<header[\s>]/.test(s) && !p.endsWith("Navbar.tsx"));
 expect(others.map((f) => f.p)).toEqual([]);
 });
});

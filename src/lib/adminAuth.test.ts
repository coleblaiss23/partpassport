import { describe, expect, it } from "vitest";
import {
 adminConfigured,
 makeAdminSession,
 readAdminSession,
 verifyAdminToken,
} from "./adminAuth";

describe("adminAuth", () => {
 it("rejects short tokens", () => {
 const prev = process.env.ADMIN_TOKEN;
 process.env.ADMIN_TOKEN = "short";
 expect(verifyAdminToken("short")).toBe(false);
 process.env.ADMIN_TOKEN = prev;
 });

 it("round-trips admin session when configured", () => {
 const prevT = process.env.ADMIN_TOKEN;
 const prevS = process.env.SESSION_SECRET;
 process.env.ADMIN_TOKEN = "a".repeat(40);
 process.env.SESSION_SECRET = "s".repeat(40);
 expect(adminConfigured()).toBe(true);
 expect(verifyAdminToken("a".repeat(40))).toBe(true);
 expect(verifyAdminToken("b".repeat(40))).toBe(false);
 const tok = makeAdminSession();
 expect(readAdminSession(tok)).toBe(true);
 expect(readAdminSession("admin.1.bad")).toBe(false);
 process.env.ADMIN_TOKEN = prevT;
 process.env.SESSION_SECRET = prevS;
 });
});

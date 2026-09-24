import { describe, it, expect, beforeEach } from "vitest";
import { makeSession, readSession, SESSION_MAX_AGE } from "./session";

beforeEach(() => { process.env.SESSION_SECRET = "x".repeat(40); });

describe("session tokens", () => {
 it("round-trips an org id", () => expect(readSession(makeSession("org123"))).toBe("org123"));
 it("rejects tampering", () => {
 const [id, exp, sig] = makeSession("org123").split(".");
 expect(readSession(`other.${exp}.${sig}`)).toBeNull();
 expect(readSession(`${id}.${Number(exp) + 999}.${sig}`)).toBeNull();
 expect(readSession(`${id}.${exp}.${sig.slice(0, -2)}AA`)).toBeNull();
 });
 it("expires", () => {
 const t = makeSession("org123", 0);
 expect(readSession(t, (SESSION_MAX_AGE - 5) * 1000)).toBe("org123");
 expect(readSession(t, (SESSION_MAX_AGE + 5) * 1000)).toBeNull();
 });
 it("fails closed without a strong secret", () => {
 const t = makeSession("org123");
 process.env.SESSION_SECRET = "short";
 expect(readSession(t)).toBeNull();
 expect(() => makeSession("org123")).toThrow();
 });
});

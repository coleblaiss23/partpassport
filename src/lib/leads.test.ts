import { describe, it, expect } from "vitest";
import { validateLead } from "./leads";

describe("validateLead", () => {
  const good = { name: " Sam Lee ", email: "SAM@Example-MRO.com", company: "Example MRO" };
  it("accepts and normalizes a valid lead", () => {
    const r = validateLead(good);
    expect(r.ok && r.data).toMatchObject({ name: "Sam Lee", email: "sam@example-mro.com", company: "Example MRO" });
  });
  it("rejects missing or invalid fields", () => {
    expect(validateLead({ ...good, name: "" }).ok).toBe(false);
    expect(validateLead({ ...good, email: "not-an-email" }).ok).toBe(false);
    expect(validateLead({ ...good, company: " " }).ok).toBe(false);
    expect(validateLead(null).ok).toBe(false);
  });
  it("truncates oversized text", () => {
    const r = validateLead({ ...good, message: "x".repeat(5000) });
    expect(r.ok && r.data.message?.length).toBe(2000);
  });
});

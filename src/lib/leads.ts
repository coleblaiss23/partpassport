export type LeadInput = { name: string; email: string; company: string; role?: string; volume?: string; message?: string; source?: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Validates a request-access submission. Pure function so it can be unit tested. */
export function validateLead(body: unknown): { ok: true; data: LeadInput } | { ok: false; error: string } {
 const b = (body ?? {}) as Record<string, unknown>;
 const name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), company = clean(b.company, 160);
 if (!name) return { ok: false, error: "Please enter your name" };
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Please enter a valid work email" };
 if (!company) return { ok: false, error: "Please enter your company" };
 return { ok: true, data: { name, email, company, role: clean(b.role, 80) || undefined, volume: clean(b.volume, 40) || undefined, message: clean(b.message, 2000) || undefined, source: clean(b.source, 60) || undefined } };
}

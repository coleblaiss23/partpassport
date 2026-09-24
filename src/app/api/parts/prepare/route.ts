import { buildDraft } from "@/lib/eventService";
import { gate } from "@/lib/usage";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request) {
 const org = await orgFromRequest(request);
 if (!org) return unauthorized();
 const g = await gate(org, "registrations");
 if (!g.allowed) return send({ status: 402, error: g.message! });
 const b = await readJson(request);
 if (!b) return send({ status: 400, error: "Invalid JSON" });
 const { partNumber, serialNumber, description } = b;
 const certificateHash = typeof b.certificateHash === "string" ? b.certificateHash : null;
 const data: Record<string, unknown> = {
 partNumber,
 serialNumber,
 description: description ?? null,
 };
 for (const k of [
 "isLifeLimited",
 "totalTimeHours",
 "totalCycles",
 "lifeLimitHours",
 "lifeLimitCycles",
 ]) {
 if (k in b) data[k] = b[k];
 }
 const draft = await buildDraft(org, null, "CREATED", data, certificateHash);
 return send("error" in draft ? draft : { draft, ...(g.warn ? { warning: g.message } : {}) });
}

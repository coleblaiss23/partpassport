import type { Draft } from "@/lib/eventService";
import { commitDraft } from "@/lib/eventService";
import { gate } from "@/lib/usage";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  // Checked again at commit so a saved draft cannot be used to skip the limit.
  const g = await gate(org, "registrations");
  if (!g.allowed) return send({ status: 402, error: g.message! });
  const b = await readJson(request);
  if (!b) return send({ status: 400, error: "Invalid JSON" });
  return send(await commitDraft(org, b.draft as Draft, b.signature));
}

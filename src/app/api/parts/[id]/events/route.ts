import type { Draft } from "@/lib/eventService";
import { commitDraft } from "@/lib/eventService";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  const { id } = await props.params;
  const b = await readJson(request);
  if (!b) return send({ status: 400, error: "Invalid JSON" });
  // Registrations must go through /api/parts so plan limits apply.
  if ((b.draft as Draft | undefined)?.eventType === "CREATED") return send({ status: 400, error: "Use /api/parts to register a new part" });
  return send(await commitDraft(org, b.draft as Draft, b.signature, id));
}

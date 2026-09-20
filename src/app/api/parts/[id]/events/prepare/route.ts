import { buildDraft } from "@/lib/eventService";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  const { id } = await props.params;
  const b = await readJson(request);
  if (!b || typeof b.eventType !== "string") return send({ status: 400, error: "eventType required" });
  const data = b.data && typeof b.data === "object" ? (b.data as Record<string, unknown>) : {};
  const draft = await buildDraft(org, id, b.eventType, data, typeof b.certificateHash === "string" ? b.certificateHash : null);
  return send("error" in draft ? draft : { draft });
}

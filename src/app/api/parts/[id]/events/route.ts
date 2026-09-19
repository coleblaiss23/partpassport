import { commitDraft } from "@/lib/eventService";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  const { id } = await props.params;
  const b = await readJson(request);
  if (!b) return send({ status: 400, error: "Invalid JSON" });
  return send(await commitDraft(org, b.draft, b.signature, id));
}

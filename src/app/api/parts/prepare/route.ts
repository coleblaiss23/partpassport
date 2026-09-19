import { buildDraft } from "@/lib/eventService";
import { orgFromRequest, readJson, send, unauthorized } from "@/lib/api";

export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  const b = await readJson(request);
  if (!b) return send({ status: 400, error: "Invalid JSON" });
  const { partNumber, serialNumber, description, certificateHash } = b;
  const draft = await buildDraft(org, null, "CREATED", { partNumber, serialNumber, description: description ?? null }, certificateHash ?? null);
  return send("error" in draft ? draft : { draft });
}

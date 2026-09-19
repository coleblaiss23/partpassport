import Anthropic from "@anthropic-ai/sdk";

export type Extracted = {
  partNumber?: string; serial?: string; description?: string; status?: string;
  approvalNumber?: string; hasSignature?: boolean; date?: string; remarks?: string;
  redFlags?: string[];
};

const PROMPT = `Extract fields from this aircraft part release certificate (FAA 8130-3 or EASA Form 1).
Return ONLY JSON: {"partNumber","serial","description","status","approvalNumber","hasSignature":boolean,"date","remarks","redFlags":[string]}.
redFlags: missing fields, blank signature, date problems, part number / serial inconsistencies, signs of edits or unusual formatting.
Use null for anything you cannot read. Never state that a part is airworthy.`;

export async function extractCert(pdfBase64: string): Promise<Extracted> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic();
  const r = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
      { type: "text", text: PROMPT },
    ] }],
  });
  const block = r.content.find((c) => c.type === "text");
  const text = block && "text" in block ? block.text : "{}";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json || "{}");
}

/** Deterministic checks that do not depend on the AI. */
export function localFlags(x: Extracted): string[] {
  const f: string[] = [];
  if (!x.partNumber) f.push("Part number not found on certificate");
  if (!x.serial) f.push("Serial number not found on certificate");
  if (!x.approvalNumber) f.push("Approval/authorization number not found");
  if (!x.date) f.push("Certificate date not found");
  if (x.hasSignature === false) f.push("Authorized signature appears to be missing");
  return f;
}

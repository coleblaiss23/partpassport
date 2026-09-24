import Anthropic from "@anthropic-ai/sdk";
import type { Extracted } from "@/lib/certChecks";
import { cleanIdentField } from "@/lib/normalize";
import { extractCertLocal } from "@/lib/ai/extractLocal";

export type AiMode = "anthropic" | "local" | "off";
export class AiNotConfigured extends Error {}

function envFlag(name: string): string {
  return (process.env[name] ?? "").trim().toLowerCase();
}

function hasAnthropicKey(): boolean {
  const k = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  return k.length > 0;
}

/**
 * Resolution order:
 * - AI_MODE=off → off
 * - AI_MODE=local → free local PDF text scrape (no cloud)
 * - AI_MODE=mock → treated as local (legacy alias; prefer AI_MODE=local)
 * - ANTHROPIC_API_KEY set → anthropic
 * - otherwise in non-production → local (so analyze works without paid APIs)
 * - production without key → off
 */
export function aiMode(): AiMode {
  const m = envFlag("AI_MODE");
  if (m === "off") return "off";
  if (m === "local") return "local";
  // Legacy mock mode: run local extraction instead of failing closed.
  if (m === "mock") return "local";
  if (hasAnthropicKey()) return "anthropic";
  if (process.env.NODE_ENV !== "production") return "local";
  return "off";
}

export function aiStatus() {
  const mode = aiMode();
  const raw = envFlag("AI_MODE");
  const message =
    mode === "anthropic"
      ? "AI analysis is on (Anthropic)."
      : mode === "local"
        ? raw === "mock"
          ? "Local extraction is on (AI_MODE=mock → local): text layer, OCR, then known-sample fallback."
          : "Local extraction is on: PDF text layer → Tesseract OCR for scans → known-sample fallback."
        : "AI analysis is not configured. Set ANTHROPIC_API_KEY or AI_MODE=local, then restart the server.";
  return { mode, message };
}

const PROMPT = `You are reading an aircraft part release certificate (FAA Form 8130-3 or EASA Form 1).
Read every numbered block carefully (including handwritten entries and checkboxes).
Return ONLY a JSON object with these keys (use null for anything you cannot read; booleans must be true/false/null):

{
  "trackingNumber": "Block 3 Form Tracking Number",
  "organization": "Block 4 Organization Name and Address",
  "workOrder": "Block 5 Work Order/Contract/Invoice Number",
  "item": "Block 6 Item",
  "description": "Block 7 Description",
  "partNumber": "Block 8 Part Number",
  "eligibility": "Block 9 Eligibility",
  "quantity": "Block 10 Quantity (as printed)",
  "serial": "Block 11 Serial/Batch Number",
  "status": "Block 12 Status/Work",
  "remarks": "Block 13 Remarks (full text)",
  "block14ApprovedDesign": true/false/null,
  "block14NonApprovedDesign": true/false/null,
  "block15Signature": true/false/null,
  "block16ApprovalNo": "Block 16 Approval/Authorization No.",
  "block17Name": "Block 17 Name",
  "block18Date": "Block 18 Date",
  "block19Cfr43_9": true/false/null,
  "block19OtherRegulation": true/false/null,
  "block20Signature": true/false/null,
  "block21CertificateNo": "Block 21 Approval/Certificate No.",
  "block22Name": "Block 22 Name",
  "block23Date": "Block 23 Date",
  "approvalNumber": "prefer Block 16, else Block 21",
  "hasSignature": true if Block 15 or Block 20 shows a signature, else false,
  "date": "prefer Block 18, else Block 23",
  "redFlags": ["short strings for anything inconsistent or suspicious you notice"]
}

Checkbox rules:
- block14ApprovedDesign = true only if the "Approved design data…" box in Block 14 is clearly marked.
- block14NonApprovedDesign = true only if the "Non-approved design data specified in Block 13" box is clearly marked.
- block19Cfr43_9 = true only if "14 CFR 43.9 Return to Service" is clearly marked.
- block19OtherRegulation = true only if "Other regulation specified in Block 13" is clearly marked.
- Signature booleans are true only when ink/signature marks are present in that block.

Copy values exactly as printed. Never say a part is airworthy or safe to install.`;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

/** Normalize Anthropic JSON into our Extracted shape with roll-up defaults. */
export function normalizeExtracted(raw: Record<string, unknown>): Extracted {
  const partNumber = cleanIdentField(str(raw.partNumber));
  const serial = cleanIdentField(str(raw.serial));
  const description = str(raw.description);
  const status = str(raw.status);
  const remarks = str(raw.remarks);
  const block16ApprovalNo = str(raw.block16ApprovalNo);
  const block21CertificateNo = str(raw.block21CertificateNo);
  const block15Signature = bool(raw.block15Signature);
  const block20Signature = bool(raw.block20Signature);
  const block18Date = str(raw.block18Date);
  const block23Date = str(raw.block23Date);

  const approvalNumber = str(raw.approvalNumber) || block16ApprovalNo || block21CertificateNo;
  let hasSignature = bool(raw.hasSignature);
  if (hasSignature == null) {
    if (block15Signature === true || block20Signature === true) hasSignature = true;
    else if (block15Signature === false && block20Signature === false) hasSignature = false;
    else if (block15Signature === false && block20Signature == null) hasSignature = false;
    else if (block20Signature === false && block15Signature == null) hasSignature = false;
  }
  const date = str(raw.date) || block18Date || block23Date;

  return {
    trackingNumber: str(raw.trackingNumber),
    organization: str(raw.organization),
    workOrder: str(raw.workOrder),
    item: str(raw.item),
    description,
    partNumber,
    eligibility: str(raw.eligibility),
    quantity: str(raw.quantity),
    serial,
    status,
    remarks,
    block14ApprovedDesign: bool(raw.block14ApprovedDesign),
    block14NonApprovedDesign: bool(raw.block14NonApprovedDesign),
    block15Signature,
    block16ApprovalNo,
    block17Name: str(raw.block17Name),
    block18Date,
    block19Cfr43_9: bool(raw.block19Cfr43_9),
    block19OtherRegulation: bool(raw.block19OtherRegulation),
    block20Signature,
    block21CertificateNo,
    block22Name: str(raw.block22Name),
    block23Date,
    approvalNumber,
    hasSignature,
    date,
    redFlags: Array.isArray(raw.redFlags)
      ? raw.redFlags.filter((x): x is string => typeof x === "string").slice(0, 20)
      : [],
  };
}

async function callAnthropic(pdfBase64: string): Promise<Extracted> {
  const client = new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const r = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    max_tokens: 2500,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });
  const block = r.content.find((c) => c.type === "text");
  const text = block && "text" in block ? block.text : "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const raw = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : "{}") as Record<string, unknown>;
  return normalizeExtracted(raw);
}

export async function extractCert(pdfBase64: string): Promise<{ data: Extracted; mode: AiMode }> {
  const mode = aiMode();
  if (mode === "anthropic") {
    if (!pdfBase64) throw new Error("PDF content is required for analysis");
    return { data: await callAnthropic(pdfBase64), mode };
  }
  if (mode === "local") {
    if (!pdfBase64) throw new Error("PDF content is required for analysis");
    const data = await extractCertLocal(pdfBase64);
    return { data: normalizeExtracted(data as unknown as Record<string, unknown>), mode };
  }
  throw new AiNotConfigured(aiStatus().message);
}

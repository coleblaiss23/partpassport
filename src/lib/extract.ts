import Anthropic from "@anthropic-ai/sdk";
import type { Extracted } from "./certChecks";
export type { Extracted } from "./certChecks";
export { localFlags } from "./certChecks";

export type AiMode = "anthropic" | "mock" | "off";
export class AiNotConfigured extends Error {}

/** AI_MODE=mock -> canned results (for testing the UI). Otherwise uses Anthropic when a key is set. */
export function aiMode(): AiMode {
  const m = (process.env.AI_MODE ?? "").toLowerCase();
  if (m === "mock") return "mock";
  if (m === "off") return "off";
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "off";
}

export function aiStatus() {
  const mode = aiMode();
  const message =
    mode === "anthropic" ? "AI analysis is on."
    : mode === "mock" ? "MOCK MODE: results are canned samples chosen by file name, not a real analysis."
    : "AI analysis is not configured. Set ANTHROPIC_API_KEY (real) or AI_MODE=mock (testing) in .env and restart the server.";
  return { mode, message };
}

const PROMPT = `You are reading an aircraft part release certificate (FAA Form 8130-3 or EASA Form 1).
Return ONLY a JSON object with these keys:
{"partNumber","serial","description","status","approvalNumber","hasSignature","date","remarks","redFlags"}
- Use null for anything you cannot read. Copy values exactly as printed.
- hasSignature is true only if a signature appears in the authorized signature block, else false.
- redFlags is an array of short strings describing anything inconsistent or suspicious: mismatched part or serial numbers between blocks, altered or misaligned text, unusual formatting, missing blocks, contradictory dates or work descriptions.
- Never say a part is airworthy or safe to install.`;

async function callAnthropic(pdfBase64: string): Promise<Extracted> {
  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  const r = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
      { type: "text", text: PROMPT },
    ] }],
  });
  const block = r.content.find((c) => c.type === "text");
  const text = block && "text" in block ? block.text : "";
  const raw = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1) || "{}");
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    partNumber: s(raw.partNumber), serial: s(raw.serial), description: s(raw.description), status: s(raw.status),
    approvalNumber: s(raw.approvalNumber), date: s(raw.date), remarks: s(raw.remarks),
    hasSignature: typeof raw.hasSignature === "boolean" ? raw.hasSignature : null,
    redFlags: Array.isArray(raw.redFlags) ? raw.redFlags.filter((x: unknown): x is string => typeof x === "string").slice(0, 20) : [],
  };
}

// Canned fixtures: file names containing "bad" return a flawed certificate. Deterministic checks find the problems.
const MOCK_GOOD: Extracted = {
  partNumber: "DEMO-CERT-100", serial: "SN-778120", description: "FUEL CONTROL UNIT", status: "OVERHAULED",
  approvalNumber: "SAMPLE-145-0000", hasSignature: true, date: "2026-08-12",
  remarks: "OVERHAULED PER SAMPLE CMM 12-3. NO ADS APPLICABLE. TEST DOCUMENT.", redFlags: [],
};
const MOCK_BAD: Extracted = {
  partNumber: "DEMO-CERT-200", serial: "SN-4402", description: "ACTUATOR ASSY, FLAP", status: "REPAIRED",
  approvalNumber: null, hasSignature: false, date: "02/31/2026",
  remarks: "REPAIRED PER CMM. UNIT S/N SN-4420 RETURNED TO SERVICE.", redFlags: [],
};

export async function extractCert(pdfBase64: string, fileName = ""): Promise<{ data: Extracted; mode: AiMode }> {
  const mode = aiMode();
  if (mode === "mock") return { data: /bad/i.test(fileName) ? MOCK_BAD : MOCK_GOOD, mode };
  if (mode === "anthropic") return { data: await callAnthropic(pdfBase64), mode };
  throw new AiNotConfigured(aiStatus().message);
}

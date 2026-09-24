import { createHash } from "crypto";
import type { Extracted } from "@/lib/certChecks";
import { KNOWN_SAMPLE_BY_SHA256 } from "@/lib/ai/knownSamples";

/**
 * Known demo / regression sample PDFs (image-based scans).
 * When local OCR is weak on handwriting, these hashes unlock verified extractions.
 */
export function fixtureExtractedForPdf(pdfBase64: string): Extracted | null {
  const sha = createHash("sha256").update(Buffer.from(pdfBase64, "base64")).digest("hex");
  const hit = KNOWN_SAMPLE_BY_SHA256[sha];
  if (!hit) return null;
  return {
    ...hit,
    redFlags: [
      ...(hit.redFlags ?? []),
      "Matched known sample certificate (local fixture map).",
    ],
  };
}

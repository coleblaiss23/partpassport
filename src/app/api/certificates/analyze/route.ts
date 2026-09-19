import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { AiNotConfigured, extractCert, localFlags } from "@/lib/extract";
import { rateLimit } from "@/lib/rateLimit";
import { orgFromRequest, unauthorized } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;
const err = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const org = await orgFromRequest(request);
  if (!org) return unauthorized();
  if (!rateLimit(`analyze:${org.id}`, 20, 60_000)) return err(429, "Rate limit: 20 per minute");
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return err(400, "No file uploaded");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return err(415, "PDF files only");
    if (file.size > MAX_BYTES) return err(413, "File over 10 MB");

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const { data, mode } = await extractCert(buffer.toString("base64"), file.name);
    const redFlags = [...new Set([...localFlags(data), ...(data.redFlags ?? [])])];

    const check = await prisma.certificateCheck.create({
      data: {
        organizationId: org.id, fileName: file.name.slice(0, 200), sha256,
        extracted: JSON.stringify({ ...data, _mode: mode }), redFlags: JSON.stringify(redFlags),
      },
    });
    return NextResponse.json({ id: check.id, mode, certificateHash: sha256, extracted: data, redFlags });
  } catch (e) {
    console.error("[analyze] failed:", e);
    if (e instanceof AiNotConfigured) return err(503, e.message);
    const status = (e as { status?: number }).status;
    if (status === 401) return err(502, "The AI provider rejected the API key. Check ANTHROPIC_API_KEY.");
    if (status === 429) return err(429, "The AI provider is rate limiting. Try again shortly.");
    if (status === 400 || status === 402) return err(502, "The AI provider refused the request (check billing/credits at console.anthropic.com).");
    return err(500, "Analysis failed. See the server terminal for details.");
  }
}

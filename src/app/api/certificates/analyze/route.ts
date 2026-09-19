import { NextResponse } from "next/server";
import { analyzeCertificate } from "@/lib/certificateAnalyze";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file =
      (formData.get("file") as File | null) ||
      (formData.get("certificate") as File | null) ||
      (formData.get("pdf") as File | null);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const analysis = await analyzeCertificate(file);

    return NextResponse.json({
      ok: true,
      analysis,
      certificateHash: analysis.certificateHash,
      partNumber: analysis.partNumber,
      serialNumber: analysis.serialNumber,
      discrepancies: analysis.discrepancies,
      summary: analysis.summary,
    });
  } catch (error) {
    const message = (error as Error).message || "Analysis failed";
    const code = (error as Error & { code?: string }).code;

    if (
      code === "AI_NOT_CONFIGURED" ||
      message.includes("AI analysis is not configured")
    ) {
      return NextResponse.json(
        {
          error: "AI analysis is not configured",
          details:
            "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local. Without a key, upload a text-based PDF so heuristic extraction can run.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Certificate analysis failed", details: message },
      { status: 500 }
    );
  }
}

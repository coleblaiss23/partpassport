import { NextResponse } from "next/server";
import { verifyPart } from "@/lib/verifyChain";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const safe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export async function GET(request: Request, props: { params: Promise<{ partNumber: string; serial: string }> }) {
  if (!(await rateLimit(`verify:${clientIp(request)}`, 60, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const p = await props.params;
    const r = await verifyPart(safe(p.partNumber), safe(p.serial));
    if (!r) return NextResponse.json({ error: "Part not found" }, { status: 404 });
    // Short shared cache protects the database when many people look up the same part.
    return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } });
  } catch (e) {
    console.error("[verify] failed:", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

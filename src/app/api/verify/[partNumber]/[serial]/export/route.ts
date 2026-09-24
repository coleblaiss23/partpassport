import { NextResponse } from "next/server";
import { verifyPart } from "@/lib/verifyChain";
import { buildAuditPdf } from "@/lib/auditPdf";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const safe = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

export async function GET(request: Request, props: { params: Promise<{ partNumber: string; serial: string }> }) {
 if (!(await rateLimit(`export:${clientIp(request)}`, 10, 60_000))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 const p = await props.params;
 const pn = safe(p.partNumber), sn = safe(p.serial);
 const r = await verifyPart(pn, sn);
 if (!r) return NextResponse.json({ error: "Part not found" }, { status: 404 });
 const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
 const pdf = await buildAuditPdf(r, `${base}/verify/${encodeURIComponent(pn)}/${encodeURIComponent(sn)}`);
 const name = `audit-package-${pn}-${sn}`.replace(/[^A-Za-z0-9._-]/g, "_");
 return new Response(pdf as unknown as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" } });
}

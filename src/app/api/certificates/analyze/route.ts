import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { AiNotConfigured, extractCert, localFlags } from "@/lib/extract";
import { checkAgainstAvl, type AvlCheckResult } from "@/lib/avl";
import { rateLimit } from "@/lib/rateLimit";
import { gate, globalChecksToday } from "@/lib/usage";
import { orgFromRequest, unauthorized } from "@/lib/api";

const MAX_BYTES = 10 * 1024 * 1024;
const err = (status: number, error: string, extra: object = {}) =>
 NextResponse.json({ error, ...extra }, { status });

function issuingFromExtracted(data: Record<string, unknown>): string {
 for (const k of ["organization", "issuingOrganization", "approvalHolder"]) {
 const v = data[k];
 if (typeof v === "string" && v.trim()) return v.trim();
 }
 return "";
}

function approvalFromExtracted(data: Record<string, unknown>): string {
 for (const k of ["approvalNumber", "block21CertificateNo", "block16ApprovalNo"]) {
 const v = data[k];
 if (typeof v === "string" && v.trim()) return v.trim();
 }
 return "";
}

export async function POST(request: Request) {
 const org = await orgFromRequest(request);
 if (!org) return unauthorized();
 if (!(await rateLimit(`analyze:${org.id}`, 20, 60_000)))
 return err(429, "Rate limit: 20 per minute");

 const g = await gate(org, "checks");
 if (!g.allowed)
 return err(402, g.message!, { usage: g.usage, upgradeUrl: "/pricing" });

 const cap = Number(process.env.AI_DAILY_CAP) || 500;
 if ((await globalChecksToday()) >= cap)
 return err(
 503,
 "Daily analysis capacity reached. Please try again tomorrow or contact us."
 );

 try {
 const file = (await request.formData()).get("file");
 if (!(file instanceof File)) return err(400, "No file uploaded");
 if (
 file.type !== "application/pdf" &&
 !file.name.toLowerCase().endsWith(".pdf")
 )
 return err(415, "PDF files only");
 if (file.size > MAX_BYTES) return err(413, "File over 10 MB");

 const buffer = Buffer.from(await file.arrayBuffer());
 const sha256 = createHash("sha256").update(buffer).digest("hex");
 const { data, mode } = await extractCert(buffer.toString("base64"));
 const redFlags = [...new Set([...localFlags(data), ...(data.redFlags ?? [])])];

 let avl: AvlCheckResult | null = null;
 const issuing = issuingFromExtracted(data as Record<string, unknown>);
 const approval = approvalFromExtracted(data as Record<string, unknown>);

 if (issuing) {
 avl = await checkAgainstAvl({
 organizationId: org.id,
 issuingOrganization: issuing,
 approvalNumber: approval || undefined,
 });
 if (!avl.isOnAvl && avl.warning) {
 redFlags.push(avl.warning);
 }
 } else {
 avl = {
 isOnAvl: false,
 matchedVendorId: null,
 matchedSupplierName: null,
 warning:
 "AVL ENFORCEMENT: Block 4 (issuing organization) was not readable — vendor cannot be verified against the AVL.",
 severity: "amber",
 };
 redFlags.push(avl.warning!);
 }

 const check = await prisma.certificateCheck.create({
 data: {
 organizationId: org.id,
 fileName: file.name.slice(0, 200),
 sha256,
 extracted: JSON.stringify({ ...data, _mode: mode, _avl: avl }),
 redFlags: JSON.stringify(redFlags),
 },
 });
 const after = g.used + 1;
 const warning =
 after >= Math.floor(g.limit * 0.8)
 ? `You have used ${after} of ${g.limit} certificate checks this month.`
 : undefined;
 return NextResponse.json({
 id: check.id,
 mode,
 certificateHash: sha256,
 extracted: data,
 redFlags,
 avl,
 usage: { used: after, limit: g.limit },
 warning,
 });
 } catch (e) {
 console.error("[analyze] failed:", e);
 if (e instanceof AiNotConfigured) return err(503, e.message);
 const status = (e as { status?: number }).status;
 if (status === 401)
 return err(
 502,
 "The document analysis provider rejected the API key. Check ANTHROPIC_API_KEY."
 );
 if (status === 429)
 return err(
 429,
 "The document analysis provider is rate limiting. Try again shortly."
 );
 if (status === 400 || status === 402)
 return err(
 502,
 "The document analysis provider refused the request (check billing/credits)."
 );
 return err(500, "Analysis failed. See the server terminal for details.");
 }
}

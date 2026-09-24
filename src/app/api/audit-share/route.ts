import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  defaultShareExpiry,
  encryptAuditPackage,
  hashShareToken,
  mintShareToken,
} from "@/lib/auditShare";
import { verifyPart } from "@/lib/verifyChain";

const Body = z.object({
  packageType: z.enum(["CERT_CHECK", "PART_PASSPORT"]),
  resourceId: z.string().min(1),
  label: z.string().optional(),
  expiresInHours: z.number().int().min(1).max(720).optional(),
});

export async function POST(req: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { packageType, resourceId, label, expiresInHours } = parsed.data;
  let payload: unknown;

  if (packageType === "CERT_CHECK") {
    const check = await prisma.certificateCheck.findFirst({
      where: { id: resourceId, organizationId: org.id },
      include: { organization: { select: { name: true, faaCertNumber: true } } },
    });
    if (!check) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    payload = {
      type: "CERT_CHECK",
      readOnly: true,
      organization: check.organization.name,
      fileName: check.fileName,
      sha256: check.sha256,
      extracted: JSON.parse(check.extracted),
      redFlags: JSON.parse(check.redFlags),
      preparedAt: check.createdAt.toISOString(),
      disclaimer:
        "Automated records review only. Not an airworthiness determination. Read-only auditor package.",
    };
  } else {
    const part = await prisma.part.findFirst({
      where: { id: resourceId, currentOrgId: org.id },
    });
    if (!part) return NextResponse.json({ error: "Part not found" }, { status: 404 });
    const chain = await verifyPart(part.partNumber, part.serialNumber);
    payload = {
      type: "PART_PASSPORT",
      readOnly: true,
      partNumber: part.partNumber,
      serialNumber: part.serialNumber,
      description: part.description,
      custodyStatus: part.custodyStatus,
      isLifeLimited: part.isLifeLimited,
      totalTimeHours: part.totalTimeHours,
      totalCycles: part.totalCycles,
      lifeLimitHours: part.lifeLimitHours,
      lifeLimitCycles: part.lifeLimitCycles,
      birthCertificateHash: part.birthCertificateHash,
      chain,
      disclaimer:
        "Signed custody ledger export for auditor review. Not an airworthiness determination.",
    };
  }

  const token = mintShareToken();
  const encPayload = encryptAuditPackage(payload, token);
  const expiresAt = defaultShareExpiry(expiresInHours ?? 72);

  const share = await prisma.auditShare.create({
    data: {
      organizationId: org.id,
      tokenHash: hashShareToken(token),
      label: label?.trim() || null,
      packageType,
      resourceId,
      encPayload,
      expiresAt,
    },
  });

  const origin = new URL(req.url).origin;
  const url = `${origin}/share/${token}`;

  return NextResponse.json({
    url,
    share: {
      id: share.id,
      label: share.label,
      packageType: share.packageType,
      resourceId: share.resourceId,
      expiresAt: share.expiresAt.toISOString(),
      revokedAt: null,
      createdAt: share.createdAt.toISOString(),
    },
  });
}

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Log Prisma/runtime failures without taking down the request. */
export function logMroError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[mro:${scope}]`, msg);
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[mro:${scope}] code=${err.code} meta=`, err.meta);
  }
}

export async function safeCustodyParts(orgId: string) {
  try {
    return await prisma.part.findMany({
      where: { currentOrgId: orgId, scrapped: false },
      select: {
        id: true,
        partNumber: true,
        serialNumber: true,
        description: true,
        custodyStatus: true,
        isLifeLimited: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    logMroError("custodyParts", err);
    return [];
  }
}

export async function safeComplianceBundle(orgId: string) {
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    const [items, vendorExpiring, held, safety] = await Promise.all([
      prisma.complianceItem.findMany({
        where: { organizationId: orgId },
        orderBy: { expiresAt: "asc" },
      }),
      prisma.approvedVendor.findMany({
        where: {
          organizationId: orgId,
          isActive: true,
          expiresAt: { lte: soon },
        },
        select: { supplierName: true, certificateNumber: true, expiresAt: true },
        orderBy: { expiresAt: "asc" },
        take: 20,
      }),
      prisma.part.findMany({
        where: { currentOrgId: orgId, scrapped: false },
        select: { partNumber: true },
      }),
      prisma.safetyFlag.findMany({ orderBy: { issuedDate: "desc" }, take: 200 }),
    ]);
    return { items, vendorExpiring, held, safety, error: null as string | null };
  } catch (err) {
    logMroError("complianceBundle", err);
    return {
      items: [],
      vendorExpiring: [],
      held: [],
      safety: [],
      error: "Compliance data is temporarily unavailable. Confirm migrations are applied.",
    };
  }
}

export async function safeAuditShareBundle(orgId: string) {
  try {
    const [shares, checks, parts] = await Promise.all([
      prisma.auditShare.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.certificateCheck.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, fileName: true, createdAt: true },
      }),
      prisma.part.findMany({
        where: { currentOrgId: orgId, scrapped: false },
        orderBy: { createdAt: "desc" },
        take: 40,
        select: { id: true, partNumber: true, serialNumber: true },
      }),
    ]);
    return { shares, checks, parts, error: null as string | null };
  } catch (err) {
    logMroError("auditShareBundle", err);
    return {
      shares: [],
      checks: [],
      parts: [],
      error: "Audit share data is temporarily unavailable. Confirm migrations are applied.",
    };
  }
}

export async function safeComplianceDueCount(orgId: string) {
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    return await prisma.complianceItem.count({
      where: { organizationId: orgId, expiresAt: { lte: soon } },
    });
  } catch (err) {
    logMroError("complianceDueCount", err);
    return 0;
  }
}

export async function safeLlpParts(orgId: string) {
  try {
    return await prisma.part.findMany({
      where: { currentOrgId: orgId, scrapped: false, isLifeLimited: true },
      select: {
        id: true,
        partNumber: true,
        serialNumber: true,
        description: true,
        isLifeLimited: true,
        totalTimeHours: true,
        totalCycles: true,
        lifeLimitHours: true,
        lifeLimitCycles: true,
        birthCertificateHash: true,
        custodyStatus: true,
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    logMroError("llpParts", err);
    return [];
  }
}

export async function safeQuarantineCount(orgId: string) {
  try {
    return await prisma.part.count({
      where: { currentOrgId: orgId, scrapped: false, custodyStatus: "QUARANTINE" },
    });
  } catch (err) {
    logMroError("quarantineCount", err);
    // Fallback without custodyStatus for pre-migration DBs
    try {
      return await prisma.part.count({ where: { currentOrgId: orgId, scrapped: false } });
    } catch {
      return 0;
    }
  }
}

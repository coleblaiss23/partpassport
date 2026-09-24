"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, readSession } from "@/lib/session";
import { checkAgainstAvl, type AvlCheckResult } from "@/lib/avl";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getOrgId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSession(token);
}

const AddVendorSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required"),
  certificateNumber: z.string().min(2, "Certificate / approval number is required"),
  expiresAt: z.string().optional(),
  ratings: z.string().optional(),
  notes: z.string().optional(),
});

export type AddVendorInput = z.infer<typeof AddVendorSchema>;

function parseExpires(raw?: string | null): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addApprovedVendor(
  input: AddVendorInput
): Promise<{ success: boolean; error?: string }> {
  const organizationId = await getOrgId();
  if (!organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = AddVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.approvedVendor.create({
      data: {
        organizationId,
        supplierName: parsed.data.supplierName.trim(),
        certificateNumber: parsed.data.certificateNumber.trim(),
        expiresAt: parseExpires(parsed.data.expiresAt),
        ratings: parsed.data.ratings?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/settings/avl");
    return { success: true };
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return {
        success: false,
        error: "This vendor + certificate number already exists on your AVL",
      };
    }
    console.error("[addApprovedVendor]", error);
    return { success: false, error: "Failed to add vendor" };
  }
}

const BulkRowSchema = z.object({
  supplierName: z.string().min(1),
  certificateNumber: z.string().min(1),
  expiresAt: z.string().optional(),
  ratings: z.string().optional(),
});

export async function bulkImportApprovedVendors(
  rows: z.infer<typeof BulkRowSchema>[]
): Promise<{
  success: boolean;
  error?: string;
  created?: number;
  updated?: number;
  skipped?: number;
}> {
  const organizationId = await getOrgId();
  if (!organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = z.array(BulkRowSchema).safeParse(rows);
  if (!parsed.success) {
    return { success: false, error: "Invalid import rows" };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const row of parsed.data) {
      const supplierName = row.supplierName.trim();
      const certificateNumber = row.certificateNumber.trim();
      if (!supplierName || !certificateNumber) {
        skipped++;
        continue;
      }
      const expiresAt = parseExpires(row.expiresAt);
      const ratings = row.ratings?.trim() || null;

      const existing = await prisma.approvedVendor.findFirst({
        where: {
          organizationId,
          supplierName: { equals: supplierName, mode: "insensitive" },
          certificateNumber: { equals: certificateNumber, mode: "insensitive" },
        },
      });

      if (existing) {
        await prisma.approvedVendor.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            expiresAt,
            ratings,
            supplierName,
            certificateNumber,
          },
        });
        updated++;
      } else {
        await prisma.approvedVendor.create({
          data: {
            organizationId,
            supplierName,
            certificateNumber,
            expiresAt,
            ratings,
            isActive: true,
          },
        });
        created++;
      }
    }

    revalidatePath("/dashboard/settings/avl");
    return { success: true, created, updated, skipped };
  } catch (error) {
    console.error("[bulkImportApprovedVendors]", error);
    return { success: false, error: "Bulk import failed" };
  }
}

export async function deactivateApprovedVendor(
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  const organizationId = await getOrgId();
  if (!organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const vendor = await prisma.approvedVendor.findFirst({
      where: { id: vendorId, organizationId },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    await prisma.approvedVendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });

    revalidatePath("/dashboard/settings/avl");
    return { success: true };
  } catch (error) {
    console.error("[deactivateApprovedVendor]", error);
    return { success: false, error: "Failed to deactivate" };
  }
}

export async function runAvlCheck(params: {
  issuingOrganization: string;
  approvalNumber: string;
}): Promise<AvlCheckResult> {
  const organizationId = await getOrgId();
  if (!organizationId) {
    return {
      isOnAvl: false,
      matchedVendorId: null,
      matchedSupplierName: null,
      warning: "Unauthorized",
      severity: "red" as const,
    };
  }

  return checkAgainstAvl({
    organizationId,
    issuingOrganization: params.issuingOrganization,
    approvalNumber: params.approvalNumber,
  });
}

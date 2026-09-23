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
  notes: z.string().optional(),
});

export type AddVendorInput = z.infer<typeof AddVendorSchema>;

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
    return { success: false, error: "Failed to deactivate vendor" };
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
    };
  }

  return checkAgainstAvl({
    organizationId,
    issuingOrganization: params.issuingOrganization,
    approvalNumber: params.approvalNumber,
  });
}

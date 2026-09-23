"use server";

import { auth } from "@/lib/auth";
import { checkAgainstAvl, type AvlCheckResult } from "@/lib/avl";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddVendorSchema = z.object({
  supplierName: z.string().min(2, "Supplier name is required"),
  certificateNumber: z.string().min(2, "Certificate / approval number is required"),
  notes: z.string().optional(),
});

export type AddVendorInput = z.infer<typeof AddVendorSchema>;

export async function addApprovedVendor(
  input: AddVendorInput
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = AddVendorSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await prisma.approvedVendor.create({
      data: {
        organizationId: session.user.organizationId,
        supplierName: parsed.data.supplierName.trim(),
        certificateNumber: parsed.data.certificateNumber.trim(),
        notes: parsed.data.notes?.trim() || null,
        isActive: true,
      },
    });

    revalidatePath("/settings/avl");
    revalidatePath("/certificates");
    return { success: true };
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return { success: false, error: "This vendor + certificate number already exists on your AVL" };
    }
    console.error("[addApprovedVendor]", error);
    return { success: false, error: "Failed to add vendor" };
  }
}

export async function deactivateApprovedVendor(
  vendorId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const vendor = await prisma.approvedVendor.findFirst({
      where: {
        id: vendorId,
        organizationId: session.user.organizationId,
      },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    await prisma.approvedVendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });

    revalidatePath("/settings/avl");
    revalidatePath("/certificates");
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
  const session = await auth();
  if (!session?.user?.organizationId) {
    return {
      isOnAvl: false,
      matchedVendorId: null,
      matchedSupplierName: null,
      warning: "Unauthorized",
    };
  }

  return checkAgainstAvl({
    organizationId: session.user.organizationId,
    issuingOrganization: params.issuingOrganization,
    approvalNumber: params.approvalNumber,
  });
}

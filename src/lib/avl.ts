import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AvlCheckInputSchema = z.object({
  organizationId: z.string().min(1),
  issuingOrganization: z.string().min(1),
  approvalNumber: z.string().min(1),
});

export type AvlCheckInput = z.infer<typeof AvlCheckInputSchema>;

export type AvlCheckResult = {
  isOnAvl: boolean;
  matchedVendorId: string | null;
  matchedSupplierName: string | null;
  warning: string | null;
};

export async function checkAgainstAvl(
  input: AvlCheckInput
): Promise<AvlCheckResult> {
  const parsed = AvlCheckInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      isOnAvl: false,
      matchedVendorId: null,
      matchedSupplierName: null,
      warning: "Invalid AVL check parameters",
    };
  }

  const { organizationId, issuingOrganization, approvalNumber } = parsed.data;

  try {
    const match = await prisma.approvedVendor.findFirst({
      where: {
        organizationId,
        isActive: true,
        OR: [
          {
            supplierName: {
              equals: issuingOrganization.trim(),
              mode: "insensitive",
            },
            certificateNumber: {
              equals: approvalNumber.trim(),
              mode: "insensitive",
            },
          },
          {
            supplierName: {
              contains: issuingOrganization.trim(),
              mode: "insensitive",
            },
            certificateNumber: {
              equals: approvalNumber.trim(),
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        supplierName: true,
        certificateNumber: true,
      },
    });

    if (match) {
      return {
        isOnAvl: true,
        matchedVendorId: match.id,
        matchedSupplierName: match.supplierName,
        warning: null,
      };
    }

    return {
      isOnAvl: false,
      matchedVendorId: null,
      matchedSupplierName: null,
      warning: "Warning: Vendor not active on current AVL",
    };
  } catch (error) {
    console.error("[AVL Check Error]", error);
    return {
      isOnAvl: false,
      matchedVendorId: null,
      matchedSupplierName: null,
      warning: "Unable to verify vendor against AVL",
    };
  }
}

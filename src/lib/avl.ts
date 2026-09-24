import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AvlCheckInputSchema = z.object({
 organizationId: z.string().min(1),
 issuingOrganization: z.string().min(1),
 approvalNumber: z.string().optional(),
});

export type AvlCheckInput = z.infer<typeof AvlCheckInputSchema>;

export type AvlSeverity = "clear" | "amber" | "red";

export type AvlCheckResult = {
 isOnAvl: boolean;
 matchedVendorId: string | null;
 matchedSupplierName: string | null;
 warning: string | null;
 severity: AvlSeverity;
};

function normalizeName(s: string): string {
 return s.trim().toLowerCase().replace(/\s+/g, " ");
}

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
 severity: "red",
 };
 }

 const { organizationId, issuingOrganization, approvalNumber } = parsed.data;
 const issuing = issuingOrganization.trim();
 const approval = approvalNumber?.trim() || "";

 try {
 const vendors = await prisma.approvedVendor.findMany({
 where: { organizationId, isActive: true },
 select: {
 id: true,
 supplierName: true,
 certificateNumber: true,
 },
 });

 if (vendors.length === 0) {
 return {
 isOnAvl: false,
 matchedVendorId: null,
 matchedSupplierName: null,
 warning:
 "AVL ENFORCEMENT: No active vendors on this organization's Approved Vendor List. Block 4 issuer cannot be verified.",
 severity: "amber",
 };
 }

 const issuingNorm = normalizeName(issuing);

 // Prefer exact certificate + name/contains match when approval is present.
 if (approval) {
 const certMatch = vendors.find((v) => {
 const certOk =
 v.certificateNumber.trim().toLowerCase() === approval.toLowerCase();
 if (!certOk) return false;
 const name = normalizeName(v.supplierName);
 return (
 name === issuingNorm ||
 name.includes(issuingNorm) ||
 issuingNorm.includes(name)
 );
 });
 if (certMatch) {
 return {
 isOnAvl: true,
 matchedVendorId: certMatch.id,
 matchedSupplierName: certMatch.supplierName,
 warning: null,
 severity: "clear",
 };
 }
 }

 // Name-only match (Block 4) when certificate does not align.
 const nameMatch = vendors.find((v) => {
 const name = normalizeName(v.supplierName);
 return (
 name === issuingNorm ||
 name.includes(issuingNorm) ||
 issuingNorm.includes(name)
 );
 });

 if (nameMatch && !approval) {
 return {
 isOnAvl: true,
 matchedVendorId: nameMatch.id,
 matchedSupplierName: nameMatch.supplierName,
 warning: null,
 severity: "clear",
 };
 }

 if (nameMatch && approval) {
 return {
 isOnAvl: false,
 matchedVendorId: null,
 matchedSupplierName: null,
 warning: `AVL ENFORCEMENT: Block 4 issuer "${issuing}" appears on AVL as "${nameMatch.supplierName}", but approval no. "${approval}" does not match listed certificate ${nameMatch.certificateNumber}.`,
 severity: "amber",
 };
 }

 return {
 isOnAvl: false,
 matchedVendorId: null,
 matchedSupplierName: null,
 warning: `AVL ENFORCEMENT: Issuing organization (Block 4) "${issuing}" is not on the Approved Vendor List${approval ? ` (approval ${approval})` : ""}. Do not accept without quality override.`,
 severity: "red",
 };
 } catch (error) {
 console.error("[AVL Check Error]", error);
 return {
 isOnAvl: false,
 matchedVendorId: null,
 matchedSupplierName: null,
 warning: "Unable to verify vendor against AVL",
 severity: "red",
 };
 }
}

import type { Extracted } from "@/lib/certChecks";

export type RtsDraftInput = {
 extracted: Extracted;
 organizationName?: string | null;
 faaCertNumber?: string | null;
};

/**
 * Builds a 14 CFR 43.9–style return-to-service maintenance record draft
 * suitable for logbook entry. Not a substitute for an authorized release.
 */
export function buildCfr439RtsDraft(input: RtsDraftInput): string {
 const x = input.extracted;
 const status = (x.status ?? "INSPECTED").toString().trim().toUpperCase();
 const workVerb = status.includes("OVERHAUL")
 ? "overhauled"
 : status.includes("REPAIR")
 ? "repaired"
 : status.includes("MODIF")
 ? "modified"
 : "inspected";

 const pn = (x.partNumber ?? "[PART NUMBER]").toString().trim() || "[PART NUMBER]";
 const sn = (x.serial ?? "[SERIAL NUMBER]").toString().trim() || "[SERIAL NUMBER]";
 const desc = (x.description ?? "component").toString().trim() || "component";
 const wo = (x.workOrder ?? "[WORK ORDER]").toString().trim() || "[WORK ORDER]";
 const date =
 (x.date ?? x.block23Date ?? x.block18Date ?? "[DATE]").toString().trim() ||
 "[DATE]";
 const remarks = (x.remarks ?? "").toString().trim();
 const approval =
 (x.approvalNumber ?? x.block21CertificateNo ?? x.block16ApprovalNo ?? "")
 .toString()
 .trim();
 const issuer =
 (x.organization ?? input.organizationName ?? "[REPAIR STATION]")
 .toString()
 .trim()
 .split("\n")[0] || "[REPAIR STATION]";
 const cert =
 (input.faaCertNumber ?? approval ?? "[CERTIFICATE NO.]").toString().trim() ||
 "[CERTIFICATE NO.]";
 const signer =
 (x.block22Name ?? x.block17Name ?? "[AUTHORIZED SIGNATURE]").toString().trim() ||
 "[AUTHORIZED SIGNATURE]";

 const lines = [
 "14 CFR 43.9 RETURN-TO-SERVICE MAINTENANCE RECORD (DRAFT)",
 "────────────────────────────────────────────────────────",
 "",
 `The ${desc}, P/N ${pn}, S/N ${sn}, was ${workVerb} in accordance with`,
 "the applicable approved data and the requirements of 14 CFR Part 43,",
 "and is approved for return to service.",
 "",
 `Work order / contract reference: ${wo}`,
 `Release / tracking reference: ${(x.trackingNumber ?? "N/A").toString().trim() || "N/A"}`,
 `Date of completion: ${date}`,
 "",
 ];

 if (remarks) {
 lines.push("Pertinent details / remarks:");
 lines.push(remarks);
 lines.push("");
 }

 lines.push(
 `Pertinent details of the work performed are on file at this repair station`,
 `under Work Order No. ${wo}.`,
 "",
 `Repair station / organization: ${issuer}`,
 `Certificate / approval no.: ${cert}`,
 `Authorized signature: ${signer}`,
 "",
 "────────────────────────────────────────────────────────",
 "DRAFT ONLY — For authorized person / logbook use. Not an airworthiness",
 "determination. Verify against the original 8130-3 / Form 1 before entry."
 );

 return lines.join("\n");
}

export function canGenerateRtsDraft(extracted: Extracted): boolean {
 return Boolean(
 extracted.partNumber ||
 extracted.serial ||
 extracted.description ||
 extracted.status ||
 extracted.block19Cfr43_9
 );
}

// Deterministic checks that never depend on an AI model.
// Field names map to FAA Form 8130-3 / EASA Form 1 blocks.

import { normSerial } from "@/lib/normalize";

export type Extracted = {
  /** Block 3 – Form tracking number */
  trackingNumber?: string | null;
  /** Block 4 – Organization name and address */
  organization?: string | null;
  /** Block 5 – Work order / contract / invoice */
  workOrder?: string | null;
  /** Block 6 – Item */
  item?: string | null;
  /** Block 7 – Description (also mirrored as `description`) */
  description?: string | null;
  /** Block 8 – Part number (also mirrored as `partNumber`) */
  partNumber?: string | null;
  /** Block 9 – Eligibility */
  eligibility?: string | null;
  /** Block 10 – Quantity */
  quantity?: string | null;
  /** Block 11 – Serial / batch number (also mirrored as `serial`) */
  serial?: string | null;
  /** Block 12 – Status / work */
  status?: string | null;
  /** Block 13 – Remarks */
  remarks?: string | null;

  /** Block 14 – "Approved design data…" checkbox */
  block14ApprovedDesign?: boolean | null;
  /** Block 14 – "Non-approved design data specified in Block 13" checkbox */
  block14NonApprovedDesign?: boolean | null;

  /** Block 15 – Authorized signature present */
  block15Signature?: boolean | null;
  /** Block 16 – Approval / authorization number */
  block16ApprovalNo?: string | null;
  /** Block 17 – Name typed or printed */
  block17Name?: string | null;
  /** Block 18 – Date */
  block18Date?: string | null;

  /** Block 19 – 14 CFR 43.9 Return to Service */
  block19Cfr43_9?: boolean | null;
  /** Block 19 – Other regulation specified in Block 13 */
  block19OtherRegulation?: boolean | null;

  /** Block 20 – Authorized signature present */
  block20Signature?: boolean | null;
  /** Block 21 – Approval / certificate number */
  block21CertificateNo?: string | null;
  /** Block 22 – Name typed or printed */
  block22Name?: string | null;
  /** Block 23 – Date */
  block23Date?: string | null;

  /**
   * Convenience roll-ups (kept for older UI / reports).
   * Prefer the block-specific fields when available.
   */
  approvalNumber?: string | null;
  hasSignature?: boolean | null;
  date?: string | null;

  redFlags?: string[];
  _mode?: string;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Understands 2026-08-12, 08/12/2026 (US month first) and 12 AUG 2026. Returns null if not a real calendar date. */
export function parseCertDate(s: string): Date | null {
  const t = s.trim().toUpperCase();
  let y: number, m: number, d: number, r: RegExpExecArray | null;
  if ((r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) {
    y = +r[1];
    m = +r[2];
    d = +r[3];
  } else if ((r = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(t))) {
    m = +r[1];
    d = +r[2];
    y = +r[3] < 100 ? 2000 + +r[3] : +r[3];
  } else if ((r = /^(\d{1,2})[ -]([A-Z]{3})[A-Z]*[ ,-]+(\d{4})$/.exec(t))) {
    d = +r[1];
    m = MONTHS.indexOf(r[2]) + 1;
    y = +r[3];
  } else return null;
  if (m < 1 || m > 12 || d < 1) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

const norm = (s: string) => normSerial(s);

function parseQuantity(q: string | null | undefined): number | null {
  if (!q?.trim()) return null;
  const m = q.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Splits Block 11 into discrete serial/batch tokens. Returns [] for blank / N/A. */
export function parseSerialTokens(serial: string | null | undefined): string[] {
  if (!serial?.trim()) return [];
  const t = serial.trim();
  if (/^(n\/?a|none|nil|not\s*applicable|-)$/i.test(t)) return [];
  return t
    .split(/[,;/\n]+|(?:\s+and\s+)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^(n\/?a|none|nil)$/i.test(s));
}

function isMaintenanceStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return /\b(overhaul|repair|inspect|tested|return\s*to\s*service|altered|modified|restored)\b/i.test(status);
}

function isNewStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return /\b(new|manufactured|prototype)\b/i.test(status);
}

function effectiveApproval(x: Extracted): string | null {
  return x.approvalNumber || x.block16ApprovalNo || x.block21CertificateNo || null;
}

function effectiveSignature(x: Extracted): boolean | null {
  const signals = [x.hasSignature, x.block15Signature, x.block20Signature];
  if (signals.some((s) => s === true)) return true;
  if (signals.some((s) => s === false)) return false;
  return null;
}

function effectiveDate(x: Extracted): string | null {
  return x.date || x.block18Date || x.block23Date || null;
}

function block14Selected(x: Extracted): boolean {
  return x.block14ApprovedDesign === true || x.block14NonApprovedDesign === true;
}

function block19Selected(x: Extracted): boolean {
  return x.block19Cfr43_9 === true || x.block19OtherRegulation === true;
}

export function localFlags(x: Extracted, now = new Date()): string[] {
  const f: string[] = [];

  if (!x.partNumber) f.push("Part number not found on certificate (Block 8)");
  if (!x.serial || parseSerialTokens(x.serial).length === 0) {
    f.push("Serial number not found on certificate (Block 11)");
  }

  const approval = effectiveApproval(x);
  if (!approval) f.push("Approval/authorization number is missing (Block 16 or 21)");

  const sig = effectiveSignature(x);
  if (sig === false) f.push("Authorized signature appears to be missing (Block 15 or 20)");

  const dateStr = effectiveDate(x);
  if (!dateStr) f.push("Certificate date not found (Block 18 or 23)");
  else {
    const dt = parseCertDate(dateStr);
    if (!dt) f.push(`Date "${dateStr}" is not a valid calendar date`);
    else if (dt.getTime() > now.getTime() + 86_400_000) f.push(`Date ${dateStr} is in the future`);
    else if (dt.getUTCFullYear() < 1950) f.push(`Date ${dateStr} is implausibly old`);
  }

  // Quantity ↔ serial / batch consistency (Blocks 10–11)
  const qty = parseQuantity(x.quantity);
  const tokens = parseSerialTokens(x.serial);
  if (qty != null && qty > 1) {
    if (tokens.length === 0) {
      f.push(`Quantity is ${qty} but Block 11 has no serial/batch numbers`);
    } else if (tokens.length === 1) {
      f.push(`Quantity is ${qty} but Block 11 lists only one serial/batch number (${tokens[0]})`);
    } else if (tokens.length !== qty && tokens.length < qty) {
      f.push(`Quantity is ${qty} but Block 11 lists only ${tokens.length} serial/batch number(s)`);
    }
  }

  // Block 14 / 19 regulatory release selection
  const has14 = block14Selected(x);
  const has19 = block19Selected(x);
  if (!has14 && !has19) {
    f.push("No regulatory release selection in Block 14 or Block 19");
  } else {
    if (isMaintenanceStatus(x.status) && !has19) {
      f.push("Status/work indicates maintenance but Block 19 Return to Service is not selected");
    }
    if (isNewStatus(x.status) && !has14 && has19) {
      f.push("Status/work indicates new manufacture but only Block 19 is selected (expected Block 14)");
    }
  }

  // Block 19 checked without signature block completed
  if (has19 && x.block20Signature === false) {
    f.push("Block 19 is selected but authorized signature in Block 20 appears missing");
  }

  // Non-approved design data requires Block 13 justification
  if (x.block14NonApprovedDesign === true) {
    const remarks = (x.remarks ?? "").trim();
    if (!remarks) {
      f.push("Block 14 indicates non-approved design data but Block 13 remarks are empty");
    }
  }

  // Serial mismatch in remarks (legacy rule)
  if (x.serial && x.remarks) {
    const sn = norm(x.serial);
    for (const m of x.remarks.matchAll(/\b(?:S\/N|SN|SERIAL(?:\s+(?:NO|NUMBER))?)\b[:#\s.-]*([A-Z0-9][A-Z0-9-]{2,})/gi)) {
      const other = norm(m[1]);
      if (other && other !== sn && !sn.endsWith(other) && !other.endsWith(sn)) {
        f.push(`Serial in remarks (${m[1]}) does not match serial field (${x.serial})`);
      }
    }
  }

  return f;
}

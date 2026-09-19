// Deterministic checks that never depend on an AI model.
export type Extracted = {
  partNumber?: string | null; serial?: string | null; description?: string | null; status?: string | null;
  approvalNumber?: string | null; hasSignature?: boolean | null; date?: string | null; remarks?: string | null;
  redFlags?: string[]; _mode?: string;
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/** Understands 2026-08-12, 08/12/2026 (US month first) and 12 AUG 2026. Returns null if not a real calendar date. */
export function parseCertDate(s: string): Date | null {
  const t = s.trim().toUpperCase();
  let y: number, m: number, d: number, r: RegExpExecArray | null;
  if ((r = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t))) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else if ((r = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t))) { m = +r[1]; d = +r[2]; y = +r[3]; }
  else if ((r = /^(\d{1,2})[ -]([A-Z]{3})[A-Z]*[ ,-]+(\d{4})$/.exec(t))) { d = +r[1]; m = MONTHS.indexOf(r[2]) + 1; y = +r[3]; }
  else return null;
  if (m < 1 || m > 12 || d < 1) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function localFlags(x: Extracted, now = new Date()): string[] {
  const f: string[] = [];
  if (!x.partNumber) f.push("Part number not found on certificate");
  if (!x.serial) f.push("Serial number not found on certificate");
  if (!x.approvalNumber) f.push("Approval/authorization number is missing");
  if (x.hasSignature === false) f.push("Authorized signature appears to be missing");
  if (!x.date) f.push("Certificate date not found");
  else {
    const dt = parseCertDate(x.date);
    if (!dt) f.push(`Date "${x.date}" is not a valid calendar date`);
    else if (dt.getTime() > now.getTime() + 86_400_000) f.push(`Date ${x.date} is in the future`);
    else if (dt.getUTCFullYear() < 1950) f.push(`Date ${x.date} is implausibly old`);
  }
  if (x.serial && x.remarks) {
    const sn = norm(x.serial);
    for (const m of x.remarks.matchAll(/\b(?:S\/N|SN|SERIAL(?:\s+(?:NO|NUMBER))?)\b[:#\s.-]*([A-Z0-9][A-Z0-9-]{2,})/gi)) {
      const other = norm(m[1]);
      if (other && other !== sn && !sn.endsWith(other) && !other.endsWith(sn))
        f.push(`Serial in remarks (${m[1]}) does not match serial field (${x.serial})`);
    }
  }
  return f;
}

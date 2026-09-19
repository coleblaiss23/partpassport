/** Normalize a part number so "3-1234-A" and "31234a" match. */
export const normPN = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Compare serials numerically when both are pure digits, otherwise as strings. */
export function serialInRange(serial: string, start?: string | null, end?: string | null) {
  if (!start && !end) return true;
  const s = serial.trim().toUpperCase();
  const num = /^\d+$/.test(s);
  const cmp = (a: string, b: string) =>
    num && /^\d+$/.test(b) ? Number(a) - Number(b) : a.localeCompare(b);
  if (start && cmp(s, start.trim().toUpperCase()) < 0) return false;
  if (end && cmp(s, end.trim().toUpperCase()) > 0) return false;
  return true;
}

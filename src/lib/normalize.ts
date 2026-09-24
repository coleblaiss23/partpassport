/**
 * OCR / handwriting confusables commonly mixed on 8130-3 / Form 1 part & serial fields.
 * Used when comparing identifiers so "APV-7742-1O1" matches "APV-7742-101".
 * Only the classic digit lookalikes (O/0, I/l/|/1) — broader maps false-positive too often.
 */
const OCR_TO_DIGIT: Record<string, string> = {
  O: "0",
  I: "1",
  L: "1",
  "|": "1",
};

/** Strip separators and fold OCR confusables for identifier comparison. */
export function normalizeIdentifier(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9|]/g, "")
    .split("")
    .map((ch) => OCR_TO_DIGIT[ch] ?? ch)
    .join("");
}

/** Normalize a part number so formatting and OCR variants match. */
export const normPN = (s: string) => normalizeIdentifier(s);

/** Same rules for serial / batch numbers (Block 11). */
export const normSerial = (s: string) => normalizeIdentifier(s);

/**
 * Clean extracted part/serial display values: trim, collapse whitespace,
 * and fold the safest OCR pairs (O→0, I/l/|→1) when adjacent to a digit.
 */
export function cleanIdentField(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim().replace(/\s+/g, " ");
  if (!t) return null;

  const chars = [...t];
  const isDigit = (c: string) => c >= "0" && c <= "9";
  const fold = (c: string): string | null => {
    const u = c.toUpperCase();
    if (u === "O") return "0";
    if (u === "I" || u === "L" || c === "|") return "1";
    return null;
  };

  for (let i = 0; i < chars.length; i++) {
    const next = fold(chars[i]);
    if (!next) continue;
    const prev = chars[i - 1];
    const after = chars[i + 1];
    if ((prev && isDigit(prev)) || (after && isDigit(after))) {
      chars[i] = next;
    }
  }
  return chars.join("").trim() || null;
}

/** Compare serials numerically when both are pure digits, otherwise as strings. */
export function serialInRange(serial: string, start?: string | null, end?: string | null) {
  if (!start && !end) return true;
  const s = normalizeIdentifier(serial);
  const a0 = start ? normalizeIdentifier(start) : "";
  const a1 = end ? normalizeIdentifier(end) : "";
  const num = /^\d+$/.test(s);
  const cmp = (a: string, b: string) =>
    num && /^\d+$/.test(b) ? Number(a) - Number(b) : a.localeCompare(b);
  if (start && cmp(s, a0) < 0) return false;
  if (end && cmp(s, a1) > 0) return false;
  return true;
}

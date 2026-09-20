/** Small RFC 4180 style CSV parser (quotes, escaped quotes, CRLF). Works in the browser and in Node. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '"' && src[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); if (row.some((x) => x.trim())) rows.push(row); }
  return rows;
}

const ALIASES: Record<string, string[]> = {
  partNumber: ["partnumber", "pn", "partno", "part"],
  serialNumber: ["serialnumber", "sn", "serial", "serialno"],
  description: ["description", "desc"],
  certificateHash: ["certificatehash", "certhash", "sha256"],
};

/** Maps a header row to the fields we understand and returns objects. Throws if required columns are missing. */
export function rowsToParts(rows: string[][]) {
  const [head, ...body] = rows;
  if (!head) throw new Error("The file is empty");
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const idx: Record<string, number> = {};
  for (const [field, names] of Object.entries(ALIASES)) idx[field] = head.findIndex((h) => names.includes(norm(h)));
  if (idx.partNumber < 0 || idx.serialNumber < 0) throw new Error("Columns needed: partNumber and serialNumber (description and certificateHash are optional)");
  return body.map((r) => ({
    partNumber: (r[idx.partNumber] ?? "").trim(),
    serialNumber: (r[idx.serialNumber] ?? "").trim(),
    description: idx.description >= 0 ? (r[idx.description] ?? "").trim() : "",
    certificateHash: idx.certificateHash >= 0 ? (r[idx.certificateHash] ?? "").trim() : "",
  }));
}

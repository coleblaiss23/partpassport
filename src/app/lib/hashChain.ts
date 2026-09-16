import { createHash } from "crypto";

export function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map((item) => JSON.parse(stableStringify(item))));
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const result: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    result[key] = JSON.parse(stableStringify((obj as Record<string, unknown>)[key]));
  }
  return JSON.stringify(result);
}

export function computeEventHash(event: {
  partId: string;
  eventType: string;
  timestamp: string;
  prevEventHash: string | null;
  data: Record<string, unknown>;
  certificateHash?: string | null;
}): string {
  const payload = {
    partId: event.partId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    prevEventHash: event.prevEventHash,
    data: event.data,
    certificateHash: event.certificateHash ?? null,
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
import { createHash } from "crypto";

export interface EventHashInput {
 partId: string;
 organizationId: string;
 seq: number;
 eventType: string;
 timestamp: string;
 prevEventHash: string | null;
 data: object | string;
 certificateHash?: string | null;
}

export function computeEventHash(input: EventHashInput): string {
 const normalizedData =
 typeof input.data === "string" ? input.data : JSON.stringify(input.data);

 const payload = [
 input.partId,
 input.organizationId,
 String(input.seq),
 input.eventType,
 input.timestamp,
 input.prevEventHash ?? "GENESIS",
 normalizedData,
 input.certificateHash ?? "",
 ].join("|");

 return createHash("sha256").update(payload).digest("hex");
}

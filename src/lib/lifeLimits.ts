/** Life-limited / time-in-service helpers for serialized assemblies. */

export type LifeLimitFields = {
 isLifeLimited: boolean;
 totalTimeHours: number | null;
 totalCycles: number | null;
 lifeLimitHours: number | null;
 lifeLimitCycles: number | null;
};

export type LifeLimitStatus = {
 expired: boolean;
 approaching: boolean;
 reasons: string[];
 remainingHours: number | null;
 remainingCycles: number | null;
};

const APPROACH_RATIO = 0.9;

function num(v: unknown): number | null {
 if (v == null || v === "") return null;
 const n = typeof v === "number" ? v : Number(String(v).trim());
 return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseLifeLimitInput(data: Record<string, unknown>): LifeLimitFields {
 const isLifeLimited =
 data.isLifeLimited === true ||
 data.isLifeLimited === "true" ||
 data.isLifeLimited === "1" ||
 data.isLifeLimited === "on";
 return {
 isLifeLimited,
 totalTimeHours: num(data.totalTimeHours),
 totalCycles: num(data.totalCycles),
 lifeLimitHours: num(data.lifeLimitHours),
 lifeLimitCycles: num(data.lifeLimitCycles),
 };
}

export function evaluateLifeLimits(p: LifeLimitFields): LifeLimitStatus {
 const reasons: string[] = [];
 let expired = false;
 let approaching = false;
 let remainingHours: number | null = null;
 let remainingCycles: number | null = null;

 if (!p.isLifeLimited) {
 return { expired: false, approaching: false, reasons, remainingHours, remainingCycles };
 }

 if (p.lifeLimitHours != null && p.totalTimeHours != null) {
 remainingHours = Math.max(0, p.lifeLimitHours - p.totalTimeHours);
 if (p.totalTimeHours >= p.lifeLimitHours) {
 expired = true;
 reasons.push(
 `Total time ${p.totalTimeHours} h meets or exceeds life limit ${p.lifeLimitHours} h`
 );
 } else if (p.totalTimeHours >= p.lifeLimitHours * APPROACH_RATIO) {
 approaching = true;
 reasons.push(
 `Total time ${p.totalTimeHours} h is within 10% of life limit ${p.lifeLimitHours} h`
 );
 }
 }

 if (p.lifeLimitCycles != null && p.totalCycles != null) {
 remainingCycles = Math.max(0, p.lifeLimitCycles - p.totalCycles);
 if (p.totalCycles >= p.lifeLimitCycles) {
 expired = true;
 reasons.push(
 `Total cycles ${p.totalCycles} meets or exceeds life limit ${p.lifeLimitCycles}`
 );
 } else if (p.totalCycles >= p.lifeLimitCycles * APPROACH_RATIO) {
 approaching = true;
 reasons.push(
 `Total cycles ${p.totalCycles} is within 10% of life limit ${p.lifeLimitCycles}`
 );
 }
 }

 if (
 p.isLifeLimited &&
 p.lifeLimitHours == null &&
 p.lifeLimitCycles == null
 ) {
 reasons.push("Marked life-limited but no life-limit hours or cycles are set");
 }

 return { expired, approaching, reasons, remainingHours, remainingCycles };
}

export function lifeLimitPayload(fields: LifeLimitFields): Record<string, unknown> {
 if (!fields.isLifeLimited) {
 return { isLifeLimited: false };
 }
 return {
 isLifeLimited: true,
 totalTimeHours: fields.totalTimeHours,
 totalCycles: fields.totalCycles,
 lifeLimitHours: fields.lifeLimitHours,
 lifeLimitCycles: fields.lifeLimitCycles,
 };
}

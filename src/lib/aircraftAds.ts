import { prisma } from "@/lib/prisma";
import { normPN } from "@/lib/normalize";

export type FlagMatchInput = {
  partNumber: string;
  partNumberNorm: string;
  description: string;
  source: string;
};

export type AircraftIdentity = {
  make: string;
  model: string;
  engineModel?: string | null;
};

/** Known OEM aliases so "Cessna" matches "Textron Aviation" / "CESSNA AIRCRAFT", etc. */
const MAKE_ALIASES: Record<string, string[]> = {
  CESSNA: ["CESSNA", "TEXTRON", "TEXTRONAVIATION"],
  PIPER: ["PIPER", "PIPERAIRCRAFT"],
  BEECH: ["BEECH", "BEECHCRAFT", "TEXTRON", "TEXTRONAVIATION", "RAYTHEON"],
  BEECHCRAFT: ["BEECH", "BEECHCRAFT", "TEXTRON", "TEXTRONAVIATION", "RAYTHEON"],
  CIRRUS: ["CIRRUS", "CIRRUSDESIGN", "CIRRUSAIRCRAFT"],
  ROCKWELL: ["ROCKWELL", "ROCKWELLINTERNATIONAL", "COMMANDER", "GULFSTREAMAMERICAN"],
  "ROCKWELLINTERNATIONAL": [
    "ROCKWELL",
    "ROCKWELLINTERNATIONAL",
    "COMMANDER",
    "GULFSTREAMAMERICAN",
  ],
  AIRBUS: ["AIRBUS", "AIRBUSSAS", "AIRBUSCANADA"],
  BOEING: ["BOEING", "THEBOEINGCOMPANY"],
  EMBRAER: ["EMBRAER", "EMBRAERSA"],
  BOMBARDIER: ["BOMBARDIER", "BOMBARDIERINC"],
  GULFSTREAM: ["GULFSTREAM", "GULFSTREAMAEROSPACE", "GULFSTREAMAMERICAN"],
  BELL: ["BELL", "BELLTEXTRON", "BELLHELICOPTER"],
  ROBINSON: ["ROBINSON", "ROBINSONHELICOPTER"],
  DIAMOND: ["DIAMOND", "DIAMONDAIRCRAFT"],
  MOONEY: ["MOONEY"],
  CIRRUSAIRCRAFT: ["CIRRUS", "CIRRUSDESIGN", "CIRRUSAIRCRAFT"],
};

function aliasSet(make: string): Set<string> {
  const key = normPN(make);
  const aliases = MAKE_ALIASES[key] ?? [key];
  return new Set(aliases.map((a) => normPN(a)).filter(Boolean));
}

/** Extract "Manufacturer: …" segment from AD TOC description. */
export function parseManufacturerFromDescription(description: string): string | null {
  const m = /Manufacturer:\s*([^|]+)/i.exec(description);
  if (!m) return null;
  return m[1].trim() || null;
}

/** Extract "Applicability model: …" when present. */
export function parseApplicabilityModel(description: string): string | null {
  const m = /Applicability model:\s*([^|]+)/i.exec(description);
  if (!m) return null;
  return m[1].trim() || null;
}

/**
 * Huge multi-OEM TOC rows (engine/common ADs) — only allow exact full-model matches,
 * never short prefix candidates.
 */
export function isBroadManufacturerBlob(mfg: string | null): boolean {
  if (!mfg) return false;
  if (mfg.length > 120) return true;
  const hits = [
    "Airbus",
    "Boeing",
    "Bombardier",
    "Embraer",
    "Textron",
    "Gulfstream",
    "Lockheed",
    "Dassault",
    "Pilatus",
    "Saab",
    "Fokker",
    "ATR",
  ].filter((name) => mfg.toLowerCase().includes(name.toLowerCase()));
  return hits.length >= 3;
}

export function makesCompatible(aircraftMake: string, flagManufacturer: string | null): boolean {
  if (!flagManufacturer) return true;
  if (isBroadManufacturerBlob(flagManufacturer)) return true; // defer to model exactness
  const want = aliasSet(aircraftMake);
  const hay = normPN(flagManufacturer);
  if (!hay) return true;
  for (const a of want) {
    if (a && hay.includes(a)) return true;
  }
  // Also accept when flag manufacturer start-token matches
  const first = hay.slice(0, Math.min(hay.length, 12));
  for (const a of want) {
    if (a && (a.startsWith(first) || first.startsWith(a))) return true;
  }
  return false;
}

/**
 * Candidate normalized model tokens for matching SafetyFlag.partNumberNorm.
 * e.g. "172S" → ["172S","172"]; "PA-28-181" → ["PA28181","PA28"]; "A320-214" → ["A320214","A320"].
 */
export function modelMatchCandidates(model: string): string[] {
  const norm = normPN(model);
  if (!norm) return [];
  const out: string[] = [];
  const push = (s: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  push(norm);

  // Hyphenated families (PA-28-181 → PA, PA28; A320-214 → A320)
  const parts = model
    .toUpperCase()
    .split(/[-\s/]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 1) {
    const first = normPN(parts[0]);
    if (/[A-Z]/.test(first) && /\d/.test(first)) push(first);
  }
  if (parts.length >= 2) {
    push(normPN(parts.slice(0, 2).join("")));
  }

  // Strip trailing letter series codes (172S → 172)
  let s = norm;
  while (/[A-Z]$/.test(s) && s.length > 2) {
    s = s.slice(0, -1);
    push(s);
  }

  // Letter prefix + 2–3 digit family (PA28181 → PA28, A320214 → A320)
  const family = /^([A-Z]+)(\d{2,3})/.exec(norm);
  if (family) push(`${family[1]}${family[2]}`);

  // Numeric-only core when model is mostly digits with letter suffix already stripped
  const digits = norm.replace(/[^0-9]/g, "");
  if (digits.length >= 2 && digits.length <= 4) push(digits);

  return out;
}

/**
 * Pure matcher: does this SafetyFlag apply to the given airframe identity?
 * Prefers exact model; allows shorter family candidates only when manufacturer aligns
 * and the flag is not a broad multi-OEM blob (unless exact full-model match).
 */
export function safetyFlagMatchesAircraft(
  flag: FlagMatchInput,
  aircraft: AircraftIdentity,
): boolean {
  if (flag.source !== "AD") return false;

  const modelNorm = normPN(aircraft.model);
  if (!modelNorm) return false;

  const mfg = parseManufacturerFromDescription(flag.description);
  const broad = isBroadManufacturerBlob(mfg);
  const candidates = modelMatchCandidates(aircraft.model);
  const full = candidates[0] ?? modelNorm;

  // Prefer applicability model token when present
  const app = parseApplicabilityModel(flag.description);
  if (app) {
    const appNorm = normPN(app);
    if (appNorm === full || candidates.includes(appNorm)) {
      if (broad && appNorm !== full) return false;
      if (broad && full.length < 5 && !/[A-Z]/.test(full)) return false;
      return makesCompatible(aircraft.make, mfg);
    }
  }

  // Exact / candidate match on partNumberNorm
  if (flag.partNumberNorm === full) {
    // Short numeric models (e.g. "114") against multi-OEM blobs are too ambiguous
    if (broad && full.length < 5 && !/[A-Z]/.test(full)) return false;
    return makesCompatible(aircraft.make, mfg);
  }

  if (broad) {
    // Only exact full model against part number for multi-OEM rows
    return false;
  }

  for (const c of candidates) {
    if (c === full) continue;
    // Avoid ultra-short false positives (e.g. "18", "114" without make filter)
    if (c.length < 3) continue;
    if (flag.partNumberNorm === c && makesCompatible(aircraft.make, mfg)) {
      return true;
    }
  }

  return false;
}

/** Query AD SafetyFlags that match make/model (and optional engine). */
export async function findMatchingSafetyFlags(aircraft: AircraftIdentity): Promise<
  Array<{ id: string; referenceId: string; partNumber: string; partNumberNorm: string }>
> {
  const candidates = modelMatchCandidates(aircraft.model);
  const norms = [...new Set(candidates)].filter((n) => n.length >= 2);
  if (!norms.length) return [];

  // Pull a bounded candidate set from DB, then apply precise filter in memory.
  // Prefer partNumberNorm matches; also scan description for the typed model string.
  const rows = await prisma.safetyFlag.findMany({
    where: {
      source: "AD",
      OR: [
        { partNumberNorm: { in: norms } },
        { description: { contains: aircraft.model.trim(), mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      referenceId: true,
      partNumber: true,
      partNumberNorm: true,
      description: true,
      source: true,
    },
    take: 500,
  });

  const matched = rows.filter((r) => safetyFlagMatchesAircraft(r, aircraft));

  // De-dupe by referenceId — keep one flag per AD number (prefer exact model partNumber)
  const byRef = new Map<string, (typeof matched)[number]>();
  for (const row of matched) {
    const existing = byRef.get(row.referenceId);
    if (!existing) {
      byRef.set(row.referenceId, row);
      continue;
    }
    const full = normPN(aircraft.model);
    const better =
      row.partNumberNorm === full && existing.partNumberNorm !== full
        ? row
        : existing;
    byRef.set(row.referenceId, better);
  }

  return [...byRef.values()].map((r) => ({
    id: r.id,
    referenceId: r.referenceId,
    partNumber: r.partNumber,
    partNumberNorm: r.partNumberNorm,
  }));
}

/**
 * Insert AircraftADStatus rows for matching ADs with status OPEN.
 * Skips duplicates (unique aircraftId+safetyFlagId).
 */
export async function linkOpenAdsForAircraft(
  aircraftId: string,
  aircraft: AircraftIdentity,
): Promise<{ linked: number; flagIds: string[] }> {
  const flags = await findMatchingSafetyFlags(aircraft);
  if (!flags.length) return { linked: 0, flagIds: [] };

  const result = await prisma.aircraftADStatus.createMany({
    data: flags.map((f) => ({
      aircraftId,
      safetyFlagId: f.id,
      status: "OPEN" as const,
    })),
    skipDuplicates: true,
  });

  return { linked: result.count, flagIds: flags.map((f) => f.id) };
}

import { prisma } from "@/lib/prisma";
import { normPN } from "@/lib/normalize";

export type RegistryHit = {
  tailNumber: string;
  make: string;
  model: string;
  year: number | null;
  serialNumber: string | null;
  engineModel: string | null;
  series: string | null;
  source: string;
};

/** Common make/model templates when registry lookup misses. */
export const AIRCRAFT_TEMPLATES: Array<{
  make: string;
  model: string;
  series?: string;
  engineModel?: string;
}> = [
  { make: "Cessna", model: "172S", series: "Skyhawk SP", engineModel: "Lycoming IO-360-L2A" },
  { make: "Cessna", model: "172N", engineModel: "Lycoming O-320-H2AD" },
  { make: "Cessna", model: "182T", series: "Skylane", engineModel: "Lycoming IO-540-AB1A5" },
  { make: "Piper", model: "PA-28-181", series: "Archer", engineModel: "Lycoming O-360-A4M" },
  { make: "Piper", model: "PA-28-161", series: "Warrior", engineModel: "Lycoming O-320-D3G" },
  { make: "Piper", model: "PA-44-180", series: "Seminole", engineModel: "Lycoming O-360-A1H6" },
  { make: "Beechcraft", model: "A36", series: "Bonanza", engineModel: "Continental IO-550-B" },
  { make: "Rockwell International", model: "114", engineModel: "Lycoming IO-540-T4A5D" },
  { make: "Cirrus", model: "SR22", engineModel: "Continental IO-550-N" },
  { make: "Airbus", model: "A320-214", engineModel: "CFM56-5B4" },
  { make: "Boeing", model: "737-800", engineModel: "CFM56-7B26" },
  { make: "Embraer", model: "E175", engineModel: "CF34-8E5" },
];

/** Normalize user input to an FAA-style N-number (uppercase, no spaces/dashes). */
export function normalizeTailNumber(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("N") ? cleaned : `N${cleaned}`;
}

export function registryRowToHit(row: {
  tailNumber: string;
  make: string;
  model: string;
  year: number | null;
  serialNumber: string | null;
  engineModel: string | null;
  series: string | null;
  source: string;
}): RegistryHit {
  return {
    tailNumber: row.tailNumber,
    make: row.make,
    model: row.model,
    year: row.year,
    serialNumber: row.serialNumber,
    engineModel: row.engineModel,
    series: row.series,
    source: row.source,
  };
}

/** Look up a tail in AircraftRegistry (local FAA cache). */
export async function lookupAircraftRegistry(tailRaw: string): Promise<RegistryHit | null> {
  const tailNumber = normalizeTailNumber(tailRaw);
  if (!tailNumber || tailNumber.length < 2) return null;

  const row = await prisma.aircraftRegistry.findUnique({ where: { tailNumber } });
  if (!row) return null;
  return registryRowToHit(row);
}

/** Upsert a registry cache row (e.g. after a successful remote lookup or manual confirm). */
export async function upsertAircraftRegistry(
  hit: Omit<RegistryHit, "source"> & { source?: string; rawPayload?: string | null },
): Promise<RegistryHit> {
  const tailNumber = normalizeTailNumber(hit.tailNumber);
  const row = await prisma.aircraftRegistry.upsert({
    where: { tailNumber },
    create: {
      tailNumber,
      make: hit.make,
      model: hit.model,
      year: hit.year,
      serialNumber: hit.serialNumber,
      engineModel: hit.engineModel,
      series: hit.series,
      source: hit.source ?? "MANUAL",
      rawPayload: hit.rawPayload ?? null,
    },
    update: {
      make: hit.make,
      model: hit.model,
      year: hit.year,
      serialNumber: hit.serialNumber,
      engineModel: hit.engineModel,
      series: hit.series,
      source: hit.source ?? "MANUAL",
      rawPayload: hit.rawPayload ?? null,
    },
  });
  return registryRowToHit(row);
}

/**
 * Templates for manual make/model selection: curated list plus distinct
 * make/model pairs already present in the registry cache.
 */
export async function listAircraftTemplates(): Promise<
  Array<{ make: string; model: string; series?: string | null; engineModel?: string | null }>
> {
  const fromDb = await prisma.aircraftRegistry.findMany({
    distinct: ["make", "model"],
    select: { make: true, model: true, series: true, engineModel: true },
    orderBy: [{ make: "asc" }, { model: "asc" }],
    take: 80,
  });

  const seen = new Set<string>();
  const out: Array<{
    make: string;
    model: string;
    series?: string | null;
    engineModel?: string | null;
  }> = [];

  for (const t of [...AIRCRAFT_TEMPLATES, ...fromDb]) {
    const key = `${normPN(t.make)}|${normPN(t.model)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      make: t.make,
      model: t.model,
      series: t.series ?? null,
      engineModel: t.engineModel ?? null,
    });
  }
  return out;
}

/** Merge body fields with registry hit; body wins when non-empty. */
export function mergeRegistryEnrichment(
  body: {
    make?: string;
    model?: string;
    year?: number | null;
    serialNumber?: string | null;
    engineModel?: string | null;
    series?: string | null;
  },
  hit: RegistryHit | null,
): {
  make: string;
  model: string;
  year: number | null;
  serialNumber: string | null;
  engineModel: string | null;
  series: string | null;
  enrichedFromRegistry: boolean;
} {
  const make = (body.make?.trim() || hit?.make || "").trim();
  const model = (body.model?.trim() || hit?.model || "").trim();
  return {
    make,
    model,
    year: body.year ?? hit?.year ?? null,
    serialNumber: body.serialNumber?.trim() || hit?.serialNumber || null,
    engineModel: body.engineModel?.trim() || hit?.engineModel || null,
    series: body.series?.trim() || hit?.series || null,
    enrichedFromRegistry: Boolean(hit) && !(body.make?.trim() && body.model?.trim()),
  };
}

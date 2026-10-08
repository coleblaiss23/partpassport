import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { aircraftLimit } from "@/lib/planLimits";
import {
  lookupAircraftRegistry,
  mergeRegistryEnrichment,
  normalizeTailNumber,
} from "@/lib/aircraftRegistry";
import { linkOpenAdsForAircraft } from "@/lib/aircraftAds";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  const aircraft = await prisma.aircraft.findMany({
    where: {
      organizationId: org.id,
      ...(q
        ? {
            OR: [
              { tailNumber: { contains: q, mode: "insensitive" } },
              { make: { contains: q, mode: "insensitive" } },
              { model: { contains: q, mode: "insensitive" } },
              { serialNumber: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { tailNumber: "asc" },
    take: 40,
    include: {
      adStatuses: {
        where: { status: { in: ["OPEN", "OVERDUE"] } },
        select: { id: true },
      },
    },
  });

  return NextResponse.json({
    aircraft: aircraft.map(({ adStatuses, ...rest }) => ({
      ...rest,
      openAds: adStatuses.length,
    })),
  });
}

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const tailNumber = normalizeTailNumber(
    typeof body.tailNumber === "string" ? body.tailNumber : "",
  );

  if (!tailNumber) {
    return NextResponse.json({ error: "tailNumber is required" }, { status: 400 });
  }

  const limit = aircraftLimit(org);
  if (Number.isFinite(limit)) {
    const count = await prisma.aircraft.count({ where: { organizationId: org.id } });
    if (count >= limit) {
      return NextResponse.json(
        {
          error: `Starter plan allows ${limit} aircraft. Upgrade to Professional for unlimited tails.`,
        },
        { status: 402 },
      );
    }
  }

  // Registry enrichment when make/model omitted or partial
  const registryHit = await lookupAircraftRegistry(tailNumber);
  const enriched = mergeRegistryEnrichment(
    {
      make: typeof body.make === "string" ? body.make : "",
      model: typeof body.model === "string" ? body.model : "",
      year: typeof body.year === "number" ? body.year : null,
      serialNumber: typeof body.serialNumber === "string" ? body.serialNumber : null,
      engineModel: typeof body.engineModel === "string" ? body.engineModel : null,
      series: typeof body.series === "string" ? body.series : null,
    },
    registryHit,
  );

  if (!enriched.make || !enriched.model) {
    return NextResponse.json(
      {
        error:
          "Could not resolve make/model from registry. Enter them manually or pick a make/model template.",
        needsManualEntry: true,
        registryHit: registryHit ?? null,
      },
      { status: 422 },
    );
  }

  try {
    const aircraft = await prisma.aircraft.create({
      data: {
        organizationId: org.id,
        tailNumber,
        make: enriched.make,
        model: enriched.model,
        year: enriched.year,
        series: enriched.series,
        serialNumber: enriched.serialNumber,
        engineModel: enriched.engineModel,
        airframeHours: typeof body.airframeHours === "number" ? body.airframeHours : null,
        hobbsHours: typeof body.hobbsHours === "number" ? body.hobbsHours : null,
      },
    });

    const linked = await linkOpenAdsForAircraft(aircraft.id, {
      make: aircraft.make,
      model: aircraft.model,
      engineModel: aircraft.engineModel,
    });

    return NextResponse.json(
      {
        aircraft: {
          ...aircraft,
          openAds: linked.linked,
        },
        enrichment: {
          fromRegistry: Boolean(registryHit),
          registrySource: registryHit?.source ?? null,
          adsLinked: linked.linked,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "Tail number already in fleet" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

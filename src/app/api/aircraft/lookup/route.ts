import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import {
  listAircraftTemplates,
  lookupAircraftRegistry,
  normalizeTailNumber,
} from "@/lib/aircraftRegistry";
import { findMatchingSafetyFlags } from "@/lib/aircraftAds";

export const dynamic = "force-dynamic";

/**
 * GET /api/aircraft/lookup?tail=N4867W
 *   → registry metadata for the N-number (if cached) + preview AD match count
 * GET /api/aircraft/lookup?templates=1
 *   → make/model templates for manual fallback
 */
export async function GET(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("templates") === "1") {
    const templates = await listAircraftTemplates();
    return NextResponse.json({ templates });
  }

  const tailRaw = searchParams.get("tail") ?? "";
  const tailNumber = normalizeTailNumber(tailRaw);
  if (!tailNumber) {
    return NextResponse.json({ error: "tail query required" }, { status: 400 });
  }

  const hit = await lookupAircraftRegistry(tailNumber);
  if (!hit) {
    return NextResponse.json({
      found: false,
      tailNumber,
      registry: null,
      previewAdCount: 0,
    });
  }

  const flags = await findMatchingSafetyFlags({
    make: hit.make,
    model: hit.model,
    engineModel: hit.engineModel,
  });

  return NextResponse.json({
    found: true,
    tailNumber,
    registry: hit,
    previewAdCount: flags.length,
  });
}

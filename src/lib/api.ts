import { NextResponse } from "next/server";
import { orgFromRequest } from "@/lib/auth";
import { isFail, type Fail } from "@/lib/eventService";

export const unauthorized = () =>
  NextResponse.json({ error: "Missing or invalid API key (Authorization: Bearer pp_live_...)" }, { status: 401 });

export function send(result: object | Fail) {
  if (isFail(result)) return NextResponse.json({ error: result.error }, { status: result.status });
  const { status, ...rest } = result as { status?: number };
  return NextResponse.json(rest, { status: status ?? 200 });
}

export async function readJson(req: Request): Promise<Record<string, any> | null> {
  try { return await req.json(); } catch { return null; }
}
export { orgFromRequest };

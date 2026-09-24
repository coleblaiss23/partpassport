import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { adminOverviewMetrics, adminSystemHealth } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
 if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const [metrics, health] = await Promise.all([adminOverviewMetrics(), adminSystemHealth()]);
 return NextResponse.json({ metrics, health });
}

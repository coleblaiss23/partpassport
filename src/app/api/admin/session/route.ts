import { NextResponse } from "next/server";
import {
 ADMIN_COOKIE,
 ADMIN_MAX_AGE,
 adminConfigured,
 adminCookieOptions,
 makeAdminSession,
 requireAdmin,
 verifyAdminToken,
} from "@/lib/adminAuth";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
 if (!requireAdmin(req)) {
 return NextResponse.json(
 { ok: false, configured: adminConfigured() },
 { status: 401 }
 );
 }
 return NextResponse.json({ ok: true, role: "admin", configured: true });
}

export async function POST(req: Request) {
 if (!(await rateLimit(`admin-login:${clientIp(req)}`, 8, 60_000))) {
 return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
 }
 if (!adminConfigured()) {
 return NextResponse.json(
 { error: "ADMIN_TOKEN and SESSION_SECRET must be configured" },
 { status: 503 }
 );
 }
 const body = await req.json().catch(() => null);
 const token = typeof body?.token === "string" ? body.token.trim() : "";
 if (!verifyAdminToken(token)) {
 return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
 }
 let session: string;
 try {
 session = makeAdminSession();
 } catch (e) {
 return NextResponse.json({ error: (e as Error).message }, { status: 500 });
 }
 const res = NextResponse.json({ ok: true, role: "admin" });
 res.cookies.set(ADMIN_COOKIE, session, { ...adminCookieOptions, maxAge: ADMIN_MAX_AGE });
 return res;
}

export async function DELETE() {
 const res = NextResponse.json({ ok: true });
 res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
 return res;
}

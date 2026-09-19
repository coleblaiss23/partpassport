import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashKey } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_MAX_AGE, makeSession } from "@/lib/session";
import { getSessionOrg } from "@/lib/sessionOrg";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const pub = (o: { id: string; name: string; publicKey: string }) => ({ id: o.id, name: o.name, publicKey: o.publicKey });
const cookieBase = { httpOnly: true, sameSite: "strict" as const, path: "/", secure: process.env.NODE_ENV === "production" };

export async function GET() {
  const org = await getSessionOrg();
  return org ? NextResponse.json({ org: pub(org) }) : NextResponse.json({ org: null }, { status: 401 });
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const key = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!/^pp_live_[a-f0-9]{48}$/.test(key)) return NextResponse.json({ error: "That does not look like a valid API key" }, { status: 400 });
  const org = await prisma.organization.findUnique({ where: { apiKeyHash: hashKey(key) } });
  if (!org?.active) return NextResponse.json({ error: "API key not recognized" }, { status: 401 });
  let token: string;
  try { token = makeSession(org.id); } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 500 }); }
  const res = NextResponse.json({ org: pub(org) });
  res.cookies.set(SESSION_COOKIE, token, { ...cookieBase, maxAge: SESSION_MAX_AGE });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return res;
}

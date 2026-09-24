import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateLead } from "@/lib/leads";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
 if (!(await rateLimit(`lead:${clientIp(req)}`, 5, 60 * 60_000))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
 const body = await req.json().catch(() => null);
 if (body?.website) return NextResponse.json({ ok: true }); // honeypot: bots fill hidden fields; pretend success
 const v = validateLead(body);
 if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

 await prisma.lead.create({ data: v.data });

 // Optional instant alert to a Slack or Discord incoming webhook
 const hook = process.env.LEAD_WEBHOOK_URL;
 if (hook) {
 const msg = `New PartPassport lead: ${v.data.name} (${v.data.company}) ${v.data.email} | volume: ${v.data.volume ?? "n/a"} | source: ${v.data.source ?? "n/a"}`;
 void fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: msg, content: msg }) }).catch(() => {});
 }
 return NextResponse.json({ ok: true });
}

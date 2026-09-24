import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

const Body = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  embedUrl: z.string(),
  category: z.enum(["AVL", "INTAKE", "AUDIT_SHARE", "GENERAL"]).default("GENERAL"),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
  duration: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const videos = await prisma.tutorialVideo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ videos });
  } catch (e) {
    console.error("[admin/tutorials GET]", e);
    return NextResponse.json({ error: "Failed to load tutorials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid" },
      { status: 400 }
    );
  }

  try {
    const video = await prisma.tutorialVideo.create({
      data: {
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        embedUrl: parsed.data.embedUrl.trim(),
        category: parsed.data.category,
        sortOrder: parsed.data.sortOrder ?? 100,
        published: parsed.data.published ?? true,
        duration: parsed.data.duration?.trim() || null,
      },
    });
    return NextResponse.json({ video });
  } catch (e) {
    console.error("[admin/tutorials POST]", e);
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 });
  }
}

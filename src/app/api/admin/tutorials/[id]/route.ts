import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Patch = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  embedUrl: z.string().optional(),
  category: z.enum(["AVL", "INTAKE", "AUDIT_SHARE", "GENERAL"]).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
  duration: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const video = await prisma.tutorialVideo.update({
      where: { id },
      data: {
        ...parsed.data,
        description:
          parsed.data.description === undefined
            ? undefined
            : parsed.data.description?.trim() || null,
        duration:
          parsed.data.duration === undefined
            ? undefined
            : parsed.data.duration?.trim() || null,
        title: parsed.data.title?.trim(),
        embedUrl: parsed.data.embedUrl?.trim(),
      },
    });
    return NextResponse.json({ video });
  } catch (e) {
    console.error("[admin/tutorials PATCH]", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(_req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    await prisma.tutorialVideo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/tutorials DELETE]", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await prisma.certificateCheck.findUnique({
    where: { id },
    include: { organization: { select: { name: true } } },
  });
  if (!check) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const flags: string[] = JSON.parse(check.redFlags);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]);
  const { height } = page.getSize();
  let y = height - 50;
  const draw = (text: string, size = 11, isBold = false) => {
    page.drawText(String(text).slice(0, 100), {
      x: 50, y, size, font: isBold ? bold : font, color: rgb(0.1, 0.1, 0.15),
    });
    y -= size + 6;
  };
  draw("PartPassport — Certificate Audit Report", 16, true);
  y -= 8;
  draw(`Organization: ${check.organization.name}`);
  draw(`Generated: ${check.createdAt.toISOString().slice(0, 10)}`);
  y -= 12;
  draw(flags.length ? `Findings: ${flags.length}` : "No issues detected", 12, true);
  flags.forEach((f) => draw(`• ${f}`, 10));
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-audit-${id}.pdf"`,
    },
  });
}

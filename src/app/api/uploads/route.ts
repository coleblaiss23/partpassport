import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { canUseFeature } from "@/lib/planLimits";
import type { DocumentKind } from "@prisma/client";

export const dynamic = "force-dynamic";

const KINDS: DocumentKind[] = ["LOGBOOK", "INVOICE", "CERTIFICATE", "OTHER"];
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export async function GET() {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uploads = await prisma.documentUpload.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      byteSize: true,
      kind: true,
      status: true,
      aircraftId: true,
      createdAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json({ uploads });
}

export async function POST(request: Request) {
  const org = await getSessionOrg();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canUseFeature(org, "ocrUploads")) {
    return NextResponse.json(
      {
        error:
          "Logbook / invoice OCR scanning requires Professional or Enterprise. Upgrade at /pricing.",
      },
      { status: 402 },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED.has(mimeType) && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF or image uploads are supported" },
      { status: 400 },
    );
  }

  const kindRaw = String(form.get("kind") ?? "OTHER").toUpperCase();
  const kind = KINDS.includes(kindRaw as DocumentKind)
    ? (kindRaw as DocumentKind)
    : "OTHER";
  const aircraftId = form.get("aircraftId");
  const workOrderId = form.get("workOrderId");

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 400 });
  }

  const sha256 = createHash("sha256").update(buf).digest("hex");
  const id = randomUUID();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const storageKey = `uploads/${org.id}/${id}-${safeName}`;
  const abs = path.join(process.cwd(), ".data", storageKey);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf);

  const upload = await prisma.documentUpload.create({
    data: {
      organizationId: org.id,
      aircraftId: typeof aircraftId === "string" && aircraftId ? aircraftId : null,
      workOrderId: typeof workOrderId === "string" && workOrderId ? workOrderId : null,
      kind,
      status: "UPLOADED",
      fileName: file.name.slice(0, 200),
      mimeType,
      byteSize: buf.length,
      storageKey,
      sha256,
    },
  });

  return NextResponse.json(
    {
      upload: {
        id: upload.id,
        fileName: upload.fileName,
        kind: upload.kind,
        status: upload.status,
        sha256: upload.sha256,
        createdAt: upload.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

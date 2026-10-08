import { redirect } from "next/navigation";
import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { DocumentDropzone } from "@/components/uploads/DocumentDropzone";
import { canUseFeature } from "@/lib/planLimits";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uploads | PartPassport" };

export default async function UploadsPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const allowed = canUseFeature(org, "ocrUploads");
  const uploads = await prisma.documentUpload.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <PageHeader
        title="Logbook & invoice uploads"
        subtitle="Drop scanned PDFs or images for AI/OCR extraction into the Tail Number Dashboard."
      />

      {!allowed && (
        <Card>
          <p className="text-sm text-[#c8c2b8]">
            OCR scanning is included on Professional and Enterprise. You can still explore the
            dropzone below — uploads require an{" "}
            <Link href="/pricing" className="text-[#1F6B47] hover:underline">
              upgraded plan
            </Link>
            .
          </p>
        </Card>
      )}

      <DocumentDropzone kind="LOGBOOK" />

      <Card className="overflow-x-auto">
        <h2 className="mb-3 text-sm font-medium text-white">Recent uploads</h2>
        {uploads.length === 0 ? (
          <p className="text-sm text-[#c8c2b8]">No uploads yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#8d877e]">
              <tr>
                <th className="pb-2 font-medium">File</th>
                <th className="pb-2 font-medium">Kind</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id} className="border-t border-[#2c2c2c]">
                  <td className="py-2 pr-3 text-white">{u.fileName}</td>
                  <td className="py-2 pr-3 text-[#c8c2b8]">{u.kind}</td>
                  <td className="py-2 pr-3">
                    <Badge
                      tone={
                        u.status === "FAILED"
                          ? "red"
                          : u.status === "EXTRACTED"
                            ? "green"
                            : "slate"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="pp-track py-2 text-[#c8c2b8]">
                    {u.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}

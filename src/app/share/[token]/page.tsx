import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  decryptAuditPackage,
  hashShareToken,
} from "@/lib/auditShare";
import { Badge, Card, bannerFail, bannerPass, bannerWarn } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shared audit package | PartPassport",
  robots: { index: false, follow: false },
};

export default async function ShareViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = hashShareToken(token);
  const share = await prisma.auditShare.findUnique({ where: { tokenHash } });

  if (!share || share.revokedAt || share.expiresAt.getTime() < Date.now()) {
    notFound();
  }

  let payload: Record<string, unknown>;
  try {
    payload = decryptAuditPackage(share.encPayload, token) as Record<string, unknown>;
  } catch {
    notFound();
  }

  await prisma.auditShare.update({
    where: { id: share.id },
    data: { lastAccessedAt: new Date() },
  });

  const type = String(payload.type ?? share.packageType);
  const disclaimer = String(payload.disclaimer ?? "Read-only auditor package.");

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className={bannerWarn}>
        <p className="text-sm font-semibold text-white">Read-only encrypted audit package</p>
        <p className="mt-1 text-xs">
          Temporary share · expires {share.expiresAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          {share.label ? ` · ${share.label}` : ""}
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-[#7C8495]">Package type</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{type.replace(/_/g, " ")}</h1>
      </div>

      {type === "CERT_CHECK" && (
        <>
          <Card className="space-y-2">
            <p className="text-sm text-[#B0B6C3]">
              Prepared by{" "}
              <span className="text-white">{String(payload.organization ?? "")}</span>
            </p>
            <p className="pp-track text-sm text-white">{String(payload.fileName ?? "")}</p>
            <p className="break-all text-xs text-[#7C8495]">
              SHA-256: <span className="pp-track">{String(payload.sha256 ?? "")}</span>
            </p>
          </Card>
          {Array.isArray(payload.redFlags) && (payload.redFlags as string[]).length > 0 ? (
            <div className={bannerFail}>
              <p className="font-medium text-white">
                Findings ({(payload.redFlags as string[]).length})
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(payload.redFlags as string[]).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={bannerPass}>
              <p className="font-medium text-white">No findings recorded on this package</p>
            </div>
          )}
          {payload.extracted && typeof payload.extracted === "object" && (
            <table className="w-full border border-[#1F2430] text-sm">
              <tbody>
                {Object.entries(payload.extracted as Record<string, unknown>)
                  .filter(([k]) => !k.startsWith("_"))
                  .slice(0, 24)
                  .map(([k, v]) => (
                    <tr key={k} className="border-b border-[#1F2430]">
                      <td className="w-44 p-2.5 text-[#B0B6C3]">{k}</td>
                      <td className="p-2.5 text-white">
                        {v == null || v === "" ? "—" : String(v)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {type === "PART_PASSPORT" && (
        <>
          <Card>
            <h2 className="pp-track text-xl font-semibold text-white">
              {String(payload.partNumber)} / {String(payload.serialNumber)}
            </h2>
            {payload.description ? (
              <p className="mt-1 text-sm text-[#B0B6C3]">{String(payload.description)}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                tone={
                  payload.custodyStatus === "SERVICEABLE"
                    ? "green"
                    : payload.custodyStatus === "QUARANTINE"
                      ? "amber"
                      : "red"
                }
              >
                {String(payload.custodyStatus ?? "—")}
              </Badge>
              {payload.isLifeLimited ? <Badge tone="blue">Life-limited</Badge> : null}
            </div>
            {payload.birthCertificateHash ? (
              <p className="mt-3 break-all text-xs text-[#7C8495]">
                Birth certificate hash:{" "}
                <span className="pp-track">{String(payload.birthCertificateHash)}</span>
              </p>
            ) : null}
          </Card>
          {payload.chain && typeof payload.chain === "object" && (
            <Card>
              <h3 className="text-sm font-medium text-white">Chain summary</h3>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs text-[#B0B6C3]">
                {JSON.stringify(payload.chain, null, 2)}
              </pre>
            </Card>
          )}
        </>
      )}

      <p className="text-xs text-[#7C8495]">{disclaimer}</p>
    </main>
  );
}

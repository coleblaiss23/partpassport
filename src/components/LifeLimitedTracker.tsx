import { evaluateLifeLimits, type LifeLimitFields } from "@/lib/lifeLimits";
import { Badge, Card } from "@/components/ui";
import Link from "next/link";

export type LlpPartRow = LifeLimitFields & {
  id: string;
  partNumber: string;
  serialNumber: string;
  description: string | null;
  birthCertificateHash: string | null;
  custodyStatus: string;
};

export function LifeLimitedTracker({ parts }: { parts: LlpPartRow[] }) {
  if (parts.length === 0) {
    return (
      <Card>
        <h2 className="font-medium text-white">Life-limited parts</h2>
        <p className="mt-2 text-sm text-[#B0B6C3]">
          No life-limited assemblies in custody. Mark parts as LLP when registering to track
          remaining hours, cycles, and digital birth certificate data.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <h2 className="mb-3 font-medium text-white">Life-limited part tracking</h2>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-[#7C8495]">
          <tr>
            <th className="pb-2 font-medium">Part</th>
            <th className="pb-2 font-medium">Remaining</th>
            <th className="pb-2 font-medium">Birth cert</th>
            <th className="pb-2 font-medium">Shelf</th>
            <th className="pb-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => {
            const s = evaluateLifeLimits(p);
            const rem =
              [
                s.remainingHours != null ? `${s.remainingHours.toFixed(1)} h` : null,
                s.remainingCycles != null ? `${s.remainingCycles} cyc` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—";
            return (
              <tr key={p.id} className="border-t border-[#1F2430]">
                <td className="py-2 pr-3">
                  <Link
                    className="pp-track text-white hover:underline"
                    href={`/verify/${encodeURIComponent(p.partNumber)}/${encodeURIComponent(p.serialNumber)}`}
                  >
                    {p.partNumber} / {p.serialNumber}
                  </Link>
                  {p.description ? (
                    <p className="text-xs text-[#7C8495]">{p.description}</p>
                  ) : null}
                </td>
                <td className="pp-track py-2 pr-3 text-[#B0B6C3]">{rem}</td>
                <td className="py-2 pr-3">
                  {p.birthCertificateHash ? (
                    <code className="pp-track text-xs text-[#B0B6C3]" title={p.birthCertificateHash}>
                      {p.birthCertificateHash.slice(0, 10)}…
                    </code>
                  ) : (
                    <span className="text-xs text-[#7C8495]">Not linked</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <Badge
                    tone={
                      p.custodyStatus === "SERVICEABLE"
                        ? "green"
                        : p.custodyStatus === "QUARANTINE"
                          ? "amber"
                          : "red"
                    }
                  >
                    {p.custodyStatus}
                  </Badge>
                </td>
                <td className="py-2">
                  {s.expired ? (
                    <Badge tone="red">Expired</Badge>
                  ) : s.approaching ? (
                    <Badge tone="amber">Approaching</Badge>
                  ) : (
                    <Badge tone="green">OK</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

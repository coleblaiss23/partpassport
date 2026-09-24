import Link from "next/link";
import { bannerFail, bannerWarn, Card } from "@/components/ui";

export type SafetyAlertRow = {
  id: string;
  source: string;
  referenceId: string;
  description: string;
  partNumber: string;
  issuedDate: Date;
  url: string | null;
};

/** Dashboard banner for FAA UPN / AD monitoring hits against held parts. */
export function SafetyMonitorBanner({ alerts }: { alerts: SafetyAlertRow[] }) {
  if (alerts.length === 0) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 border-[#1F6B47] bg-[#14281F]">
        <div>
          <p className="text-sm font-medium text-white">UPN / AD monitoring</p>
          <p className="mt-0.5 text-xs text-[#B0B6C3]">
            No open Unapproved Parts Notifications or Airworthiness Directives match parts in your
            custody.
          </p>
        </div>
        <Link href="/dashboard/compliance" className="text-xs text-[#D8F3E7] hover:underline">
          Compliance center →
        </Link>
      </Card>
    );
  }

  const upn = alerts.filter((a) => a.source === "UPN" || a.source === "SDR").length;
  const ad = alerts.filter((a) => a.source === "AD").length;
  const shell = upn > 0 ? bannerFail : bannerWarn;

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            FAA UPN / AD alerts · {alerts.length} open
            {upn ? ` · ${upn} UPN` : ""}
            {ad ? ` · ${ad} AD` : ""}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <span className="pp-track font-medium">
                  {a.source} {a.referenceId}
                </span>
                <span className="text-[#B0B6C3]">
                  {" "}
                  · {a.partNumber} — {a.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/dashboard/compliance" className="shrink-0 text-xs text-white hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}

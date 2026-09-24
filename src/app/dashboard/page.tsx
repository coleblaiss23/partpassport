import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/sessionOrg";
import { getUsage } from "@/lib/usage";
import { PLAN_LIMITS, effectivePlan } from "@/lib/planLimits";
import { Badge, Card, Hash, PageHeader, Stat, btnPrimary, btnSecondary } from "@/components/ui";
import BillingButton from "@/components/BillingButton";
import { SafetyMonitorBanner } from "@/components/SafetyMonitorBanner";
import { LifeLimitedTracker } from "@/components/LifeLimitedTracker";
import { normPN } from "@/lib/normalize";
import {
  safeComplianceDueCount,
  safeLlpParts,
  safeQuarantineCount,
} from "@/lib/mroQueries";

export const dynamic = "force-dynamic";

const TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  CREATED: "blue",
  INSPECTED: "slate",
  REPAIRED: "amber",
  OVERHAULED: "green",
  INSTALLED: "green",
  REMOVED: "slate",
  SCRAPPED: "red",
  SOLD: "blue",
  TRANSFERRED: "blue",
};

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const big = limit >= 10_000;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? "bg-[#9F1239]" : pct >= 80 ? "bg-[#B45309]" : "bg-[#1F6B47]";
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-[#B0B6C3]">{label}</span>
        <span className="text-[#B0B6C3]">
          {used} / {big ? "fair use" : limit}
        </span>
      </div>
      {!big && (
        <div className="mt-1 h-2 overflow-hidden rounded-[4px] bg-[#161B24]">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {!big && pct >= 100 && (
        <p className="mt-1 text-xs text-[#FFE4E6]">Limit reached. Upgrade to continue.</p>
      )}
      {!big && pct >= 80 && pct < 100 && (
        <p className="mt-1 text-xs text-[#B45309]">Approaching your monthly limit.</p>
      )}
    </div>
  );
}

const label = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export default async function DashboardPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const mine = { organizationId: org.id };
  const plan = effectivePlan(org);
  const limits = PLAN_LIMITS[plan];

  const [held, checks, usage, flagged, events, attention, llp, heldParts, safetyAll, expiring, quarantine] =
    await Promise.all([
      prisma.part.count({ where: { currentOrgId: org.id, scrapped: false } }),
      prisma.certificateCheck.count({ where: mine }),
      getUsage(org.id),
      prisma.certificateCheck.count({ where: { ...mine, NOT: { redFlags: "[]" } } }),
      prisma.partEvent.findMany({
        where: mine,
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { part: { select: { partNumber: true, serialNumber: true } } },
      }),
      prisma.certificateCheck.findMany({
        where: { ...mine, NOT: { redFlags: "[]" } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      safeLlpParts(org.id),
      prisma.part.findMany({
        where: { currentOrgId: org.id, scrapped: false },
        select: { partNumber: true },
      }),
      prisma.safetyFlag.findMany({ orderBy: { issuedDate: "desc" }, take: 300 }),
      safeComplianceDueCount(org.id),
      safeQuarantineCount(org.id),
    ]);

  const heldNorm = new Set(heldParts.map((p) => normPN(p.partNumber)));
  const safetyAlerts = safetyAll
    .filter((f) => heldNorm.has(f.partNumberNorm))
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      source: f.source,
      referenceId: f.referenceId,
      description: f.description,
      partNumber: f.partNumber,
      issuedDate: f.issuedDate,
      url: f.url,
    }));

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        title={org.name}
        subtitle="Organization overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/check" className={btnPrimary}>
              Certificate intake
            </Link>
            <Link href="/dashboard/custody" className={btnSecondary}>
              Custody
            </Link>
          </div>
        }
      />

      <SafetyMonitorBanner alerts={safetyAlerts} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Parts in your custody" value={held} />
        <Stat
          label="In quarantine"
          value={quarantine}
          sub="awaiting shelf assignment"
          tone={quarantine ? "amber" : undefined}
        />
        <Stat label="Certificates checked" value={checks} sub={`${usage.checks} this month`} />
        <Stat
          label="Need attention"
          value={flagged}
          sub={expiring ? `${expiring} compliance items due` : "checks with findings"}
          tone={flagged || expiring ? "amber" : undefined}
        />
      </div>

      <LifeLimitedTracker parts={llp} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <h2 className="mb-3 font-medium text-white">Recent activity</h2>
          {events.length === 0 ? (
            <p className="text-sm text-[#B0B6C3]">
              No events yet. Register a part to create your first signed record.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[#7C8495]">
                <tr>
                  <th className="pb-2 font-medium">Time (UTC)</th>
                  <th className="pb-2 font-medium">Event</th>
                  <th className="pb-2 font-medium">Part</th>
                  <th className="pb-2 font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-[#1F2430]">
                    <td className="py-2 pr-3 text-[#B0B6C3]">
                      {e.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={TONE[e.eventType] ?? "slate"}>{label(e.eventType)}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Link
                        className="pp-track text-white hover:underline"
                        href={`/verify/${encodeURIComponent(e.part.partNumber)}/${encodeURIComponent(e.part.serialNumber)}`}
                      >
                        {e.part.partNumber} / {e.part.serialNumber}
                      </Link>
                    </td>
                    <td className="py-2">
                      <Hash value={e.eventHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-medium text-white">Needs attention</h2>
            {attention.length === 0 ? (
              <p className="text-sm text-[#B0B6C3]">No certificate findings to review.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {attention.map((c) => (
                  <li key={c.id}>
                    <Link href={`/report/${c.id}`} className="text-white hover:underline">
                      {c.fileName}
                    </Link>
                    <span className="ml-2">
                      <Badge tone="amber">
                        {(JSON.parse(c.redFlags) as string[]).length} findings
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link href="/dashboard/compliance" className="text-[#1F6B47] hover:underline">
                Compliance alerts
              </Link>
              <Link href="/dashboard/audit-share" className="text-[#1F6B47] hover:underline">
                Audit share
              </Link>
            </div>
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-white">Plan and usage</h2>
              <Badge tone={plan === "PILOT" ? "slate" : "green"}>{limits.name}</Badge>
            </div>
            <Meter label="Certificate checks" used={usage.checks} limit={limits.checks} />
            <Meter
              label="Part registrations"
              used={usage.registrations}
              limit={limits.registrations}
            />
            <p className="text-xs text-[#7C8495]">Resets on the 1st of each month (UTC).</p>
            {plan === "PILOT" ? (
              <Link href="/billing" className={`${btnPrimary} w-full`}>
                Upgrade plan
              </Link>
            ) : (
              <BillingButton />
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

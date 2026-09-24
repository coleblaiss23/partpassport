import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/sessionOrg";
import { getUsage } from "@/lib/usage";
import { PLAN_LIMITS, effectivePlan } from "@/lib/planLimits";
import { Badge, Card, Hash, PageHeader, Stat, btnPrimary } from "@/components/ui";
import BillingButton from "@/components/BillingButton";

export const dynamic = "force-dynamic";

const TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  CREATED: "blue", INSPECTED: "slate", REPAIRED: "amber", OVERHAULED: "green", INSTALLED: "green",
  REMOVED: "slate", SCRAPPED: "red", SOLD: "blue", TRANSFERRED: "blue",
};
function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const big = limit >= 10_000; // "unlimited" with a fair-use ceiling
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="text-slate-400">{used} / {big ? "fair use" : limit}</span></div>
      {!big && <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full ${color}`} style={{ width: `${pct}%` }} /></div>}
      {!big && pct >= 100 && <p className="mt-1 text-xs text-rose-300">Limit reached. Upgrade to continue.</p>}
      {!big && pct >= 80 && pct < 100 && <p className="mt-1 text-xs text-amber-300">Approaching your monthly limit.</p>}
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
  const [held, issued, checks, usage, flagged, events, attention] = await Promise.all([
    prisma.part.count({ where: { currentOrgId: org.id, scrapped: false } }),
    prisma.partEvent.count({ where: { ...mine, eventType: "CREATED" } }),
    prisma.certificateCheck.count({ where: mine }),
    getUsage(org.id),
    prisma.certificateCheck.count({ where: { ...mine, NOT: { redFlags: "[]" } } }),
    prisma.partEvent.findMany({ where: mine, orderBy: { createdAt: "desc" }, take: 10, include: { part: { select: { partNumber: true, serialNumber: true } } } }),
    prisma.certificateCheck.findMany({ where: { ...mine, NOT: { redFlags: "[]" } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader title={org.name} subtitle="Organization overview" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Parts in your custody" value={held} />
        <Stat label="Passports issued" value={issued} />
        <Stat label="Certificates checked" value={checks} sub={`${usage.checks} this month`} />
        <Stat label="Need attention" value={flagged} sub="checks with findings" tone={flagged ? "amber" : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <h2 className="mb-3 font-medium text-white">Recent activity</h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400">No events yet. Register a part to create your first signed record.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="pb-2 font-medium">Time (UTC)</th><th className="pb-2 font-medium">Event</th><th className="pb-2 font-medium">Part</th><th className="pb-2 font-medium">Record</th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-slate-800">
                    <td className="py-2 pr-3 text-slate-400">{e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td className="py-2 pr-3"><Badge tone={TONE[e.eventType] ?? "slate"}>{label(e.eventType)}</Badge></td>
                    <td className="py-2 pr-3">
                      <Link className="font-mono text-emerald-400 hover:underline" href={`/verify/${encodeURIComponent(e.part.partNumber)}/${encodeURIComponent(e.part.serialNumber)}`}>
                        {e.part.partNumber} / {e.part.serialNumber}
                      </Link>
                    </td>
                    <td className="py-2"><Hash value={e.eventHash} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-medium text-white">Needs attention</h2>
            {attention.length === 0 ? <p className="text-sm text-slate-400">No certificate findings to review.</p> : (
              <ul className="space-y-2 text-sm">
                {attention.map((c) => (
                  <li key={c.id}>
                    <Link href={`/report/${c.id}`} className="text-slate-200 hover:text-emerald-400">{c.fileName}</Link>
                    <span className="ml-2"><Badge tone="amber">{(JSON.parse(c.redFlags) as string[]).length} findings</Badge></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-white">Plan and usage</h2>
              <Badge tone={plan === "PILOT" ? "slate" : "green"}>{limits.name}</Badge>
            </div>
            <Meter label="Certificate checks" used={usage.checks} limit={limits.checks} />
            <Meter label="Part registrations" used={usage.registrations} limit={limits.registrations} />
            <p className="text-xs text-slate-500">Resets on the 1st of each month (UTC).</p>
            {plan === "PILOT" ? <Link href="/checkout?plan=PRO" className={`${btnPrimary} w-full`}>Upgrade plan</Link> : <BillingButton />}
          </Card>
        </div>
      </div>
    </main>
  );
}

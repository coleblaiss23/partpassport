import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/sessionOrg";
import { Badge, Card, Hash, PageHeader, Stat, btnPrimary, btnSecondary } from "@/components/ui";

export const dynamic = "force-dynamic";

const TONE: Record<string, "slate" | "green" | "amber" | "red" | "blue"> = {
  CREATED: "blue", INSPECTED: "slate", REPAIRED: "amber", OVERHAULED: "green", INSTALLED: "green",
  REMOVED: "slate", SCRAPPED: "red", SOLD: "blue", TRANSFERRED: "blue",
};
const label = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export default async function DashboardPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const mine = { organizationId: org.id };

  const [held, issued, checks, monthChecks, flagged, events, attention] = await Promise.all([
    prisma.part.count({ where: { currentOrgId: org.id, scrapped: false } }),
    prisma.partEvent.count({ where: { ...mine, eventType: "CREATED" } }),
    prisma.certificateCheck.count({ where: mine }),
    prisma.certificateCheck.count({ where: { ...mine, createdAt: { gte: monthStart } } }),
    prisma.certificateCheck.count({ where: { ...mine, NOT: { redFlags: "[]" } } }),
    prisma.partEvent.findMany({ where: mine, orderBy: { createdAt: "desc" }, take: 10, include: { part: { select: { partNumber: true, serialNumber: true } } } }),
    prisma.certificateCheck.findMany({ where: { ...mine, NOT: { redFlags: "[]" } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        title={org.name}
        subtitle="Organization overview"
        actions={<>
          <Link href="/dashboard/check" className={btnPrimary}>Scan certificates</Link>
          <Link href="/dashboard/parts/new" className={btnSecondary}>Register part</Link>
          <Link href="/dashboard/events/new" className={btnSecondary}>Issue transfer or event</Link>
        </>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Parts in your custody" value={held} />
        <Stat label="Passports issued" value={issued} />
        <Stat label="Certificates checked" value={checks} sub={`${monthChecks} this month`} />
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
          <Card>
            <h2 className="mb-2 font-medium text-white">Plan and usage</h2>
            <p className="text-sm text-slate-300">Pilot plan (free while in testing)</p>
            <p className="mt-1 text-sm text-slate-400">{monthChecks} certificate checks this month</p>
            <p className="mt-2 text-xs text-slate-500">Billing is not enabled yet.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}

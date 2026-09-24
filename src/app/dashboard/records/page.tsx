import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionOrg } from "@/lib/sessionOrg";
import { Card, PageHeader, btnSecondary } from "@/components/ui";
import { RecordsManager } from "./RecordsManager";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  const org = await getSessionOrg();
  if (!org) redirect("/connect");

  const [checks, parts] = await Promise.all([
    prisma.certificateCheck.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, fileName: true, createdAt: true, redFlags: true },
    }),
    prisma.part.findMany({
      where: { currentOrgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, partNumber: true, serialNumber: true, description: true, scrapped: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <PageHeader
        title="Records"
        subtitle="Delete certificate checks and remove parts from this organization"
        actions={
          <>
            <Link href="/dashboard" className={btnSecondary}>
              Dashboard
            </Link>
            <Link href="/billing" className={btnSecondary}>
              Billing
            </Link>
          </>
        }
      />
      <Card>
        <RecordsManager
          checks={checks.map((c) => ({
            id: c.id,
            fileName: c.fileName,
            createdAt: c.createdAt.toISOString(),
            findings: (() => {
              try {
                return (JSON.parse(c.redFlags) as string[]).length;
              } catch {
                return 0;
              }
            })(),
          }))}
          parts={parts}
        />
      </Card>
    </main>
  );
}

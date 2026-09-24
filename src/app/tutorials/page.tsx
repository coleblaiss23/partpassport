import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge } from "@/components/ui";
import { TutorialGrid } from "@/components/TutorialGrid";
import { categoryLabel } from "@/lib/tutorials";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tutorials | PartPassport" };

export default async function TutorialsPage() {
  let videos: {
    id: string;
    title: string;
    description: string | null;
    embedUrl: string;
    category: string;
    duration: string | null;
  }[] = [];

  try {
    videos = await prisma.tutorialVideo.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        embedUrl: true,
        category: true,
        duration: true,
      },
    });
  } catch (e) {
    console.error("[tutorials]", e);
  }

  const byCat = new Map<string, typeof videos>();
  for (const v of videos) {
    const list = byCat.get(v.category) ?? [];
    list.push(v);
    byCat.set(v.category, list);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <PageHeader
        title="Training resources"
        subtitle="Walkthroughs for MRO receiving inspectors and quality managers — AVL import, 8130-3 intake, and audit package sharing."
      />

      {videos.length === 0 ? (
        <Card className="space-y-3">
          <p className="text-sm text-[#B0B6C3]">
            No published tutorials yet. Administrators can add embed URLs from the Admin console →
            Tutorials tab.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/dashboard/settings/avl" className="text-[#1F6B47] hover:underline">
              AVL settings
            </Link>
            <Link href="/dashboard/check" className="text-[#1F6B47] hover:underline">
              Certificate intake
            </Link>
            <Link href="/dashboard/audit-share" className="text-[#1F6B47] hover:underline">
              Audit share
            </Link>
          </div>
        </Card>
      ) : (
        [...byCat.entries()].map(([cat, list]) => (
          <section key={cat} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-white">{categoryLabel(cat)}</h2>
              <Badge tone="slate">{list.length}</Badge>
            </div>
            <TutorialGrid videos={list} />
          </section>
        ))
      )}
    </main>
  );
}

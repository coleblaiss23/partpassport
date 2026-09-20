import SigningGate from "@/components/SigningGate";
import { PageHeader } from "@/components/ui";
import EventForm from "./EventForm";

export const metadata = { title: "Lifecycle event" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ partId?: string }> }) {
  const { partId } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <PageHeader title="Lifecycle event" subtitle="Inspect, repair, install, sell, transfer or scrap a part you hold." />
      <SigningGate><EventForm partId={partId} /></SigningGate>
    </main>
  );
}

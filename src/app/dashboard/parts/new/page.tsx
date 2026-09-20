import SigningGate from "@/components/SigningGate";
import { PageHeader } from "@/components/ui";
import PartForm from "./PartForm";

export const metadata = { title: "Register a part" };

export default async function NewPartPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <PageHeader title="Register a part" subtitle="Creates the part's passport. Your browser signs the first record." />
      <SigningGate><PartForm initial={{ pn: q.pn, sn: q.sn, desc: q.desc, cert: q.cert }} /></SigningGate>
    </main>
  );
}

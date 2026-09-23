import { getSessionOrg } from "@/lib/sessionOrg";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AvlManager } from "./AvlManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approved Vendor List | PartPassport" };

export default async function AvlSettingsPage() {
  const org = await getSessionOrg();
  if (!org) {
    redirect("/connect");
  }

  const vendors = await prisma.approvedVendor.findMany({
    where: { organizationId: org.id },
    orderBy: [{ isActive: "desc" }, { supplierName: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Approved Vendor List</h1>
        <p className="mt-1 text-sm text-slate-400">
          Maintain the list of suppliers and certificate numbers your organization accepts.
          Certificate scans will automatically flag vendors that are not on this list.
        </p>
      </div>
      <AvlManager initialVendors={vendors} />
    </main>
  );
}

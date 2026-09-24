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
        <p className="mt-1 text-sm text-[#B0B6C3]">
          Add and bulk-import approved repair stations (Vendor Name, Cert Number, Expiration Date,
          Ratings). Certificate intake and verification show a clear AVL PASS / AVL FAIL badge when
          Block 4 is cross-referenced.
        </p>
      </div>
 <AvlManager initialVendors={vendors} />
 </main>
 );
}

"use client";

import { useState, useTransition } from "react";
import { addApprovedVendor, deactivateApprovedVendor } from "@/actions/avl";
import { btnPrimary, Card } from "@/components/ui";

type Vendor = {
  id: string;
  supplierName: string;
  certificateNumber: string;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
};

export function AvlManager({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState(initialVendors);
  const [supplierName, setSupplierName] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await addApprovedVendor({
        supplierName,
        certificateNumber,
        notes: notes || undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to add vendor");
        return;
      }

      setSuccess("Vendor added to AVL");
      setSupplierName("");
      setCertificateNumber("");
      setNotes("");

      setVendors((prev) => [
        {
          id: crypto.randomUUID(),
          supplierName: supplierName.trim(),
          certificateNumber: certificateNumber.trim(),
          isActive: true,
          notes: notes.trim() || null,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    });
  }

  function handleDeactivate(id: string) {
    if (!confirm("Deactivate this vendor? Future certificate scans will flag them as not on the AVL.")) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateApprovedVendor(id);
      if (!result.success) {
        setError(result.error ?? "Failed to deactivate");
        return;
      }

      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: false } : v))
      );
      setSuccess("Vendor deactivated");
    });
  }

  const active = vendors.filter((v) => v.isActive);
  const inactive = vendors.filter((v) => !v.isActive);

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <h2 className="text-lg font-medium text-white">Add approved vendor</h2>
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Supplier name</label>
            <input
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none"
              placeholder="e.g. Precision Aviation Services"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Certificate / approval number</label>
            <input
              required
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none"
              placeholder="e.g. 7AXX123R or EASA.145.XXXX"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none"
              placeholder="Internal notes…"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={isPending} className={btnPrimary}>
              {isPending ? "Adding…" : "Add to AVL"}
            </button>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">
          Active vendors <span className="text-slate-500">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-400">No active vendors yet. Add your first approved supplier above.</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl borderder-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Certificate #</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {active.map((v) => (
                  <tr key={v.id} className="bg-slate-950/50">
                    <td className="px-4 py-3 font-medium text-slate-100">{v.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{v.certificateNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{v.notes || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"                       onClick={() => handleDeactivate(v.id)}
                        disabled={isPending}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-400">
            Inactive <span className="text-slate-600">({inactive.length})</span>
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800/60">
            <table className="w-full text-sm opacity-60">
              <tbody className="divide-y divide-slate-800">
                {inactive.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2.5 text-slate-400">{v.supplierName}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{v.certificateNumber}</td>
                    <td className="px-4 py-2.5 text-slate-600">Inactive</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

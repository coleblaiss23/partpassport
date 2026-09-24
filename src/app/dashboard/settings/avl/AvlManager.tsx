"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addApprovedVendor,
  bulkImportApprovedVendors,
  deactivateApprovedVendor,
} from "@/actions/avl";
import { btnPrimary, btnSecondary, Card, inputCls } from "@/components/ui";
import { parseCsv } from "@/lib/csv";

type Vendor = {
  id: string;
  supplierName: string;
  certificateNumber: string;
  expiresAt: Date | string | null;
  ratings: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date | string;
};

const SAMPLE_CSV = `Vendor Name,Cert Number,Expiration Date,Ratings
Precision Aviation Services,7AXX123R,2027-06-30,"Limited Airframe, Instruments"
Apex Aero Repair,EASA.145.XXXX,2026-12-15,Powerplant
`;

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return x.toISOString().slice(0, 10);
}

function expired(d: Date | string | null | undefined) {
  if (!d) return false;
  const x = typeof d === "string" ? new Date(d) : d;
  return x.getTime() < Date.now();
}

export function AvlManager({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState(initialVendors);
  const [supplierName, setSupplierName] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [ratings, setRatings] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importPreview, setImportPreview] = useState<
    { supplierName: string; certificateNumber: string; expiresAt?: string; ratings?: string }[] | null
  >(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await addApprovedVendor({
        supplierName,
        certificateNumber,
        expiresAt: expiresAt || undefined,
        ratings: ratings || undefined,
        notes: notes || undefined,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to add vendor");
        return;
      }

      setSuccess("Vendor added to AVL");
      setSupplierName("");
      setCertificateNumber("");
      setExpiresAt("");
      setRatings("");
      setNotes("");

      setVendors((prev) => [
        {
          id: crypto.randomUUID(),
          supplierName: supplierName.trim(),
          certificateNumber: certificateNumber.trim(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          ratings: ratings.trim() || null,
          isActive: true,
          notes: notes.trim() || null,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    });
  }

  function handleDeactivate(id: string) {
    if (
      !confirm(
        "Deactivate this vendor? Future certificate scans will flag them as not on the AVL."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateApprovedVendor(id);
      if (!result.success) {
        setError(result.error ?? "Failed to deactivate");
        return;
      }
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, isActive: false } : v)));
      setSuccess("Vendor deactivated");
    });
  }

  function onCsvFile(file: File) {
    setImportMsg(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const rows = parseCsv(text);
        if (rows.length < 2) throw new Error("CSV needs a header row and at least one vendor");
        const [head, ...body] = rows;
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const idx = {
          name: head.findIndex((h) =>
            ["vendorname", "suppliername", "supplier", "name", "vendor"].includes(norm(h))
          ),
          cert: head.findIndex((h) =>
            [
              "certnumber",
              "certificatenumber",
              "approvalnumber",
              "cert",
              "certificate",
              "approval",
            ].includes(norm(h))
          ),
          exp: head.findIndex((h) =>
            ["expirationdate", "expiresat", "expiry", "expires", "expiration"].includes(norm(h))
          ),
          ratings: head.findIndex((h) =>
            ["ratings", "rating", "capabilities", "limitedratings"].includes(norm(h))
          ),
        };
        if (idx.name < 0 || idx.cert < 0) {
          throw new Error(
            "Map columns: Vendor Name and Cert Number required (Expiration Date, Ratings optional)"
          );
        }
        const mapped = body
          .map((r) => ({
            supplierName: (r[idx.name] ?? "").trim(),
            certificateNumber: (r[idx.cert] ?? "").trim(),
            expiresAt: idx.exp >= 0 ? (r[idx.exp] ?? "").trim() || undefined : undefined,
            ratings: idx.ratings >= 0 ? (r[idx.ratings] ?? "").trim() || undefined : undefined,
          }))
          .filter((r) => r.supplierName && r.certificateNumber);
        if (!mapped.length) throw new Error("No valid vendor rows found");
        setImportPreview(mapped);
      } catch (err) {
        setImportPreview(null);
        setError((err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  function commitImport() {
    if (!importPreview?.length) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkImportApprovedVendors(importPreview);
      if (!result.success) {
        setError(result.error ?? "Import failed");
        return;
      }
      setImportMsg(
        `Imported ${result.created ?? 0} new, updated ${result.updated ?? 0}, skipped ${result.skipped ?? 0}.`
      );
      setImportPreview(null);
      // Refresh list from server-shaped optimistic rows
      setVendors((prev) => {
        const next = [...prev];
        for (const row of importPreview) {
          const i = next.findIndex(
            (v) =>
              v.supplierName.toLowerCase() === row.supplierName.toLowerCase() &&
              v.certificateNumber.toLowerCase() === row.certificateNumber.toLowerCase()
          );
          const entry: Vendor = {
            id: i >= 0 ? next[i].id : crypto.randomUUID(),
            supplierName: row.supplierName,
            certificateNumber: row.certificateNumber,
            expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
            ratings: row.ratings ?? null,
            isActive: true,
            notes: i >= 0 ? next[i].notes : null,
            createdAt: i >= 0 ? next[i].createdAt : new Date(),
          };
          if (i >= 0) next[i] = entry;
          else next.unshift(entry);
        }
        return next;
      });
    });
  }

  const active = useMemo(() => vendors.filter((v) => v.isActive), [vendors]);
  const inactive = useMemo(() => vendors.filter((v) => !v.isActive), [vendors]);

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <h2 className="text-lg font-medium text-white">Add approved repair station</h2>
        <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B6C3]">Vendor name</label>
            <input
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Precision Aviation Services"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B6C3]">Cert number</label>
            <input
              required
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className={inputCls}
              placeholder="e.g. 7AXX123R or EASA.145.XXXX"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B6C3]">Expiration date</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#B0B6C3]">Ratings</label>
            <input
              value={ratings}
              onChange={(e) => setRatings(e.target.value)}
              className={inputCls}
              placeholder="e.g. Limited Airframe, Instruments"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-[#B0B6C3]">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputCls}
              placeholder="Internal notes…"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={isPending} className={btnPrimary}>
              {isPending ? "Adding…" : "Add to AVL"}
            </button>
            {error && <p className="text-sm text-[#FFE4E6]">{error}</p>}
            {success && <p className="text-sm text-[#1F6B47]">{success}</p>}
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-white">Bulk import (CSV / Excel export)</h2>
            <p className="mt-1 text-sm text-[#B0B6C3]">
              Map columns: Vendor Name, Cert Number, Expiration Date, Ratings. Save Excel as CSV
              before upload.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
            download="avl-template.csv"
            className={btnSecondary}
          >
            Download template
          </a>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-[#1F2430] p-6 text-center hover:border-[#B0B6C3]">
          <span className="text-sm font-medium text-white">Drop CSV or click to browse</span>
          <span className="text-xs text-[#7C8495]">.csv from Excel / Google Sheets</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onCsvFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {importPreview && (
          <div className="space-y-3">
            <p className="text-sm text-[#B0B6C3]">
              Preview: <span className="text-white">{importPreview.length}</span> vendors ready to
              import
            </p>
            <div className="max-h-48 overflow-auto border border-[#1F2430]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#12151C] text-[#7C8495]">
                  <tr>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Cert</th>
                    <th className="px-3 py-2">Expires</th>
                    <th className="px-3 py-2">Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 50).map((r, i) => (
                    <tr key={`${r.certificateNumber}-${i}`} className="border-t border-[#1F2430]">
                      <td className="px-3 py-1.5 text-white">{r.supplierName}</td>
                      <td className="pp-track px-3 py-1.5 text-[#B0B6C3]">{r.certificateNumber}</td>
                      <td className="px-3 py-1.5 text-[#B0B6C3]">{r.expiresAt ?? "—"}</td>
                      <td className="px-3 py-1.5 text-[#B0B6C3]">{r.ratings ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={isPending} onClick={commitImport} className={btnPrimary}>
                {isPending ? "Importing…" : `Import ${importPreview.length} vendors`}
              </button>
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setImportPreview(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {importMsg && <p className="text-sm text-[#1F6B47]">{importMsg}</p>}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">
          Active vendors <span className="text-[#7C8495]">({active.length})</span>
        </h2>
        {active.length === 0 ? (
          <Card>
            <p className="text-sm text-[#B0B6C3]">
              No active vendors yet. Add or bulk-import approved repair stations above.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[4px] border border-[#1F2430]">
            <table className="w-full text-sm">
              <thead className="bg-[#12151C] text-left text-xs uppercase tracking-wider text-[#7C8495]">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Cert #</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Ratings</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {active.map((v) => (
                  <tr key={v.id} className="bg-[#0B0F14]">
                    <td className="px-4 py-3 font-medium text-white">{v.supplierName}</td>
                    <td className="pp-track px-4 py-3 text-[#B0B6C3]">{v.certificateNumber}</td>
                    <td
                      className={`px-4 py-3 ${
                        expired(v.expiresAt) ? "text-[#FFE4E6]" : "text-[#B0B6C3]"
                      }`}
                    >
                      {fmtDate(v.expiresAt)}
                      {expired(v.expiresAt) ? " · expired" : ""}
                    </td>
                    <td className="px-4 py-3 text-[#B0B6C3]">{v.ratings || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeactivate(v.id)}
                        disabled={isPending}
                        className="text-xs text-[#FFE4E6] hover:underline"
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
          <h2 className="text-lg font-medium text-[#B0B6C3]">
            Inactive <span className="text-[#7C8495]">({inactive.length})</span>
          </h2>
          <div className="overflow-hidden rounded-[4px] border border-[#1F2430]">
            <table className="w-full text-sm opacity-60">
              <tbody className="divide-y divide-[#1F2430]">
                {inactive.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2.5 text-[#B0B6C3]">{v.supplierName}</td>
                    <td className="pp-track px-4 py-2.5 text-[#7C8495]">{v.certificateNumber}</td>
                    <td className="px-4 py-2.5 text-[#7C8495]">Inactive</td>
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

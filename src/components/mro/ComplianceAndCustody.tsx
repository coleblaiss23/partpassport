"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge, Card, PageHeader, btnPrimary, inputCls } from "@/components/ui";

export type CustodyPart = {
  id: string;
  partNumber: string;
  serialNumber: string;
  description: string | null;
  custodyStatus: string;
  isLifeLimited: boolean;
};

const SHELVES = [
  { id: "QUARANTINE", label: "Quarantine", tone: "amber" as const },
  { id: "SERVICEABLE", label: "Serviceable shelf", tone: "green" as const },
  { id: "UNSERVICEABLE", label: "Unserviceable", tone: "red" as const },
];

export function CustodyBoard({ initial }: { initial: CustodyPart[] }) {
  const [parts, setParts] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function setStatus(id: string, custodyStatus: string) {
    setErr("");
    start(async () => {
      const r = await fetch(`/api/parts/${id}/custody`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custodyStatus }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Could not update custody");
        return;
      }
      setParts((all) => all.map((p) => (p.id === id ? { ...p, custodyStatus } : p)));
    });
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        title="Inventory custody"
        subtitle="Assign incoming parts to Quarantine or Serviceable shelf after inspection."
      />
      {err && <p className="text-sm text-[#FFE4E6]">{err}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {SHELVES.map((shelf) => {
          const list = parts.filter((p) => p.custodyStatus === shelf.id);
          return (
            <Card key={shelf.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-white">{shelf.label}</h2>
                <Badge tone={shelf.tone}>{list.length}</Badge>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-[#7C8495]">Empty</p>
              ) : (
                <ul className="space-y-2">
                  {list.map((p) => (
                    <li key={p.id} className="border border-[#1F2430] bg-[#0B0F14] p-3">
                      <Link
                        href={`/verify/${encodeURIComponent(p.partNumber)}/${encodeURIComponent(p.serialNumber)}`}
                        className="pp-track text-sm text-white hover:underline"
                      >
                        {p.partNumber} / {p.serialNumber}
                      </Link>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-[#7C8495]">{p.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {SHELVES.filter((s) => s.id !== p.custodyStatus).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            disabled={pending}
                            onClick={() => setStatus(p.id, s.id)}
                            className="rounded-[4px] border border-[#222A3B] px-2 py-0.5 text-[10px] text-[#B0B6C3] hover:border-[#B0B6C3] hover:text-white"
                          >
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}

export function ComplianceManager({
  initial,
  vendorExpiring,
}: {
  initial: {
    id: string;
    category: string;
    name: string;
    reference: string | null;
    expiresAt: string;
    notes: string | null;
  }[];
  vendorExpiring: { supplierName: string; certificateNumber: string; expiresAt: string }[];
}) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    category: "TOOL_CALIBRATION",
    name: "",
    reference: "",
    expiresAt: "",
    notes: "",
  });
  const [err, setErr] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    start(async () => {
      const r = await fetch("/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Failed to add");
        return;
      }
      setItems((all) => [j.item, ...all]);
      setForm({ category: "TOOL_CALIBRATION", name: "", reference: "", expiresAt: "", notes: "" });
    });
  }

  const now = Date.now();
  const soon = now + 30 * 24 * 60 * 60 * 1000;

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <PageHeader
        title="Compliance alerts"
        subtitle="Track shop tool calibrations, vendor cert expirations, and inspection authorizations."
      />

      {vendorExpiring.length > 0 && (
        <Card className="border-[#B45309] bg-[#1C1408]">
          <h2 className="text-sm font-semibold text-white">AVL vendor certs expiring (30 days)</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#FFEDD5]">
            {vendorExpiring.map((v) => (
              <li key={`${v.supplierName}-${v.certificateNumber}`}>
                {v.supplierName} · <span className="pp-track">{v.certificateNumber}</span> ·{" "}
                {v.expiresAt.slice(0, 10)}
              </li>
            ))}
          </ul>
          <Link href="/dashboard/settings/avl" className="mt-2 inline-block text-xs text-white hover:underline">
            Manage AVL →
          </Link>
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="font-medium text-white">Add expiration tracker</h2>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[#B0B6C3]">
            Category
            <select
              className={`${inputCls} mt-1`}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="TOOL_CALIBRATION">Shop tool calibration</option>
              <option value="VENDOR_CERT">Vendor certificate</option>
              <option value="INSPECTION_AUTH">Inspection authorization</option>
            </select>
          </label>
          <label className="text-xs text-[#B0B6C3]">
            Name
            <input
              required
              className={`${inputCls} mt-1`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Torque wrench TW-12"
            />
          </label>
          <label className="text-xs text-[#B0B6C3]">
            Reference
            <input
              className={`${inputCls} mt-1`}
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Asset # / cert #"
            />
          </label>
          <label className="text-xs text-[#B0B6C3]">
            Expires
            <input
              required
              type="date"
              className={`${inputCls} mt-1`}
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Saving…" : "Add alert"}
            </button>
            {err && <p className="text-sm text-[#FFE4E6]">{err}</p>}
          </div>
        </form>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Upcoming expirations</h2>
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-[#B0B6C3]">No trackers yet.</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[4px] border border-[#1F2430]">
            <table className="w-full text-sm">
              <thead className="bg-[#12151C] text-left text-xs uppercase tracking-wider text-[#7C8495]">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {items.map((it) => {
                  const t = new Date(it.expiresAt).getTime();
                  const state =
                    t < now ? "Expired" : t < soon ? "Due soon" : "Current";
                  const tone =
                    state === "Expired" ? "red" : state === "Due soon" ? "amber" : "green";
                  return (
                    <tr key={it.id} className="bg-[#0B0F14]">
                      <td className="px-4 py-3 text-white">
                        {it.name}
                        {it.reference ? (
                          <span className="pp-track ml-2 text-xs text-[#7C8495]">{it.reference}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[#B0B6C3]">{it.category.replace(/_/g, " ")}</td>
                      <td className="pp-track px-4 py-3 text-[#B0B6C3]">
                        {it.expiresAt.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={tone}>{state}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

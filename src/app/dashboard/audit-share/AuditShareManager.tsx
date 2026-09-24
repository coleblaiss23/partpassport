"use client";

import { useState, useTransition } from "react";
import { Badge, Card, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

type ShareRow = {
  id: string;
  label: string | null;
  packageType: string;
  resourceId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  url?: string;
};

export function AuditShareManager({
  initial,
  checks,
  parts,
}: {
  initial: ShareRow[];
  checks: { id: string; fileName: string; createdAt: string }[];
  parts: { id: string; partNumber: string; serialNumber: string }[];
}) {
  const [shares, setShares] = useState(initial);
  const [pending, start] = useTransition();
  const [packageType, setPackageType] = useState<"CERT_CHECK" | "PART_PASSPORT">("CERT_CHECK");
  const [resourceId, setResourceId] = useState("");
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("72");
  const [err, setErr] = useState("");
  const [freshUrl, setFreshUrl] = useState<string | null>(null);

  function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setFreshUrl(null);
    start(async () => {
      const r = await fetch("/api/audit-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType,
          resourceId,
          label: label || undefined,
          expiresInHours: Number(hours) || 72,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(j.error ?? "Failed to create share link");
        return;
      }
      setFreshUrl(j.url);
      setShares((all) => [j.share, ...all]);
      setLabel("");
    });
  }

  function revoke(id: string) {
    start(async () => {
      const r = await fetch(`/api/audit-share/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error ?? "Revoke failed");
        return;
      }
      setShares((all) =>
        all.map((s) => (s.id === id ? { ...s, revokedAt: new Date().toISOString() } : s))
      );
    });
  }

  const options =
    packageType === "CERT_CHECK"
      ? checks.map((c) => ({ value: c.id, label: `${c.fileName} · ${c.createdAt.slice(0, 10)}` }))
      : parts.map((p) => ({
          value: p.id,
          label: `${p.partNumber} / ${p.serialNumber}`,
        }));

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <PageHeader
        title="Audit package sharing"
        subtitle="Generate a temporary encrypted link for FAA auditors or airline customers. Read-only."
      />

      <Card className="space-y-4">
        <h2 className="font-medium text-white">Create secure share link</h2>
        <form onSubmit={create} className="space-y-3">
          <label className="block text-xs text-[#B0B6C3]">
            Package type
            <select
              className={`${inputCls} mt-1`}
              value={packageType}
              onChange={(e) => {
                setPackageType(e.target.value as "CERT_CHECK" | "PART_PASSPORT");
                setResourceId("");
              }}
            >
              <option value="CERT_CHECK">Certificate audit report</option>
              <option value="PART_PASSPORT">Part passport (chain)</option>
            </select>
          </label>
          <label className="block text-xs text-[#B0B6C3]">
            Resource
            <select
              required
              className={`${inputCls} mt-1`}
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            >
              <option value="">Select…</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-[#B0B6C3]">
              Label (optional)
              <input
                className={`${inputCls} mt-1`}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Airline QA review"
              />
            </label>
            <label className="block text-xs text-[#B0B6C3]">
              Expires in (hours)
              <input
                className={`${inputCls} mt-1`}
                type="number"
                min={1}
                max={720}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </label>
          </div>
          <button type="submit" disabled={pending || !resourceId} className={btnPrimary}>
            {pending ? "Encrypting…" : "Generate encrypted link"}
          </button>
          {err && <p className="text-sm text-[#FFE4E6]">{err}</p>}
        </form>

        {freshUrl && (
          <div className="border border-[#1F6B47] bg-[#14281F] p-3">
            <p className="text-xs text-[#B0B6C3]">
              Copy this link now — the full token is shown once.
            </p>
            <p className="pp-track mt-2 break-all text-sm text-white">{freshUrl}</p>
            <button
              type="button"
              className={`${btnSecondary} mt-2`}
              onClick={() => navigator.clipboard.writeText(freshUrl)}
            >
              Copy to clipboard
            </button>
          </div>
        )}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-white">Active &amp; recent shares</h2>
        {shares.length === 0 ? (
          <Card>
            <p className="text-sm text-[#B0B6C3]">No share links yet.</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-[4px] border border-[#1F2430]">
            <table className="w-full text-sm">
              <thead className="bg-[#12151C] text-left text-xs uppercase tracking-wider text-[#7C8495]">
                <tr>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2430]">
                {shares.map((s) => {
                  const expired = new Date(s.expiresAt).getTime() < Date.now();
                  const revoked = !!s.revokedAt;
                  return (
                    <tr key={s.id} className="bg-[#0B0F14]">
                      <td className="px-4 py-3 text-white">{s.label || "—"}</td>
                      <td className="px-4 py-3 text-[#B0B6C3]">{s.packageType}</td>
                      <td className="pp-track px-4 py-3 text-[#B0B6C3]">
                        {s.expiresAt.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="px-4 py-3">
                        {revoked ? (
                          <Badge tone="slate">Revoked</Badge>
                        ) : expired ? (
                          <Badge tone="amber">Expired</Badge>
                        ) : (
                          <Badge tone="green">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!revoked && !expired && (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => revoke(s.id)}
                            className="text-xs text-[#FFE4E6] hover:underline"
                          >
                            Revoke
                          </button>
                        )}
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

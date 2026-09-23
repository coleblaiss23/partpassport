"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Badge, Card, PageHeader, btnPrimary, btnSecondary } from "@/components/ui";
import { AvlWarningBadge } from "@/components/certificates/AvlWarningBadge";
import { runAvlCheck } from "@/actions/avl";
import type { AvlCheckResult } from "@/lib/avl";

type Result = {
  id: string;
  mode: string;
  certificateHash: string;
  extracted: Record<string, unknown>;
  redFlags: string[];
};

type Item = {
  id: string;
  file: File;
  url: string;
  status: "queued" | "running" | "done" | "error";
  result?: Result;
  error?: string;
  avl?: AvlCheckResult | null;
};

const FIELDS: [string, string][] = [
  ["partNumber", "Part number"],
  ["serial", "Serial"],
  ["description", "Description"],
  ["status", "Status / work"],
  ["approvalNumber", "Approval no."],
  ["date", "Date"],
  ["hasSignature", "Signature present"],
  ["remarks", "Remarks"],
];

const show = (v: unknown) =>
  v == null || v === "" ? "not found" : v === true ? "Yes" : v === false ? "No" : String(v);

const tone = (i: Item) =>
  i.status === "error"
    ? "red"
    : i.status === "done"
      ? i.result?.redFlags.length
        ? "amber"
        : "green"
      : "slate";

const text = (i: Item) =>
  i.status === "done"
    ? i.result?.redFlags.length
      ? `${i.result.redFlags.length} findings`
      : "Clear"
    : i.status === "error"
      ? "Error"
      : i.status === "running"
        ? "Analyzing…"
        : "Queued";

export default function ScannerPage() {
  const v = useVault();
  const [items, setItems] = useState<Item[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [ai, setAi] = useState<{ mode: string; message: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<Item[]>([]);

  useEffect(() => {
    ref.current = items;
  }, tems]);

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then(setAi)
      .catch(() => {});
  }, []);

  useEffect(() => () => ref.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const patch = (id: string, p: Partial<Item>) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));

  async function analyze(it: Item) {
    patch(it.id, { status: "running", avl: null });
    try {
      const fd = new FormData();
      fd.append("file", it.file);
      const r = await fetch("/api/certificates/analyze", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Analysis failed");

      let avlResult: AvlCheckResult | null = null;
      const issuing =
        (j.extracted?.issuingOrganization as string) ||
        (j.extracted?.organization as string) ||
        (j.extracted?.approvalHolder as string) ||
        "";
      const approval = (j.extracted?.approvalNumber as string) || "";

      if (issuing && approval) {
        try {
          avlResult = await runAvlCheck({
            issuingOrganization: issuing,
            approvalNumber: approval,
          });
        } catch {
          avlResult = null;
        }
      }

      patch(it.id, { status: "done", result: j, avl: avlResult });
    } catch (e) {
      patch(it.id, { status: "error", error: (e as Error).message });
    }
  }

  async function addFiles(list: FileList | File[]) {
    const pdfs = Array.from(list)
      .filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      .slice(0, 20);

    const fresh: Item[] = pdfs.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      status: "queued",
    }));

    if (!fresh.length) return;
    setItems((p) => [...p, ...fresh]);
    setSel((s) => s ?? fresh[0].id);

    for (const it of fresh) await analyze(it);
  }

  const cur = items.find((i) => i.id === sel);

  const banner = ai && (
    <div
      className={`rounded-md border p-3 text-sm ${
        ai.mode === "anthropic"
          ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
          : ai.mode === "mock"
            ? "border-amber-800 bg-amber-950/40 text-amber-300"
            : "border-rose-800 bg-rose-950/40 text-rose-300"
      }`}
    >
      {ai.message}
    </div>
  );

  if (v.ready && !v.org)
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <PageHeader title="Certificate scanner" />
        <Card className="space-y-3">
          <p className="text-slate-300">Connect your organization to scan certificates.</p>
          <Link href="/connect" className={btnPrimary}>
            Connect organization
          </Link>
        </Card>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <PageHeader
        title="Certificate scanner"
        subtitle="Drop one or more 8130-3 / EASA Form 1 PDFs. Review the document beside the findings."
      />

      {banner}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-8 text-center transition ${
              drag ? "border-emerald-500 bg-emerald-950/20" : "border-slate-700 hover:border-slate-500"
            }`}
          >
            <span className="font-medium text-white">Drop PDFs here or click to browse</span>
            <span className="text-xs text-slate-500">Up to 20 files, 10 MB each</span>
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {items.length > 0 && (
            <Card className="space-y-1 p-2">
              {items.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSel(i.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${
                    i.id === sel ? "bg-slate-800" : "hover:bg-slate-900"
                  }`}
                >
                  <span className="truncate text-slate-200">{i.file.name}</span>
                  <Badge tone={tone(i)}>{text(i)}</Badge>
                </button>
              ))}
            </Card>
          )}

          {cur && (
            <iframe
              title="Certificate preview"
              src={cur.url}
              className="h-[65vh] w-full rounded-xl border border-slate-800 bg-white"
            />
          )}
        </div>

        <div className="space-y-4">
          {!cur && (
            <Card>
              <p className="text-sm text-slate-400">Results will appear here.</p>
            </Card>
          )}

          {cur?.status === "running" && (
            <Card>
              <p className="text-sm text-slate-300">Analyzing {cur.file.name}…</p>
            </Card>
          )}

          {cur?.status === "error" && (
            <p className="rounded-md border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-300">
              Error: {cur.error}
            </p>
          )}

          {cur?.result &&
            (() => {
              const r = cur.result;
              const reg = `/dashboard/parts/new?${new URLSearchParams({
                pn: String(r.extracted.partNumber ?? ""),
                sn: String(r.extracted.serial ?? ""),
                desc: String(r.extracted.description ?? ""),
                cert: r.certificateHash,
            })}`;

              return (
                <>
                  {r.mode === "mock" && (
                    <p className="text-xs text-amber-400">
                      Mock result: canned sample data, not a real analysis.
                    </p>
                  )}

                  {cur.avl && (
                    <AvlWarningBadge
                      isOnAvl={cur.avl.isOnAvl}
                      warning={cur.avl.warning}
                      matchedSupplierName={cur.avl.matchedSupplierName}
                    />
                  )}

                  <section
                    className={`rounded-xl border p-4 ${
                      r.redFlags.length
                        ? "border-amber-700 bg-amber-950/30"
                        : "border-emerald-800 bg-emerald-950/30"
                    }`}
                  >
                    <h2 className="font-medium text-white">
                      {r.redFlags.length
                        ? `Review recommended: ${r.redFlags.length} finding${
                            r.redFlags.length > 1 ? "s" : ""
                          }`
                        : "No issues detected in the document"}
                    </h2>
                    {r.redFlags.length > 0 && (
                      <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-slate-300">
                        {r.redFlags.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <Card className="p-0">
                    <table className="w-full text-sm">
                      <tbody>
                        {FIELDS.map(([k, l]) => (
                          <tr key={k} className="border-b border-slate-800 last:border-0">
                            <td className="w-40 p-3 text-slate-400">{l}</td>
                            <td
                              className={`p-3 ${
                                r.extracted[k] == null || r.extracted[k] === ""
                                  ? "text-rose-400"
                                  : "text-slate-100"
                              }`}
                            >
                              {show(r.extracted[k])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>

                  <p className="break-all text-xs text-slate-500">
                    File SHA-256: <span className="font-mono">{r.certificateHash}</span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/report/${r.id}`} className={btnPrimary}>
                      Open shareable report
                    </Link>
                    <Link href={reg} className={btnSecondary}>
                      Register this part
                    </Link>
                  </div>

                  <p className="text-xs text-slate-500">
                    Automated records review only. This is not an airworthiness determination.
                  </p>
                </>
              );
            })()}
        </div>
      </div>
    </main>
  );
}

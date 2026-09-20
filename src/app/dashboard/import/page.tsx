"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import SigningGate from "@/components/SigningGate";
import { useVault } from "@/components/VaultProvider";
import { Card, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { parseCsv, rowsToParts } from "@/lib/csv";

const CHUNK = 100, MAX_ROWS = 50_000;
type Row = { partNumber: string; serialNumber: string; description: string; certificateHash: string };
type Fail = { row: number; partNumber: string; serialNumber: string; error: string };
const TEMPLATE = "partNumber,serialNumber,description,certificateHash\nDEMO-100,SN-0001,Fuel pump,\nDEMO-100,SN-0002,Fuel pump,\n";

function Importer() {
  const { sign } = useVault();
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);
  const [p, setP] = useState({ done: 0, created: 0, skipped: 0, failed: 0 });
  const [fails, setFails] = useState<Fail[]>([]);
  const stop = useRef(false);

  async function onFile(f: File | undefined) {
    setErr(""); setRows([]); setFails([]); setP({ done: 0, created: 0, skipped: 0, failed: 0 });
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) return setErr("File is over 25 MB. Split it into smaller files.");
    try {
      const parsed = rowsToParts(parseCsv(await f.text()));
      if (!parsed.length) return setErr("No data rows found");
      if (parsed.length > MAX_ROWS) return setErr(`Too many rows (${parsed.length.toLocaleString()}). Import ${MAX_ROWS.toLocaleString()} at a time.`);
      setRows(parsed); setName(f.name);
    } catch (e) { setErr((e as Error).message); }
  }

  async function run() {
    stop.current = false; setRunning(true); setErr(""); setFails([]);
    let acc = { done: 0, created: 0, skipped: 0, failed: 0 };
    const bad: Fail[] = [];
    try {
      for (let i = 0; i < rows.length && !stop.current; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const pr = await fetch("/api/parts/batch/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: chunk }) });
        const pj = await pr.json();
        if (!pr.ok) throw new Error(pj.error ?? "Prepare failed");
        const toCommit: { draft: unknown; signature: string; idx: number }[] = [];
        for (const [k, res] of (pj.results as { ok: boolean; draft?: any; error?: string }[]).entries()) {
          if (res.ok && res.draft) toCommit.push({ draft: res.draft, signature: await sign({ partId: res.draft.partId, eventHash: res.draft.eventHash, timestamp: res.draft.timestamp }), idx: k });
          else record(res.error ?? "Rejected", k);
        }
        if (toCommit.length) {
          const cr = await fetch("/api/parts/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: toCommit.map(({ draft, signature }) => ({ draft, signature })) }) });
          const cj = await cr.json();
          if (!cr.ok) throw new Error(cj.error ?? "Commit failed");
          (cj.results as { ok: boolean; error?: string }[]).forEach((res, n) => { if (res.ok) acc.created++; else record(res.error ?? "Rejected", toCommit[n].idx); });
        }
        acc = { ...acc, done: Math.min(i + CHUNK, rows.length) };
        setP(acc); setFails([...bad]);

        function record(error: string, k: number) {
          const r = chunk[k];
          if (error === "Part already exists") acc.skipped++; else acc.failed++;
          bad.push({ row: i + k + 2, partNumber: r.partNumber, serialNumber: r.serialNumber, error });
        }
      }
    } catch (e) { setErr(`${(e as Error).message}. You can run the same file again: parts already imported are skipped.`); }
    setRunning(false);
  }

  function download(text: string, file: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = file; a.click(); URL.revokeObjectURL(a.href);
  }
  const pct = rows.length ? Math.round((p.done / rows.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-300">Upload a CSV with <span className="font-mono">partNumber</span> and <span className="font-mono">serialNumber</span> columns (description and certificateHash optional). Each row becomes a signed passport.</p>
          <button className={btnSecondary} onClick={() => download(TEMPLATE, "part-passport-template.csv")}>Download template</button>
        </div>
        <input type="file" accept=".csv,text/csv" className={inputCls} disabled={running} onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="rounded-md border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-300">{err}</p>}
        {rows.length > 0 && (
          <>
            <p className="text-sm text-slate-300"><span className="font-medium text-white">{rows.length.toLocaleString()}</span> rows ready from {name}. First rows: {rows.slice(0, 3).map((r) => `${r.partNumber}/${r.serialNumber}`).join(", ")}</p>
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={running} onClick={run}>{running ? "Importing…" : "Sign and import"}</button>
              {running && <button className={btnSecondary} onClick={() => { stop.current = true; }}>Stop after this batch</button>}
            </div>
          </>
        )}
      </Card>
      {(running || p.done > 0) && (
        <Card className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="text-sm text-slate-300">{p.done.toLocaleString()} of {rows.length.toLocaleString()} processed: <span className="text-emerald-300">{p.created.toLocaleString()} created</span>, {p.skipped.toLocaleString()} already existed, <span className={p.failed ? "text-rose-300" : ""}>{p.failed.toLocaleString()} failed</span></p>
          {fails.length > 0 && <button className={btnSecondary} onClick={() => download("row,partNumber,serialNumber,error\n" + fails.map((f) => [f.row, f.partNumber, f.serialNumber, f.error].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n"), "import-errors.csv")}>Download error report ({fails.length})</button>}
        </Card>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader title="Bulk import" subtitle="Register thousands of parts at once. Signing happens in your browser." actions={<Link href="/dashboard" className={btnSecondary}>Back</Link>} />
      <SigningGate><Importer /></SigningGate>
    </main>
  );
}

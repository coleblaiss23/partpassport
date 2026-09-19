"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Field, inputClass } from "../ui";

type Result = { id: string; mode: string; certificateHash: string; extracted: Record<string, unknown>; redFlags: string[] };
const FIELDS: [string, string][] = [
  ["partNumber", "Part number"], ["serial", "Serial"], ["description", "Description"], ["status", "Status / work"],
  ["approvalNumber", "Approval no."], ["date", "Date"], ["hasSignature", "Signature present"], ["remarks", "Remarks"],
];
const show = (v: unknown) => (v == null || v === "" ? "not found" : v === true ? "Yes" : v === false ? "No" : String(v));

export default function CheckPage() {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [ai, setAi] = useState<{ mode: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetch("/api/ai-status").then((r) => r.json()).then(setAi).catch(() => {}); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true); setError(""); setRes(null); setCopied(false);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/certificates/analyze", { method: "POST", headers: { Authorization: `Bearer ${apiKey.trim()}` }, body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Analysis failed");
      setRes(j);
    } catch (err) { setError((err as Error).message); }
    setBusy(false);
  }

  const banner = ai && (
    <div className={`rounded border p-3 text-xs font-mono ${ai.mode === "anthropic" ? "border-emerald-700 bg-emerald-950/30 text-emerald-300" : ai.mode === "mock" ? "border-amber-600 bg-amber-950/40 text-amber-300" : "border-rose-700 bg-rose-950/40 text-rose-300"}`}>
      {ai.message}
    </div>
  );
  const registerHref = res
    ? `/dashboard/parts/new?${new URLSearchParams({ pn: String(res.extracted.partNumber ?? ""), sn: String(res.extracted.serial ?? ""), desc: String(res.extracted.description ?? ""), cert: res.certificateHash })}`
    : "";

  return (
    <main className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">PAPERWORK_AUDIT</span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Certificate Check</h1>
        </div>
        {banner}
        <form onSubmit={submit} className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl">
          <Field label="API key"><input className={inputClass} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required /></Field>
          <Field label="8130-3 / EASA Form 1 (PDF, max 10 MB)"><input className={inputClass} type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></Field>
          <Button disabled={busy}>{busy ? "ANALYZING..." : "ANALYZE"}</Button>
        </form>
        {error && <p className="rounded border border-rose-700 bg-rose-950/40 p-3 text-xs font-mono text-rose-300">ERROR: {error}</p>}

        {res && (
          <div className="space-y-4">
            {res.mode === "mock" && <p className="text-xs font-mono text-amber-400">Mock result: canned sample data, not a real analysis.</p>}
            <section className={`rounded-lg border p-4 ${res.redFlags.length ? "border-amber-600 bg-amber-950/30" : "border-emerald-700 bg-emerald-950/30"}`}>
              <h2 className="font-semibold">{res.redFlags.length ? `Review recommended: ${res.redFlags.length} finding${res.redFlags.length > 1 ? "s" : ""}` : "No issues detected in the document"}</h2>
              {res.redFlags.length > 0 && <ul className="list-disc ml-5 mt-2 text-sm text-slate-300 space-y-1">{res.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>}
            </section>
            <table className="w-full text-sm border border-slate-800"><tbody>
              {FIELDS.map(([k, label]) => (
                <tr key={k} className="border-b border-slate-800">
                  <td className="p-2 text-slate-400 font-mono w-40">{label}</td>
                  <td className={`p-2 ${res.extracted[k] == null || res.extracted[k] === "" ? "text-rose-400" : ""}`}>{show(res.extracted[k])}</td>
                </tr>
              ))}
            </tbody></table>
            <p className="text-[10px] font-mono text-slate-500 break-all">File SHA-256: {res.certificateHash}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link href={`/report/${res.id}`} className="block text-center bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs py-2.5 rounded">OPEN_SHAREABLE_REPORT</Link>
              <Link href={registerHref} className="block text-center border border-slate-700 hover:border-emerald-500 text-slate-200 font-mono text-xs py-2.5 rounded">REGISTER_THIS_PART</Link>
              <button type="button" onClick={() => { navigator.clipboard.writeText(res.certificateHash); setCopied(true); }} className="border border-slate-700 hover:border-emerald-500 text-slate-200 font-mono text-xs py-2.5 rounded">{copied ? "COPIED" : "COPY_FILE_HASH"}</button>
            </div>
            <p className="text-xs text-slate-500">Automated records review only. This is not an airworthiness determination.</p>
          </div>
        )}
      </div>
    </main>
  );
}

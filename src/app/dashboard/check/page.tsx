"use client";

import { useState } from "react";
import Link from "next/link";

type Discrepancy = {
  severity: "info" | "watch" | "alert";
  code: string;
  message: string;
};

type Analysis = {
  certificateHash?: string;
  fileName?: string;
  provider?: string;
  formType?: string | null;
  partNumber?: string | null;
  serialNumber?: string | null;
  status?: string | null;
  workOrder?: string | null;
  issuer?: string | null;
  approvalDate?: string | null;
  aircraftOrEligibility?: string | null;
  rawTextPreview?: string | null;
  discrepancies?: Discrepancy[];
  summary?: string;
  confidence?: number;
};

export default function CheckCertificatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/certificates/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || data.details || "Certificate analysis failed"
        );
      }

      const analysis: Analysis = data.analysis ?? data;
      setResult(analysis);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
          Dashboard
        </Link>
        <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider">
          Certificate check
        </span>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze 8130-3 / Form 1</h1>
          <p className="text-sm text-slate-400 mt-2">
            Upload a text-based PDF. Hash is computed on the server; fields are extracted
            without claiming airworthiness.
          </p>
        </div>

        <form
          onSubmit={handleAnalyze}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 mb-2">
              Certificate PDF
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-slate-800 file:text-slate-200"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                setError(null);
              }}
            />
            {file ? (
              <p className="text-xs font-mono text-slate-500 mt-2">{file.name}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold py-3 rounded-lg text-sm"
          >
            {isLoading ? "Analyzing certificate..." : "Analyze certificate"}
          </button>
        </form>

        {error ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {result && !isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Result · {result.provider || "unknown"}
                </p>
                <p className="text-sm text-slate-300 mt-1">{result.summary}</p>
              </div>
              {typeof result.confidence === "number" ? (
                <span className="text-xs font-mono text-slate-500">
                  conf {(result.confidence * 100).toFixed(0)}%
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {(
                [
                  ["Form", result.formType],
                  ["Part number", result.partNumber],
                  ["Serial", result.serialNumber],
                  ["Status", result.status],
                  ["Work order", result.workOrder],
                  ["Issuer", result.issuer],
                  ["Date", result.approvalDate],
                  ["Eligibility", result.aircraftOrEligibility],
                ] as [string, string | null | undefined][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="font-mono text-sm mt-1 break-all">{value || "—"}</p>
                </div>
              ))}
            </div>

            {result.certificateHash ? (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Certificate hash (SHA-256)
                </p>
                <p className="font-mono text-[11px] text-emerald-400 break-all">
                  {result.certificateHash}
                </p>
              </div>
            ) : null}

            {result.discrepancies && result.discrepancies.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Discrepancies
                </p>
                <ul className="space-y-2">
                  {result.discrepancies.map((d, i) => (
                    <li
                      key={d.code + String(i)}
                      className="rounded-lg border border-slate-800 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-amber-400">
                        {d.severity} · {d.code}
                      </span>
                      <p className="text-slate-300 mt-0.5">{d.message}</p>
                   </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.rawTextPreview ? (
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer">Text preview</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-slate-400">
                  {result.rawTextPreview}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

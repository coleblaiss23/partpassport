"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface PartEvent {
  id: string;
  eventType: string;
  timestamp: string;
  prevEventHash: string | null;
  eventHash: string;
  signature: string;
  certificateHash?: string | null;
  data: string;
  organization: { name: string };
}

interface VerificationData {
  valid: boolean;
  error?: string;
  scrapped?: boolean;
  safetyFlags?: { id: string; source: string; referenceId: string; description: string; url?: string | null }[];
  reason?: string;
  brokenAtEventId?: string;
  events?: PartEvent[];
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ partNumber: string; serial: string }>;
}) {
  const { partNumber, serial } = use(params);
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${partNumber}/${serial}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, [partNumber, serial]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 font-mono p-8 flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
          <span>EXECUTING_HASH_CHAIN_AUDIT...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">
              AEROSPACE SUPPLY CHAIN REGISTRY
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              P/N: <span className="font-mono text-slate-200">{partNumber}</span> | S/N:{" "}
              <span className="font-mono text-slate-200">{serial}</span>
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-mono text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded bg-slate-900"
          >
            ← SEARCH_NEW
          </Link>
        </div>

        {data?.error ? (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-slate-300">
            NO_RECORD: {data.error}. This part has no passport in the registry.
          </div>
        ) : data?.valid ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  RECORD CHAIN INTACT
                </p>
                <p className="text-xs text-emerald-600/80 font-mono">
                  All hash links and signatures check out. This is a records check, not an airworthiness determination.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
              STATUS_OK
            </span>
          </div>
        ) : (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
              <div>
                <p className="text-sm font-semibold text-rose-400">
                  CHAIN TAMPERING DETECTED
                </p>
                <p className="text-xs text-rose-500/80 font-mono">
                  Reason: {data?.reason ?? "UNKNOWN_FAILURE"} | Event ID: {data?.brokenAtEventId}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded">
              FAILED_AUDIT
            </span>
          </div>
        )}

        {data?.scrapped && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-lg text-sm font-mono text-rose-300">
            SCRAPPED: this part was recorded as scrapped. Treat any new paperwork for it as suspect.
          </div>
        )}
        {!!data?.safetyFlags?.length && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-lg space-y-1">
            <p className="text-sm font-semibold text-amber-400">SAFETY DATA MATCHES ({data.safetyFlags.length})</p>
            {data.safetyFlags.map((f) => (
              <p key={f.id} className="text-xs font-mono text-amber-200/80">{f.source} {f.referenceId}: {f.description}</p>
            ))}
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-6">
            LIFECYCLE_EVENT_LEDGER ({data?.events?.length ?? 0} EVENTS)
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-[19px] before:w-[2px] before:bg-slate-800">
            {data?.events?.map((evt) => (
              <div key={evt.id} className="relative pl-10">
                <div className="absolute left-3 top-1 -translate-x-1/2 h-3 w-3 rounded-full bg-slate-950 border-2 border-slate-500" />
                <div className="bg-slate-950 border border-slate-800/80 rounded p-4 font-mono text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                    <span className="font-bold text-slate-200 uppercase">{evt.eventType}</span>
                    <span className="text-slate-500">
                      {new Date(evt.timestamp).toISOString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span className="text-slate-600 block text-[10px]">ISSUING_ORGANIZATION</span>
                      <span className="text-slate-300">{evt.organization.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px]">PREVIOUS_EVENT_HASH</span>
                      <span className="truncate block text-slate-400">
                        {evt.prevEventHash ?? "GENESIS_NODE"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-600 block text-[10px]">CURRENT_EVENT_HASH</span>
                    <span className="text-emerald-400/90 break-all">{evt.eventHash}</span>
                  </div>

                  <div>
                    <span className="text-slate-600 block text-[10px]">Ed25519_DIGITAL_SIGNATURE</span>
                    <span className="text-slate-500 truncate block">{evt.signature}</span>
                  </div>

                  {evt.certificateHash && (
                    <div className="pt-1 border-t border-slate-800/40 text-cyan-400/90">
                      <span className="text-slate-600 block text-[10px]">ATTACHED_CERTIFICATE_HASH</span>
                      <span>{evt.certificateHash}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

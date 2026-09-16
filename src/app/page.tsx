"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [partNumber, setPartNumber] = useState("");
  const [serial, setSerial] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (partNumber && serial) {
      router.push(`/verify/${partNumber.trim()}/${serial.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-6">
      <div className="max-w-xl w-full mx-auto my-auto space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-block px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs rounded">
            CRYPTOGRAPHIC PROVENANCE SYSTEM
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Part Passport Registry
          </h1>
          <p className="text-sm text-slate-400 font-mono">
            Enter physical hardware telemetry to verify SHA-256 hash integrity.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl"
        >
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Part Number (P/N)
            </label>
            <input
              type="text"
              placeholder="e.g. APU-9000"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Serial Number (S/N)
            </label>
            <input
              type="text"
              placeholder="e.g. SN-88392"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded transition"
          >
            EXECUTE_REGISTRY_AUDIT
          </button>
        </form>
      </div>

      <footer className="text-center font-mono text-[11px] text-slate-600">
        Ed25519 Signature Verification • SHA-256 Hash Chain Ledger
      </footer>
    </main>
  );
}

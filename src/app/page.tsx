"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500";
const labelClass = "block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5";

export default function HomePage() {
  const [partNumber, setPartNumber] = useState("");
  const [serial, setSerial] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (partNumber && serial) {
      router.push(`/verify/${encodeURIComponent(partNumber.trim())}/${encodeURIComponent(serial.trim())}`);
    }
  };

  return (
    <main className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 font-sans flex flex-col justify-between p-6">
      <div className="max-w-xl w-full mx-auto my-auto space-y-8 py-8">
        <div className="space-y-2 text-center">
          <div className="inline-block px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-xs rounded">
            CRYPTOGRAPHIC PROVENANCE SYSTEM
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Part Passport Registry</h1>
          <p className="text-sm text-slate-400 font-mono">Look up a part to check its signed history.</p>
        </div>

        <form onSubmit={handleSearch} className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl">
          <div>
            <label className={labelClass}>Part Number (P/N)</label>
            <input type="text" placeholder="e.g. APU-9000" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Serial Number (S/N)</label>
            <input type="text" placeholder="e.g. SN-88392" value={serial} onChange={(e) => setSerial(e.target.value)} className={inputClass} required />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded transition">
            VERIFY_PART
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-center text-xs font-mono uppercase tracking-wider text-slate-500">Organization tools</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/dashboard/check", t: "Check Certificate", d: "Upload an 8130-3 for an audit" },
              { href: "/dashboard/parts/new", t: "Register Part", d: "Create a new signed passport" },
              { href: "/dashboard/events/new", t: "Add Event", d: "Inspect, sell, install, scrap" },
            ].map((b) => (
              <Link key={b.href} href={b.href} className="block border border-slate-800 hover:border-emerald-500 bg-slate-900/60 rounded-lg p-4 transition">
                <p className="text-sm font-semibold text-white">{b.t}</p>
                <p className="text-xs text-slate-400 mt-1">{b.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="text-center font-mono text-[11px] text-slate-600">
        Ed25519 Signature Verification • SHA-256 Hash Chain Ledger
      </footer>
    </main>
  );
}

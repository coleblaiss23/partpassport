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
      router.push(`/verify/${partNumber}/${serial}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-4xl font-extrabold text-cyan-400">Part Passport</h1>
        <p className="text-sm text-slate-400">
          Cryptographic supply chain verification for aerospace and aviation hardware.
        </p>

        <form onSubmit={handleSearch} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">Part Number</label>
            <input
              type="text"
              placeholder="e.g. APU-9000"
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">Serial Number</label>
            <input
              type="text"
              placeholder="e.g. SN-88392"
              className="w-full p-3 rounded bg-slate-900 border border-slate-700 text-white"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition"
          >
            Verify Cryptographic History
          </button>
        </form>
      </div>
    </main>
  );
}
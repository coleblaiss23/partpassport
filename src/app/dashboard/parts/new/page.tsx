"use client";

import { useState } from "react";

export default function NewPartPage() {
  const [partNumber, setPartNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("REGISTERING_PART...");

    const res = await fetch("/api/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partNumber, serialNumber, description, organizationId, privateKeyPem }),
    });

    if (res.ok) {
      const json = await res.json();
      setStatus(`REGISTERED. PART_ID: ${json.part.id}`);
    } else {
      const err = await res.json();
      setStatus(`ERROR: ${err.error || err.details}`);
    }
  };

  const inputClass =
    "w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">
            GENESIS_REGISTRATION
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Register New Part</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Part Number</label>
            <input type="text" className={inputClass} value={partNumber} onChange={(e) => setPartNumber(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Serial Number</label>
            <input type="text" className={inputClass} value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Description (optional)</label>
            <input type="text" className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Organization ID</label>
            <input type="text" className={inputClass} value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Organization Private Key (PEM)</label>
            <textarea className={`${inputClass} h-24`} value={privateKeyPem} onChange={(e) => setPrivateKeyPem(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded transition">
            Register Part
          </button>
        </form>
        {status && <p className="text-sm font-mono text-emerald-400">{status}</p>}
      </div>
    </main>
  );
}

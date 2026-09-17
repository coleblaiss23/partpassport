"use client";

import { useState } from "react";

export default function NewEventPage() {
  const [partId, setPartId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [eventType, setEventType] = useState("INSPECTED");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("SUBMITTING_EVENT...");

    const res = await fetch(`/api/parts/${partId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        eventType,
        data: { notes: "Lifecycle inspection completed" },
        privateKeyPem,
      }),
    });

    if (res.ok) {
      setStatus("EVENT_APPENDED_AND_SIGNED");
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
            LIFECYCLE_EVENT
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Append Lifecycle Event</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl"
        >
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Part ID
            </label>
            <input type="text" className={inputClass} value={partId}
              onChange={(e) => setPartId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Organization ID
            </label>
            <input type="text" className={inputClass} value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Event Type
            </label>
            <select className={inputClass} value={eventType}
              onChange={(e) => setEventType(e.target.value)}>
              <option value="INSPECTED">INSPECTED</option>
              <option value="OVERHAULED">OVERHAULED</option>
              <option value="REMOVED">REMOVED</option>
              <option value="INSTALLED">INSTALLED</option>
              <option value="SOLD">SOLD</option>
              <option value="SCRAPPED">SCRAPPED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Organization Private Key (PEM)
            </label>
            <textarea className={`${inputClass} h-24`} value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)} required />
          </div>
          <button type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider py-3 rounded transition">
            Sign & Append Event
          </button>
        </form>
        {status && <p className="text-sm font-mono text-emerald-400">{status}</p>}
      </div>
    </main>
  );
}

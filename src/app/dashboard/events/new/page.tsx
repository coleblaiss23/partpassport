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
    setStatus("Submitting event...");

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
      setStatus("Event added and signed cleanly!");
    } else {
      const err = await res.json();
      setStatus(`Error: ${err.error || err.details}`);
    }
  };

  return (
    <main className="max-w-md mx-auto p-8 text-white space-y-4">
      <h1 className="text-2xl font-bold">Append Lifecycle Event</h1>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <input
          type="text"
          placeholder="Part ID"
          className="w-full p-2 rounded"
          value={partId}
          onChange={(e) => setPartId(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Organization ID"
          className="w-full p-2 rounded"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          required
        />
        <select
          className="w-full p-2 rounded"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="INSPECTED">INSPECTED</option>
          <option value="OVERHAULED">OVERHAULED</option>
          <option value="REMOVED">REMOVED</option>
          <option value="INSTALLED">INSTALLED</option>
        </select>
        <textarea
          placeholder="Organization Private Key (PEM)"
          className="w-full p-2 rounded h-24 font-mono text-xs"
          value={privateKeyPem}
          onChange={(e) => setPrivateKeyPem(e.target.value)}
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded font-bold">
          Sign & Append Event
        </button>
      </form>
      {status && <p className="text-sm font-mono text-cyan-300">{status}</p>}
    </main>
  );
}
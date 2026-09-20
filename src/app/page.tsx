"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SAMPLES = [
  {
    pn: "TFE731-5BR",
    sn: "P-88211",
    label: "Clear chain",
    hint: "Full event history with certificate hashes",
  },
  {
    pn: "APU-36-150",
    sn: "SN-77401",
    label: "Watch",
    hint: "Missing overhaul certificate hash",
  },
  {
    pn: "CSD-400-1",
    sn: "44102",
    label: "Hold",
    hint: "Safety flag and life-limit pressure",
  },
];

export default function HomePage() {
  const [partNumber, setPartNumber] = useState("");
  const [serial, setSerial] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partNumber.trim() || !serial.trim()) return;
    router.push(
      `/verify/${encodeURIComponent(partNumber.trim())}/${encodeURIComponent(serial.trim())}`
    );
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              PartPassport
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Look up an aircraft part by number and serial to review its signed
              event history and certificate hashes. This is a documentation
              tool—not an airworthiness determination.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-xl space-y-4"
        >
            <div>
              <label
                htmlFor="pn"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Part number
              </label>
              <input
                id="pn"
                type="text"
                autoComplete="off"
                placeholder="e.g. TFE731-5BR"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="sn"
                className="mb-1.5 block text-xs font-medium text-slate-400"
              >
                Serial number
              </label>
              <input
                id="sn"
                type="text"
                autoComplete="off"
                placeholder="e.g. P-88211"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-500"
            >
              Verify part
            </button>
          </form>

          <p className="text-xs text-slate-500">
            Shops register parts and attach certificate hashes from the{" "}
            <Link href="/dashboard" className="text-emerald-500 hover:underline">
              dashboard
            </Link>
            .
          </p>
        </div>

        <div className="mt-14 w-full max-w-3xl">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Sample reports
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {SAMPLES.map((s) => (
              <button
                key={s.pn + s.sn}
                type="button"
                onClick={() =>
                  router.push(`/verify/${encodeURIComponent(s.pn)}/${encodeURIComponent(s.sn)}`)
                }
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-left hover:border-emerald-700/60"
              >
                <p className="font-mono text-sm text-emerald-400">{s.pn}</p>
                <p className="font-mono text-base text-white">{s.sn}</p>
                <p className="mt-2 text-xs font-medium text-slate-300">{s.label}</p>
                <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm">
            <Link
              href="/samples/report"
              className="text-emerald-500 hover:underline"
            >
              See a guided sample report →
            </Link>
          </p>
        </div>
      </div>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        Documentation integrity only. Not an airworthiness determination.
      </footer>
    </main>
  );
}

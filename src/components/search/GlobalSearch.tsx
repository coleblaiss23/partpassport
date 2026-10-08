"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls } from "@/components/ui";

type Hit =
  | { kind: "tail"; label: string; href: string }
  | { kind: "part"; label: string; href: string }
  | { kind: "workOrder"; label: string; href: string };

function resolveLocal(raw: string): Hit[] {
  const s = raw.trim();
  if (s.length < 2) return [];
  const upper = s.toUpperCase();
  const out: Hit[] = [];

  if (/^N[A-Z0-9-]+$/i.test(s) || (/^[A-Z0-9-]{2,10}$/i.test(s) && /[0-9]/.test(s))) {
    const tail = upper.startsWith("N") ? upper : upper;
    out.push({
      kind: "tail",
      label: `Aircraft ${tail}`,
      href: `/dashboard/fleet/${encodeURIComponent(tail)}`,
    });
  }

  if (/^WO[- ]?\d+/i.test(s)) {
    out.push({
      kind: "workOrder",
      label: `Work order ${upper}`,
      href: `/dashboard/fleet?wo=${encodeURIComponent(upper)}`,
    });
  }

  const parts = s.split(/[/\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const [pn, sn] = parts;
    out.push({
      kind: "part",
      label: `Part ${pn} / ${sn}`,
      href: `/verify/${encodeURIComponent(pn)}/${encodeURIComponent(sn)}`,
    });
  }

  return out.slice(0, 6);
}

/**
 * Unified omnibox: N-number → fleet tail, PN/SN → verify, WO-… → work orders.
 * Client-side heuristics + optional /api/aircraft search when signed in.
 */
export function GlobalSearch({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<{ q: string; hits: Hit[] }>({ q: "", hits: [] });
  const wrapRef = useRef<HTMLDivElement>(null);
  const localHits = resolveLocal(q);
  const remoteHits = remote.q === q ? remote.hits : [];
  const seen = new Set(localHits.map((h) => h.href));
  const hits = [...localHits, ...remoteHits.filter((h) => !seen.has(h.href))].slice(0, 8);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const query = q;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/aircraft?q=${encodeURIComponent(query.trim())}`);
        if (!r.ok) return;
        const j = (await r.json()) as {
          aircraft?: { tailNumber: string; make: string; model: string }[];
        };
        const found: Hit[] = (j.aircraft ?? []).map((a) => ({
          kind: "tail" as const,
          label: `${a.tailNumber} · ${a.make} ${a.model}`,
          href: `/dashboard/fleet/${encodeURIComponent(a.tailNumber)}`,
        }));
        setRemote({ q: query, hits: found });
      } catch {
        /* ignore */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hits[0]) go(hits[0].href);
  }

  return (
    <div ref={wrapRef} className={`relative ${compact ? "w-full max-w-xs" : "w-full max-w-md"}`}>
      <form onSubmit={onSubmit}>
        <input
          className={inputCls}
          placeholder="Search tail, PN/SN, or WO…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Global search"
        />
      </form>
      {open && hits.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 border border-[#2c2c2c] bg-[#0a0a0a] py-1"
          role="listbox"
        >
          {hits.map((h) => (
            <li key={h.href + h.label}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#c8c2b8] hover:bg-[#111111] hover:text-white"
                onClick={() => go(h.href)}
              >
                <span className="text-[10px] uppercase tracking-wider text-[#8d877e]">
                  {h.kind === "tail" ? "Tail" : h.kind === "part" ? "Part" : "WO"}
                </span>
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

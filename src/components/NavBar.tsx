"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Search" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/parts/new", label: "Register Part" },
  { href: "/dashboard/events/new", label: "Add Event" },
  { href: "/dashboard/check", label: "Check Certificate" },
];

export default function NavBar() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const active = (h: string) =>
    h === "/" ? path === "/" || path.startsWith("/verify") : h === "/dashboard" ? path === "/dashboard" : path.startsWith(h);
  const cls = (h: string) =>
    `block px-3 py-2 rounded text-xs font-mono uppercase tracking-wider transition ${
      active(h) ? "bg-emerald-600 text-slate-950 font-bold" : "text-slate-300 hover:text-white hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-mono text-sm font-bold tracking-widest text-emerald-400">
          PART_PASSPORT
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={cls(l.href)}>{l.label}</Link>
          ))}
        </div>
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
          className="md:hidden border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-slate-800 px-4 py-2 space-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls(l.href)}>{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}

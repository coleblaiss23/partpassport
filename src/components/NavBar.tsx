"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useVault } from "./VaultProvider";
import { btnPrimary } from "./ui";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/check", label: "Scan Certificates" },
  { href: "/dashboard/parts/new", label: "Register Part" },
  { href: "/dashboard/events/new", label: "Lifecycle Event" },
  { href: "/", label: "Public Search" },
];

export default function NavBar() {
  const path = usePathname() ?? "/";
  const v = useVault();
  const [open, setOpen] = useState(false);
  const active = (h: string) => (h === "/" ? path === "/" || path.startsWith("/verify") : h === "/dashboard" ? path === "/dashboard" : path.startsWith(h));
  const cls = (h: string) => `block rounded-md px-3 py-2 text-sm transition ${active(h) ? "bg-slate-800 font-medium text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`;

  const account = !v.ready ? null : v.org ? (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-200">
        <span className={`h-2 w-2 rounded-full ${v.unlocked ? "bg-emerald-400" : "bg-amber-400"}`} />
        {v.org.name}
        <span className="text-xs text-slate-500">{v.unlocked ? "Key unlocked" : "Key locked"}</span>
      </span>
      {v.unlocked && <button onClick={v.lock} className="text-xs text-slate-400 hover:text-white">Lock</button>}
      <button onClick={async () => { await v.signOut(); window.location.href = "/"; }} className="text-xs text-slate-400 hover:text-white">Sign out</button>
    </div>
  ) : (
    <Link href="/connect" className={btnPrimary}>Connect organization</Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
          Part Passport
        </Link>
        <div className="hidden items-center gap-1 lg:flex">{LINKS.map((l) => <Link key={l.href} href={l.href} className={cls(l.href)}>{l.label}</Link>)}</div>
        <div className="hidden lg:block">{account}</div>
        <button type="button" aria-label="Menu" onClick={() => setOpen(!open)} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 lg:hidden">{open ? "Close" : "Menu"}</button>
      </nav>
      {open && (
        <div className="space-y-1 border-t border-slate-800 px-4 py-3 lg:hidden">
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls(l.href)}>{l.label}</Link>)}
          <div className="pt-2">{account}</div>
        </div>
      )}
    </header>
  );
}

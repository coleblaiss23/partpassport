"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { useVault } from "./VaultProvider";
import { btnPrimary } from "./ui";

const PUBLIC = [
  { href: "/", label: "Registry" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/pricing", label: "Pricing" },
];
const APP = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/check", label: "Certificate check" },
  { href: "/dashboard/parts/new", label: "Register part" },
  { href: "/dashboard/import", label: "Import" },
];

export default function Navbar() {
  const path = usePathname() ?? "/";
  const router = useRouter();
  const v = useVault();
  const [open, setOpen] = useState(false);
  const links = v.org ? [...APP, ...PUBLIC] : PUBLIC;

  const active = (h: string) => {
    if (h === "/") return path === "/" || path.startsWith("/verify") || path.startsWith("/sample-part");
    if (h === "/dashboard") return path === "/dashboard";
    return path === h || path.startsWith(h + "/");
  };
  const cls = (h: string) =>
    `rounded-md px-3 py-2 text-sm transition ${active(h) ? "bg-slate-800/80 text-white" : "text-slate-400 hover:text-white"}`;

  const account = !v.ready ? null : v.org ? (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex items-center gap-2 text-slate-300">
        <span className={`h-2 w-2 rounded-full ${v.unlocked ? "bg-emerald-400" : "bg-amber-400"}`} aria-hidden="true" />
        <span className="max-w-[10rem] truncate">{v.org.name}</span>
        <span className="text-xs text-slate-500">{v.unlocked ? "unlocked" : "locked"}</span>
      </span>
      {v.unlocked && <button onClick={v.lock} className="text-xs text-slate-400 hover:text-white">Lock</button>}
      <button onClick={async () => { await v.signOut(); router.push("/"); router.refresh(); }} className="text-xs text-slate-400 hover:text-white">Sign out</button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/connect" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Sign in</Link>
      <Link href="/request-access" className={btnPrimary}>Request access</Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4" aria-label="Main">
        <Link href="/" aria-label="PartPassport home"><Logo /></Link>
        <div className="hidden flex-1 items-center gap-1 lg:flex">{links.map((l) => <Link key={l.href} href={l.href} className={cls(l.href)}>{l.label}</Link>)}</div>
        <div className="hidden lg:block">{account}</div>
        <button type="button" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen(!open)} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 lg:hidden">{open ? "Close" : "Menu"}</button>
      </nav>
      {open && (
        <div className="space-y-1 border-t border-slate-800 px-4 py-3 lg:hidden">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`block ${cls(l.href)}`}>{l.label}</Link>)}
          <div className="pt-3" onClick={() => setOpen(false)}>{account}</div>
        </div>
      )}
    </header>
  );
}

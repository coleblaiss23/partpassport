"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Registry" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/check", label: "Certificate check" },
  { href: "/pricing", label: "Pricing" },
  { href: "/legal", label: "Legal" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold tracking-tight text-white shrink-0">
          PartPassport
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-slate-400">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "text-emerald-400 font-medium"
                    : "hover:text-white transition-colors"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
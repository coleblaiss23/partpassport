"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useVault } from "./VaultProvider";
import { btnPrimary } from "./ui";
import { GlobalSearch } from "./search/GlobalSearch";

/** Signed-in primary nav: Dashboard | Fleet | Intake | AVL | Registry | Tools */
const PRIMARY_AUTH = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/fleet", label: "Fleet" },
  { href: "/dashboard/check", label: "Intake" },
  { href: "/dashboard/settings/avl", label: "AVL" },
  { href: "/", label: "Registry" },
];

const PRIMARY_PUBLIC = [
  { href: "/", label: "Registry" },
];

const TOOLS = [
  { href: "/tutorials", label: "Tutorials" },
  { href: "/dashboard/uploads", label: "Logbook uploads", auth: true },
  { href: "/dashboard/parts/new", label: "Register part", auth: true },
  { href: "/dashboard/events/new", label: "Events", auth: true },
  { href: "/dashboard/import", label: "Import", auth: true },
  { href: "/dashboard/records", label: "Records", auth: true },
  { href: "/dashboard/compliance", label: "Compliance alerts", auth: true },
  { href: "/dashboard/custody", label: "Custody", auth: true },
  { href: "/dashboard/audit-share", label: "Audit share", auth: true },
  { href: "/dashboard/settings/api-keys", label: "API keys", auth: true },
];

const ACCOUNT_LINKS = [
  { href: "/billing", label: "Billing" },
  { href: "/pricing", label: "Pricing" },
  { href: "/tutorials", label: "Tutorials" },
];

function linkActive(path: string, href: string) {
  if (href === "/") return path === "/" || path.startsWith("/verify") || path.startsWith("/sample-part");
  if (href === "/dashboard") return path === "/dashboard";
  if (href === "/dashboard/fleet") return path === "/dashboard/fleet" || path.startsWith("/dashboard/fleet/");
  return path === href || path.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  path,
  onClick,
  block,
}: {
  href: string;
  label: string;
  path: string;
  onClick?: () => void;
  block?: boolean;
}) {
  const active = linkActive(path, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${block ? "block px-3 py-2.5 " : "px-3 py-2 "}text-[13px] tracking-wide transition-colors ${
        active
          ? "text-[#f4f1ea] shadow-[inset_0_-1px_0_0_#c4893a]"
          : "text-[#c8c2b8] hover:text-[#f4f1ea]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  const path = usePathname() ?? "/";
  const router = useRouter();
  const v = useVault();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const acctRef = useRef<HTMLDivElement>(null);

  const signedIn = !!v.org;
  const tools = TOOLS.filter((t) => !t.auth || signedIn);
  const toolsActive = tools.some((l) => linkActive(path, l.href));

  const [menuPath, setMenuPath] = useState(path);
  if (menuPath !== path) {
    setMenuPath(path);
    setToolsOpen(false);
    setAcctOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcctOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const primary = signedIn ? PRIMARY_AUTH : PRIMARY_PUBLIC;

  const accountMenu = !v.ready ? null : signedIn ? (
    <div className="relative" ref={acctRef}>
      <button
        type="button"
        aria-expanded={acctOpen}
        aria-haspopup="menu"
        onClick={() => setAcctOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#c8c2b8] transition-colors hover:text-[#f4f1ea]"
      >
        <span
          className={`h-1.5 w-1.5 ${v.unlocked ? "bg-[#1F6B47]" : "bg-[#c4893a]"}`}
          aria-hidden
        />
        <span className="max-w-[9rem] truncate text-[#f4f1ea]">{v.org!.name}</span>
        <span className="text-[#8d877e]" aria-hidden>
          ▾
        </span>
      </button>
      {acctOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] border border-[#3d3d3d] bg-[#111111]/95 py-1 backdrop-blur-xl"
        >
          <p className="px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#8d877e]">
            {v.unlocked ? "Vault unlocked" : "Vault locked"}
          </p>
          {ACCOUNT_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setAcctOpen(false)}
              className={`block px-4 py-2 text-sm ${
                linkActive(path, l.href)
                  ? "text-[#f4f1ea]"
                  : "text-[#c8c2b8] hover:bg-[#171717] hover:text-[#f4f1ea]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          {v.unlocked && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                v.lock();
                setAcctOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-[#c8c2b8] hover:bg-[#171717] hover:text-[#f4f1ea]"
            >
              Lock vault
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setAcctOpen(false);
              await v.signOut();
              router.push("/");
              router.refresh();
            }}
            className="block w-full border-t border-[#2c2c2c] px-4 py-2 text-left text-sm text-[#c8c2b8] hover:bg-[#171717] hover:text-[#f4f1ea]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/pricing" className="px-3 py-2 text-[13px] tracking-wide text-[#c8c2b8] transition-colors hover:text-[#f4f1ea]">
        Pricing
      </Link>
      <Link href="/connect" className="px-3 py-2 text-[13px] tracking-wide text-[#c8c2b8] transition-colors hover:text-[#f4f1ea]">
        Sign in
      </Link>
      <Link href="/request-access" className={btnPrimary}>
        Request access
      </Link>
    </div>
  );

  const toolsDropdown = (
    <div className="relative" ref={toolsRef}>
      <button
        type="button"
        aria-expanded={toolsOpen}
        aria-haspopup="menu"
        onClick={() => setToolsOpen((o) => !o)}
        className={`px-3 py-2 text-[13px] tracking-wide transition-colors ${
          toolsActive || toolsOpen
            ? "text-[#f4f1ea] shadow-[inset_0_-1px_0_0_#c4893a]"
            : "text-[#c8c2b8] hover:text-[#f4f1ea]"
        }`}
      >
        Tools
        <span className="ml-1 text-[#8d877e]" aria-hidden>
          ▾
        </span>
      </button>
      {toolsOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 min-w-[14rem] border border-[#3d3d3d] bg-[#111111]/95 py-1 backdrop-blur-xl"
        >
          {tools.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setToolsOpen(false)}
              className={`block px-4 py-2 text-sm ${
                linkActive(path, l.href)
                  ? "text-[#f4f1ea]"
                  : "text-[#c8c2b8] hover:bg-[#171717] hover:text-[#f4f1ea]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/55 backdrop-blur-xl">
      <nav className="flex h-16 items-center justify-between gap-4 px-4 md:px-8" aria-label="Main">
        <Link href="/" aria-label="PartPassport home" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden flex-1 items-center gap-1 md:flex">
          {primary.map((l) => (
            <NavLink key={l.href + l.label} href={l.href} label={l.label} path={path} />
          ))}
          {signedIn && toolsDropdown}
          {signedIn && <NavLink href="/sample-report" label="Sample report" path={path} />}
          {signedIn && (
            <div className="ml-2 min-w-[10rem] max-w-sm flex-1 px-1">
              <GlobalSearch compact />
            </div>
          )}
        </div>

        <div className="hidden md:block">{accountMenu}</div>

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="border border-[#3d3d3d] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-[#c8c2b8] md:hidden"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="max-h-[80vh] space-y-1 overflow-y-auto border-t border-white/10 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur-xl md:hidden">
          {signedIn && (
            <div className="mb-3 px-1">
              <GlobalSearch />
            </div>
          )}
          <p className="px-3 pt-1 text-[10px] uppercase tracking-[0.18em] text-[#8d877e]">Navigate</p>
          {primary.map((l) => (
            <NavLink
              key={l.href + l.label}
              href={l.href}
              label={l.label}
              path={path}
              onClick={() => setMobileOpen(false)}
              block
            />
          ))}
          <NavLink
            href="/sample-report"
            label="Sample report"
            path={path}
            onClick={() => setMobileOpen(false)}
            block
          />
          <p className="px-3 pt-3 text-[10px] uppercase tracking-[0.18em] text-[#8d877e]">Tools</p>
          {tools.map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              label={l.label}
              path={path}
              onClick={() => setMobileOpen(false)}
              block
            />
          ))}
          {signedIn && (
            <>
              <p className="px-3 pt-3 text-[10px] uppercase tracking-[0.18em] text-[#8d877e]">Account</p>
              {ACCOUNT_LINKS.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  path={path}
                  onClick={() => setMobileOpen(false)}
                  block
                />
              ))}
            </>
          )}
          <div className="pt-3" onClick={() => setMobileOpen(false)}>
            {accountMenu}
          </div>
        </div>
      )}
    </header>
  );
}

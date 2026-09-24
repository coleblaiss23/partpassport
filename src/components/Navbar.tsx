"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useVault } from "./VaultProvider";
import { btnPrimary } from "./ui";

/** Signed-in primary nav (exact order): Dashboard | Intake | AVL | Registry | Tools | Sample Report */
const PRIMARY_AUTH = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/check", label: "Intake" },
  { href: "/dashboard/settings/avl", label: "AVL" },
  { href: "/", label: "Registry" },
];

const PRIMARY_PUBLIC = [
  { href: "/", label: "Registry" },
];

const TOOLS = [
  { href: "/tutorials", label: "Tutorials" },
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
      className={`${block ? "block " : ""}rounded-[4px] px-3 py-2 text-sm ${
        active ? "bg-[#161B24] text-white" : "text-[#B0B6C3] hover:text-white"
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

  useEffect(() => {
    setToolsOpen(false);
    setAcctOpen(false);
    setMobileOpen(false);
  }, [path]);

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
        className="flex items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm text-[#B0B6C3] hover:text-white"
      >
        <span
          className={`h-2 w-2 rounded-[2px] ${v.unlocked ? "bg-[#1F6B47]" : "bg-[#B45309]"}`}
          aria-hidden
        />
        <span className="max-w-[9rem] truncate text-white">{v.org!.name}</span>
        <span className="text-[#7C8495]" aria-hidden>
          ▾
        </span>
      </button>
      {acctOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] border border-[#1F2430] bg-[#0B0F14] py-1"
        >
          <p className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-[#7C8495]">
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
                  ? "bg-[#161B24] text-white"
                  : "text-[#B0B6C3] hover:bg-[#12151C] hover:text-white"
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
              className="block w-full px-4 py-2 text-left text-sm text-[#B0B6C3] hover:bg-[#12151C] hover:text-white"
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
            className="block w-full border-t border-[#1F2430] px-4 py-2 text-left text-sm text-[#B0B6C3] hover:bg-[#12151C] hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link href="/pricing" className="px-3 py-2 text-sm text-[#B0B6C3] hover:text-white">
        Pricing
      </Link>
      <Link href="/connect" className="px-3 py-2 text-sm text-[#B0B6C3] hover:text-white">
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
        className={`rounded-[4px] px-3 py-2 text-sm ${
          toolsActive || toolsOpen
            ? "bg-[#161B24] text-white"
            : "text-[#B0B6C3] hover:text-white"
        }`}
      >
        Tools
        <span className="ml-1 text-[#7C8495]" aria-hidden>
          ▾
        </span>
      </button>
      {toolsOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[14rem] border border-[#1F2430] bg-[#0B0F14] py-1"
        >
          {tools.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              onClick={() => setToolsOpen(false)}
              className={`block px-4 py-2 text-sm ${
                linkActive(path, l.href)
                  ? "bg-[#161B24] text-white"
                  : "text-[#B0B6C3] hover:bg-[#12151C] hover:text-white"
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
    <header className="sticky top-0 z-50 border-b border-[#1F2430] bg-[#0B0F14]">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4" aria-label="Main">
        <Link href="/" aria-label="PartPassport home" className="shrink-0">
          <Logo />
        </Link>

        <div className="hidden flex-1 items-center gap-1 lg:flex">
          {primary.map((l) => (
            <NavLink key={l.href + l.label} href={l.href} label={l.label} path={path} />
          ))}
          {toolsDropdown}
          <NavLink href="/sample-report" label="Sample report" path={path} />
        </div>

        <div className="hidden lg:block">{accountMenu}</div>

        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-[4px] border border-[#222A3B] px-3 py-1.5 text-sm text-[#B0B6C3] lg:hidden"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="max-h-[80vh] space-y-1 overflow-y-auto border-t border-[#1F2430] bg-[#0B0F14] px-4 py-3 lg:hidden">
          <p className="px-3 pt-1 text-[10px] uppercase tracking-wider text-[#7C8495]">Navigate</p>
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
          <p className="px-3 pt-3 text-[10px] uppercase tracking-wider text-[#7C8495]">Tools</p>
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
              <p className="px-3 pt-3 text-[10px] uppercase tracking-wider text-[#7C8495]">Account</p>
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

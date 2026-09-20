import type { ReactNode } from "react";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { VaultProvider } from "@/components/VaultProvider";

export const metadata = {
  title: "Part Passport",
  description: "Signed lifecycle records and paperwork checks for aircraft parts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-slate-950 font-sans text-slate-100 antialiased">
        <VaultProvider>
          <NavBar />
          {children}
          <footer className="space-y-2 border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
            <div className="flex justify-center gap-5">
              <Link href="/pricing" className="hover:text-slate-300">Pricing</Link>
              <Link href="/legal" className="hover:text-slate-300">Legal</Link>
              <Link href="/terms" className="hover:text-slate-300">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            </div>
            <p>Part Passport provides cryptographic record integrity and does not certify airworthiness.</p>
          </footer>
        </VaultProvider>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { VaultProvider } from "@/components/VaultProvider";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "PartPassport", template: "%s | PartPassport" },
  description:
    "Deterministic OCR Pipeline, AVL enforcement, Automated FAA UPN cross-reference, and Chain of Custody Ledger for aircraft parts.",
  openGraph: {
    title: "PartPassport",
    description:
      "Industrial-grade release certificate control and signed custody ledgers for MROs and repair stations.",
    type: "website",
    siteName: "PartPassport",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${grotesk.variable} ${mono.variable}`}>
      <body className="bg-[#0a0a0a] font-sans text-[#f4f1ea] antialiased">
        <VaultProvider>
          <Navbar />
          {children}
          <footer className="border-t border-[#2c2c2c] px-6 py-12 md:px-12">
            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-display text-4xl text-[#f4f1ea]">PartPassport</p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#8d877e]">
                  Cryptographic record integrity for release certificates and custody ledgers. Not an
                  airworthiness determination.
                </p>
              </div>
              <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-[#c8c2b8]">
                <Link href="/pricing" className="hover:text-[#f4f1ea]">
                  Pricing
                </Link>
                <Link href="/legal" className="hover:text-[#f4f1ea]">
                  Legal
                </Link>
                <Link href="/terms" className="hover:text-[#f4f1ea]">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-[#f4f1ea]">
                  Privacy
                </Link>
              </nav>
            </div>
          </footer>
        </VaultProvider>
      </body>
    </html>
  );
}

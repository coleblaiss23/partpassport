import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { VaultProvider } from "@/components/VaultProvider";

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
 <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
 <body className="bg-[#0B0F14] font-sans text-white antialiased">
 <VaultProvider>
 <Navbar />
 {children}
 <footer className="space-y-2 border-t border-[#1F2430] px-4 py-6 text-center text-xs text-[#7C8495]">
 <div className="flex justify-center gap-5">
 <Link href="/pricing" className="hover:text-white">Pricing</Link>
 <Link href="/legal" className="hover:text-white">Legal</Link>
 <Link href="/terms" className="hover:text-white">Terms</Link>
 <Link href="/privacy" className="hover:text-white">Privacy</Link>
 </div>
 <p>PartPassport provides cryptographic record integrity and does not certify airworthiness.</p>
 </footer>
 </VaultProvider>
 </body>
 </html>
 );
}

import type { ReactNode } from "react";
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
        </VaultProvider>
      </body>
    </html>
  );
}

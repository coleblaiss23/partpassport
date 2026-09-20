import type { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "PartPassport",
  description:
    "Documentation integrity and signed audit trails for aircraft parts. Not an airworthiness determination.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}

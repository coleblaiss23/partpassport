import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Part Passport Registry",
  description: "Cryptographic supply chain verification for aerospace hardware",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
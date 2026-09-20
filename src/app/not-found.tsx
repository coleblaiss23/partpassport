import Link from "next/link";
import { btnPrimary } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-emerald-400">404</p>
      <h1 className="text-2xl font-semibold text-white">That page doesn&apos;t exist</h1>
      <p className="text-slate-400">Check the address, or head back to the registry.</p>
      <Link href="/" className={btnPrimary}>Back to the registry</Link>
    </main>
  );
}

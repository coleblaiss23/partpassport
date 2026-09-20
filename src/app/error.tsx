"use client";
import { btnPrimary } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="text-slate-400">The request didn&apos;t complete. Try again in a moment.</p>
      <button onClick={reset} className={btnPrimary}>Try again</button>
    </main>
  );
}

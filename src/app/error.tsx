"use client";
import { btnPrimary, btnSecondary } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail =
    process.env.NODE_ENV === "development"
      ? error.message || error.digest
      : error.digest
        ? `Reference: ${error.digest}`
        : null;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="text-[#c8c2b8]">
        The request didn&apos;t complete. If this is a new dashboard page (Custody, Compliance, or
        Audit share), confirm database migrations are applied and restart the dev server so Prisma
        picks up the latest client.
      </p>
      {detail && (
        <p className="break-all rounded-[4px] border border-[#2c2c2c] bg-[#111111] px-3 py-2 text-left text-xs text-[#8d877e]">
          {detail}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={btnPrimary}>
          Try again
        </button>
        <a href="/dashboard" className={btnSecondary}>
          Back to dashboard
        </a>
      </div>
    </main>
  );
}

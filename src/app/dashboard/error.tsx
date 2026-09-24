"use client";
import { btnPrimary, btnSecondary } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-white">Dashboard view failed to load</h1>
      <p className="text-sm text-[#B0B6C3]">
        A database or rendering error interrupted this page. Secondary tools (custody, compliance,
        audit share) need the latest migration — run{" "}
        <code className="pp-track text-white">npx prisma migrate deploy</code> then restart{" "}
        <code className="pp-track text-white">npm run dev</code>.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <p className="break-all rounded-[4px] border border-[#9F1239] bg-[#1A0A10] px-3 py-2 text-left text-xs text-[#FFE4E6]">
          {error.message}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className={btnPrimary}>
          Retry
        </button>
        <a href="/dashboard" className={btnSecondary}>
          Overview
        </a>
      </div>
    </main>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16" aria-busy="true">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />
      <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-900" />
      <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-900" />
    </main>
  );
}

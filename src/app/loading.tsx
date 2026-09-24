export default function Loading() {
 return (
 <main className="mx-auto max-w-3xl px-4 py-16" aria-busy="true">
 <div className="h-6 w-48 bg-[#161B24]" />
 <div className="mt-4 h-24 border border-[#1F2430] bg-[#12151C]" />
 <div className="mt-4 h-40 border border-[#1F2430] bg-[#12151C]" />
 <p className="pp-track mt-4 text-xs text-[#7C8495]">Loading compliance workspace…</p>
 </main>
 );
}

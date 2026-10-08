export default function Loading() {
 return (
 <main className="mx-auto max-w-3xl px-4 py-16" aria-busy="true">
 <div className="h-6 w-48 bg-[#171717]" />
 <div className="mt-4 h-24 border border-[#2c2c2c] bg-[#111111]" />
 <div className="mt-4 h-40 border border-[#2c2c2c] bg-[#111111]" />
 <p className="pp-track mt-4 text-xs text-[#8d877e]">Loading compliance workspace…</p>
 </main>
 );
}

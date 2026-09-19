import Link from "next/link";

const TOOLS = [
  { href: "/dashboard/check", step: "A", title: "Check a Certificate", desc: "Upload an 8130-3 or EASA Form 1 PDF. Get red flags and a shareable report." },
  { href: "/dashboard/parts/new", step: "B", title: "Register a Part", desc: "Create a part's passport. Your browser signs the first record." },
  { href: "/dashboard/events/new", step: "C", title: "Add a Lifecycle Event", desc: "Inspect, repair, overhaul, install, sell, transfer or scrap a part you hold." },
  { href: "/", step: "D", title: "Verify a Part", desc: "Anyone can look up a part number and serial to check its history." },
];

export default function DashboardHome() {
  return (
    <main className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">Organization dashboard</span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">What do you want to do?</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="block bg-slate-900/80 border border-slate-800 hover:border-emerald-500 rounded-lg p-5 transition">
              <span className="text-xs font-mono text-emerald-500">{t.step}</span>
              <p className="text-lg font-semibold text-white mt-1">{t.title}</p>
              <p className="text-sm text-slate-400 mt-1">{t.desc}</p>
            </Link>
          ))}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-2 text-sm text-slate-300">
          <p className="font-semibold text-white">Your keys</p>
          <p>The forms ask for two secrets your organization was issued: an <span className="font-mono">API key</span> (identifies you) and a <span className="font-mono">private key</span> (signs records).</p>
          <p>The private key is used inside your browser only and is never sent to the server. Keep it in a password manager.</p>
          <p className="text-xs text-slate-500">Testing locally? Run <span className="font-mono">npm run seed:demo</span>, then read <span className="font-mono">demo-credentials.json</span>.</p>
        </div>
      </div>
    </main>
  );
}

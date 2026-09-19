export const inputClass =
  "w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function Shell({ tag, title, children }: { tag: string; title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono tracking-widest text-emerald-500 uppercase">{tag}</span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">{title}</h1>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 space-y-4 shadow-xl">{children}</div>
      </div>
    </main>
  );
}

export const Button = ({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) => (
  <button type="submit" disabled={disabled} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-sm py-2 rounded">
    {children}
  </button>
);

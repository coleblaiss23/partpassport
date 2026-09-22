import type { ReactNode } from "react";
export const inputCls =  "w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-600 focus:outline-none";
export const btnPrimary =  "inline-flex items-center justify-center gap-2 rounded border border-emerald-700 bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50";
export const btnSecondary =  "inline-flex items-center justify-center gap-2 rounded border border-slate-700 bg-transparent px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900";
export function Card({  children,  className = "",}: {  children: ReactNode;  className?: string;}) {
  return (
    <div className={`rounded border border-slate-800 bg-slate-900/50 p-4 ${className}`}>
      {children}
    </div>
  );
}
export function PageHeader({  title,  subtitle,  actions,}: {  title: string;  subtitle?: string;  actions?: ReactNode;}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
export function Field({  label,  hint,  children,}: {  label: string;  hint?: string;  children: ReactNode;}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
const TONES = {
  slate: "border-slate-700 bg-slate-800 text-slate-300",
  green: "border-emerald-800 bg-emerald-950 text-emerald-300",
  amber: "border-amber-800 bg-amber-950 text-amber-300",
  red: "border-rose-800 bg-rose-950 text-rose-300",
  blue: "border-sky-800 bg-sky-950 text-sky-300",
};
export function Badge({  tone = "slate",  children,}: {  tone?: keyof typeof TONES;  children: ReactNode;}) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${TONES[tone]}`}>
      {children}
    </span>
  );
}
export function Stat({  label,  value,  sub,  tone,}: {  label: string;  value: ReactNode;  sub?: string;  tone?: "amber";}) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${
          tone === "amber" ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </Card>
  );
}
export function Hash({ value, n = 10 }: { value: string; n?: number }) {
  return (
    <code className="font-mono text-xs text-slate-400" title={value}>
      {value.slice(0, n)}…
    </code>
  );
}

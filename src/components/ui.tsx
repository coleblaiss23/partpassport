import type { ReactNode } from "react";

/** Industrial primitives: sharp edges, brushed metal borders, paper and amber. */

export const inputCls =
  "w-full border border-[#3d3d3d] bg-[#0a0a0a] px-3 py-2 text-sm text-[#f4f1ea] placeholder:text-[#8d877e] transition-colors focus:border-[#c8c2b8] focus:outline-none";

/** Primary: warm paper, amber on press. */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 border border-[#f4f1ea] bg-[#f4f1ea] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#0a0a0a] transition-colors hover:border-[#c4893a] hover:bg-[#c4893a] disabled:opacity-50";

/** Secondary: hairline metal, transparent field. */
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 border border-[#3d3d3d] bg-transparent px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f4f1ea] transition-colors hover:border-[#c8c2b8] disabled:opacity-50";

/** Success / verified action — flat forest, no glow. */
export const btnSuccess =
  "inline-flex items-center justify-center gap-2 border border-[#1F6B47] bg-[#1F6B47] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#185A3B] hover:border-[#185A3B] disabled:opacity-50";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-[#2c2c2c] bg-[#111111] p-5 ${className}`}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl text-[#f4f1ea] md:text-5xl">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#c8c2b8]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-[#8d877e]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[#8d877e]">{hint}</span> : null}
    </label>
  );
}

const TONES = {
  slate: "border-[#3d3d3d] bg-[#171717] text-[#c8c2b8]",
  green: "border-[#1F6B47] bg-[#1F6B47] text-white",
  amber: "border-[#c4893a] bg-[#c4893a] text-[#0a0a0a]",
  red: "border-[#9F1239] bg-[#9F1239] text-white",
  blue: "border-[#3d3d3d] bg-[#171717] text-[#f4f1ea]",
};

export function Badge({
  tone = "slate",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "amber";
}) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[#8d877e]">{label}</p>
      <p className={`pp-track mt-2 text-3xl ${tone === "amber" ? "text-[#c4893a]" : "text-[#f4f1ea]"}`}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-[#8d877e]">{sub}</p> : null}
    </Card>
  );
}

export function Hash({ value, n = 10 }: { value: string; n?: number }) {
  return (
    <code className="pp-track text-xs text-[#c8c2b8]" title={value}>
      {value.slice(0, n)}…
    </code>
  );
}

/** Monospace identity block for P/N, S/N, tracking numbers. */
export function TrackingBlock({
  label,
  value,
  className = "",
}: {
  label?: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`border border-[#2c2c2c] bg-[#0a0a0a] px-3 py-2 ${className}`}>
      {label ? <p className="text-[10px] uppercase tracking-[0.18em] text-[#8d877e]">{label}</p> : null}
      <p className="pp-track text-sm text-[#f4f1ea]">{value}</p>
    </div>
  );
}

/** Solid status banners — pass / warn / fail. */
export const bannerPass = "border border-[#1F6B47] bg-[#14281F] p-4 text-[#D8F3E7]";
export const bannerWarn = "border border-[#c4893a] bg-[#1C1408] p-4 text-[#FFEDD5]";
export const bannerFail = "border border-[#9F1239] bg-[#1A0A10] p-4 text-[#FFE4E6]";
export const bannerNeutral = "border border-[#2c2c2c] bg-[#111111] p-4 text-[#c8c2b8]";

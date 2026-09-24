import type { ReactNode } from "react";

/** Solid matte industrial primitives — no glass, glow, or soft fills. */

export const inputCls =
 "w-full rounded-[4px] border border-[#222A3B] bg-[#0B0F14] px-3 py-2 text-sm text-white placeholder:text-[#7C8495] focus:border-[#B0B6C3] focus:outline-none";

/** Primary CTA: stark white / dark text (Robinhood-style authority). */
export const btnPrimary =
 "inline-flex items-center justify-center gap-2 rounded-[4px] border border-white bg-white px-3.5 py-2 text-sm font-semibold text-[#0B0F14] hover:bg-[#E8EAED] hover:border-[#E8EAED] disabled:opacity-50";

/** Secondary: crisp border, opaque surface. */
export const btnSecondary =
 "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#222A3B] bg-[#12151C] px-3.5 py-2 text-sm font-medium text-white hover:border-[#B0B6C3] disabled:opacity-50";

/** Success / verified action — deep flat forest green, no glow. */
export const btnSuccess =
 "inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#1F6B47] bg-[#1F6B47] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#185A3B] hover:border-[#185A3B] disabled:opacity-50";

export function Card({
 children,
 className = "",
}: {
 children: ReactNode;
 className?: string;
}) {
 return (
 <div className={`rounded-[4px] border border-[#1F2430] bg-[#12151C] p-4 ${className}`}>
 {children}
 </div>
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
 <div className="flex flex-wrap items-end justify-between gap-3">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
 {subtitle ? <p className="mt-1 text-sm text-[#B0B6C3]">{subtitle}</p> : null}
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
 <span className="mb-1.5 block text-sm text-[#B0B6C3]">{label}</span>
 {children}
 {hint ? <span className="mt-1 block text-xs text-[#7C8495]">{hint}</span> : null}
 </label>
 );
}

const TONES = {
 slate: "border-[#222A3B] bg-[#161B24] text-[#B0B6C3]",
 green: "border-[#1F6B47] bg-[#1F6B47] text-white",
 amber: "border-[#B45309] bg-[#B45309] text-white",
 red: "border-[#9F1239] bg-[#9F1239] text-white",
 blue: "border-[#222A3B] bg-[#161B24] text-white",
};

export function Badge({
 tone = "slate",
 children,
}: {
 tone?: keyof typeof TONES;
 children: ReactNode;
}) {
 return (
 <span className={`inline-block rounded-[4px] border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
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
 <p className="text-sm text-[#B0B6C3]">{label}</p>
 <p
 className={`mt-1 text-2xl font-semibold tracking-tight ${
 tone === "amber" ? "text-[#B45309]" : "text-white"
 }`}
 >
 {value}
 </p>
 {sub ? <p className="mt-1 text-xs text-[#7C8495]">{sub}</p> : null}
 </Card>
 );
}

export function Hash({ value, n = 10 }: { value: string; n?: number }) {
 return (
 <code className="pp-track text-xs text-[#B0B6C3]" title={value}>
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
 <div className={`rounded-[4px] border border-[#1F2430] bg-[#0B0F14] px-3 py-2 ${className}`}>
 {label ? (
 <p className="text-[10px] uppercase tracking-widest text-[#7C8495]">{label}</p>
 ) : null}
 <p className="pp-track text-sm text-white">{value}</p>
 </div>
 );
}

/** Solid status banners — pass / warn / fail. */
export const bannerPass =
 "rounded-[4px] border border-[#1F6B47] bg-[#14281F] p-4 text-[#D8F3E7]";
export const bannerWarn =
 "rounded-[4px] border border-[#B45309] bg-[#1C1408] p-4 text-[#FFEDD5]";
export const bannerFail =
 "rounded-[4px] border border-[#9F1239] bg-[#1A0A10] p-4 text-[#FFE4E6]";
export const bannerNeutral =
 "rounded-[4px] border border-[#1F2430] bg-[#12151C] p-4 text-[#B0B6C3]";

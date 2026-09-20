export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5 20 5.6v6.1c0 4.6-3.2 8.3-8 9.8-4.8-1.5-8-5.2-8-9.8V5.6L12 2.5Z" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m8.4 12.1 2.5 2.5 4.7-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
      <LogoMark />
      PartPassport
    </span>
  );
}

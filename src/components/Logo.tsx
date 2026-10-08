/** PartPassport brand mark — passport plate + propeller hub. */

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="22" stroke="#f4f1ea" strokeWidth="1.25" fill="#111111" />
      <path d="M7 5v22" stroke="#8d877e" strokeWidth="1" />
      <path d="M21 8h5.5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H21" stroke="#c8c2b8" strokeWidth="1.15" />
      <rect x="10" y="9" width="7" height="5" stroke="#c4893a" strokeWidth="1.15" />
      <path d="M10 17.5h8M10 20.5h6" stroke="#c8c2b8" strokeWidth="1" strokeLinecap="square" />
      <g transform="translate(22.5 22.5)">
        <circle cx="0" cy="0" r="1.35" fill="#f4f1ea" />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#f4f1ea"
          transform="rotate(0)"
        />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#f4f1ea"
          transform="rotate(120)"
        />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#f4f1ea"
          transform="rotate(240)"
        />
        <circle cx="0" cy="0" r="0.55" fill="#0a0a0a" />
      </g>
    </svg>
  );
}

export default function Logo({
  showWordmark = true,
  size = 28,
}: {
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 text-[#f4f1ea]">
      <LogoMark size={size} />
      {showWordmark ? (
        <span className="font-display text-[1.35rem] leading-none tracking-tight">
          Part<span className="italic text-[#c8c2b8]">Passport</span>
        </span>
      ) : null}
    </span>
  );
}

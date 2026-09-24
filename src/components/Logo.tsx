/** PartPassport brand mark — passport booklet + three-blade propeller. */

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
      {/* Passport booklet cover */}
      <rect
        x="3"
        y="5"
        width="18"
        height="22"
        rx="1.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        fill="#12151C"
      />
      {/* Spine fold */}
      <path d="M7 5v22" stroke="#7C8495" strokeWidth="1" />
      {/* Inner page edge */}
      <path d="M21 8h5.5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H21" stroke="#B0B6C3" strokeWidth="1.25" />
      {/* Passport chip window */}
      <rect x="10" y="9" width="7" height="5" rx="0.5" stroke="#1F6B47" strokeWidth="1.25" />
      {/* Identity lines */}
      <path d="M10 17.5h8M10 20.5h6" stroke="#B0B6C3" strokeWidth="1" strokeLinecap="square" />

      {/* Three-blade propeller over lower-right of mark */}
      <g transform="translate(22.5 22.5)">
        <circle cx="0" cy="0" r="1.35" fill="#FFFFFF" />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#FFFFFF"
          opacity="0.95"
          transform="rotate(120)"
        />
        <path
          d="M0-1.2 C1.1-4.8 2.6-5.4 3.2-4.2 C3.8-3 2.2-1.4 0-1.2Z"
          fill="#FFFFFF"
          opacity="0.95"
          transform="rotate(240)"
        />
        <circle cx="0" cy="0" r="0.55" fill="#0B0F14" />
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
    <span className="inline-flex items-center gap-2.5 text-white">
      <LogoMark size={size} />
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight">
          Part<span className="text-[#B0B6C3]">Passport</span>
        </span>
      ) : null}
    </span>
  );
}

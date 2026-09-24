"use client";

interface AvlWarningBadgeProps {
  isOnAvl: boolean;
  warning: string | null;
  matchedSupplierName?: string | null;
  severity?: "clear" | "amber" | "red";
  className?: string;
  size?: "sm" | "md";
}

/**
 * Explicit visual pass/fail for Block 4 AVL cross-reference.
 * Green AVL PASS vs red AVL FAIL (amber when list empty / partial match).
 */
export function AvlWarningBadge({
  isOnAvl,
  warning,
  matchedSupplierName,
  severity,
  className = "",
  size = "md",
}: AvlWarningBadgeProps) {
  const sizeCls = size === "sm" ? "text-xs px-2.5 py-1.5" : "text-sm px-3.5 py-2.5";
  const tone = severity ?? (isOnAvl ? "clear" : "red");

  if (tone === "clear" || isOnAvl) {
    return (
      <div
        className={
          "inline-flex w-full items-center gap-3 rounded-[4px] border border-[#1F6B47] bg-[#14281F] " +
          sizeCls +
          " " +
          className
        }
        role="status"
        aria-label="AVL Pass"
      >
        <span className="shrink-0 rounded-[4px] border border-white bg-[#1F6B47] px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">
          AVL PASS
        </span>
        <span className="font-medium text-white">
          On Approved Vendor List
          {matchedSupplierName ? ` — ${matchedSupplierName}` : ""}
        </span>
      </div>
    );
  }

  const isAmber = tone === "amber";
  const shell = isAmber
    ? "border-[#B45309] bg-[#1C1408] text-[#FFEDD5]"
    : "border-[#9F1239] bg-[#1A0A10] text-[#FFE4E6]";
  const chip = isAmber
    ? "border-[#B45309] bg-[#B45309] text-white"
    : "border-[#9F1239] bg-[#9F1239] text-white";

  return (
    <div
      className={`inline-flex w-full items-start gap-3 rounded-[4px] border ${shell} ${sizeCls} ${className}`}
      role="alert"
      aria-label={isAmber ? "AVL Warning" : "AVL Fail"}
      title={warning ?? "Vendor not found on current Approved Vendor List"}
    >
      <span
        className={`shrink-0 rounded-[4px] border px-2 py-0.5 text-[11px] font-bold tracking-wider ${chip}`}
      >
        {isAmber ? "AVL WARN" : "AVL FAIL"}
      </span>
      <span className="font-medium leading-snug">
        {warning ?? "Warning: Vendor not active on current AVL"}
      </span>
    </div>
  );
}

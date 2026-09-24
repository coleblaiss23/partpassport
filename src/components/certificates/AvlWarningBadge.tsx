"use client";

interface AvlWarningBadgeProps {
  isOnAvl: boolean;
  warning: string | null;
  matchedSupplierName?: string | null;
  className?: string;
  size?: "sm" | "md";
}

export function AvlWarningBadge({
  isOnAvl,
  warning,
  matchedSupplierName,
  className = "",
  size = "md",
}: AvlWarningBadgeProps) {
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  
  if (isOnAvl) {
    return (
      <div className={"inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 " + sizeCls + " " + className}>
        <span aria-hidden>✓</span>
        <span className="font-medium">
          On AVL{matchedSupplierName ? " • " + matchedSupplierName : ""}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={"inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 " + sizeCls + " " + className}
      title={warning ?? "Vendor not found on current Approved Vendor List"}
    >
      <span aria-hidden>!</span>
      <span className="font-medium">
        {warning ?? "Warning: Vendor not active on current AVL"}
      </span>
    </div>
  );
}

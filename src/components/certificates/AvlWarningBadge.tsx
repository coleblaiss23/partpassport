"use client";

import { CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

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
  className,
  size = "md",
}: AvlWarningBadgeProps) {
  if (isOnAvl) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-emerald-400",
          size === "sm" && "text-xs px-2 py-0.5",
          size === "md" && "text-sm",
          className
        )}
      >
        <CheckCircle2 className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <span className="font-medium">
          On AVL{matchedSupplierName ? ` • ${matchedSupplierName}` : ""}
        </span      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-amber-400",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm",
        className
      )}
      title={warning ?? "Vendor not found on current Approved Vendor List"}
    >
      <ShieldAlert className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span className="font-medium">
        {warning ?? "Warning: Vendor not active on current AVL"}
      </span>
    </div>
  );
}

/** @deprecated Use @/components/certificates/AvlWarningBadge */
export function AvlWarningBadge({ className = "" }: { className?: string }) {
 return (
 <span
 className={`inline-flex items-center border border-[#B45309] bg-[#1C1408] px-2 py-0.5 text-xs font-medium text-[#B45309] ${className}`}
 >
 AVL review required
 </span>
 );
}

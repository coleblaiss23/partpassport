interface VerificationBadgeProps {
    valid: boolean;
    reason?: string;
    brokenAtEventId?: string;
  }
  
  export default function VerificationBadge({ valid, reason, brokenAtEventId }: VerificationBadgeProps) {
    if (valid) {
      return (
        <div className="p-4 bg-emerald-900/40 border border-emerald-500 rounded-lg text-emerald-200">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>✓</span> Cryptographic Chain Verified
          </h3>
          <p className="text-sm mt-1">
            All digital signatures and hash pointers are valid. No data tampering detected.
          </p>
        </div>
      );
    }
  
    return (
      <div className="p-4 bg-rose-900/40 border border-rose-500 rounded-lg text-rose-200">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span>⚠️</span> Tamper Warning: Chain Invalid
        </h3>
        <p className="text-sm mt-1">Reason: {reason}</p>
        {brokenAtEventId && (
          <p className="text-xs text-rose-300 mt-1 font-mono">
            Broken Event ID: {brokenAtEventId}
          </p>
        )}
      </div>
    );
  }
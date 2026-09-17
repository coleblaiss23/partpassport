"use client";

import { useEffect, useState, use } from "react";
import VerificationBadge from "@/components/VerificationBadge";
import PartTimeline from "@/components/PartTimeline";

interface VerifyEvent {
  id: string;
  eventType: string;
  timestamp: string;
  eventHash: string;
  prevEventHash: string | null;
  certificateHash?: string | null;
  organization: { name: string };
  data: string;
}

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  brokenAtEventId?: string;
  events?: VerifyEvent[];
}

export default function VerifyPage({
  params,
}: {
  params: Promise<{ partNumber: string; serial: string }>;
}) {
  const { partNumber, serial } = use(params);
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${partNumber}/${serial}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, [partNumber, serial]);

  if (loading || !data) return <div className="p-8 text-white">Verifying cryptographic chain...</div>;

  return (
    <main className="max-w-4xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Part Passport Registry</h1>
      <h2 className="text-lg text-slate-400 mb-6">
        P/N: {partNumber} | S/N: {serial}
      </h2>

      <VerificationBadge
        valid={data.valid}
        reason={data.reason}
        brokenAtEventId={data.brokenAtEventId}
      />

      {data.events && <PartTimeline events={data.events} brokenAtEventId={data.brokenAtEventId} />}
    </main>
  );
}

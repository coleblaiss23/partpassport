"use client";

import { useEffect, useState } from "react";
import VerificationBadge from "@/components/VerificationBadge";
import PartTimeline from "@/components/PartTimeline";

export default function VerifyPage({ params }: { params: { partNumber: string; serial: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${params.partNumber}/${params.serial}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, [params.partNumber, params.serial]);

  if (loading) return <div className="p-8 text-white">Verifying cryptographic chain...</div>;

  return (
    <main className="max-w-4xl mx-auto p-8 text-white">
      <h1 className="text-3xl font-bold mb-2">Part Passport Registry</h1>
      <h2 className="text-lg text-slate-400 mb-6">
        P/N: {params.partNumber} | S/N: {params.serial}
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
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

export default function HomePage() {
  const [pn, setPn] = useState("");
  const [sn, setSn] = useState("");
  const router = useRouter();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Part Passport Registry</h1>
        <p className="text-slate-400">Look up a part to see its signed history and any safety-data matches.</p>
      </div>
      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); router.push(`/verify/${encodeURIComponent(pn.trim())}/${encodeURIComponent(sn.trim())}`); }}
        >
          <Field label="Part number"><input className={`${inputCls} font-mono`} placeholder="e.g. APU-9000" value={pn} onChange={(e) => setPn(e.target.value)} required /></Field>
          <Field label="Serial number"><input className={`${inputCls} font-mono`} placeholder="e.g. SN-88392" value={sn} onChange={(e) => setSn(e.target.value)} required /></Field>
          <button className={`${btnPrimary} w-full`}>Search Registry</button>
        </form>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-white">For MROs, distributors and airlines</p>
          <p className="text-sm text-slate-400">Register parts, sign lifecycle events and check certificates.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className={btnSecondary}>Dashboard</Link>
          <Link href="/connect" className={btnPrimary}>Connect</Link>
        </div>
      </Card>
    </main>
  );
}
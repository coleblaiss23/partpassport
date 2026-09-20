"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, inputCls } from "./ui";

export default function PartSearch() {
  const [pn, setPn] = useState("");
  const [sn, setSn] = useState("");
  const router = useRouter();

  return (
    <form
      className="mx-auto w-full max-w-3xl"
      onSubmit={(e) => { e.preventDefault(); router.push(`/verify/${encodeURIComponent(pn.trim())}/${encodeURIComponent(sn.trim())}`); }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="sr-only">Part number</span>
          <input className={`${inputCls} h-11 font-mono`} placeholder="Part number" value={pn} onChange={(e) => setPn(e.target.value)} required autoComplete="off" />
        </label>
        <label className="block">
          <span className="sr-only">Serial number</span>
          <input className={`${inputCls} h-11 font-mono`} placeholder="Serial number" value={sn} onChange={(e) => setSn(e.target.value)} required autoComplete="off" />
        </label>
        <button className={`${btnPrimary} h-11 px-6`}>Look up</button>
      </div>
    </form>
  );
}

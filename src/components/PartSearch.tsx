"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, inputCls } from "./ui";

export default function PartSearch({ compact = false }: { compact?: boolean }) {
 const [pn, setPn] = useState("");
 const [sn, setSn] = useState("");
 const router = useRouter();

 return (
 <form
 className="w-full"
 onSubmit={(e) => {
 e.preventDefault();
 router.push(
 `/verify/${encodeURIComponent(pn.trim())}/${encodeURIComponent(sn.trim())}`
 );
 }}
 >
 <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-[1fr_1fr_auto]"}>
 <label className="block">
 <span className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#7C8495]">
 Part number
 </span>
 <input
 className={`${inputCls} h-11 pp-track`}
 placeholder="e.g. APV-7742-101"
 value={pn}
 onChange={(e) => setPn(e.target.value)}
 required
 autoComplete="off"
 />
 </label>
 <label className="block">
 <span className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#7C8495]">
 Serial number
 </span>
 <input
 className={`${inputCls} h-11 pp-track`}
 placeholder="e.g. SN-2026-0491"
 value={sn}
 onChange={(e) => setSn(e.target.value)}
 required
 autoComplete="off"
 />
 </label>
 <div className={compact ? "" : "flex items-end"}>
 <button className={`${btnPrimary} h-11 w-full px-6 sm:w-auto`}>
 Verify serial
 </button>
 </div>
 </div>
 </form>
 );
}

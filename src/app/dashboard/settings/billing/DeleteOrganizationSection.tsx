"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export function DeleteOrganizationSection({ orgName }: { orgName: string }) {
 const router = useRouter();
 const [confirmName, setConfirmName] = useState("");
 const [busy, setBusy] = useState(false);
 const [err, setErr] = useState("");

 async function handleDelete(e: React.FormEvent) {
 e.preventDefault();
 if (confirmName !== orgName) {
 setErr("Name does not match.");
 return;
 }
 setBusy(true);
 const r = await fetch("/api/organization/delete", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ confirm: confirmName }),
 });
 if (r.ok) {
 router.push("/");
 router.refresh();
 } else {
 const j = await r.json().catch(() => ({}));
 setErr(j.error ?? "Failed");
 setBusy(false);
 }
 }

 return (
 <Card className="border-[#9F1239] bg-[#1A0A10] space-y-4">
 <h2 className="text-base font-semibold text-[#FFE4E6]">Danger Zone</h2>
 <p className="text-sm text-[#B0B6C3]">Permanently delete organization and all data.</p>
 <form onSubmit={handleDelete} className="space-y-3 max-w-md">
 <input
 type="text"
 value={confirmName}
 onChange={(e) => setConfirmName(e.target.value)}
 className="w-full rounded border border-[#222A3B] bg-[#12151C] px-3 py-2 text-sm text-white"
 placeholder={orgName}
 />
 {err && <p className="text-xs text-[#FFE4E6]">{err}</p>}
 <button type="submit" disabled={busy || confirmName !== orgName} className="rounded bg-[#9F1239] px-4 py-2 text-sm text-white hover:bg-[#9F1239] disabled:opacity-50">
 {busy ? "Deleting..." : "Delete Organization"}
 </button>
 </form>
 </Card>
 );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useVault } from "@/components/VaultProvider";
import { Badge, Card, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

type Key = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };
type Data = { keys: Key[]; usage: { checks: number; registrations: number }; limits: { name: string; checks: number; registrations: number }; plan: string; maxKeys: number };
const fmt = (n: number) => (n >= 10_000 ? "fair use" : n.toLocaleString());
const when = (s: string | null) => (s ? s.slice(0, 16).replace("T", " ") + " UTC" : "never");

export default function ApiKeysPage() {
 const v = useVault();
 const [d, setD] = useState<Data | null>(null);
 const [name, setName] = useState("");
 const [fresh, setFresh] = useState<{ key: string; name: string } | null>(null);
 const [err, setErr] = useState("");
 const [copied, setCopied] = useState(false);

 const load = useCallback(async () => { const r = await fetch("/api/keys"); if (r.ok) setD(await r.json()); }, []);
 useEffect(() => {
 if (!v.org) return;
 let alive = true;
 fetch("/api/keys").then((r) => (r.ok ? r.json() : null)).then((j) => { if (alive && j) setD(j); }).catch(() => {});
 return () => { alive = false; };
 }, [v.org]);

 async function create(label = name) {
 setErr(""); setCopied(false);
 const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: label }) });
 const j = await r.json();
 if (!r.ok) return setErr(j.error ?? "Could not create key");
 setFresh({ key: j.apiKey, name: j.name }); setName(""); load();
 return j.id as string;
 }
 async function revoke(id: string) {
 setErr("");
 const r = await fetch(`/api/keys/${id}`, { method: "DELETE" });
 const j = await r.json().catch(() => ({}));
 if (!r.ok) setErr(j.error ?? "Could not revoke key");
 load();
 }
 async function roll(k: Key) { if (await create(`${k.name} (rolled)`)) await revoke(k.id); }

 if (v.ready && !v.org)
 return <main className="mx-auto max-w-2xl px-4 py-8"><Card className="space-y-3"><p className="text-[#B0B6C3]">Connect your organization to manage API keys.</p><Link href="/connect" className={btnPrimary}>Connect organization</Link></Card></main>;

 const active = d?.keys.filter((k) => !k.revokedAt).length ?? 0;
 return (
 <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
 <PageHeader title="API keys" subtitle="Use keys to connect your ERP or scripts. Keep them secret." actions={<Link href="/dashboard" className={btnSecondary}>Back</Link>} />
 {fresh && (
 <Card className="space-y-2 border-[#1F6B47]">
 <p className="text-sm font-medium text-white">New key &ldquo;{fresh.name}&rdquo;. Copy it now, it won&apos;t be shown again.</p>
 <code className="block break-all rounded bg-[#0B0F14] p-3 font-mono text-xs text-white">{fresh.key}</code>
 <button className={btnSecondary} onClick={() => { navigator.clipboard.writeText(fresh.key); setCopied(true); }}>{copied ? "Copied" : "Copy key"}</button>
 </Card>
 )}
 <Card className="space-y-3">
 <div className="flex items-center justify-between"><h2 className="font-medium text-white">Your keys</h2><span className="text-xs text-[#7C8495]">{active} of {d?.maxKeys ?? "-"} active on the {d?.limits.name ?? "-"} plan</span></div>
 <div className="flex gap-2">
 <input className={inputCls} placeholder="Key name, e.g. Corridor sync" value={name} onChange={(e) => setName(e.target.value)} />
 <button className={btnPrimary} onClick={() => create()}>Create key</button>
 </div>
 {err && <p className="text-sm text-[#FFE4E6]">{err}</p>}
 <table className="w-full text-left text-sm">
 <thead className="text-xs text-[#7C8495]"><tr><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Key</th><th className="pb-2 font-medium">Last used</th><th /></tr></thead>
 <tbody>
 {d?.keys.map((k) => (
 <tr key={k.id} className="border-t border-[#1F2430]">
 <td className="py-2 pr-2 text-white">{k.name} {k.revokedAt && <Badge tone="red">Revoked</Badge>}</td>
 <td className="py-2 pr-2 font-mono text-xs text-[#B0B6C3]">{k.prefix}…</td>
 <td className="py-2 pr-2 text-xs text-[#B0B6C3]">{when(k.lastUsedAt)}</td>
 <td className="py-2 text-right">{!k.revokedAt && <span className="flex justify-end gap-2"><button className="text-xs text-[#B0B6C3] hover:text-white" onClick={() => roll(k)}>Roll</button><button className="text-xs text-[#FFE4E6] hover:text-[#FFE4E6]" onClick={() => revoke(k.id)}>Revoke</button></span>}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </Card>
 {d && (
 <Card className="space-y-1 text-sm text-[#B0B6C3]">
 <h2 className="font-medium text-white">Usage this month</h2>
 <p>Certificate checks: {d.usage.checks.toLocaleString()} / {fmt(d.limits.checks)}</p>
 <p>Part registrations: {d.usage.registrations.toLocaleString()} / {fmt(d.limits.registrations)}</p>
 <p className="pt-1 text-xs text-[#7C8495]">Rate limits: public verification 60 requests/min per IP, certificate analysis 20/min and batch imports 120 requests/min per organization. Send the key as <span className="font-mono">Authorization: Bearer YOUR_KEY</span>.</p>
 </Card>
 )}
 </main>
 );
}

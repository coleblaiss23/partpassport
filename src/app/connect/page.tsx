"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVault } from "@/components/VaultProvider";
import { Card, Field, PageHeader, btnPrimary, btnSecondary, inputCls } from "@/components/ui";

export default function ConnectPage() {
  const v = useVault();
  const router = useRouter();
  const [f, setF] = useState({ apiKey: "", privateKey: "", passphrase: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try { await v.connect(f.apiKey, f.privateKey, f.passphrase); router.push("/dashboard"); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <PageHeader title="Connect your organization" subtitle="Do this once per device. You won't have to paste keys into every form." />
      {v.org && (
        <Card className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-300">Connected as <span className="font-medium text-white">{v.org.name}</span></p>
          <Link href="/dashboard" className={btnSecondary}>Go to dashboard</Link>
        </Card>
      )}
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="API key" hint="Identifies your organization. Kept in a secure, HTTP-only session cookie."><input className={`${inputCls} font-mono`} type="password" value={f.apiKey} onChange={set("apiKey")} required /></Field>
          <Field label="Private key" hint="Used only in this browser to sign records. It is never sent to our servers."><textarea className={`${inputCls} font-mono`} rows={4} autoComplete="off" value={f.privateKey} onChange={set("privateKey")} required /></Field>
          <Field label="Passphrase" hint="Encrypts your private key on this device (8+ characters). We cannot recover it, so keep it safe."><input className={inputCls} type="password" autoComplete="new-password" value={f.passphrase} onChange={set("passphrase")} required /></Field>
          {err && <p className="rounded-md border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-300">{err}</p>}
          <button className={btnPrimary} disabled={busy}>{busy ? "Connecting…" : "Connect organization"}</button>
        </form>
      </Card>
      <p className="text-xs text-slate-500">Testing locally? Run <code className="font-mono">npm run seed:demo</code> and read <code className="font-mono">demo-credentials.json</code> for demo keys.</p>
    </main>
  );
}

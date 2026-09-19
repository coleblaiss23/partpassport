"use client";
import Link from "next/link";
import { useState } from "react";
import { useVault } from "./VaultProvider";
import { Card, Field, btnPrimary, inputCls } from "./ui";

/** Renders children only when the org is connected and its key is unlocked. */
export default function SigningGate({ children }: { children: React.ReactNode }) {
  const v = useVault();
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  if (!v.ready) return <Card><p className="text-sm text-slate-400">Loading…</p></Card>;
  if (!v.org || !v.hasVault)
    return (
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Connect your organization</h2>
        <p className="text-sm text-slate-400">Connect once with your API key and private key. After that you won&apos;t need to paste them again.</p>
        <Link href="/connect" className={btnPrimary}>Connect organization</Link>
      </Card>
    );
  if (!v.unlocked)
    return (
      <Card>
        <form
          className="space-y-3"
          onSubmit={async (e) => { e.preventDefault(); setErr(""); try { await v.unlock(pass); setPass(""); } catch (x) { setErr((x as Error).message); } }}
        >
          <h2 className="text-lg font-semibold text-white">Unlock signing key</h2>
          <Field label={`Passphrase for ${v.org.name}`}>
            <input type="password" className={inputCls} value={pass} onChange={(e) => setPass(e.target.value)} autoFocus required />
          </Field>
          {err && <p className="text-sm text-rose-400">{err}</p>}
          <button className={btnPrimary}>Unlock</button>
        </form>
      </Card>
    );
  return <>{children}</>;
}

"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { decryptPrivateKey, encryptPrivateKey, privateKeyMatches, type VaultBlob } from "@/lib/keyVault";
import { makeSigner, prepareSignCommit } from "@/lib/signedFlow";

type Org = { id: string; name: string; publicKey: string };
type Ctx = {
  ready: boolean; org: Org | null; hasVault: boolean; unlocked: boolean;
  connect: (apiKey: string, privateKey: string, passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  signOut: () => Promise<void>;
  signedPost: (prepareUrl: string, commitUrl: string, body: object) => Promise<any>;
  sign: (payload: { partId: string; eventHash: string; timestamp: string }) => Promise<string>;
};

const VaultCtx = createContext<Ctx | null>(null);
export const useVault = () => {
  const c = useContext(VaultCtx);
  if (!c) throw new Error("VaultProvider is missing from layout");
  return c;
};
const storeKey = (orgId: string) => `pp_vault_${orgId}`;

// State strategy: the API session lives in an HTTP-only cookie (invisible to scripts).
// The private key is stored encrypted in localStorage and decrypted into memory only (never persisted in plain form).
export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [ready, setReady] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const pem = useRef<string | null>(null);
  const signer = useRef<Awaited<ReturnType<typeof makeSigner>> | null>(null);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => (r.ok ? r.json() : { org: null }))
      .then(({ org }) => { setOrg(org); if (org) setHasVault(!!localStorage.getItem(storeKey(org.id))); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const lock = useCallback(() => { pem.current = null; signer.current = null; setUnlocked(false); }, []);

  const connect: Ctx["connect"] = async (apiKey, privateKey, passphrase) => {
    if (passphrase.length < 8) throw new Error("Passphrase must be at least 8 characters");
    const r = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Could not connect");
    if (!(await privateKeyMatches(privateKey, j.org.publicKey))) {
      await fetch("/api/session", { method: "DELETE" });
      throw new Error("That private key does not belong to this organization");
    }
    localStorage.setItem(storeKey(j.org.id), JSON.stringify(await encryptPrivateKey(privateKey, passphrase)));
    pem.current = privateKey;
    setOrg(j.org); setHasVault(true); setUnlocked(true);
  };

  const unlock: Ctx["unlock"] = async (passphrase) => {
    if (!org) throw new Error("Not connected");
    const blob: VaultBlob = JSON.parse(localStorage.getItem(storeKey(org.id)) ?? "null");
    pem.current = await decryptPrivateKey(blob, passphrase);
    setUnlocked(true);
  };

  const signOut = async () => {
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    if (org) localStorage.removeItem(storeKey(org.id));
    lock(); setOrg(null); setHasVault(false);
  };

  const signedPost: Ctx["signedPost"] = async (prepareUrl, commitUrl, body) => {
    if (!pem.current) throw new Error("Your key is locked. Enter your passphrase to unlock it.");
    return prepareSignCommit({ privateKey: pem.current, prepareUrl, commitUrl, body });
  };

  // Cached key import: much faster when signing thousands of records
  const sign: Ctx["sign"] = async (payload) => {
    if (!pem.current) throw new Error("Your key is locked. Enter your passphrase to unlock it.");
    signer.current ??= await makeSigner(pem.current);
    return signer.current(payload);
  };

  return <VaultCtx.Provider value={{ ready, org, hasVault, unlocked, connect, unlock, lock, signOut, signedPost, sign }}>{children}</VaultCtx.Provider>;
}

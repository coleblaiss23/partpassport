// Browser-side signing. The private key NEVER leaves the user's machine.
export async function signInBrowser(
  payload: { partId: string; eventHash: string; timestamp: string },
  privateKeyPem: string
): Promise<string> {
  const b64 = privateKeyPem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" } as unknown as AlgorithmIdentifier, false, ["sign"]);
  // Must match server-side stableStringify in src/lib/signing.ts
  const msg = new TextEncoder().encode(JSON.stringify(payload, Object.keys(payload).sort()));
  const sig = await crypto.subtle.sign("Ed25519", key, msg);
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/** Authenticates with the session cookie (or an explicit apiKey for scripts). */
export async function prepareSignCommit(o: {
  privateKey: string; prepareUrl: string; commitUrl: string; body: object; apiKey?: string;
}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (o.apiKey) headers.Authorization = `Bearer ${o.apiKey.trim()}`;
  const p = await fetch(o.prepareUrl, { method: "POST", headers, body: JSON.stringify(o.body) });
  const pj = await p.json();
  if (!p.ok) throw new Error(pj.error ?? "Prepare failed");
  const d = pj.draft;
  const signature = await signInBrowser({ partId: d.partId, eventHash: d.eventHash, timestamp: d.timestamp }, o.privateKey);
  const c = await fetch(o.commitUrl, { method: "POST", headers, body: JSON.stringify({ draft: d, signature }) });
  const cj = await c.json();
  if (!c.ok) throw new Error(cj.error ?? "Commit failed");
  return cj;
}

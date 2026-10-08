"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, Field, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { AdminTutorialsPanel } from "./AdminTutorialsPanel";

type Tab = "overview" | "tenants" | "inbox" | "sandbox" | "tutorials";

type Metrics = {
 activeOrganizations: number;
 certificatesScanned: number;
 checksThisMonth: number;
 estimatedMrrUsd: number;
 openLeads: number;
 paidTenants: number;
};

type Health = {
 system: string;
 database: "ok" | "down";
 ocr: { mode: string; message: string; effective: string };
 billing: { stripeCheckout: boolean; devMock: boolean };
 flags: {
 disableRateLimit: boolean;
 aiModeOverride: string | null;
 billingDevMock: boolean | null;
 };
 uptimeSec: number;
 nodeEnv: string;
};

type Tenant = {
 id: string;
 name: string;
 plan: string;
 subStatus: string | null;
 active: boolean;
 verification: string;
 createdAt: string;
 usage: {
 checks: number;
 checksLimit: number;
 registrations: number;
 registrationsLimit: number;
 };
 totals: { checks: number; parts: number };
 mrrUsd: number;
};

type Lead = {
 id: string;
 name: string;
 email: string;
 company: string;
 role: string | null;
 volume: string | null;
 message: string | null;
 source: string | null;
 status: string;
 createdAt: string;
};

const TABS: { id: Tab; label: string }[] = [
 { id: "overview", label: "Overview" },
 { id: "tenants", label: "Tenants" },
 { id: "inbox", label: "Inbox" },
 { id: "tutorials", label: "Tutorials" },
 { id: "sandbox", label: "Sandbox" },
];

function money(n: number) {
 return new Intl.NumberFormat("en-US", {
 style: "currency",
 currency: "USD",
 maximumFractionDigits: 0,
 }).format(n);
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
 return (
 <div className="flex items-center gap-2 border border-[#2c2c2c] bg-[#0a0a0a] px-3 py-2 text-xs">
 <span
 className={`h-2 w-2 ${ok ? "bg-[#1F6B47]" : "bg-[#9F1239]"}`}
 aria-hidden
 />
 <span className="text-[#c8c2b8]">{label}</span>
 <span className={`pp-track ml-auto ${ok ? "text-[#1F6B47]" : "text-[#FFE4E6]"}`}>
 {ok ? "OK" : "DOWN"}
 </span>
 </div>
 );
}

export default function AdminConsole() {
 const [authed, setAuthed] = useState<boolean | null>(null);
 const [token, setToken] = useState("");
 const [loginErr, setLoginErr] = useState("");
 const [busy, setBusy] = useState(false);
 const [tab, setTab] = useState<Tab>("overview");

 const [metrics, setMetrics] = useState<Metrics | null>(null);
 const [health, setHealth] = useState<Health | null>(null);
 const [tenants, setTenants] = useState<Tenant[]>([]);
 const [leads, setLeads] = useState<Lead[]>([]);
 const [webhookConfigured, setWebhookConfigured] = useState(false);
 const [fixtures, setFixtures] = useState<{ id: string; file: string }[]>([]);
 const [flags, setFlags] = useState<Health["flags"] | null>(null);
 const [sandboxOut, setSandboxOut] = useState("");
 const [selectedOrg, setSelectedOrg] = useState("");
 const [stripeEvent, setStripeEvent] = useState("checkout.session.completed");
 const [fixtureId, setFixtureId] = useState("sample-1");
 const [loadErr, setLoadErr] = useState("");

 useEffect(() => {
 let cancelled = false;
 (async () => {
 const r = await fetch("/api/admin/session");
 if (!cancelled) setAuthed(r.ok);
 })();
 return () => {
 cancelled = true;
 };
 }, []);

 async function login(e: React.FormEvent) {
 e.preventDefault();
 setBusy(true);
 setLoginErr("");
 try {
 const r = await fetch("/api/admin/session", {
 method: "POST",
 headers: { "content-type": "application/json" },
 body: JSON.stringify({ token }),
 });
 const j = await r.json();
 if (!r.ok) throw new Error(j.error ?? "Login failed");
 setToken("");
 setAuthed(true);
 } catch (err) {
 setLoginErr((err as Error).message);
 }
 setBusy(false);
 }

 async function logout() {
 await fetch("/api/admin/session", { method: "DELETE" });
 setAuthed(false);
 setMetrics(null);
 setTenants([]);
 setLeads([]);
 }

 const loadOverview = useCallback(async () => {
 const r = await fetch("/api/admin/overview");
 if (!r.ok) throw new Error("Failed to load overview");
 const j = await r.json();
 setMetrics(j.metrics);
 setHealth(j.health);
 setFlags(j.health.flags);
 }, []);

 const loadTenants = useCallback(async () => {
 const r = await fetch("/api/admin/orgs");
 if (!r.ok) throw new Error("Failed to load tenants");
 const j = await r.json();
 setTenants(j.tenants);
 if (!selectedOrg && j.tenants[0]) setSelectedOrg(j.tenants[0].id);
 }, [selectedOrg]);

 const loadInbox = useCallback(async () => {
 const r = await fetch("/api/admin/inbox");
 if (!r.ok) throw new Error("Failed to load inbox");
 const j = await r.json();
 setLeads(j.leads);
 setWebhookConfigured(j.webhookConfigured);
 }, []);

 const loadSandbox = useCallback(async () => {
 const r = await fetch("/api/admin/sandbox");
 if (!r.ok) throw new Error("Failed to load sandbox");
 const j = await r.json();
 setFixtures(j.fixtures);
 setFlags(j.flags);
 }, []);

 useEffect(() => {
 if (!authed) return;
 let cancelled = false;
 (async () => {
 try {
 if (tab === "overview") await loadOverview();
 if (tab === "tenants") await loadTenants();
 if (tab === "inbox") await loadInbox();
 if (tab === "sandbox") {
 await Promise.all([loadSandbox(), loadTenants()]);
 }
 if (!cancelled) setLoadErr("");
 } catch (e) {
 if (!cancelled) setLoadErr((e as Error).message);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [authed, tab, loadOverview, loadTenants, loadInbox, loadSandbox]);

 async function setPlan(id: string, plan: string) {
 const r = await fetch("/api/admin/orgs", {
 method: "PATCH",
 headers: { "content-type": "application/json" },
 body: JSON.stringify({ id, plan }),
 });
 const j = await r.json();
 if (!r.ok) {
 alert(j.error ?? "Update failed");
 return;
 }
 await loadTenants();
 if (tab === "overview") await loadOverview();
 }

 async function setLeadStatus(id: string, status: string) {
 await fetch("/api/admin/inbox", {
 method: "PATCH",
 headers: { "content-type": "application/json" },
 body: JSON.stringify({ id, status }),
 });
 await loadInbox();
 }

 async function sandboxAction(action: string, extra: Record<string, unknown> = {}) {
 setSandboxOut("Running…");
 const r = await fetch("/api/admin/sandbox", {
 method: "POST",
 headers: { "content-type": "application/json" },
 body: JSON.stringify({ action, ...extra }),
 });
 const j = await r.json();
 setSandboxOut(JSON.stringify(j, null, 2));
 if (action === "flags" || action === "flags-reset") {
 setFlags(j.flags);
 await loadOverview().catch(() => {});
 }
 }

 if (authed === null) {
 return (
 <main className="mx-auto max-w-md px-4 py-20">
 <p className="pp-track text-xs text-[#8d877e]">Checking admin session…</p>
 </main>
 );
 }

 if (!authed) {
 return (
 <main className="mx-auto max-w-md space-y-6 px-4 py-16">
 <div>
 <p className="pp-track text-[11px] uppercase tracking-[0.2em] text-[#c8c2b8]">
 Super-admin
 </p>
 <h1 className="mt-2 text-2xl font-semibold text-white">Owner command center</h1>
 <p className="mt-2 text-sm text-[#c8c2b8]">
 Authenticate with <span className="pp-track text-[#c8c2b8]">ADMIN_TOKEN</span> from
 your environment. Sessions are HTTP-only and expire in 8 hours.
 </p>
 </div>
 <Card>
 <form onSubmit={login} className="space-y-4">
 <Field label="Admin token">
 <input
 type="password"
 className={`${inputCls} pp-track`}
 value={token}
 onChange={(e) => setToken(e.target.value)}
 autoComplete="off"
 required
 />
 </Field>
 {loginErr && (
 <p className="border border-[#9F1239] bg-[#1A0A10] p-3 text-sm text-[#FFE4E6]">
 {loginErr}
 </p>
 )}
 <button className={btnPrimary} disabled={busy}>
 {busy ? "Verifying…" : "Unlock console"}
 </button>
 </form>
 </Card>
 </main>
 );
 }

 return (
 <main className="mx-auto max-w-6xl space-y-5 px-4 py-8">
 <div className="flex flex-wrap items-end justify-between gap-3">
 <div>
 <p className="pp-track text-[11px] uppercase tracking-[0.2em] text-[#c8c2b8]">
 Super-admin / owner
 </p>
 <h1 className="mt-1 text-2xl font-semibold text-white">Command center</h1>
 </div>
 <button type="button" className={btnSecondary} onClick={logout}>
 Sign out
 </button>
 </div>

 <div className="flex flex-wrap gap-1 border border-[#2c2c2c] bg-[#111111] p-1">
 {TABS.map((t) => (
 <button
 key={t.id}
 type="button"
 onClick={() => {
 setLoadErr("");
 setTab(t.id);
 }}
 className={`px-3 py-2 text-sm ${
 tab === t.id
 ? "bg-[#171717] text-white"
 : "text-[#c8c2b8] hover:text-white"
 }`}
 >
 {t.label}
 </button>
 ))}
 </div>

 {loadErr && (
 <p className="border border-[#9F1239] bg-[#1A0A10] p-3 text-sm text-[#FFE4E6]">{loadErr}</p>
 )}

 {tab === "overview" && (
 <div className="space-y-4">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <Card>
 <p className="text-xs text-[#8d877e]">Active MRO orgs</p>
 <p className="pp-track mt-1 text-2xl text-white">
 {metrics?.activeOrganizations ?? "—"}
 </p>
 </Card>
 <Card>
 <p className="text-xs text-[#8d877e]">8130-3 / Form 1 scanned</p>
 <p className="pp-track mt-1 text-2xl text-white">
 {metrics?.certificatesScanned ?? "—"}
 </p>
 <p className="mt-1 text-xs text-[#8d877e]">
 {metrics?.checksThisMonth ?? 0} this month
 </p>
 </Card>
 <Card>
 <p className="text-xs text-[#8d877e]">Estimated MRR</p>
 <p className="pp-track mt-1 text-2xl text-white">
 {metrics ? money(metrics.estimatedMrrUsd) : "—"}
 </p>
 <p className="mt-1 text-xs text-[#8d877e]">
 {metrics?.paidTenants ?? 0} paid tenants
 </p>
 </Card>
 <Card>
 <p className="text-xs text-[#8d877e]">Open inbox items</p>
 <p className="pp-track mt-1 text-2xl text-[#B45309]">
 {metrics?.openLeads ?? "—"}
 </p>
 </Card>
 </div>

 <div className="grid gap-3 md:grid-cols-3">
 <StatusDot ok={health?.system === "ok"} label="System health" />
 <StatusDot
 ok={Boolean(health && health.ocr.mode !== "off")}
 label={`OCR engine (${health?.ocr.effective ?? "—"})`}
 />
 <StatusDot ok={health?.database === "ok"} label="Database connection" />
 </div>

 {health && (
 <Card className="space-y-2 text-sm text-[#c8c2b8]">
 <p>
 <span className="text-[#c8c2b8]">OCR:</span> {health.ocr.message}
 </p>
 <p>
 <span className="text-[#c8c2b8]">Billing:</span> Stripe checkout{" "}
 {health.billing.stripeCheckout ? "configured" : "not configured"}
 {" · "}
 Dev mock {health.billing.devMock ? "on" : "off"}
 </p>
 <p className="pp-track text-xs">
 uptime {health.uptimeSec}s · env {health.nodeEnv}
 </p>
 </Card>
 )}
 </div>
 )}

 {tab === "tenants" && (
 <Card className="overflow-x-auto p-0">
 <table className="w-full text-left text-sm">
 <thead className="border-b border-[#2c2c2c] text-xs text-[#8d877e]">
 <tr>
 <th className="px-3 py-2 font-medium">Organization</th>
 <th className="px-3 py-2 font-medium">Plan</th>
 <th className="px-3 py-2 font-medium">Checks (mo)</th>
 <th className="px-3 py-2 font-medium">Regs (mo)</th>
 <th className="px-3 py-2 font-medium">MRR</th>
 <th className="px-3 py-2 font-medium">Actions</th>
 </tr>
 </thead>
 <tbody>
 {tenants.map((t) => (
 <tr key={t.id} className="border-t border-[#2c2c2c]">
 <td className="px-3 py-2">
 <p className="font-medium text-white">{t.name}</p>
 <p className="pp-track text-[10px] text-[#8d877e]">{t.id}</p>
 <div className="mt-1 flex flex-wrap gap-1">
 {!t.active && <Badge tone="red">Inactive</Badge>}
 <Badge tone={t.verification === "VERIFIED" ? "green" : "slate"}>
 {t.verification}
 </Badge>
 {t.subStatus && <Badge tone="blue">{t.subStatus}</Badge>}
 </div>
 </td>
 <td className="px-3 py-2">
 <Badge
 tone={
 t.plan === "ENTERPRISE" ? "green" : t.plan === "PROFESSIONAL" ? "blue" : "slate"
 }
 >
 {t.plan}
 </Badge>
 </td>
 <td className="pp-track px-3 py-2 text-[#c8c2b8]">
 {t.usage.checks}/{t.usage.checksLimit}
 </td>
 <td className="pp-track px-3 py-2 text-[#c8c2b8]">
 {t.usage.registrations}/{t.usage.registrationsLimit >= 10000 ? "∞" : t.usage.registrationsLimit}
 </td>
 <td className="pp-track px-3 py-2 text-[#c8c2b8]">{money(t.mrrUsd)}</td>
 <td className="px-3 py-2">
 <div className="flex flex-wrap gap-1">
 {(["STARTER", "PROFESSIONAL", "ENTERPRISE"] as const)
 .filter((p) => p !== t.plan)
 .map((p) => (
 <button
 key={p}
 type="button"
 className="border border-[#2c2c2c] px-2 py-1 text-[11px] text-[#c8c2b8] hover:border-[#c8c2b8]"
 onClick={() => setPlan(t.id, p)}
 >
 → {p}
 </button>
 ))}
 <button
 type="button"
 className="border border-[#2c2c2c] px-2 py-1 text-[11px] text-[#1F6B47] hover:border-[#1F6B47]"
 onClick={() => navigator.clipboard.writeText(t.id)}
 title="Copy organization ID"
 >
 Copy ID
 </button>
 </div>
 </td>
 </tr>
 ))}
 {tenants.length === 0 && (
 <tr>
 <td colSpan={6} className="px-3 py-8 text-center text-[#8d877e]">
 No organizations registered.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </Card>
 )}

 {tab === "inbox" && (
 <div className="space-y-3">
 <p className="text-xs text-[#8d877e]">
 Lead / request-access submissions
 {webhookConfigured
 ? " · LEAD_WEBHOOK_URL is configured (alerts also fire externally)"
 : " · LEAD_WEBHOOK_URL not set"}
 </p>
 {leads.map((l) => (
 <Card key={l.id} className="space-y-2">
 <div className="flex flex-wrap items-start justify-between gap-2">
 <div>
 <p className="font-medium text-white">
 {l.name}{" "}
 <span className="text-[#8d877e]">· {l.company}</span>
 </p>
 <p className="pp-track text-xs text-[#c8c2b8]">
 {l.email}
 {l.role ? ` · ${l.role}` : ""}
 {l.volume ? ` · vol ${l.volume}` : ""}
 {l.source ? ` · src ${l.source}` : ""}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Badge
 tone={
 l.status === "NEW" || l.status === "OPEN"
 ? "amber"
 : l.status === "CLOSED"
 ? "slate"
 : "green"
 }
 >
 {l.status}
 </Badge>
 <span className="pp-track text-[10px] text-[#8d877e]">
 {l.createdAt.slice(0, 16).replace("T", " ")}
 </span>
 </div>
 </div>
 {l.message && (
 <p className="border border-[#2c2c2c] bg-[#0a0a0a] p-2 text-sm text-[#c8c2b8]">
 {l.message}
 </p>
 )}
 <div className="flex flex-wrap gap-1">
 {["NEW", "OPEN", "IN_PROGRESS", "CLOSED"].map((s) => (
 <button
 key={s}
 type="button"
 disabled={l.status === s}
 className="border border-[#2c2c2c] px-2 py-1 text-[11px] text-[#c8c2b8] hover:border-[#c8c2b8] disabled:opacity-40"
 onClick={() => setLeadStatus(l.id, s)}
 >
 {s}
 </button>
 ))}
 </div>
 </Card>
 ))}
 {leads.length === 0 && (
 <Card>
 <p className="text-sm text-[#8d877e]">No leads or form submissions yet.</p>
 </Card>
 )}
 </div>
 )}

 {tab === "sandbox" && (
 <div className="grid gap-4 lg:grid-cols-2">
 <Card className="space-y-3">
 <h2 className="text-sm font-semibold text-white">OCR fixture runner</h2>
 <p className="text-xs text-[#8d877e]">
 Runs the Deterministic OCR Pipeline against checked-in 8130-3 samples.
 </p>
 <Field label="Fixture">
 <select
 className={inputCls}
 value={fixtureId}
 onChange={(e) => setFixtureId(e.target.value)}
 >
 {fixtures.map((f) => (
 <option key={f.id} value={f.id}>
 {f.id} — {f.file}
 </option>
 ))}
 </select>
 </Field>
 <button
 type="button"
 className={btnPrimary}
 onClick={() => sandboxAction("ocr-fixture", { fixtureId })}
 >
 Run OCR fixture
 </button>
 </Card>

 <Card className="space-y-3">
 <h2 className="text-sm font-semibold text-white">Stripe webhook simulator</h2>
 <p className="text-xs text-[#8d877e]">
 Applies the same interpretStripeEvent patches without a live signature.
 </p>
 <Field label="Organization">
 <select
 className={inputCls}
 value={selectedOrg}
 onChange={(e) => setSelectedOrg(e.target.value)}
 >
 {tenants.map((t) => (
 <option key={t.id} value={t.id}>
 {t.name} ({t.plan})
 </option>
 ))}
 </select>
 </Field>
 <Field label="Event type">
 <select
 className={inputCls}
 value={stripeEvent}
 onChange={(e) => setStripeEvent(e.target.value)}
 >
 <option value="checkout.session.completed">checkout.session.completed</option>
 <option value="customer.subscription.updated">
 customer.subscription.updated
 </option>
 <option value="customer.subscription.deleted">
 customer.subscription.deleted
 </option>
 <option value="invoice.paid">invoice.paid</option>
 <option value="invoice.payment_failed">invoice.payment_failed</option>
 </select>
 </Field>
 <button
 type="button"
 className={btnPrimary}
 disabled={!selectedOrg}
 onClick={() =>
 sandboxAction("stripe-simulate", {
 orgId: selectedOrg,
 eventType: stripeEvent,
 })
 }
 >
 Simulate webhook
 </button>
 </Card>

 <Card className="space-y-3 lg:col-span-2">
 <h2 className="text-sm font-semibold text-white">Dev flags (in-process)</h2>
 <p className="text-xs text-[#8d877e]">
 Toggles apply to this Node process only — reset on restart. Not persisted to .env.
 </p>
 <div className="flex flex-wrap gap-3 text-sm">
 <label className="flex items-center gap-2 text-[#c8c2b8]">
 <input
 type="checkbox"
 checked={flags?.disableRateLimit ?? false}
 onChange={(e) =>
 sandboxAction("flags", {
 flags: { disableRateLimit: e.target.checked },
 })
 }
 />
 Disable rate limits
 </label>
 <Field label="OCR mode override">
 <select
 className={inputCls}
 value={flags?.aiModeOverride ?? ""}
 onChange={(e) =>
 sandboxAction("flags", {
 flags: {
 aiModeOverride: e.target.value === "" ? null : e.target.value,
 },
 })
 }
 >
 <option value="">(follow env)</option>
 <option value="local">local</option>
 <option value="anthropic">anthropic</option>
 <option value="off">off</option>
 </select>
 </Field>
 <Field label="Billing dev mock">
 <select
 className={inputCls}
 value={
 flags?.billingDevMock === null || flags?.billingDevMock === undefined
 ? ""
 : flags.billingDevMock
 ? "1"
 : "0"
 }
 onChange={(e) =>
 sandboxAction("flags", {
 flags: {
 billingDevMock:
 e.target.value === "" ? null : e.target.value === "1",
 },
 })
 }
 >
 <option value="">(follow env)</option>
 <option value="1">force on</option>
 <option value="0">force off</option>
 </select>
 </Field>
 <button
 type="button"
 className={btnSecondary}
 onClick={() => sandboxAction("flags-reset")}
 >
 Reset flags
 </button>
 </div>
 </Card>

 {sandboxOut && (
 <Card className="lg:col-span-2">
 <p className="mb-2 text-xs text-[#8d877e]">Sandbox output</p>
 <pre className="max-h-80 overflow-auto border border-[#2c2c2c] bg-[#0a0a0a] p-3 pp-track text-[11px] text-[#c8c2b8] whitespace-pre-wrap">
 {sandboxOut}
 </pre>
 </Card>
 )}
 </div>
 )}

 {tab === "tutorials" && <AdminTutorialsPanel />}
 </main>
 );
}

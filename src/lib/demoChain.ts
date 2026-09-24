import { computeEventHash } from "./hashChain";
import { generateKeypair, signPayload } from "./signing";
import { checkChain, type ChainEvent } from "./chainCheck";
import type { VerifyResult } from "./verifyChain";

// A fictional part history that is signed and verified for real on every request, with no database.
// The keys are generated in memory at startup and never leave the process.
const PART_ID = "demo-fuel-control-unit";
const PN = "881-2001-04";
const SN = "FCU-77120";
const ORGS = [
 { id: "demo-org-1", name: "Ridgeline Aero Repair", verified: true },
 { id: "demo-org-2", name: "Northfield Parts Supply", verified: true },
 { id: "demo-org-3", name: "Skyward Air Cargo", verified: false },
].map((o) => ({ ...o, ...generateKeypair() }));

const STEPS: { org: number; type: string; data: Record<string, unknown> }[] = [
 { org: 0, type: "CREATED", data: { partNumber: PN, serialNumber: SN, description: "Fuel control unit", notes: "Received from teardown with 8130-3 attached" } },
 { org: 0, type: "INSPECTED", data: { notes: "Incoming inspection. Records match part markings." } },
 { org: 0, type: "OVERHAULED", data: { notes: "Overhauled per component maintenance manual." } },
 { org: 0, type: "SOLD", data: { toOrganizationId: ORGS[1].id, notes: "Sold with release certificate." } },
 { org: 1, type: "INSPECTED", data: { notes: "Receiving inspection. Certificate and history reviewed." } },
 { org: 1, type: "SOLD", data: { toOrganizationId: ORGS[2].id } },
 { org: 2, type: "INSTALLED", data: { notes: "Installed on fleet aircraft." } },
];

function build() {
 let prev: string | null = null;
 return STEPS.map((s, i): ChainEvent & { org: (typeof ORGS)[number] } => {
 const org = ORGS[s.org];
 const timestamp = new Date(Date.UTC(2026, 2, 2 + i * 6, 14, 20));
 const data = JSON.stringify(s.data);
 const eventHash = computeEventHash({ partId: PART_ID, organizationId: org.id, seq: i + 1, eventType: s.type, timestamp: timestamp.toISOString(), prevEventHash: prev, data, certificateHash: null });
 const signature = signPayload({ partId: PART_ID, eventHash, timestamp: timestamp.toISOString() }, org.privateKey);
 const ev = { id: `demo-${i + 1}`, partId: PART_ID, organizationId: org.id, seq: i + 1, eventType: s.type, timestamp, prevEventHash: prev, eventHash, signature, data, certificateHash: null, publicKey: org.publicKey, org };
 prev = eventHash;
 return ev;
 });
}
const BASE = build();

/** Same shape as a real lookup, computed live. With tamper=true one event is edited after signing. */
export function demoResult(tamper: boolean): VerifyResult {
 const events = BASE.map((e, i) => (tamper && i === 4 ? { ...e, data: JSON.stringify({ notes: "Receiving inspection. Certificate and history reviewed. Edited after signing." }) } : e));
 const chain = checkChain(events);
 return {
 partNumber: PN, serialNumber: SN, description: "Fuel control unit (fictional sample)", scrapped: false, custodian: ORGS[2].name,
 isLifeLimited: true,
 totalTimeHours: 4200,
 totalCycles: 1850,
 lifeLimitHours: 8000,
 lifeLimitCycles: 5000,
 custodyStatus: "SERVICEABLE",
 birthCertificateHash: "9f2c41d0a7e35b18c6d94f0e2a7b53c8d1e6f4a90b2c7d5e83f1a6b4c09d7e21",
 safetyFlags: [], eventsCount: events.length, truncated: false,
 events: events.map((e) => ({
 id: e.id, seq: e.seq, eventType: e.eventType, timestamp: e.timestamp.toISOString(), eventHash: e.eventHash,
 prevEventHash: e.prevEventHash, signature: e.signature, data: e.data, certificateHash: null,
 organization: { id: e.org.id, name: e.org.name, verified: e.org.verified },
 })),
 ...chain,
 } as VerifyResult;
}

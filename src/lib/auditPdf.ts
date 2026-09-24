import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { VerifyResult } from "./verifyChain";

const safe = (s: unknown) => String(s ?? "").replace(/[^\x20-\x7E]/g, "?");
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "~" : s);
const notes = (data: string) => { try { const d = JSON.parse(data); return typeof d.notes === "string" ? d.notes : ""; } catch { return ""; } };

/** One-click audit package: part identity, chain verdict, safety matches, and the full event log. */
export async function buildAuditPdf(r: VerifyResult, verifyUrl: string): Promise<Uint8Array> {
 const pdf = await PDFDocument.create();
 const reg = await pdf.embedFont(StandardFonts.Helvetica);
 const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
 const mono = await pdf.embedFont(StandardFonts.Courier);
 const W = 612, H = 792, M = 40;
 const grey = rgb(0.4, 0.4, 0.45), ink = rgb(0.08, 0.1, 0.14);
 let page = pdf.addPage([W, H]);
 let y = H - M;

 const mark = () => page.drawText("PartPassport | VERIFICATION LOG", { x: 70, y: 260, size: 42, font: bold, color: rgb(0.94, 0.94, 0.95), rotate: degrees(35) });
 mark();
 const ensure = (need: number) => { if (y - need < 70) { page = pdf.addPage([W, H]); mark(); y = H - M; } };
 const text = (t: string, o: { x?: number; size?: number; font?: typeof reg; color?: ReturnType<typeof rgb> } = {}) =>
 page.drawText(safe(t), { x: o.x ?? M, y, size: o.size ?? 10, font: o.font ?? reg, color: o.color ?? ink });

 text("Audit Package", { size: 22, font: bold }); y -= 20;
 text(`Part ${r.partNumber} / Serial ${r.serialNumber}`, { size: 12, font: bold }); y -= 16;
 if (r.description) { text(clip(r.description, 90), { color: grey }); y -= 14; }

 y -= 6;
 const ok = r.valid;
 page.drawRectangle({ x: M, y: y - 26, width: W - 2 * M, height: 30, color: ok ? rgb(0.88, 0.97, 0.92) : rgb(0.99, 0.9, 0.9), borderColor: ok ? rgb(0.2, 0.65, 0.4) : rgb(0.8, 0.2, 0.2), borderWidth: 1 });
 y -= 18;
 text(ok ? `RECORD CHAIN INTACT (${r.eventsCount} events, all hashes and signatures check out)` : `RECORD CHAIN FAILED: ${"reason" in r ? r.reason : "UNKNOWN"}`, { x: M + 10, font: bold, size: 11 });
 y -= 24;

 text(`Current custodian: ${r.custodian ?? "unknown"} Status: ${r.scrapped ? "SCRAPPED" : "active"}`, { color: grey }); y -= 14;
 text(`Generated: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC Live verification: ${clip(verifyUrl, 70)}`, { size: 8, color: grey }); y -= 20;

 if (r.safetyFlags.length) {
 ensure(20 + r.safetyFlags.length * 12);
 text(`Safety data matches (${r.safetyFlags.length})`, { font: bold, size: 11 }); y -= 14;
 for (const f of r.safetyFlags) { ensure(14); text(`${f.source} ${f.referenceId}: ${clip(f.description, 95)}`, { size: 9 }); y -= 12; }
 y -= 8;
 }

 ensure(40);
 text("Event log", { font: bold, size: 11 }); y -= 14;
 const cols = [M, M + 24, M + 118, M + 190, M + 330];
 ["#", "Date (UTC)", "Event", "Organization", "Event hash / signature"].forEach((h, i) => text(h, { x: cols[i], size: 8, font: bold, color: grey }));
 y -= 12;
 for (const e of r.events) {
 ensure(34);
 text(String(e.seq), { x: cols[0], size: 8 });
 text(e.timestamp.replace("T", " ").slice(0, 16), { x: cols[1], size: 8 });
 text(e.eventType, { x: cols[2], size: 8, font: bold });
 text(clip(e.organization.name + (e.organization.verified ? " (verified)" : ""), 24), { x: cols[3], size: 8 });
 text(e.eventHash.slice(0, 24), { x: cols[4], size: 7, font: mono });
 y -= 9;
 const n = notes(e.data);
 if (n) text(clip(n, 60), { x: cols[2], size: 7, color: grey });
 text("sig " + e.signature.slice(0, 20), { x: cols[4], size: 7, font: mono, color: grey });
 y -= 12;
 }
 if (r.truncated) { ensure(14); text(`Showing the latest ${r.events.length} of ${r.eventsCount} events. All events were verified.`, { size: 8, color: grey }); y -= 12; }

 const pages = pdf.getPages();
 pages.forEach((p, i) => {
 p.drawText(safe("PartPassport provides cryptographic record integrity and does not certify airworthiness. It is not an FAA or EASA approved document."), { x: M, y: 40, size: 7, font: reg, color: grey });
 p.drawText(`Page ${i + 1} of ${pages.length}`, { x: W - M - 50, y: 28, size: 7, font: reg, color: grey });
 });
 return pdf.save();
}

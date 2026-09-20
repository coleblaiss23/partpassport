// npm run loadtest -- [--url http://localhost:3000] [--c 20] [--s 15]
// Hammers the public verify API with random parts from bulk-sample.json. Start the server with DISABLE_RATE_LIMIT=1.
import { readFileSync, existsSync } from "fs";

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const url = arg("url", "http://localhost:3000").replace(/\/$/, "");
const C = Number(arg("c", "20")), S = Number(arg("s", "15"));
if (!existsSync("bulk-sample.json")) { console.error("bulk-sample.json not found. Run: npm run seed:bulk"); process.exit(1); }
const sample: [string, string][] = JSON.parse(readFileSync("bulk-sample.json", "utf8"));

(async () => {
  const lat: number[] = [];
  const status: Record<string, number> = {};
  const end = Date.now() + S * 1000;
  console.log(`Load test: ${C} workers for ${S}s against ${url}/api/verify/... (${sample.length} sample parts)`);
  await Promise.all(Array.from({ length: C }, async () => {
    while (Date.now() < end) {
      const [pn, sn] = sample[Math.floor(Math.random() * sample.length)];
      const t = performance.now();
      try {
        const r = await fetch(`${url}/api/verify/${encodeURIComponent(pn)}/${encodeURIComponent(sn)}`);
        const body = await r.json().catch(() => ({}));
        await r.text().catch(() => {});
        const key = r.status === 200 && body.valid !== true ? "200-but-not-valid" : String(r.status);
        status[key] = (status[key] ?? 0) + 1;
      } catch { status.network_error = (status.network_error ?? 0) + 1; }
      lat.push(performance.now() - t);
    }
  }));
  lat.sort((a, b) => a - b);
  const q = (p: number) => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))]?.toFixed(0) ?? "-";
  console.log(`\nRequests: ${lat.length}  (${(lat.length / S).toFixed(1)} req/s)`);
  console.log(`Latency ms: p50 ${q(0.5)}  p95 ${q(0.95)}  p99 ${q(0.99)}  max ${lat[lat.length - 1]?.toFixed(0)}`);
  console.log("Status:", status);
  const bad = Object.entries(status).filter(([k]) => k !== "200").reduce((n, [, v]) => n + v, 0);
  console.log(bad ? `\n${bad} non-200 responses. Check the server logs.` : "\nAll responses were 200 and every history verified as valid.");
  process.exit(bad ? 1 : 0);
})();

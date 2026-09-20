// npm run smoke   (server must be running)   BASE_URL=https://yourdomain.com npm run smoke
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const routes: [string, number[]][] = [
  ["/", [200]], ["/pricing", [200]], ["/terms", [200]], ["/privacy", [200]], ["/legal", [200]], ["/sample-report", [200]],
  ["/request-access", [200]], ["/connect", [200]], ["/dashboard/check", [200]], ["/dashboard/parts/new", [200]],
  ["/dashboard/events/new", [200]], ["/dashboard/import", [200]], ["/dashboard/settings/api-keys", [200]],
  ["/dashboard", [200, 302, 303, 307, 308]], // redirects to /connect when signed out
  ["/verify/NOT-A-PART/000", [200]], ["/api/health", [200]], ["/api/ai-status", [200]], ["/api/session", [401]],
  ["/robots.txt", [200]], ["/sitemap.xml", [200]],
];
(async () => {
  let failed = 0;
  for (const [path, ok] of routes) {
    const t = performance.now();
    const r = await fetch(BASE + path, { redirect: "manual" }).catch(() => null);
    const pass = !!r && ok.includes(r.status);
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"}  ${String(r?.status ?? "ERR").padEnd(4)} ${path.padEnd(32)} ${(performance.now() - t).toFixed(0)}ms`);
  }
  const hdr = (await fetch(BASE + "/").catch(() => null))?.headers;
  const hasHeaders = !!hdr?.get("x-content-type-options") && !!hdr?.get("x-frame-options");
  console.log(`${hasHeaders ? "PASS" : "FAIL"}  security headers present`);
  if (!hasHeaders) failed++;
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll routes healthy");
  process.exit(failed ? 1 : 0);
})();

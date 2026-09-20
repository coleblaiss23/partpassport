// In-memory limiter by default. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for limits shared across all servers.
const hits = new Map<string, number[]>();

function memory(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  return true;
}

export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  if (process.env.DISABLE_RATE_LIMIT === "1") return true; // load testing only; never in production
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return memory(key, max, windowMs);
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", `rl:${key}`], ["PEXPIRE", `rl:${key}`, String(windowMs), "NX"]]),
      signal: AbortSignal.timeout(1500),
    });
    const count = Number((await r.json())?.[0]?.result);
    return Number.isFinite(count) ? count <= max : memory(key, max, windowMs);
  } catch { return memory(key, max, windowMs); }
}

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";

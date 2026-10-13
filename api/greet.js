import { kv } from "@vercel/kv";

// ---- shared hardening helpers (public endpoint) ----
const PUBLIC_ORIGINS = new Set([
  "https://tylerjanczak.com",
  "https://www.tylerjanczak.com",
  "https://bridges.tylerjanczak.com",
  "https://tylerjanczak.github.io",
  "https://tylerjanczak-github-io.vercel.app"
]);

function setCors(req, res, methods, headers) {
  const origin = req.headers.origin;
  if (origin && PUBLIC_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", headers);
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function ipOf(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}

// true = under the limit. On a counter-store error, fails OPEN so a KV
// hiccup never breaks the visitor-facing site.
async function underLimit(bucket, id, limit, windowSec) {
  try {
    const key = `rl_${bucket}_${id}`;
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, windowSec);
    return n <= limit;
  } catch (err) {
    console.error("Rate limiter unavailable:", err);
    return true;
  }
}

// Public endpoint — resolves a personal-link code (?c=...) to the greeting
// name Tyler typed in the dashboard. Returns only name/company/note.
// Unknown, revoked and malformed codes all get the same { found:false }
// response so codes can't be probed. No IP is kept long-term; the rate-limit
// counter expires after 60 seconds.

const CODE_RE = /^[A-Za-z0-9_-]{6,24}$/;
const LIMIT_PER_MINUTE = 30;

export default async function handler(req, res) {
  setCors(req, res, "GET, OPTIONS", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const miss = () => res.status(200).json({ found: false });

  try {
    const code = typeof req.query?.c === "string" ? req.query.c : "";
    if (!CODE_RE.test(code)) return miss();

    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const rlKey = `greet_rl_${ip}`;
    const hits = await kv.incr(rlKey);
    if (hits === 1) await kv.expire(rlKey, 60);
    if (hits > LIMIT_PER_MINUTE) return res.status(429).json({ found: false });

    const raw = await kv.hget("greet_links", code);
    if (!raw) return miss();
    const record = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (record.status !== "active") return miss();
    if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) return miss();

    // Count the open only when the page says it's the first lookup this
    // session (?first=1), so reloads don't inflate the number.
    if (req.query?.first === "1") {
      const now = new Date().toISOString();
      record.opens = (record.opens || 0) + 1;
      record.firstOpened = record.firstOpened || now;
      record.lastOpened = now;
      await kv.hset("greet_links", { [code]: JSON.stringify(record) });
    }

    return res.status(200).json({
      found: true,
      name: record.name || "",
      company: record.company || "",
      note: record.note || "",
      permission: record.permission || "GUEST",
      template: record.template || "PROD_VIEW"
    });
  } catch (err) {
    console.error("greet failed:", err);
    return miss();
  }
}

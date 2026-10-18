// api/tip.js — creates a Stripe PaymentIntent for the tip jar ($1, $2 or $3).
// Env: STRIPE_SECRET_KEY (required; sk_test_... while testing, sk_live_... when real).
// The secret key lives only in Vercel; the page only ever holds the public (pk_) key.
import { kv } from "@vercel/kv";

const PUBLIC_ORIGINS = new Set([
  "https://tylerjanczak.com",
  "https://www.tylerjanczak.com",
  "https://tylerjanczak.github.io"
]);
const ALLOWED = new Set([1, 2, 3]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && PUBLIC_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (origin && !PUBLIC_ORIGINS.has(origin)) return res.status(403).json({ error: "Forbidden" });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: "Tipping isn't switched on yet." });

  // Only whole-dollar tips of $1, $2 or $3 — the amount is decided here, never trusted from the page beyond this choice.
  const dollars = Number(req.body?.amount);
  if (!ALLOWED.has(dollars)) return res.status(400).json({ error: "Invalid amount." });

  try {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    try {
      const rl = `rl_tip_${ip}`;
      const n = await kv.incr(rl);
      if (n === 1 || (await kv.ttl(rl)) < 0) await kv.expire(rl, 600);
      if (n > 15) return res.status(429).json({ error: "Too many attempts. Please try again in a few minutes." });
    } catch (e) { console.error("tip rate limit unavailable", e); }

    const body = new URLSearchParams();
    body.set("amount", String(dollars * 100));
    body.set("currency", "usd");
    body.set("description", "Tip jar");
    body.set("automatic_payment_methods[enabled]", "true"); // which methods appear is managed in the Stripe Dashboard
    body.set("metadata[source]", "tylerjanczak.com tip jar");

    const r = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.client_secret) {
      console.error("Stripe error", r.status, data?.error?.message || data?.error?.code);
      return res.status(502).json({ error: "Couldn't start the payment. Please try again." });
    }
    return res.status(200).json({ clientSecret: data.client_secret });
  } catch (err) {
    console.error("tip failed", err);
    return res.status(500).json({ error: "Couldn't start the payment. Please try again." });
  }
}

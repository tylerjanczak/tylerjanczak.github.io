import { kv } from "@vercel/kv";
import { Readable } from "node:stream";

const PUBLIC_ORIGINS = new Set([
  "https://tylerjanczak.com",
  "https://www.tylerjanczak.com",
  "https://bridges.tylerjanczak.com",
  "https://tylerjanczak.github.io",
  "https://tylerjanczak-github-io.vercel.app"
]);

const MAX_CHARS = 1200; // one chat reply; keeps cost and latency small

function ipInCidr(ip, cidr) {
  try {
    const [range, bitsStr] = String(cidr).split("/");
    const bits = Number(bitsStr);
    const toInt = (a) => a.split(".").reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) || !/^\d+\.\d+\.\d+\.\d+$/.test(range)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (toInt(ip) & mask) === (toInt(range) & mask);
  } catch { return false; }
}

// Turn a chat reply into clean speakable text: no markdown, links, emails or URLs.
function speakable(raw) {
  return String(raw || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "")
    .replace(/[*_`#>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && PUBLIC_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (origin && !PUBLIC_ORIGINS.has(origin)) return res.status(403).json({ error: "Forbidden" });

  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) return res.status(503).json({ error: "Voice is not set up yet." });

  const text = speakable(req.body?.text).slice(0, MAX_CHARS);
  if (text.length < 2) return res.status(400).json({ error: "Nothing to read." });

  try {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const fingerprint = typeof req.body?.fingerprint === "string" ? req.body.fingerprint.slice(0, 200) : null;

    // Same switches as the chat: disabled chat, maintenance mode and bans all silence the voice.
    const [chatStored, maintStored, bannedIp, ranges, bannedFp] = await Promise.all([
      kv.get("tyler_ai_chat_enabled"),
      kv.get("site_maintenance_enabled"),
      kv.sismember("banned_ips", ip),
      kv.smembers("banned_ranges"),
      fingerprint ? kv.sismember("banned_fingerprints", fingerprint) : Promise.resolve(false)
    ]);
    const chatOff = chatStored === "false" || chatStored === false;
    const maint = maintStored === "true" || maintStored === true;
    const blocked = bannedIp || bannedFp || (ranges || []).some((r) => ipInCidr(ip, r));
    if (chatOff || maint || blocked) return res.status(403).json({ error: "Voice is unavailable." });

    // Per-visitor limit (fails open on a KV hiccup) and a global daily character budget (fails closed: it protects spend).
    try {
      const rl = `rl_tts_${ip}`;
      const n = await kv.incr(rl);
      if (n === 1) await kv.expire(rl, 600);
      if (n > 25) return res.status(429).json({ error: "Too many voice requests. Try again in a few minutes." });
    } catch (e) { console.error("tts rate limit unavailable", e); }

    const budget = Number(process.env.TTS_DAILY_CHAR_BUDGET) || 150000;
    const day = new Date().toISOString().slice(0, 10);
    const bKey = `tts_chars_${day}`;
    const used = await kv.incrby(bKey, text.length);
    if (used === text.length) await kv.expire(bKey, 172800);
    if (used > budget) return res.status(429).json({ error: "Voice is resting for today." });

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}/stream?output_format=mp3_44100_64`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5" })
      }
    );
    if (!upstream.ok || !upstream.body) {
      console.error("ElevenLabs error", upstream.status, await upstream.text().catch(() => ""));
      return res.status(502).json({ error: "Voice is unavailable right now." });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200);
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error("tts failed", err);
    if (!res.headersSent) return res.status(500).json({ error: "Voice is unavailable right now." });
  }
}

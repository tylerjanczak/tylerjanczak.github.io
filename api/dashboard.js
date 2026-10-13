import { kv } from "@vercel/kv";
import { randomBytes, webcrypto, createHash } from "crypto";

// ---- Device-bound session check (identical copy lives in webauthn.js,
// dashboard.js, chat-config.js and knowledge-base.js) --------------------
// A session token alone is NOT enough. At sign-in the browser creates a
// non-extractable signing key and registers its public half with the
// session; every request must carry a fresh one-time signature:
//   X-Dashboard-Proof: <timestamp-ms>.<nonce>.<signature, base64url>
//   signature = ECDSA-P256-SHA256 over:
//     METHOD \n /path?query \n timestamp \n nonce \n sha256(token)
// A copied token is useless without the original browser's key.
const MAX_SKEW_MS = 60 * 1000;
const NONCE_TTL_SECONDS = 180;

const b64urlToBuf = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

function isValidPublicJwk(jwk) {
  return Boolean(
    jwk &&
      typeof jwk === "object" &&
      jwk.kty === "EC" &&
      jwk.crv === "P-256" &&
      typeof jwk.x === "string" && jwk.x.length <= 100 &&
      typeof jwk.y === "string" && jwk.y.length <= 100 &&
      jwk.d === undefined
  );
}

// Verifies the proof for `token`. Returns true/false, never throws.
async function verifyProof(req, token) {
  try {
    if (typeof token !== "string" || token.length < 20 || token.length > 100) return false;

    const raw = await kv.get(`webauthn_session_${token}`);
    if (!raw) return false;
    const record = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!record || !isValidPublicJwk(record.pk)) return false; // old/unbound sessions are refused

    const header = req.headers["x-dashboard-proof"];
    if (typeof header !== "string" || header.length > 400) return false;
    const [ts, nonce, sig] = header.split(".");
    if (!ts || !nonce || !sig || nonce.length < 16 || nonce.length > 64) return false;

    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > MAX_SKEW_MS) return false;

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const message = `${req.method}\n${req.url}\n${ts}\n${nonce}\n${tokenHash}`;

    const key = await webcrypto.subtle.importKey(
      "jwk",
      { kty: "EC", crv: "P-256", x: record.pk.x, y: record.pk.y, ext: true },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );

    const ok = await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      b64urlToBuf(sig),
      new TextEncoder().encode(message)
    );
    if (!ok) return false;

    // One-time use: reject if this nonce was already seen.
    const fresh = await kv.set(`proof_nonce_${tokenHash.slice(0, 16)}_${nonce}`, "1", {
      nx: true,
      ex: NONCE_TTL_SECONDS
    });
    return fresh === "OK" || fresh === true;
  } catch (err) {
    console.error("Session proof check failed:", err);
    return false;
  }
}

// Drop-in replacement for each endpoint's old requireSession().
// Sends the 401 itself and returns null on failure; returns the token on success.
async function requireSession(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }

  if (!(await verifyProof(req, token))) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return null;
  }

  return token;
}


const KEYS = {
  conversation: "tyler_ai_conversations",
  resume: "tyler_ai_resume_requests",
  callRequest: "tyler_ai_call_requests",
  intake: "visitor_intake_log"
};

function parseEntries(entries) {
  return (entries || []).map((entry) => {
    try {
      return typeof entry === "string" ? JSON.parse(entry) : entry;
    } catch {
      return { raw: entry };
    }
  });
}

async function handleData(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const [rawConversations, rawResumeRequests, rawMaintenanceLog, rawFlagged, bannedIps, bannedRanges, bannedFingerprints, rawInjectionAttempts, rawCallRequests, rawIntakeLog, rawA11yIssues, rawGreetLinks] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 199),
      kv.lrange("tyler_ai_resume_requests", 0, 199),
      kv.lrange("site_maintenance_log", 0, 49),
      kv.lrange("flagged_conversations", 0, 49),
      kv.smembers("banned_ips"),
      kv.smembers("banned_ranges"),
      kv.smembers("banned_fingerprints"),
      kv.lrange("injection_attempts", 0, 49),
      kv.lrange("tyler_ai_call_requests", 0, 99),
      kv.lrange("visitor_intake_log", 0, 99),
      kv.hgetall("a11y_issues"),
      kv.hgetall("greet_links")
    ]);

    const greetLinks = Object.values(rawGreetLinks || {})
      .map((value) => {
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    const a11yIssues = Object.entries(rawA11yIssues || {})
      .map(([signature, value]) => {
        try {
          const record = typeof value === "string" ? JSON.parse(value) : value;
          return { signature, ...record };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

    return res.status(200).json({
      success: true,
      conversations: parseEntries(rawConversations),
      resumeRequests: parseEntries(rawResumeRequests),
      maintenanceLog: parseEntries(rawMaintenanceLog),
      flaggedConversations: parseEntries(rawFlagged),
      bannedIps: bannedIps || [],
      bannedRanges: bannedRanges || [],
      bannedFingerprints: bannedFingerprints || [],
      injectionAttempts: parseEntries(rawInjectionAttempts),
      callRequests: parseEntries(rawCallRequests),
      intakeLog: parseEntries(rawIntakeLog),
      a11yIssues,
      greetLinks
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleDelete(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { type, index } = req.body;
    const key = KEYS[type];

    if (!key || typeof index !== "number") {
      return res.status(400).json({ error: "Invalid delete request." });
    }

    const rawEntries = await kv.lrange(key, 0, -1);

    if (!Array.isArray(rawEntries) || index < 0 || index >= rawEntries.length) {
      return res.status(400).json({ error: "Entry not found." });
    }

    const remaining = rawEntries.filter((_, i) => i !== index);

    await kv.del(key);

    for (const entry of remaining.slice().reverse()) {
      await kv.lpush(key, entry);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleBanIp(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip, reason } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    await kv.sadd("banned_ips", ip);
    await kv.del(`ip_cooldown_${ip}`);

    await kv.lpush(
      "ip_ban_log",
      JSON.stringify({
        id: crypto.randomUUID(),
        ip,
        reason: reason || "Manually banned from dashboard",
        timestamp: new Date().toISOString()
      })
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

function getSlash24(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

async function handleBanRange(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip, reason } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    const range = getSlash24(ip);

    if (!range) {
      return res.status(400).json({ error: "Could not determine a subnet for that IP." });
    }

    await kv.sadd("banned_ranges", range);

    await kv.lpush(
      "ip_ban_log",
      JSON.stringify({
        id: crypto.randomUUID(),
        ip: range,
        reason: reason || `Subnet ban from dashboard (based on ${ip})`,
        timestamp: new Date().toISOString()
      })
    );

    return res.status(200).json({ success: true, range });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleUnbanRange(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { range } = req.body;

    if (!range || typeof range !== "string") {
      return res.status(400).json({ error: "No range provided." });
    }

    await kv.srem("banned_ranges", range);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleBanFingerprint(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { fingerprint, reason } = req.body;

    if (!fingerprint || typeof fingerprint !== "string") {
      return res.status(400).json({ error: "No fingerprint provided." });
    }

    await kv.sadd("banned_fingerprints", fingerprint);

    await kv.lpush(
      "ip_ban_log",
      JSON.stringify({
        id: crypto.randomUUID(),
        ip: `fingerprint:${fingerprint.slice(0, 12)}...`,
        reason: reason || "Manually banned from dashboard (device fingerprint)",
        timestamp: new Date().toISOString()
      })
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleUnbanFingerprint(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { fingerprint } = req.body;

    if (!fingerprint || typeof fingerprint !== "string") {
      return res.status(400).json({ error: "No fingerprint provided." });
    }

    await kv.srem("banned_fingerprints", fingerprint);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleUnbanIp(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    // Clear the ban and their strike count together, so unbanning gives
    // a genuine clean slate rather than leaving them one strike from
    // an instant re-ban on their very next message.
    await kv.srem("banned_ips", ip);
    await kv.del(`ip_strikes_${ip}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleResetStrikes(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    await kv.del(`ip_strikes_${ip}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleAnalysis(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const [rawConversations, rawResumeRequests] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 99),
      kv.lrange("tyler_ai_resume_requests", 0, 99)
    ]);

    const conversations = parseEntries(rawConversations);
    const resumeRequests = parseEntries(rawResumeRequests);

    if (conversations.length === 0) {
      return res.status(200).json({
        success: true,
        analysis: "Not enough conversation data yet to generate a meaningful analysis. Check back once a few visitors have used Tyler AI."
      });
    }

    const conversationText = conversations
      .map((c, i) => `${i + 1}. Q: "${c.question}"\n   A: "${c.answer}"\n   Page: ${c.page || "unknown"}`)
      .join("\n\n");

    const prompt = `You are analyzing visitor conversations from a chatbot on Tyler Janczak's professional portfolio website. Below are up to 100 of the most recent visitor questions and the AI's answers, plus the count of resume requests.

Total conversations: ${conversations.length}
Total resume requests: ${resumeRequests.length}

Conversations:
${conversationText}

Provide a concise, practical analysis for Tyler (the portfolio owner) covering:
1. The most common topics or themes visitors are asking about
2. Any signs of high-intent visitors (recruiters, hiring managers) based on question patterns
3. Any questions the AI seemed unable to answer well, or gaps in the portfolio content that visitors are asking about
4. One or two concrete, actionable suggestions for improving the portfolio or the AI's knowledge base based on this data

Keep the total response under 200 words, written directly to Tyler in a helpful, direct tone. Use short paragraphs or a brief list, not headers.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await response.json();

    let analysisText = data.output_text;
    if (!analysisText && Array.isArray(data.output)) {
      const messageItem = data.output.find((item) => item.type === "message");
      const textPart = messageItem?.content?.find((c) => c.type === "output_text");
      analysisText = textPart?.text;
    }

    return res.status(200).json({
      success: true,
      analysis: analysisText || "Could not generate an analysis right now."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleA11yResolve(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { signature, status } = req.body;

    if (!signature || typeof signature !== "string") {
      return res.status(400).json({ error: "No issue signature provided." });
    }

    const raw = await kv.hget("a11y_issues", signature);
    if (!raw) {
      return res.status(404).json({ error: "Issue not found." });
    }

    const record = typeof raw === "string" ? JSON.parse(raw) : raw;
    record.status = status === "open" ? "open" : "resolved";
    record.resolvedAt = record.status === "resolved" ? new Date().toISOString() : null;

    await kv.hset("a11y_issues", { [signature]: JSON.stringify(record) });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

// ---- Personal links (greeting by name) ----
const GREET_PERMISSIONS = ["GUEST", "RECRUITER", "HIRING_MANAGER", "COLLEAGUE"];
const GREET_TEMPLATES = ["PROD_VIEW", "PROD_MANAGER", "PROD_SUPPORT", "TEST_VIEW"];
// Time limit for a personal link. Counted from creation (or from the last
// time the limit was reset in the dashboard). Expired links stop working
// everywhere (site greeting, chat identity, Bridges) with no other change.
const GREET_DURATIONS = {
  "12h": 12 * 3600 * 1000,
  "1d": 24 * 3600 * 1000,
  "3d": 3 * 24 * 3600 * 1000,
  "1w": 7 * 24 * 3600 * 1000,
  "1m": 30 * 24 * 3600 * 1000
};
const expiryFor = (key) => new Date(Date.now() + GREET_DURATIONS[key]).toISOString();

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alike chars

function makeCode(len = 10) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  // strip control chars and angle brackets; collapse whitespace
  return value.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

async function handleGreetCreate(req, res) {
  if (!(await requireSession(req, res))) return;
  try {
    const name = cleanText(req.body?.name, 60);
    const company = cleanText(req.body?.company, 80);
    const note = cleanText(req.body?.note, 200);
    if (!name) return res.status(400).json({ error: "A greeting name is required." });
    const permission = GREET_PERMISSIONS.includes(req.body?.permission) ? req.body.permission : "GUEST";
    const template = GREET_TEMPLATES.includes(req.body?.template) ? req.body.template : "PROD_VIEW";

    const durationKey = Object.prototype.hasOwnProperty.call(GREET_DURATIONS, req.body?.duration) ? req.body.duration : "1w";

    let code = makeCode();
    for (let i = 0; i < 5 && (await kv.hget("greet_links", code)); i++) code = makeCode();

    const record = {
      code, name, company, note, permission, template,
      status: "active",
      duration: durationKey,
      expiresAt: expiryFor(durationKey),
      created: new Date().toISOString(),
      opens: 0, firstOpened: null, lastOpened: null
    };
    await kv.hset("greet_links", { [code]: JSON.stringify(record) });
    return res.status(200).json({ success: true, link: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleGreetUpdate(req, res) {
  if (!(await requireSession(req, res))) return;
  try {
    const { code, permission, template, duration } = req.body || {};
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{6,24}$/.test(code)) {
      return res.status(400).json({ error: "Invalid code." });
    }
    if (permission !== undefined && !GREET_PERMISSIONS.includes(permission)) {
      return res.status(400).json({ error: "Invalid permission level." });
    }
    if (template !== undefined && !GREET_TEMPLATES.includes(template)) {
      return res.status(400).json({ error: "Invalid template." });
    }
    if (duration !== undefined && !Object.prototype.hasOwnProperty.call(GREET_DURATIONS, duration)) {
      return res.status(400).json({ error: "Invalid time limit." });
    }
    const raw = await kv.hget("greet_links", code);
    if (!raw) return res.status(404).json({ error: "Link not found." });
    const record = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (duration !== undefined) {
      record.duration = duration;
      record.expiresAt = expiryFor(duration);
    }
    if (permission !== undefined) record.permission = permission;
    if (template !== undefined) record.template = template;
    await kv.hset("greet_links", { [code]: JSON.stringify(record) });
    return res.status(200).json({ success: true, link: record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleGreetRevoke(req, res) {
  if (!(await requireSession(req, res))) return;
  try {
    const { code, status } = req.body || {};
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{6,24}$/.test(code)) {
      return res.status(400).json({ error: "Invalid code." });
    }
    const raw = await kv.hget("greet_links", code);
    if (!raw) return res.status(404).json({ error: "Link not found." });
    const record = typeof raw === "string" ? JSON.parse(raw) : raw;
    record.status = status === "active" ? "active" : "revoked";
    await kv.hset("greet_links", { [code]: JSON.stringify(record) });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

async function handleGreetDelete(req, res) {
  if (!(await requireSession(req, res))) return;
  try {
    const { code } = req.body || {};
    if (typeof code !== "string" || !/^[A-Za-z0-9_-]{6,24}$/.test(code)) {
      return res.status(400).json({ error: "Invalid code." });
    }
    await kv.hdel("greet_links", code);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Server error." });
  }
}

// Only the dashboard's own origin may call this from a browser.
const ALLOWED_ORIGINS = new Set(["https://dashboard.tylerjanczak.com"]);

async function handleLogout(req, res) {
  const token = await requireSession(req, res);
  if (!token) return;
  await kv.del(`webauthn_session_${token}`);
  return res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Dashboard-Proof");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (origin && !ALLOWED_ORIGINS.has(origin) && req.method !== "OPTIONS") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query.action;

  if (req.method === "GET" && action === "data") {
    return handleData(req, res);
  }

  if (req.method === "POST" && action === "delete") {
    return handleDelete(req, res);
  }

  if (req.method === "POST" && action === "analysis") {
    return handleAnalysis(req, res);
  }

  if (req.method === "POST" && action === "ban-ip") {
    return handleBanIp(req, res);
  }

  if (req.method === "POST" && action === "unban-ip") {
    return handleUnbanIp(req, res);
  }

  if (req.method === "POST" && action === "ban-range") {
    return handleBanRange(req, res);
  }

  if (req.method === "POST" && action === "unban-range") {
    return handleUnbanRange(req, res);
  }

  if (req.method === "POST" && action === "ban-fingerprint") {
    return handleBanFingerprint(req, res);
  }

  if (req.method === "POST" && action === "unban-fingerprint") {
    return handleUnbanFingerprint(req, res);
  }

  if (req.method === "POST" && action === "reset-strikes") {
    return handleResetStrikes(req, res);
  }

  if (req.method === "POST" && action === "a11y-resolve") {
    return handleA11yResolve(req, res);
  }

  if (req.method === "POST" && action === "logout") {
    return handleLogout(req, res);
  }

  if (req.method === "POST" && action === "greet-create") {
    return handleGreetCreate(req, res);
  }

  if (req.method === "POST" && action === "greet-update") {
    return handleGreetUpdate(req, res);
  }

  if (req.method === "POST" && action === "greet-revoke") {
    return handleGreetRevoke(req, res);
  }

  if (req.method === "POST" && action === "greet-delete") {
    return handleGreetDelete(req, res);
  }

  return res.status(400).json({ error: "Unknown or missing action." });
}

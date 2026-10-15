import { kv } from "@vercel/kv";
import { webcrypto, createHash } from "crypto";

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
async function verifyProofCore(req, token) {
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


// ---- Roles --------------------------------------------------------------
// Every sign-in carries the role of the passkey that was used (ADMIN,
// RESTRICTED, READ_ONLY). The role is looked up again on every request, so
// removing a user or changing their role takes effect immediately.
const ROLE_RANK = { READ_ONLY: 1, RESTRICTED: 2, ADMIN: 3 };

async function verifyProof(req, token) {
  if (!(await verifyProofCore(req, token))) return false;
  try {
    const rawSession = await kv.get(`webauthn_session_${token}`);
    const session = rawSession ? (typeof rawSession === "string" ? JSON.parse(rawSession) : rawSession) : null;
    const rawCreds = await kv.get("webauthn_credentials");
    const creds = rawCreds ? (typeof rawCreds === "string" ? JSON.parse(rawCreds) : rawCreds) : [];
    const cred = session && session.cid && Array.isArray(creds) ? creds.find((c) => c.id === session.cid) : null;
    if (!cred) { req._why = "revoked"; return false; }
    req._role = ROLE_RANK[cred.role] ? cred.role : "ADMIN"; // passkeys from before roles existed are the owner's
    req._who = String(cred.label || "");
    req._cid = cred.id;
    return true;
  } catch (err) {
    console.error("Role lookup failed:", err);
    return false;
  }
}

// Drop-in replacement for each endpoint's old requireSession().
// Sends the 401 itself and returns null on failure; returns the token on success.
async function requireSession(req, res, minRole = "READ_ONLY") {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }

  if (!(await verifyProof(req, token))) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return null;
  }

  if ((ROLE_RANK[req._role] || 0) < (ROLE_RANK[minRole] || 99)) {
    res.status(403).json({ error: "Your role does not allow this action.", reason: "role" });
    return null;
  }

  return token;
}


async function handleGet(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const content = await kv.get("tyler_ai_knowledge_base");

    return res.status(200).json({
      success: true,
      content: content || null,
      usingDefault: !content
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleSave(req, res) {
  if (!(await requireSession(req, res, "ADMIN"))) return;

  try {
    const { content, useDefault } = req.body;

    if (useDefault) {
      await kv.del("tyler_ai_knowledge_base");
      return res.status(200).json({ success: true, usingDefault: true });
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Knowledge base content cannot be empty." });
    }

    await kv.set("tyler_ai_knowledge_base", content);

    return res.status(200).json({ success: true, usingDefault: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Dashboard-Proof");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "POST") {
    return handleSave(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

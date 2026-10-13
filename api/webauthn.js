import { kv } from "@vercel/kv";
import { createHash, timingSafeEqual, randomUUID, webcrypto } from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

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


// Dashboard sign-in (passkeys). Hardening in this file:
//  - Registration needs the dashboard password AND (no passkey exists yet,
//    OR you are already signed in, OR ALLOW_PASSKEY_REGISTRATION=true is
//    set temporarily in Vercel). A guessed/leaked password alone can no
//    longer add an attacker's passkey.
//  - Password checks are constant-time, rate-limited per IP, and there is a
//    global lockout if many wrong guesses arrive from anywhere.
//  - Every challenge is single-use and tied to its own id (a stranger can't
//    overwrite yours and lock you out).
//  - Sign-in attempts are rate-limited; sessions last 8 hours; errors sent
//    to the browser are generic (details only go to server logs).
//  - CORS only allows the dashboard's own origin.

const RP_NAME = "Tyler Janczak Portfolio";
const RP_ID = "dashboard.tylerjanczak.com";
const ORIGIN = "https://dashboard.tylerjanczak.com";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const CHALLENGE_TTL_SECONDS = 300;

const ALLOWED_ORIGINS = new Set([ORIGIN]);

function clientIp(req) {
  return (
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// Returns true if still under the limit. Fails CLOSED (blocks) if the
// counter store is unreachable, because these are the sign-in endpoints.
async function allow(bucket, id, limit, windowSec) {
  try {
    const key = `rl_${bucket}_${id}`;
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, windowSec);
    return n <= limit;
  } catch (err) {
    console.error("Rate limiter unavailable:", err);
    return false;
  }
}

function safeEqual(a, b) {
  const ha = createHash("sha256").update(String(a)).digest();
  const hb = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

async function getStoredCredentials() {
  const raw = await kv.get("webauthn_credentials");
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : [];
}

// "Already signed in" now means a session token AND a valid device proof.
async function hasValidSession(req) {
  const token = req.headers["x-dashboard-session"];
  if (typeof token !== "string") return false;
  return verifyProof(req, token);
}

// Checks the dashboard password with lockouts. Sends the response itself and
// returns false on failure.
async function checkPassword(req, res) {
  const ip = clientIp(req);
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) {
    res.status(503).json({ error: "Registration is not available." });
    return false;
  }

  try {
    const ipFails = parseInt((await kv.get(`pw_fail_${ip}`)) || "0", 10);
    const globalFails = parseInt((await kv.get("pw_fail_global")) || "0", 10);
    if (ipFails >= 5 || globalFails >= 30) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return false;
    }
  } catch {
    res.status(503).json({ error: "Temporarily unavailable." });
    return false;
  }

  const provided = req.headers.authorization?.replace("Bearer ", "") || "";

  if (!provided || !safeEqual(provided, expected)) {
    try {
      const f = await kv.incr(`pw_fail_${ip}`);
      if (f === 1) await kv.expire(`pw_fail_${ip}`, 15 * 60);
      const g = await kv.incr("pw_fail_global");
      if (g === 1) await kv.expire("pw_fail_global", 60 * 60);
    } catch (err) {
      console.error(err);
    }
    res.status(401).json({ error: "Incorrect password." });
    return false;
  }

  try {
    await kv.del(`pw_fail_${ip}`);
  } catch {
    /* non-fatal */
  }
  return true;
}

async function handleRegisterOptions(req, res) {
  if (!(await allow("reg", clientIp(req), 20, 600))) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }
  if (!(await checkPassword(req, res))) return;

  try {
    const existingCredentials = await getStoredCredentials();

    // A password alone can only create the FIRST passkey. After that you
    // must already be signed in, or temporarily open registration with the
    // ALLOW_PASSKEY_REGISTRATION=true environment variable in Vercel.
    if (
      existingCredentials.length > 0 &&
      process.env.ALLOW_PASSKEY_REGISTRATION !== "true" &&
      !(await hasValidSession(req))
    ) {
      return res.status(403).json({
        error: "Registration is closed. Sign in first, or temporarily enable it in Vercel."
      });
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: "tyler",
      userID: new TextEncoder().encode("tyler-admin-user"),
      attestationType: "none",
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.id,
        transports: cred.transports
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required"
      }
    });

    const challengeId = randomUUID();
    await kv.set(`webauthn_reg_challenge_${challengeId}`, options.challenge, {
      ex: CHALLENGE_TTL_SECONDS
    });

    return res.status(200).json({ ...options, challengeId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not start registration." });
  }
}

async function handleRegisterVerify(req, res) {
  if (!(await allow("regv", clientIp(req), 20, 600))) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }
  if (!(await checkPassword(req, res))) return;

  try {
    const { response, deviceLabel, challengeId } = req.body || {};

    if (typeof challengeId !== "string" || !/^[0-9a-f-]{36}$/.test(challengeId) || !response) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const key = `webauthn_reg_challenge_${challengeId}`;
    const expectedChallenge = await kv.get(key);
    await kv.del(key); // single use, success or not

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "Registration session expired. Please try again."
      });
    }

    const existingCredentials = await getStoredCredentials();
    if (
      existingCredentials.length > 0 &&
      process.env.ALLOW_PASSKEY_REGISTRATION !== "true" &&
      !(await hasValidSession(req))
    ) {
      return res.status(403).json({ error: "Registration is closed." });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: "Passkey verification failed." });
    }

    const { credential } = verification.registrationInfo;

    existingCredentials.push({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      transports: credential.transports || [],
      label: String(deviceLabel || `Device ${existingCredentials.length + 1}`).slice(0, 60),
      registeredAt: new Date().toISOString()
    });

    await kv.set("webauthn_credentials", JSON.stringify(existingCredentials));

    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ verified: false, error: "Passkey verification failed." });
  }
}

async function handleAuthOptions(req, res) {
  if (!(await allow("authopt", clientIp(req), 20, 60))) {
    return res.status(429).json({ error: "Too many attempts. Try again shortly." });
  }

  try {
    const storedCredentials = await getStoredCredentials();

    if (storedCredentials.length === 0) {
      return res.status(404).json({
        error: "No passkey has been registered yet."
      });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: storedCredentials.map((cred) => ({
        id: cred.id,
        transports: cred.transports
      })),
      userVerification: "required"
    });

    const challengeId = randomUUID();
    await kv.set(`webauthn_auth_challenge_${challengeId}`, options.challenge, {
      ex: CHALLENGE_TTL_SECONDS
    });

    return res.status(200).json({ ...options, challengeId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not start sign-in." });
  }
}

async function handleAuthVerify(req, res) {
  const ip = clientIp(req);

  if (!(await allow("authv", ip, 10, 300))) {
    return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  try {
    const failCount = parseInt((await kv.get(`auth_fail_${ip}`)) || "0", 10);
    if (failCount >= 10) {
      return res.status(429).json({ error: "Too many failed attempts. Try again later." });
    }
  } catch {
    return res.status(503).json({ error: "Temporarily unavailable." });
  }

  const fail = async (status, message) => {
    try {
      const n = await kv.incr(`auth_fail_${ip}`);
      if (n === 1) await kv.expire(`auth_fail_${ip}`, 15 * 60);
    } catch (err) {
      console.error(err);
    }
    return res.status(status).json({ verified: false, error: message });
  };

  try {
    const { response, challengeId, devicePublicKey } = req.body || {};

    if (typeof challengeId !== "string" || !/^[0-9a-f-]{36}$/.test(challengeId) || !response || typeof response.id !== "string") {
      return fail(400, "Invalid request.");
    }

    // The session is bound to a signing key created in this browser.
    if (!isValidPublicJwk(devicePublicKey)) {
      return fail(400, "Invalid request.");
    }

    const key = `webauthn_auth_challenge_${challengeId}`;
    const expectedChallenge = await kv.get(key);
    await kv.del(key); // single use, success or not

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "Sign-in session expired. Please try again."
      });
    }

    const storedCredentials = await getStoredCredentials();

    if (storedCredentials.length === 0) {
      return res.status(404).json({ error: "No passkey has been registered yet." });
    }

    const matchedIndex = storedCredentials.findIndex(
      (cred) => cred.id === response.id
    );

    if (matchedIndex === -1) {
      return fail(401, "Sign-in failed.");
    }

    const matchedCredential = storedCredentials[matchedIndex];

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
        credential: {
          id: matchedCredential.id,
          publicKey: Buffer.from(matchedCredential.publicKey, "base64"),
          counter: matchedCredential.counter,
          transports: matchedCredential.transports
        }
      });
    } catch (err) {
      console.error("Passkey verification error:", err);
      return fail(401, "Sign-in failed.");
    }

    if (!verification.verified) {
      return fail(401, "Sign-in failed.");
    }

    storedCredentials[matchedIndex].counter =
      verification.authenticationInfo.newCounter;
    await kv.set("webauthn_credentials", JSON.stringify(storedCredentials));
    await kv.del(`auth_fail_${ip}`);

    const sessionToken = randomUUID();
    await kv.set(
      `webauthn_session_${sessionToken}`,
      JSON.stringify({
        v: 1,
        created: new Date().toISOString(),
        pk: { kty: "EC", crv: "P-256", x: devicePublicKey.x, y: devicePublicKey.y }
      }),
      { ex: SESSION_TTL_SECONDS }
    );

    return res.status(200).json({ verified: true, sessionToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ verified: false, error: "Sign-in failed." });
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Dashboard-Session, X-Dashboard-Proof");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Browsers always send Origin on cross-site POSTs; reject any that isn't
  // the dashboard. (Non-browser clients can still call this, which is why
  // everything above is also rate-limited.)
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const action = req.query.action;

  switch (action) {
    case "register-options":
      return handleRegisterOptions(req, res);
    case "register-verify":
      return handleRegisterVerify(req, res);
    case "auth-options":
      return handleAuthOptions(req, res);
    case "auth-verify":
      return handleAuthVerify(req, res);
    default:
      return res.status(400).json({ error: "Unknown or missing action." });
  }
}

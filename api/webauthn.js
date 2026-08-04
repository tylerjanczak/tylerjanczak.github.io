import { kv } from "@vercel/kv";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

const RP_NAME = "Tyler Janczak Portfolio";
const RP_ID = "tylerjanczak-github-io.vercel.app";
const ORIGIN = "https://tylerjanczak-github-io.vercel.app";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

async function getStoredCredentials() {
  const raw = await kv.get("webauthn_credentials");
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : [];
}

function checkPassword(req, res) {
  const providedPassword = req.headers.authorization?.replace("Bearer ", "");
  if (!providedPassword || providedPassword !== process.env.DASHBOARD_PASSWORD) {
    res.status(401).json({ error: "Incorrect password." });
    return false;
  }
  return true;
}

async function handleRegisterOptions(req, res) {
  if (!checkPassword(req, res)) return;

  try {
    const existingCredentials = await getStoredCredentials();

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
        userVerification: "preferred"
      }
    });

    await kv.set("webauthn_reg_challenge", options.challenge, { ex: 300 });

    return res.status(200).json(options);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleRegisterVerify(req, res) {
  if (!checkPassword(req, res)) return;

  try {
    const { response, deviceLabel } = req.body;

    const expectedChallenge = await kv.get("webauthn_reg_challenge");

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "Registration session expired. Please try again."
      });
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: "Passkey verification failed." });
    }

    const { credential } = verification.registrationInfo;

    const existingCredentials = await getStoredCredentials();

    existingCredentials.push({
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: credential.counter,
      transports: credential.transports || [],
      label: deviceLabel || `Device ${existingCredentials.length + 1}`,
      registeredAt: new Date().toISOString()
    });

    await kv.set("webauthn_credentials", JSON.stringify(existingCredentials));
    await kv.del("webauthn_reg_challenge");

    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ verified: false, error: err.message });
  }
}

async function handleAuthOptions(req, res) {
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
      userVerification: "preferred"
    });

    await kv.set("webauthn_auth_challenge", options.challenge, { ex: 300 });

    return res.status(200).json(options);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

async function handleAuthVerify(req, res) {
  try {
    const { response } = req.body;

    const expectedChallenge = await kv.get("webauthn_auth_challenge");

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
      return res.status(401).json({ error: "Unrecognized passkey." });
    }

    const matchedCredential = storedCredentials[matchedIndex];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: matchedCredential.id,
        publicKey: Buffer.from(matchedCredential.publicKey, "base64"),
        counter: matchedCredential.counter,
        transports: matchedCredential.transports
      }
    });

    if (!verification.verified) {
      return res.status(401).json({ error: "Passkey verification failed." });
    }

    storedCredentials[matchedIndex].counter =
      verification.authenticationInfo.newCounter;
    await kv.set("webauthn_credentials", JSON.stringify(storedCredentials));
    await kv.del("webauthn_auth_challenge");

    const sessionToken = crypto.randomUUID();
    await kv.set(`webauthn_session_${sessionToken}`, "true", {
      ex: SESSION_TTL_SECONDS
    });

    return res.status(200).json({ verified: true, sessionToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ verified: false, error: err.message });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

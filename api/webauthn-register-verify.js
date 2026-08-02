import { kv } from "@vercel/kv";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

const RP_ID = "tylerjanczak-github-io.vercel.app";
const ORIGIN = "https://tylerjanczak-github-io.vercel.app";

async function getStoredCredentials() {
  const raw = await kv.get("webauthn_credentials");
  if (!raw) return [];
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : [];
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

  const providedPassword = req.headers.authorization?.replace("Bearer ", "");

  if (!providedPassword || providedPassword !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password." });
  }

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

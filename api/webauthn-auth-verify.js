import { kv } from "@vercel/kv";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

const RP_ID = "tylerjanczak.com";
const ORIGIN = "https://tylerjanczak.com";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { response } = req.body;

    const expectedChallenge = await kv.get("webauthn_auth_challenge");

    if (!expectedChallenge) {
      return res.status(400).json({
        error: "Sign-in session expired. Please try again."
      });
    }

    const raw = await kv.get("webauthn_credentials");
    const storedCredentials = raw
      ? (typeof raw === "string" ? JSON.parse(raw) : raw)
      : [];

    if (!Array.isArray(storedCredentials) || storedCredentials.length === 0) {
      return res.status(404).json({ error: "No passkey has been registered yet." });
    }

    // Find which of the (possibly several) registered devices this
    // sign-in attempt came from.
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

    // Update only this device's counter to guard against cloned authenticators.
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

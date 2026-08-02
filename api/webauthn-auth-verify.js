import { kv } from "@vercel/kv";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

const RP_ID = "tylerjanczak-github-io.vercel.app";
const ORIGIN = "https://tylerjanczak-github-io.vercel.app";
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

    const storedCredentialRaw = await kv.get("webauthn_credential");

    if (!storedCredentialRaw) {
      return res.status(404).json({ error: "No passkey has been registered yet." });
    }

    const storedCredential =
      typeof storedCredentialRaw === "string"
        ? JSON.parse(storedCredentialRaw)
        : storedCredentialRaw;

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCredential.id,
        publicKey: Buffer.from(storedCredential.publicKey, "base64"),
        counter: storedCredential.counter,
        transports: storedCredential.transports
      }
    });

    if (!verification.verified) {
      return res.status(401).json({ error: "Passkey verification failed." });
    }

    // Update the stored counter to guard against cloned authenticators.
    storedCredential.counter = verification.authenticationInfo.newCounter;
    await kv.set("webauthn_credential", JSON.stringify(storedCredential));
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

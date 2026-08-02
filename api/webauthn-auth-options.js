import { kv } from "@vercel/kv";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const RP_ID = "tylerjanczak.com";

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
    const raw = await kv.get("webauthn_credentials");
    const storedCredentials = raw
      ? (typeof raw === "string" ? JSON.parse(raw) : raw)
      : [];

    if (!Array.isArray(storedCredentials) || storedCredentials.length === 0) {
      return res.status(404).json({
        error: "No passkey has been registered yet."
      });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      // Any device that's been registered can be used to sign in.
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

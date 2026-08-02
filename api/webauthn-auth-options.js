import { kv } from "@vercel/kv";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const RP_ID = "tylerjanczak-github-io.vercel.app";

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
    const storedCredentialRaw = await kv.get("webauthn_credential");

    if (!storedCredentialRaw) {
      return res.status(404).json({
        error: "No passkey has been registered yet."
      });
    }

    const storedCredential =
      typeof storedCredentialRaw === "string"
        ? JSON.parse(storedCredentialRaw)
        : storedCredentialRaw;

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [
        {
          id: storedCredential.id,
          transports: storedCredential.transports
        }
      ],
      userVerification: "preferred"
    });

    await kv.set("webauthn_auth_challenge", options.challenge, { ex: 300 });

    return res.status(200).json(options);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

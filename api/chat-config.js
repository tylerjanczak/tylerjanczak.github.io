import { kv } from "@vercel/kv";

async function handleStatus(req, res) {
  try {
    const stored = await kv.get("tyler_ai_chat_enabled");
    const enabled = stored === null || stored === undefined ? true : stored === "true" || stored === true;

    return res.status(200).json({ enabled });
  } catch (err) {
    console.error(err);
    // Fail open — a broken status check shouldn't take down the widget.
    return res.status(200).json({ enabled: true });
  }
}

async function handleToggle(req, res) {
  const sessionToken = req.headers.authorization?.replace("Bearer ", "");

  if (!sessionToken) {
    return res.status(401).json({ error: "Not signed in." });
  }

  const sessionValid = await kv.get(`webauthn_session_${sessionToken}`);

  if (!sessionValid) {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }

  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid request." });
    }

    await kv.set("tyler_ai_chat_enabled", enabled ? "true" : "false");

    return res.status(200).json({ success: true, enabled });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return handleStatus(req, res);
  }

  if (req.method === "POST") {
    return handleToggle(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

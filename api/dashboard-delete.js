import { kv } from "@vercel/kv";

const KEYS = {
  conversation: "tyler_ai_conversations",
  resume: "tyler_ai_resume_requests"
};

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

  const sessionToken = req.headers.authorization?.replace("Bearer ", "");

  if (!sessionToken) {
    return res.status(401).json({ error: "Not signed in." });
  }

  const sessionValid = await kv.get(`webauthn_session_${sessionToken}`);

  if (!sessionValid) {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }

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

    // Remove the target entry, keeping the rest in their original order.
    const remaining = rawEntries.filter((_, i) => i !== index);

    await kv.del(key);

    // lrange returns newest-first (since entries are LPUSHed). To rebuild
    // the same order, push from oldest to newest so the newest ends up on top.
    for (const entry of remaining.slice().reverse()) {
      await kv.lpush(key, entry);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

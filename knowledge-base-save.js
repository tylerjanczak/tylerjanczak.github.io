import { kv } from "@vercel/kv";

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

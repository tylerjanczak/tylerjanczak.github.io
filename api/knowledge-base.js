import { kv } from "@vercel/kv";

async function requireSession(req, res) {
  const sessionToken = req.headers.authorization?.replace("Bearer ", "");

  if (!sessionToken) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }

  const sessionValid = await kv.get(`webauthn_session_${sessionToken}`);

  if (!sessionValid) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return null;
  }

  return sessionToken;
}

async function handleGet(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const content = await kv.get("tyler_ai_knowledge_base");

    return res.status(200).json({
      success: true,
      content: content || null,
      usingDefault: !content
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleSave(req, res) {
  if (!(await requireSession(req, res))) return;

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return handleGet(req, res);
  }

  if (req.method === "POST") {
    return handleSave(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

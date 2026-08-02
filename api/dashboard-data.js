import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
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
    const [rawConversations, rawResumeRequests] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 199),
      kv.lrange("tyler_ai_resume_requests", 0, 199)
    ]);

    const parseEntries = (entries) =>
      entries.map((entry) => {
        try {
          return typeof entry === "string" ? JSON.parse(entry) : entry;
        } catch {
          return { raw: entry };
        }
      });

    return res.status(200).json({
      success: true,
      conversations: parseEntries(rawConversations || []),
      resumeRequests: parseEntries(rawResumeRequests || [])
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

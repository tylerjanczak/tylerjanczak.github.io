import { kv } from "@vercel/kv";

const KEYS = {
  conversation: "tyler_ai_conversations",
  resume: "tyler_ai_resume_requests"
};

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

function parseEntries(entries) {
  return (entries || []).map((entry) => {
    try {
      return typeof entry === "string" ? JSON.parse(entry) : entry;
    } catch {
      return { raw: entry };
    }
  });
}

async function handleData(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const [rawConversations, rawResumeRequests, rawMaintenanceLog, rawFlagged, bannedIps] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 199),
      kv.lrange("tyler_ai_resume_requests", 0, 199),
      kv.lrange("site_maintenance_log", 0, 49),
      kv.lrange("flagged_conversations", 0, 49),
      kv.smembers("banned_ips")
    ]);

    return res.status(200).json({
      success: true,
      conversations: parseEntries(rawConversations),
      resumeRequests: parseEntries(rawResumeRequests),
      maintenanceLog: parseEntries(rawMaintenanceLog),
      flaggedConversations: parseEntries(rawFlagged),
      bannedIps: bannedIps || []
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleDelete(req, res) {
  if (!(await requireSession(req, res))) return;

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

    const remaining = rawEntries.filter((_, i) => i !== index);

    await kv.del(key);

    for (const entry of remaining.slice().reverse()) {
      await kv.lpush(key, entry);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleBanIp(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip, reason } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    await kv.sadd("banned_ips", ip);
    await kv.del(`ip_cooldown_${ip}`);

    await kv.lpush(
      "ip_ban_log",
      JSON.stringify({
        id: crypto.randomUUID(),
        ip,
        reason: reason || "Manually banned from dashboard",
        timestamp: new Date().toISOString()
      })
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleUnbanIp(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    // Clear the ban and their strike count together, so unbanning gives
    // a genuine clean slate rather than leaving them one strike from
    // an instant re-ban on their very next message.
    await kv.srem("banned_ips", ip);
    await kv.del(`ip_strikes_${ip}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleResetStrikes(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { ip } = req.body;

    if (!ip || typeof ip !== "string") {
      return res.status(400).json({ error: "No IP address provided." });
    }

    await kv.del(`ip_strikes_${ip}`);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleAnalysis(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const [rawConversations, rawResumeRequests] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 99),
      kv.lrange("tyler_ai_resume_requests", 0, 99)
    ]);

    const conversations = parseEntries(rawConversations);
    const resumeRequests = parseEntries(rawResumeRequests);

    if (conversations.length === 0) {
      return res.status(200).json({
        success: true,
        analysis: "Not enough conversation data yet to generate a meaningful analysis. Check back once a few visitors have used Tyler AI."
      });
    }

    const conversationText = conversations
      .map((c, i) => `${i + 1}. Q: "${c.question}"\n   A: "${c.answer}"\n   Page: ${c.page || "unknown"}`)
      .join("\n\n");

    const prompt = `You are analyzing visitor conversations from a chatbot on Tyler Janczak's professional portfolio website. Below are up to 100 of the most recent visitor questions and the AI's answers, plus the count of resume requests.

Total conversations: ${conversations.length}
Total resume requests: ${resumeRequests.length}

Conversations:
${conversationText}

Provide a concise, practical analysis for Tyler (the portfolio owner) covering:
1. The most common topics or themes visitors are asking about
2. Any signs of high-intent visitors (recruiters, hiring managers) based on question patterns
3. Any questions the AI seemed unable to answer well, or gaps in the portfolio content that visitors are asking about
4. One or two concrete, actionable suggestions for improving the portfolio or the AI's knowledge base based on this data

Keep the total response under 200 words, written directly to Tyler in a helpful, direct tone. Use short paragraphs or a brief list, not headers.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await response.json();

    let analysisText = data.output_text;
    if (!analysisText && Array.isArray(data.output)) {
      const messageItem = data.output.find((item) => item.type === "message");
      const textPart = messageItem?.content?.find((c) => c.type === "output_text");
      analysisText = textPart?.text;
    }

    return res.status(200).json({
      success: true,
      analysis: analysisText || "Could not generate an analysis right now."
    });
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

  const action = req.query.action;

  if (req.method === "GET" && action === "data") {
    return handleData(req, res);
  }

  if (req.method === "POST" && action === "delete") {
    return handleDelete(req, res);
  }

  if (req.method === "POST" && action === "analysis") {
    return handleAnalysis(req, res);
  }

  if (req.method === "POST" && action === "ban-ip") {
    return handleBanIp(req, res);
  }

  if (req.method === "POST" && action === "unban-ip") {
    return handleUnbanIp(req, res);
  }

  if (req.method === "POST" && action === "reset-strikes") {
    return handleResetStrikes(req, res);
  }

  return res.status(400).json({ error: "Unknown or missing action." });
}

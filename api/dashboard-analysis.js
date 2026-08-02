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
    const [rawConversations, rawResumeRequests] = await Promise.all([
      kv.lrange("tyler_ai_conversations", 0, 99),
      kv.lrange("tyler_ai_resume_requests", 0, 99)
    ]);

    const parse = (entries) =>
      (entries || []).map((e) => {
        try {
          return typeof e === "string" ? JSON.parse(e) : e;
        } catch {
          return null;
        }
      }).filter(Boolean);

    const conversations = parse(rawConversations);
    const resumeRequests = parse(rawResumeRequests);

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

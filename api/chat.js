export default async function handler(req, res) {
  // Allow requests from your website
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
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "No question provided." });
    }

    const portfolio = `
You are answering questions about Tyler Janczak.

Professional Background:
- Healthcare technology implementation
- Director of Core Solutions at Compass Group
- Led implementations across 100+ venues
- Managed a 52-person team at Compass Group
- Previously worked at Cardinal Health on WaveMark
- Supported six health systemsat Cardinal Health on WaveMark
- Helped generate over $2.6M in savings linked to Implementation Specialist at Cardinal Health
- Reduced expired inventory by approximately 50% linked to Implementation Specialist at Cardinal Health

Education:
- Northwestern University Master's degree in Health Data Science
- University of Illinois Urbana-Champaign Bachelor's degree in Health Administration

Only answer questions using this information.
If the answer is not in the portfolio, say you weren't able to find anything.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Portfolio:\n${portfolio}\n\nQuestion: ${question}`
      })
    });

   const data = await response.json();

let answerText = data.output_text; // in case OpenAI adds this later
if (!answerText && Array.isArray(data.output)) {
  const messageItem = data.output.find(item => item.type === "message");
  const textPart = messageItem?.content?.find(c => c.type === "output_text");
  answerText = textPart?.text;
}

return res.status(200).json({
  success: true,
  response: answerText || "No response returned."
});
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

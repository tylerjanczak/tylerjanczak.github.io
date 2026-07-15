export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;

  const knowledge = `
Tyler Janczak is a healthcare transformation and technology implementation professional.

Experience:
- Director of Core Solutions at Compass Group.
- Led implementations across 100+ venues.
- Managed a 52-person team.
- Previously worked at Cardinal Health on WaveMark implementations.
- Supported six health systems and 500+ procedural/nursing areas.
- Helped generate over $2.6M in savings.
- Reduced expired inventory by approximately 50%.

Education:
- MS from Northwestern University.
- BS from the University of Illinois Urbana-Champaign.

Only answer questions using this information.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content: `You are Tyler's portfolio assistant. Use ONLY the supplied portfolio knowledge. If you don't know the answer, say so.`
        },
        {
          role: "user",
          content: `Portfolio:\n${knowledge}\n\nQuestion: ${question}`
        }
      ]
    })
  });

  const data = await response.json();

  res.status(200).json({
    answer: data.output_text
  });
}

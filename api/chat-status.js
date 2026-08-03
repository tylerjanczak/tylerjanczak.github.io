import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stored = await kv.get("tyler_ai_chat_enabled");
    // Defaults to enabled if never explicitly set.
    const enabled = stored === null || stored === undefined ? true : stored === "true" || stored === true;

    return res.status(200).json({ enabled });
  } catch (err) {
    console.error(err);
    // Fail open — a broken status check shouldn't take down the widget.
    return res.status(200).json({ enabled: true });
  }
}

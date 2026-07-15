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
    const { email } = req.body;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    // Pull the current resume PDF straight from the live site so this
    // always sends the latest version without needing to duplicate it.
    const resumeUrl = "https://tylerjanczak-github-io.vercel.app/resume.pdf";
    const pdfResponse = await fetch(resumeUrl);

    if (!pdfResponse.ok) {
      throw new Error("Could not retrieve the resume file from the site.");
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Tyler Janczak <onboarding@resend.dev>",
        to: [email],
        subject: "Tyler Janczak — Resume",
        html: `
          <p>Hi,</p>
          <p>Thanks for your interest, Tyler's resume is attached.</p>
          <p>You can return to view his full portfolio here:
            <a href="tylerjanczak.com">tylerjanczak.com</a>
          </p>
          <p>Best,<br>Tyler Janczak</p>
        `,
        attachments: [
          {
            filename: "Tyler-Janczak-Resume.pdf",
            content: pdfBase64
          }
        ]
      })
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailData);
      return res.status(502).json({
        success: false,
        error: emailData.message || "Failed to send the email."
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}

<!DOCTYPE html>
<!--
  © 2026 Tyler Janczak. All rights reserved.
  bridges.tylerjanczak.com/getdetails.do

  A brief intake gate shown before the chat itself. Captures a device
  fingerprint (client-side) and IP (server-side, from the request itself)
  and asks one qualifying question before handing off into bridges.html.
-->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tyler AI</title>
  <meta name="robots" content="noindex, nofollow" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg:          #F5F8FC;
      --bg-subtle:   #E9F1FA;
      --ink:         #1A2B3C;
      --ink-soft:    #55697D;
      --rule:        #D6E3EF;
      --accent:      #2563EB;
      --display:     "Fraunces", Georgia, serif;
      --body:        "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: var(--bg);
    }

    body {
      display: flex;
      flex-direction: column;
      font-family: var(--body);
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
    }

    .masthead {
      border-bottom: 1px solid var(--rule);
      padding: 22px 32px;
    }

    .masthead-inner {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--ink-soft);
    }

    .masthead-mark {
      font-family: var(--display);
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.1em;
    }

    .gate-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .gate-card {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(26,43,60,0.1);
      border: 1px solid var(--rule);
      max-width: 440px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
    }

    .gate-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.24em;
      color: var(--accent);
      margin-bottom: 18px;
    }

    .gate-title {
      font-family: var(--display);
      font-weight: 500;
      font-size: 28px;
      letter-spacing: -0.01em;
      color: var(--ink);
      margin-bottom: 12px;
      line-height: 1.15;
    }

    .gate-question {
      font-size: 16px;
      color: var(--ink-soft);
      margin-bottom: 30px;
    }

    .gate-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 26px;
    }

    .gate-btn {
      flex: 1;
      padding: 13px 0;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid var(--accent);
      background: #ffffff;
      color: var(--accent);
      font-family: var(--body);
      transition: background 140ms ease, color 140ms ease;
    }

    .gate-btn.primary {
      background: var(--accent);
      color: #ffffff;
    }

    .gate-btn:hover {
      background: var(--accent);
      color: #ffffff;
    }

    .gate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .gate-disclosure {
      font-size: 11.5px;
      color: var(--ink-soft);
      line-height: 1.6;
      padding-top: 20px;
      border-top: 1px solid var(--rule);
    }
  </style>
</head>
<body>

  <header class="masthead">
    <div class="masthead-inner">
      <span class="masthead-mark">TNJ</span>
      <span>Tyler AI</span>
    </div>
  </header>

  <div class="gate-wrap">
    <div class="gate-card">
      <div class="gate-eyebrow">Before You Continue</div>
      <div class="gate-title">One quick question</div>
      <div class="gate-question">Are you a recruiter or hiring manager?</div>

      <div class="gate-buttons" id="gate-buttons">
        <button class="gate-btn primary" id="gate-yes" type="button">Yes</button>
        <button class="gate-btn" id="gate-no" type="button">No</button>
      </div>

      <div class="gate-disclosure" id="gate-disclosure">
        This helps Tyler understand who he's speaking with. Basic technical information about your device and connection is recorded, consistent with the monitoring disclosure shown in chat.
      </div>
    </div>
  </div>

  <script>
    // Same fingerprinting approach used by the main chat widget, so
    // fingerprints captured here are consistent with everywhere else.
    async function generateFingerprint() {
      try {
        const signals = [
          navigator.userAgent || "",
          navigator.language || "",
          String(screen.width) + "x" + String(screen.height),
          String(screen.colorDepth || ""),
          Intl.DateTimeFormat().resolvedOptions().timeZone || "",
          String(navigator.hardwareConcurrency || ""),
          navigator.platform || ""
        ];

        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          ctx.textBaseline = "top";
          ctx.font = "14px Arial";
          ctx.fillText("tyler-ai-fp", 2, 2);
          signals.push(canvas.toDataURL());
        } catch {
          // Canvas fingerprinting blocked — fine, remaining signals still apply.
        }

        const combined = signals.join("||");
        const encoded = new TextEncoder().encode(combined);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch {
        return null;
      }
    }

    async function submitIntake(isRecruiter) {
      const buttonsEl = document.getElementById("gate-buttons");
      const disclosureEl = document.getElementById("gate-disclosure");

      document.getElementById("gate-yes").disabled = true;
      document.getElementById("gate-no").disabled = true;
      disclosureEl.textContent = "One moment…";

      const fingerprint = await generateFingerprint();
      let sessionId = null;

      try {
        const res = await fetch("https://tylerjanczak-github-io.vercel.app/api/chat", {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "log-intake",
            fingerprint: fingerprint,
            isRecruiter: isRecruiter
          })
        });

        const data = await res.json().catch(() => ({}));
        sessionId = data.sessionId || null;
      } catch (err) {
        console.error("Intake logging failed:", err);
      }

      if (!sessionId) {
        disclosureEl.textContent = "Something went wrong setting up your session. Please refresh and try again.";
        document.getElementById("gate-yes").disabled = false;
        document.getElementById("gate-no").disabled = false;
        return;
      }

      // Pass the answer along so the chat itself could reference it later.
      try {
        sessionStorage.setItem("tylerAiIsRecruiter", String(isRecruiter));
      } catch {
        // Storage blocked — fine, proceed without it.
      }

      window.location.href = "https://bridges.tylerjanczak.com/?sid=" + encodeURIComponent(sessionId);
    }

    document.getElementById("gate-yes").addEventListener("click", function () {
      submitIntake(true);
    });

    document.getElementById("gate-no").addEventListener("click", function () {
      submitIntake(false);
    });
  </script>

</body>
</html>

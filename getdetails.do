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
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #F5F8FC;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    }

    .gate-card {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 20px 60px rgba(26,43,60,0.12);
      max-width: 420px;
      width: 90%;
      padding: 40px 34px;
      text-align: center;
    }

    .gate-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 24px;
      font-weight: 600;
      color: #1A2B3C;
      margin-bottom: 10px;
    }

    .gate-question {
      font-size: 16px;
      color: #1A2B3C;
      margin-bottom: 26px;
    }

    .gate-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 22px;
    }

    .gate-btn {
      flex: 1;
      padding: 13px 0;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid #2563EB;
      background: #ffffff;
      color: #2563EB;
      transition: background 140ms ease, color 140ms ease;
    }

    .gate-btn.primary {
      background: #2563EB;
      color: #ffffff;
    }

    .gate-btn:hover {
      background: #2563EB;
      color: #ffffff;
    }

    .gate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .gate-disclosure {
      font-size: 11.5px;
      color: #8b96a5;
      line-height: 1.5;
    }

    .gate-loading-text {
      font-size: 13px;
      color: #55697D;
    }
  </style>
</head>
<body>

  <div class="gate-card">
    <div class="gate-title">Before we get started</div>
    <div class="gate-question">Are you a recruiter or hiring manager?</div>

    <div class="gate-buttons" id="gate-buttons">
      <button class="gate-btn primary" id="gate-yes" type="button">Yes</button>
      <button class="gate-btn" id="gate-no" type="button">No</button>
    </div>

    <div class="gate-disclosure" id="gate-disclosure">
      This helps Tyler understand who he's speaking with. Basic technical information about your device and connection is recorded, consistent with the monitoring disclosure shown in chat.
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

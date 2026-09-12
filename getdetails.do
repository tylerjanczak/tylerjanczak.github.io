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
      --bg:          #F7F5F0;
      --bg-subtle:   #EFEAE0;
      --ink:         #1B1B1B;
      --ink-soft:    #4A4A48;
      --rule:        #D9D2C4;
      --accent:      #7B1F2A;
      --accent-hover: #641923;
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
      box-shadow: 0 20px 60px rgba(27,27,27,0.1);
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
      background: var(--accent-hover);
      border-color: var(--accent-hover);
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

    /* Heart + ECG loading state, shown after Yes/No is clicked —
       matches the same animation used on the dashboard's own
       "Authenticating…" screen, for visual consistency. */
    .gate-loading {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .gate-loading.visible {
      display: flex;
    }

    .gate-loading-heart {
      width: 46px;
      height: 46px;
    }

    .heart-fill {
      fill: var(--accent);
      animation: gateHeartBeat 1.1s ease-in-out infinite;
      transform-origin: center;
    }

    .gate-ecg-line {
      fill: none;
      stroke: #ffffff;
      stroke-width: 1.4;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: gateEcgDraw 1.1s linear infinite;
    }

    @keyframes gateHeartBeat {
      0%, 100% { transform: scale(1); }
      25% { transform: scale(1.08); }
      50% { transform: scale(0.98); }
    }

    @keyframes gateEcgDraw {
      0% { stroke-dashoffset: 100; opacity: 1; }
      65% { stroke-dashoffset: 0; opacity: 1; }
      85% { stroke-dashoffset: 0; opacity: 1; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }

    .gate-loading-text {
      font-size: 13px;
      color: var(--ink-soft);
    }

    @media (prefers-reduced-motion: reduce) {
      .heart-fill, .gate-ecg-line {
        animation: none;
      }
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

      <div class="gate-loading" id="gate-loading">
        <svg class="gate-loading-heart" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path class="heart-fill" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          <path class="gate-ecg-line" d="M3 12 L7.5 12 L9.5 7 L12 17 L14.5 9 L16.5 12 L21 12"/>
        </svg>
        <div class="gate-loading-text" id="gate-loading-text">One moment…</div>
      </div>

      <div class="gate-disclosure" id="gate-disclosure">
        We and our partners may monitor and record conversations for quality, systems training, and personalization.
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
      const loadingEl = document.getElementById("gate-loading");
      const loadingTextEl = document.getElementById("gate-loading-text");

      buttonsEl.style.display = "none";
      loadingEl.classList.add("visible");
      loadingTextEl.textContent = "One moment…";

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
        loadingTextEl.textContent = "Something went wrong setting up your session. Please refresh and try again.";
        loadingEl.classList.remove("visible");
        buttonsEl.style.display = "flex";
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

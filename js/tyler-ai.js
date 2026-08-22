(async () => {
  "use strict";

  /*
   * Tyler AI — Portfolio Chat Widget
   * Frontend website: GitHub Pages / Vercel static hosting
   * Backend API: Vercel serverless function
   */

  const CONFIG = {
    apiUrl: "https://tylerjanczak-github-io.vercel.app/api/chat",
    statusUrl: "https://tylerjanczak-github-io.vercel.app/api/chat-config",
    resumeUrl: "https://tylerjanczak-github-io.vercel.app/resume.pdf",
    resumeApiUrl: "https://tylerjanczak-github-io.vercel.app/api/send-resume",
    assistantName: "Tyler AI",
    profileImage: "tyler-ai-avatar.jpg",
    requestTimeoutMs: 45000
  };

  // Prevent the widget from being loaded more than once.
  if (document.getElementById("tyler-ai-widget")) {
    return;
  }

  // A semi-stable browser fingerprint — a secondary identity signal
  // alongside IP address, since IP alone can be rotated via a VPN or
  // Private Relay. Not a guaranteed unique ID, just an additional signal.
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

  const deviceFingerprint = await generateFingerprint();

  // Check the site-wide on/off switches controlled from the dashboard
  // before rendering anything. Fails open (shows the site/widget normally)
  // if the check itself fails, so a network hiccup never silently breaks things.
  try {
    const statusUrlWithFp = deviceFingerprint
      ? `${CONFIG.statusUrl}?fp=${encodeURIComponent(deviceFingerprint)}`
      : CONFIG.statusUrl;

    const statusRes = await fetch(statusUrlWithFp, { cache: "no-store" });
    const statusData = await statusRes.json();

    if (statusData && statusData.ipBlocked === true) {
      showBlockedOverlay();
      return;
    }

    if (statusData && statusData.maintenance === true) {
      showFullPageOverlay(
        "Down for Maintenance",
        "Tyler's portfolio is temporarily unavailable while updates are made. Please check back shortly."
      );
      return;
    }

    if (statusData && statusData.enabled === false) {
      return;
    }
  } catch (err) {
    console.error("Tyler AI status check failed, showing site normally by default:", err);
  }

  function showFullPageOverlay(title, message) {
    document.body.innerHTML = "";
    document.body.style.margin = "0";

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f7f4ee;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      text-align: center;
      padding: 24px;
    `;

    overlay.innerHTML = `
      <div>
        <div style="font-family: Georgia, serif; font-size: 30px; color: #1b1b1b; margin-bottom: 12px;">
          ${title}
        </div>
        <div style="font-size: 15px; color: #4a4a48; max-width: 380px; margin: 0 auto;">
          ${message}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  function showBlockedOverlay() {
    document.body.innerHTML = "";
    document.body.style.margin = "0";

    // A scattered space-doodle pattern — rockets, ringed planets, stars —
    // glowing softly against a dark navy night sky.
    const patternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260">
      <g stroke="#3d5a80" stroke-width="1.5" fill="none" opacity="0.55">
        <g transform="translate(28,36)">
          <path d="M10 50 L10 15 Q10 0 20 0 Q30 0 30 15 L30 50 L20 62 Z"/>
          <circle cx="20" cy="18" r="5"/>
          <path d="M10 40 L0 55 L10 50 Z"/>
          <path d="M30 40 L40 55 L30 50 Z"/>
        </g>
        <g transform="translate(190,34)">
          <circle cx="0" cy="0" r="13"/>
          <ellipse cx="0" cy="0" rx="25" ry="7" transform="rotate(-20)"/>
        </g>
        <path d="M92,96 L96,106 L106,106 L98,112 L101,122 L92,116 L83,122 L86,112 L78,106 L88,106 Z" fill="#8fd4f5" stroke="none" opacity="0.6"/>
        <g transform="translate(205,155) rotate(25) scale(0.65)">
          <path d="M10 50 L10 15 Q10 0 20 0 Q30 0 30 15 L30 50 L20 62 Z"/>
          <circle cx="20" cy="18" r="5"/>
        </g>
        <g transform="translate(55,195)">
          <circle cx="0" cy="0" r="9"/>
          <ellipse cx="0" cy="0" rx="18" ry="5" transform="rotate(15)"/>
        </g>
        <path d="M225,222 l3,7 l7,0 l-5,5 l2,7 l-7,-4 l-7,4 l2,-7 l-5,-5 l7,0 Z" fill="#8fd4f5" stroke="none" opacity="0.6"/>
      </g>
    </svg>`;

    const patternUrl = `data:image/svg+xml,${encodeURIComponent(patternSvg)}`;

    // A small spaceship abducting Nugget — a nod to the site's playful side
    // even in an otherwise serious "access denied" moment.
    const ufoSvg = `<svg width="140" height="150" viewBox="0 0 150 160" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beamGlow" cx="50%" cy="20%" r="75%">
          <stop offset="0%" stop-color="#bdeaff" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="#4fc3f7" stop-opacity="0.35"/>
        </radialGradient>
      </defs>

      <polygon points="75,58 48,112 102,112" fill="url(#beamGlow)"/>

      <!-- Ship hull: elongated capsule shape, not a saucer -->
      <g>
        <ellipse cx="75" cy="34" rx="17" ry="30" fill="#22304a"/>
        <path d="M58 30 Q75 -2 92 30 L92 34 Q75 42 58 34 Z" fill="#16213a"/>
        <ellipse cx="75" cy="30" rx="9" ry="12" fill="#7fd4f5" stroke="#16213a" stroke-width="1.5"/>
        <ellipse cx="75" cy="30" rx="5" ry="7" fill="#d9f5ff" opacity="0.8"/>

        <!-- fins -->
        <path d="M58 44 L44 58 L58 56 Z" fill="#16213a"/>
        <path d="M92 44 L106 58 L92 56 Z" fill="#16213a"/>

        <!-- engine glow / beam emitter -->
        <ellipse cx="75" cy="58" rx="16" ry="6" fill="#16213a"/>
        <circle cx="66" cy="58" r="2.4" fill="#8fe3ff"/>
        <circle cx="75" cy="59" r="2.4" fill="#8fe3ff"/>
        <circle cx="84" cy="58" r="2.4" fill="#8fe3ff"/>
      </g>

      <!-- Nugget, mid-run in the beam — original golden Maltese Shih Tzu design -->
      <g transform="translate(78,98)">
        <!-- legs, kicked out mid-stride rather than dangling -->
        <path d="M -13 8 Q -18 12 -20 19" stroke="#1b1b1b" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M -3 9 Q -4 15 -8 20" stroke="#1b1b1b" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 5 9 Q 7 15 4 21" stroke="#1b1b1b" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 12 7 Q 17 11 18 18" stroke="#1b1b1b" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- fluffy curled tail, up and alert -->
        <path d="M 15 -3 Q 22 -8 20 -15 Q 18 -19 13 -16" stroke="#1b1b1b" stroke-width="1.6" fill="#e8cf8a" stroke-linecap="round"/>

        <!-- body, fluffy golden coat -->
        <path d="M -16 4
                 Q -18 -7 -7 -9
                 L 10 -9
                 Q 18 -8 18 1
                 Q 18 8 9 9
                 L -10 9
                 Q -16 9 -16 4 Z"
              fill="#e8cf8a" stroke="#1b1b1b" stroke-width="1.5"/>

        <!-- head, round -->
        <circle cx="-19" cy="-4" r="10" fill="#f0dfa8" stroke="#1b1b1b" stroke-width="1.5"/>

        <!-- floppy ears -->
        <path d="M -26 -10 Q -33 -8 -32 0 Q -31 5 -26 3 Z" fill="#d8b96a" stroke="#1b1b1b" stroke-width="1.3"/>
        <path d="M -13 -11 Q -8 -7 -10 0 Q -12 4 -16 1 Z" fill="#d8b96a" stroke="#1b1b1b" stroke-width="1.3"/>

        <!-- snout -->
        <ellipse cx="-25" cy="-1" rx="4.5" ry="3.5" fill="#fbf3dc" stroke="#1b1b1b" stroke-width="1.2"/>
        <circle cx="-28" cy="-1.5" r="1" fill="#1b1b1b"/>

        <!-- eye -->
        <circle cx="-18" cy="-6" r="1.3" fill="#1b1b1b"/>

        <!-- eyebrow tuft, a little personality -->
        <path d="M -21 -10 Q -19 -12 -16 -10.5" stroke="#1b1b1b" stroke-width="1" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0f1c33;
      background-image: url("${patternUrl}"), radial-gradient(circle at 50% 35%, #1c3559 0%, #0f1c33 70%);
      background-size: 260px 260px, cover;
      background-repeat: repeat, no-repeat;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      padding: 24px;
    `;

    overlay.innerHTML = `
      <div style="
        background: #fffefa;
        border-radius: 14px;
        box-shadow: 0 0 0 1px rgba(143,212,245,0.25), 0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(79,195,247,0.15);
        max-width: 420px;
        width: 100%;
        overflow: hidden;
        text-align: center;
      ">
        <div style="padding: 26px 28px 4px; display: flex; justify-content: center;">${ufoSvg}</div>
        <div style="padding: 4px 30px 30px;">
          <div style="display: flex; justify-content: center; margin-bottom: 16px;">
            <div style="width: 60px; border-radius: 5px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.12);">
              <div style="
                height: 46px;
                background: repeating-linear-gradient(-45deg, #d94a40, #d94a40 5px, #b3261e 5px, #b3261e 10px);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2 L23 21 L1 21 Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
                  <rect x="11" y="9" width="2" height="6" fill="#ffffff"/>
                  <rect x="11" y="16.5" width="2" height="2" fill="#ffffff"/>
                </svg>
              </div>
            </div>
          </div>
          <div style="font-family: Georgia, serif; font-size: 25px; font-weight: 700; color: #b3261e; margin-bottom: 6px; line-height: 1.2;">
            Hard Stop: Error
          </div>
          <div style="font-size: 18px; font-weight: 600; color: #1b1b1b; margin-bottom: 14px;">
            Access Denied
          </div>
          <div style="margin-top: 10px; padding-top: 16px; border-top: 1px solid #e2ddd0; font-size: 11px; letter-spacing: 0.06em; color: #8b857e;">
            © 2026 Tyler Janczak
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /* ------------------------------------------------------------------
     CSS
  ------------------------------------------------------------------ */

  const style = document.createElement("style");

  style.textContent = `
    #tyler-ai-widget,
    #tyler-ai-widget * {
      box-sizing: border-box;
    }

    #tyler-ai-widget {
      --ta-red: #7b1f2a;
      --ta-red-hover: #641923;
      --ta-background: #f7f5f0;
      --ta-panel: #fffefa;
      --ta-border: rgba(40, 35, 30, 0.18);
      --ta-text: #24211e;
      --ta-muted: #746e67;
      --ta-user-text: #ffffff;

      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 999999;
      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Arial,
        sans-serif;
      color: var(--ta-text);
    }

    #tyler-ai-launcher {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      height: 68px;
      padding: 8px 26px 8px 8px;
      border: 0;
      border-radius: 999px;
      background: var(--ta-red);
      color: #ffffff;
      cursor: pointer;
      box-shadow: 0 12px 30px rgba(30, 22, 20, 0.28);
      transition:
        transform 160ms ease,
        box-shadow 160ms ease;
    }

    #tyler-ai-launcher img {
      display: block;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.35);
    }

    #tyler-ai-launcher-label {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.4px;
      white-space: nowrap;
    }

    .tyler-ai-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    #tyler-ai-notification-dot {
      position: absolute;
      top: 2px;
      right: 14px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #2f7de1;
      border: 2.5px solid #f7f5f0;
      box-shadow: 0 0 0 2px rgba(47, 125, 225, 0.25);
      display: none;
    }

    #tyler-ai-notification-dot.tyler-ai-dot-visible {
      display: block;
      animation: tylerAiDotPop 220ms ease-out;
    }

    @keyframes tylerAiDotPop {
      from {
        transform: scale(0.4);
        opacity: 0;
      }

      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    #tyler-ai-nudge {
      position: fixed;
      right: 24px;
      bottom: 98px;
      z-index: 999998;
      max-width: 240px;
      padding: 13px 34px 13px 16px;
      background: #fffefa;
      border: 1px solid var(--ta-border);
      border-radius: 14px;
      box-shadow: 0 14px 34px rgba(30, 22, 20, 0.18);
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.45;
      color: var(--ta-text);
      cursor: pointer;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 220ms ease, transform 220ms ease;
      pointer-events: none;
    }

    #tyler-ai-nudge.tyler-ai-nudge-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    #tyler-ai-nudge::after {
      content: "";
      position: absolute;
      bottom: -7px;
      right: 30px;
      width: 14px;
      height: 14px;
      background: #fffefa;
      border-right: 1px solid var(--ta-border);
      border-bottom: 1px solid var(--ta-border);
      transform: rotate(45deg);
    }

    #tyler-ai-nudge-close {
      position: absolute;
      top: 6px;
      right: 8px;
      border: 0;
      background: transparent;
      color: var(--ta-muted);
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 4px;
    }

    #tyler-ai-nudge-close:hover {
      color: var(--ta-text);
    }

    @media (max-width: 520px) {
      #tyler-ai-nudge {
        right: 14px;
        bottom: 82px;
        max-width: 200px;
        font-size: 13px;
      }
    }

    #tyler-ai-launcher:hover {
      transform: translateY(-3px) scale(1.04);
      box-shadow: 0 16px 34px rgba(30, 22, 20, 0.3);
    }

    #tyler-ai-launcher:focus-visible,
    #tyler-ai-close:focus-visible,
    #tyler-ai-send:focus-visible,
    #tyler-ai-input:focus-visible {
      outline: 3px solid rgba(123, 31, 42, 0.3);
      outline-offset: 2px;
    }

    #tyler-ai-panel {
      display: none;
      flex-direction: column;
      position: absolute;
      right: 0;
      bottom: 60px;
      width: min(390px, calc(100vw - 28px));
      height: min(600px, calc(100vh - 110px));
      overflow: hidden;
      border: 1px solid var(--ta-border);
      border-radius: 22px;
      background: var(--ta-panel);
      box-shadow: 0 24px 70px rgba(31, 27, 23, 0.24);
    }

    #tyler-ai-panel.tyler-ai-open {
      display: flex;
      animation: tylerAiOpen 180ms ease-out;
    }

    @keyframes tylerAiOpen {
      from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .tyler-ai-header {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 92px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--ta-border);
      background: rgba(255, 254, 250, 0.97);
    }

    .tyler-ai-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 44px;
      width: 44px;
      height: 44px;
      overflow: hidden;
      border-radius: 50%;
      background:
        linear-gradient(145deg, #d8c6aa, #f1e9db);
      color: var(--ta-red);
      font-family: Georgia, serif;
      font-size: 17px;
      font-weight: 700;
    }

    .tyler-ai-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tyler-ai-heading {
      min-width: 0;
      flex: 1;
    }

    .tyler-ai-title {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 23px;
      font-weight: 500;
      line-height: 1.1;
    }

    .tyler-ai-status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 7px;
      color: var(--ta-muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .tyler-ai-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #3f9b64;
      box-shadow: 0 0 0 3px rgba(63, 155, 100, 0.12);
    }

    #tyler-ai-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--ta-muted);
      font-size: 25px;
      line-height: 1;
      cursor: pointer;
    }

    #tyler-ai-close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: var(--ta-text);
    }

    #tyler-ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
      background: var(--ta-background);
      scroll-behavior: smooth;
    }

    .tyler-ai-row {
      display: flex;
      align-items: flex-end;
      gap: 9px;
      margin-bottom: 14px;
    }

    .tyler-ai-row.user {
      justify-content: flex-end;
    }

    .tyler-ai-small-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 28px;
      width: 28px;
      height: 28px;
      overflow: hidden;
      border-radius: 50%;
      background: #e7dbca;
      color: var(--ta-red);
      font-family: Georgia, serif;
      font-size: 11px;
      font-weight: 700;
    }

    .tyler-ai-small-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tyler-ai-message {
      max-width: 82%;
      padding: 12px 14px;
      border: 1px solid var(--ta-border);
      border-radius: 5px;
      background: #fffefa;
      font-size: 14px;
      line-height: 1.52;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      box-shadow: 0 2px 8px rgba(30, 25, 20, 0.04);
    }

    .tyler-ai-message a {
      color: var(--ta-red);
      text-decoration: underline;
    }

    .tyler-ai-row.user .tyler-ai-message {
      border-color: var(--ta-red);
      border-radius: 5px;
      background: var(--ta-red);
      color: var(--ta-user-text);
    }

    .tyler-ai-message.notice {
      color: #625c56;
      font-size: 13px;
    }

    .tyler-ai-message.error {
      border-color: rgba(162, 45, 45, 0.28);
      background: #fff5f4;
      color: #8b2929;
    }

    .tyler-ai-typing {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 64px;
      min-height: 32px;
    }

    .tyler-ai-typing svg {
      display: block;
      width: 64px;
      height: 26px;
    }

    .tyler-ai-ecg-line {
      fill: none;
      stroke: var(--ta-red);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: tylerAiEcgDraw 1.5s linear infinite;
    }

    @keyframes tylerAiEcgDraw {
      0% {
        stroke-dashoffset: 100;
        opacity: 1;
      }

      65% {
        stroke-dashoffset: 0;
        opacity: 1;
      }

      85% {
        stroke-dashoffset: 0;
        opacity: 1;
      }

      100% {
        stroke-dashoffset: 0;
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .tyler-ai-ecg-line {
        animation: none;
        stroke-dashoffset: 0;
      }
    }

    .tyler-ai-searching {
      min-width: 190px;
      max-width: 82%;
    }

    .tyler-ai-searching-title {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-weight: 700;
      font-size: 11.5px;
      color: var(--ta-muted);
      margin-bottom: 9px;
      line-height: 1.35;
    }

    .tyler-ai-searching-title-text {
      padding-top: 1px;
    }

    .tyler-ai-searching-title svg {
      display: block;
      width: 30px;
      height: 14px;
      flex: 0 0 auto;
      margin-top: 1px;
    }

    .tyler-ai-searching-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .tyler-ai-searching-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--ta-muted);
      opacity: 0.5;
      transition: opacity 200ms ease, color 200ms ease;
    }

    .tyler-ai-searching-list li.tyler-ai-checked {
      opacity: 1;
      color: var(--ta-text);
    }

    .tyler-ai-check-icon {
      position: relative;
      flex: 0 0 15px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      border: 1.5px solid var(--ta-border);
      transition: background 200ms ease, border-color 200ms ease;
    }

    .tyler-ai-searching-list li.tyler-ai-checked .tyler-ai-check-icon {
      background: var(--ta-red);
      border-color: var(--ta-red);
    }

    .tyler-ai-searching-list li.tyler-ai-checked .tyler-ai-check-icon::after {
      content: "";
      position: absolute;
      left: 4.5px;
      top: 2px;
      width: 4px;
      height: 7px;
      border-right: 2px solid #ffffff;
      border-bottom: 2px solid #ffffff;
      transform: rotate(40deg);
    }

    .tyler-ai-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin: 4px 0 14px 37px;
      max-width: calc(82% + 37px);
    }

    .tyler-ai-suggestion-chip {
      border: 1px solid var(--ta-border);
      background: #fffefa;
      color: var(--ta-red);
      font-size: 12.5px;
      font-weight: 600;
      padding: 8px 13px;
      border-radius: 999px;
      cursor: pointer;
      text-align: left;
      line-height: 1.3;
      transition: background 140ms ease, border-color 140ms ease;
    }

    .tyler-ai-suggestion-chip:hover {
      background: rgba(123, 31, 42, 0.06);
      border-color: rgba(123, 31, 42, 0.35);
    }

    .tyler-ai-footer {
      padding: 12px;
      border-top: 1px solid var(--ta-border);
      background: var(--ta-panel);
    }

    #tyler-ai-form {
      display: flex;
      align-items: flex-end;
      gap: 9px;
    }

    #tyler-ai-input {
      flex: 1;
      min-height: 46px;
      max-height: 112px;
      resize: none;
      padding: 12px 13px;
      border: 1px solid rgba(40, 35, 30, 0.38);
      border-radius: 5px;
      background: #ffffff;
      color: var(--ta-text);
      font: inherit;
      font-size: 14px;
      line-height: 1.4;
    }

    #tyler-ai-input::placeholder {
      color: #8b857e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #tyler-ai-send {
      flex: 0 0 auto;
      min-width: 82px;
      height: 46px;
      padding: 0 16px;
      border: 0;
      border-radius: 5px;
      background: var(--ta-red);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.3px;
      text-transform: uppercase;
      cursor: pointer;
    }

    #tyler-ai-send:hover:not(:disabled) {
      background: var(--ta-red-hover);
    }

    #tyler-ai-send:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    @media (max-width: 520px) {
      #tyler-ai-widget {
        right: 14px;
        bottom: 14px;
      }

      #tyler-ai-panel {
        position: fixed;
        right: 14px;
        bottom: 72px;
        left: 14px;
        width: auto;
        height: min(650px, calc(100vh - 95px));
      }

      #tyler-ai-launcher {
        height: 56px;
        padding: 6px 20px 6px 6px;
        gap: 9px;
      }

      #tyler-ai-launcher img {
        width: 42px;
        height: 42px;
      }

      #tyler-ai-launcher-label {
        font-size: 13px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #tyler-ai-panel.tyler-ai-open {
        animation: none;
      }

      #tyler-ai-messages {
        scroll-behavior: auto;
      }
    }
  `;

  document.head.appendChild(style);

  /* ------------------------------------------------------------------
     HTML
  ------------------------------------------------------------------ */

  const widget = document.createElement("section");
  widget.id = "tyler-ai-widget";

  const avatarContent = CONFIG.profileImage
    ? `<img src="${escapeHtml(CONFIG.profileImage)}" alt="Tyler Janczak">`
    : "TJ";

  widget.innerHTML = `
    <div
      id="tyler-ai-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="tyler-ai-title"
      aria-hidden="true"
    >
      <header class="tyler-ai-header">
        <div class="tyler-ai-avatar">
          ${avatarContent}
        </div>

        <div class="tyler-ai-heading">
          <h2 class="tyler-ai-title" id="tyler-ai-title">
            ${escapeHtml(CONFIG.assistantName)}
          </h2>

          <div class="tyler-ai-status">
            <span class="tyler-ai-status-dot" aria-hidden="true"></span>
            Online
          </div>
        </div>

        <button
          id="tyler-ai-close"
          type="button"
          aria-label="Close Tyler AI"
        >
          &times;
        </button>
      </header>

      <main
        id="tyler-ai-messages"
        aria-live="polite"
        aria-label="Conversation"
      ></main>

      <footer class="tyler-ai-footer">
        <form id="tyler-ai-form">
          <textarea
            id="tyler-ai-input"
            rows="1"
            maxlength="1500"
            placeholder="Ask about Tyler's experience..."
            aria-label="Ask Tyler AI a question"
          ></textarea>

          <button id="tyler-ai-send" type="submit">
            Send
          </button>
        </form>
      </footer>
    </div>

    <button
      id="tyler-ai-launcher"
      type="button"
      aria-expanded="false"
      aria-controls="tyler-ai-panel"
      aria-label="Ask Tyler AI"
    >
      <img src="${escapeHtml(CONFIG.profileImage)}" alt="" />
      <span id="tyler-ai-launcher-label">Ask Tyler AI</span>
      <span
        id="tyler-ai-notification-dot"
        aria-hidden="true"
      ></span>
    </button>

    <div id="tyler-ai-nudge" role="button" tabindex="0">
      <button id="tyler-ai-nudge-close" type="button" aria-label="Dismiss">&times;</button>
      Got a question about Tyler's background?
    </div>
  `;

  document.body.appendChild(widget);

  /* ------------------------------------------------------------------
     Element references
  ------------------------------------------------------------------ */

  const panel = document.getElementById("tyler-ai-panel");
  const launcher = document.getElementById("tyler-ai-launcher");
  const closeButton = document.getElementById("tyler-ai-close");
  const messages = document.getElementById("tyler-ai-messages");
  const form = document.getElementById("tyler-ai-form");
  const input = document.getElementById("tyler-ai-input");
  const sendButton = document.getElementById("tyler-ai-send");
  const notificationDot = document.getElementById("tyler-ai-notification-dot");
  const launcherLabel = document.getElementById("tyler-ai-launcher-label");

  let requestInProgress = false;
  let conversationStarted = false;
  let awaitingResumeEmail = false;
  let awaitingScheduleName = false;
  let awaitingSchedulePhone = false;
  let awaitingScheduleEmail = false;
  let scheduleName = null;
  let schedulePhone = null;
  let scheduleEmail = null;
  let selectedScheduleSlot = null;
  let chatDisabled = false;

  // Recent question/answer pairs from this chat session, sent with each
  // new request so follow-up questions have context. Resets on a full
  // page reload — persists only for the current active conversation.
  const conversationHistory = [];
  const MAX_HISTORY_TURNS = 6;

  // A stable ID for this browser tab's visit, so every message sent
  // during one visit groups together as one conversation on the dashboard.
  const SESSION_ID_KEY = "tylerAiConversationSessionId";
  let conversationSessionId;
  try {
    conversationSessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (!conversationSessionId) {
      conversationSessionId = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_ID_KEY, conversationSessionId);
    }
  } catch {
    conversationSessionId = crypto.randomUUID();
  }

  const resumeRequestPattern =
    /(resume|cv).*(send|email|copy|share|forward|get|see|view)|(send|email|copy|share|forward|get|see|view).*(resume|cv)/i;
  const scheduleCallPattern =
    /(schedule|book|set up|setup|arrange).*(call|meeting|chat|time)|(talk|meet|speak).*(with tyler|to tyler)|interview.*tyler|tyler.*(available|availability)/i;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ------------------------------------------------------------------
     Link handling — the AI is instructed to output markdown-style
     links like [Recommendations](https://.../recommendations.html).
     We render them safely, then auto-navigate the browser there
     after the person has had a moment to read the answer.
  ------------------------------------------------------------------ */

  function formatMessageHtml(text) {
    const escaped = escapeHtml(text);

    return escaped.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  function parseAssistantResponse(rawText) {
    const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;
    const match = rawText.match(linkPattern);

    if (!match) {
      return { displayText: rawText, navigateUrl: null };
    }

    // Strip the markdown link syntax from the visible text since we
    // navigate there automatically instead of asking for a click.
    const displayText = rawText.replace(linkPattern, match[1]).trim();
    return { displayText, navigateUrl: match[2] };
  }

  function getTimeBasedGreeting() {
    const hour = new Date().getHours();

    if (hour < 5) return "Hi";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Hi";
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function showInitialMessage(text, type, delayBeforeMs, typingDurationMs) {
    await wait(delayBeforeMs);
    const typingRow = addTypingIndicator();
    await wait(typingDurationMs);
    typingRow.remove();
    addAssistantMessage(text, type);
  }

  async function runInitialMessages() {
    await showInitialMessage(
      "We and our partners may monitor and record conversations for quality, systems training, and personalization.",
      "notice",
      300,
      1100
    );

    await showInitialMessage(
      `${getTimeBasedGreeting()}, I'm Tyler AI. Ask me about Tyler's background, and I can point you to the right part of the site or send his resume.`,
      "",
      500,
      1100
    );

    addSuggestionChips();
  }

  const SUGGESTED_QUESTIONS = [
    "Send me Tyler's resume",
    "Arrange Intro Meeting",
    "How is Tyler perceived by his former employers?",
    "What's Tyler's most impressive project?",
    "What AI or automation work has Tyler done?"
  ];

  function removeSuggestionChips() {
    const existing = document.getElementById("tyler-ai-suggestions");
    if (existing) existing.remove();
  }

  function addSuggestionChips() {
    // Don't show these if the visitor already started typing or asking
    // something on their own while the greeting was still playing out.
    if (conversationStarted) return;

    const wrap = document.createElement("div");
    wrap.className = "tyler-ai-suggestions";
    wrap.id = "tyler-ai-suggestions";

    SUGGESTED_QUESTIONS.forEach((suggestion) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tyler-ai-suggestion-chip";
      chip.textContent = suggestion;
      chip.addEventListener("click", () => {
        removeSuggestionChips();
        input.value = suggestion;
        form.requestSubmit();
      });
      wrap.appendChild(chip);
    });

    messages.appendChild(wrap);
    scrollToBottom();
  }

  /* ------------------------------------------------------------------
     Initial messages
  ------------------------------------------------------------------ */

  runInitialMessages();

  /* ------------------------------------------------------------------
     Nudge tooltip — a gentle, one-time prompt after 15s of inactivity,
     instead of forcing the chat panel open.
  ------------------------------------------------------------------ */

  const NUDGE_SESSION_KEY = "tylerAiNudgeShown";
  const nudgeEl = document.getElementById("tyler-ai-nudge");
  const nudgeCloseBtn = document.getElementById("tyler-ai-nudge-close");
  let nudgeAutoHideTimer = null;

  function hideNudge() {
    nudgeEl.classList.remove("tyler-ai-nudge-visible");
    window.clearTimeout(nudgeAutoHideTimer);
  }

  function maybeShowNudge() {
    if (conversationStarted || panel.classList.contains("tyler-ai-open")) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(NUDGE_SESSION_KEY)) {
        return;
      }
      window.sessionStorage.setItem(NUDGE_SESSION_KEY, "true");
    } catch {
      // If storage is blocked, still show it this one time.
    }

    nudgeEl.classList.add("tyler-ai-nudge-visible");

    nudgeAutoHideTimer = window.setTimeout(hideNudge, 8000);
  }

  window.setTimeout(maybeShowNudge, 15000);

  nudgeEl.addEventListener("click", (event) => {
    if (event.target === nudgeCloseBtn) return;
    hideNudge();
    openChat();
  });

  nudgeEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      hideNudge();
      openChat();
    }
  });

  nudgeCloseBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    hideNudge();
  });

  /* ------------------------------------------------------------------
     Open and close behavior
  ------------------------------------------------------------------ */

  launcher.addEventListener("click", () => {
    hideNudge();
    const isOpen = panel.classList.contains("tyler-ai-open");

    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeButton.addEventListener("click", closeChat);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      panel.classList.contains("tyler-ai-open")
    ) {
      closeChat();
    }
  });

  function openChat() {
    panel.classList.add("tyler-ai-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    launcherLabel.textContent = "Close Tyler AI";
    notificationDot.classList.remove("tyler-ai-dot-visible");

    window.setTimeout(() => {
      input.focus();
    }, 100);
  }

  function closeChat() {
    panel.classList.remove("tyler-ai-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    launcherLabel.textContent = "Ask Tyler AI";
    launcher.focus();
  }

  /* ------------------------------------------------------------------
     Input behavior
  ------------------------------------------------------------------ */

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
  });

  input.addEventListener("keydown", (event) => {
    // Enter sends. Shift + Enter adds a new line.
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  /* ------------------------------------------------------------------
     Send questions to Vercel
  ------------------------------------------------------------------ */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = input.value.trim();

    if (!question || requestInProgress) {
      return;
    }

    if (question.length > 1500) {
      addAssistantMessage(
        "Please shorten your question to fewer than 1,500 characters.",
        "error"
      );
      return;
    }

    conversationStarted = true;
    removeSuggestionChips();
    addUserMessage(question);

    input.value = "";
    input.style.height = "auto";

    // If we just asked for an email to send the resume to, treat this
    // reply as the email address instead of a normal chat question.
    if (awaitingResumeEmail) {
      awaitingResumeEmail = false;

      if (!emailPattern.test(question)) {
        addAssistantMessage(
          "That doesn't look like a valid email address. Could you try typing it again?",
          "error"
        );
        awaitingResumeEmail = true;
        return;
      }

      await sendResumeToEmail(question);
      return;
    }

    // Scheduling flow: after a time is picked, collect name, then phone,
    // then email, in sequence, with a natural pause before each question.
    if (awaitingScheduleName) {
      awaitingScheduleName = false;

      if (question.length < 1 || question.length > 100) {
        addAssistantMessage("I didn't quite catch that. What's your name?", "error");
        awaitingScheduleName = true;
        return;
      }

      scheduleName = question;
      await promptForSchedulePhone();
      return;
    }

    if (awaitingSchedulePhone) {
      awaitingSchedulePhone = false;

      const digitCount = question.replace(/\D/g, "").length;
      if (digitCount < 7) {
        addAssistantMessage(
          "That doesn't look like a valid phone number. Could you try again?",
          "error"
        );
        awaitingSchedulePhone = true;
        return;
      }

      schedulePhone = question;
      await promptForScheduleEmail();
      return;
    }

    if (awaitingScheduleEmail) {
      awaitingScheduleEmail = false;

      if (!emailPattern.test(question)) {
        addAssistantMessage(
          "That doesn't look like a valid email address. Could you try typing it again?",
          "error"
        );
        awaitingScheduleEmail = true;
        return;
      }

      scheduleEmail = question;
      await logCallRequest();
      await requestBooking(selectedScheduleSlot);
      return;
    }

    // If the question is asking for the resume, start the email-collection
    // flow instead of sending this to the AI model.
    if (resumeRequestPattern.test(question)) {
      addAssistantMessage(
        "Happy to send that over. What email address should I send Tyler's resume to?"
      );
      awaitingResumeEmail = true;
      return;
    }

    // If the question is about scheduling a call, show real availability
    // first. Contact details are only collected once a time is picked.
    if (scheduleCallPattern.test(question)) {
      await handleScheduleRequest();
      return;
    }

    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    const typingElement = addSearchingIndicator(question);

    try {
      const controller = new AbortController();

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, CONFIG.requestTimeoutMs);

      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question,
          page: window.location.pathname,
          sessionId: conversationSessionId,
          fingerprint: deviceFingerprint,
          history: conversationHistory
        }),
        signal: controller.signal
      });

      window.clearTimeout(timeout);

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `The server returned an invalid response (${response.status}).`
        );
      }

      if (!response.ok) {
        const serverMessage =
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}.`;

        throw new Error(serverMessage);
      }

      /*
       * This supports several common response formats:
       * { answer: "..." }
       * { response: "..." }
       * { message: "..." }
       * { content: "..." }
       */
      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        data?.content ||
        data?.output;

      if (!answer || typeof answer !== "string") {
        console.error("Unexpected Tyler AI response:", data);

        throw new Error(
          "Tyler AI returned an unexpected response format."
        );
      }

      typingElement.remove();

      const { displayText, navigateUrl } = parseAssistantResponse(answer);
      addAssistantMessage(displayText, data?.disabled ? "error" : "");

      if (!data?.disabled) {
        conversationHistory.push({ question, answer: displayText });
        if (conversationHistory.length > MAX_HISTORY_TURNS) {
          conversationHistory.shift();
        }
      }

      if (data?.disabled) {
        chatDisabled = true;
        input.disabled = true;
        sendButton.disabled = true;
        input.placeholder = "This chat is no longer available.";
        return;
      }

      if (navigateUrl) {
        window.setTimeout(() => {
          window.location.href = navigateUrl;
        }, 1800);
      }
    } catch (error) {
      typingElement.remove();

      console.error("Tyler AI request failed:", error);

      if (error.name === "AbortError") {
        addAssistantMessage(
          "The response took too long. Please try your question again.",
          "error"
        );
      } else {
        addAssistantMessage(
          "Tyler AI is temporarily unavailable. Please try again in a moment.",
          "error"
        );
      }
    } finally {
      requestInProgress = false;
      if (!chatDisabled) {
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }
  });

  /* ------------------------------------------------------------------
     Message helpers
  ------------------------------------------------------------------ */

  async function logCallRequest() {
    try {
      await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log-call-request",
          name: scheduleName,
          phone: schedulePhone,
          email: scheduleEmail,
          page: window.location.pathname
        })
      });
    } catch (error) {
      // Non-critical — don't block the scheduling flow if logging fails.
      console.error("Failed to log call request:", error);
    }
  }

  async function handleScheduleRequest() {
    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    const thinkingRow = addTypingIndicator();
    await wait(700);
    thinkingRow.remove();
    addAssistantMessage("Hmm, okay... looking at Tyler's calendar real quick.", "notice");

    const checkingRow = addTypingIndicator();

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-availability" }),
        signal: controller.signal
      });

      window.clearTimeout(timeout);

      const data = await response.json().catch(() => ({}));

      checkingRow.remove();

      if (!data.success || !Array.isArray(data.slots) || data.slots.length === 0) {
        addAssistantMessage(
          "I wasn't able to pull open times just now. You can reach Tyler directly to set up a call.",
          "error"
        );
        return;
      }

      addAssistantMessage(`I've got some openings. Here are a few:`);
      addScheduleOptions(data.slots);
    } catch (error) {
      checkingRow.remove();
      console.error("Availability lookup failed:", error);
      addAssistantMessage(
        "I wasn't able to pull open times just now. Please try again in a moment.",
        "error"
      );
    } finally {
      requestInProgress = false;
      if (!chatDisabled) {
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
      }
    }
  }

  function formatSlotLabel(startTime) {
    // No timeZone specified — this naturally uses the visitor's own
    // browser/local timezone, not the server's (which defaults to UTC).
    return new Date(startTime).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    });
  }

  function addScheduleOptions(slots) {
    const wrap = document.createElement("div");
    wrap.className = "tyler-ai-suggestions";

    slots.forEach((slot) => {
      const label = formatSlotLabel(slot.startTime);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tyler-ai-suggestion-chip";
      chip.textContent = label;
      chip.addEventListener("click", async () => {
        chip.disabled = true;
        selectedScheduleSlot = { ...slot, label };
        await promptForScheduleName();
      });
      wrap.appendChild(chip);
    });

    messages.appendChild(wrap);
    scrollToBottom();
  }

  // A brief, slightly randomized pause before each follow-up question,
  // so the exchange reads as composed rather than instant and canned.
  async function composedPrompt(text) {
    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    const thinkingRow = addTypingIndicator();
    await wait(1100 + Math.random() * 700);
    thinkingRow.remove();
    addAssistantMessage(text);

    requestInProgress = false;
    sendButton.disabled = false;
    input.disabled = false;
    input.focus();
  }

  async function promptForScheduleName() {
    await composedPrompt(
      "Ok, I see. In order to continue with your meeting request, I need to know your name."
    );
    awaitingScheduleName = true;
  }

  async function promptForSchedulePhone() {
    await composedPrompt(
      `Thanks, ${getFirstName(scheduleName)}. What's a good phone number for Tyler to reach you at?`
    );
    awaitingSchedulePhone = true;
  }

  async function promptForScheduleEmail() {
    await composedPrompt(
      "Last thing, what email should I use to confirm everything?"
    );
    awaitingScheduleEmail = true;
  }

  async function requestBooking(slot) {
    const sendingRow = addTypingIndicator();

    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-booking",
          name: scheduleName,
          phone: schedulePhone,
          email: scheduleEmail,
          startTime: slot.startTime,
          label: slot.label
        })
      });

      const data = await response.json().catch(() => ({}));
      sendingRow.remove();

      if (data.success) {
        addAssistantMessage(
          `Perfect, I've let Tyler know you'd like to meet ${slot.label}. He'll follow up to confirm.`
        );
        offerCalendarInvite(slot);
      } else {
        addAssistantMessage(
          "I wasn't able to send that request just now. Please try again in a moment.",
          "error"
        );
      }
    } catch (error) {
      sendingRow.remove();
      console.error("Booking request failed:", error);
      addAssistantMessage(
        "I wasn't able to send that request just now. Please try again in a moment.",
        "error"
      );
    }
  }

  // Escapes characters that have special meaning in the ICS format,
  // per RFC 5545 — commas, semicolons, backslashes, and newlines.
  function escapeIcsText(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function formatIcsDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function getFirstName(fullName) {
    return String(fullName || "").trim().split(/\s+/)[0] || "Guest";
  }

  function formatPhoneNumber(phone) {
    const digits = String(phone || "").replace(/\D/g, "");

    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (digits.length === 11 && digits[0] === "1") {
      return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    // Not a standard 10-digit US number — fall back to what was entered.
    return phone || "";
  }

  function generateIcsContent(slot) {
    const start = new Date(slot.startTime);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30-minute default
    const now = new Date();

    const requesterName = scheduleName || "Guest";
    const firstName = getFirstName(scheduleName);
    const formattedPhone = formatPhoneNumber(schedulePhone);

    const eventTitle = `${requesterName}/Tyler Janczak Intro - 30 min`;
    const eventDescription = `Tyler to call ${firstName} at ${formattedPhone}`;

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Tyler Janczak Portfolio//Tyler AI Scheduling//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}@tylerjanczak.com`,
      `DTSTAMP:${formatIcsDate(now)}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(eventTitle)}`,
      `DESCRIPTION:${escapeIcsText(eventDescription)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ];

    return lines.join("\r\n");
  }

  function offerCalendarInvite(slot) {
    const wrap = document.createElement("div");
    wrap.className = "tyler-ai-suggestions";

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tyler-ai-suggestion-chip";
    chip.textContent = "Download calendar invite (.ics)";
    chip.addEventListener("click", () => {
      const icsContent = generateIcsContent(slot);
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const safeName = (scheduleName || "guest")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}-tyler-intro-30min.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });

    wrap.appendChild(chip);
    messages.appendChild(wrap);
    scrollToBottom();
  }

  async function sendResumeToEmail(email) {
    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    const typingElement = addTypingIndicator();

    try {
      const controller = new AbortController();

      const timeout = window.setTimeout(() => {
        controller.abort();
      }, CONFIG.requestTimeoutMs);

      const response = await fetch(CONFIG.resumeApiUrl, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });

      window.clearTimeout(timeout);

      const data = await response.json().catch(() => ({}));

      typingElement.remove();

      if (!response.ok || !data.success) {
        addAssistantMessage(
          data?.error ||
            "I wasn't able to send the resume just now. Please try again in a moment.",
          "error"
        );
        return;
      }

      addAssistantMessage(
        `Done. Tyler's resume is on its way to ${email}.`
      );
    } catch (error) {
      typingElement.remove();

      console.error("Resume send failed:", error);

      if (error.name === "AbortError") {
        addAssistantMessage(
          "That took too long. Please try again in a moment.",
          "error"
        );
      } else {
        addAssistantMessage(
          "I wasn't able to send the resume just now. Please try again in a moment.",
          "error"
        );
      }
    } finally {
      requestInProgress = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  function addUserMessage(text) {
    const row = document.createElement("div");
    row.className = "tyler-ai-row user";

    const bubble = document.createElement("div");
    bubble.className = "tyler-ai-message";
    bubble.textContent = text;

    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();

    return row;
  }

  function addAssistantMessage(text, type = "") {
    const row = document.createElement("div");
    row.className = "tyler-ai-row assistant";

    const avatar = document.createElement("div");
    avatar.className = "tyler-ai-small-avatar";

    if (CONFIG.profileImage) {
      const image = document.createElement("img");
      image.src = CONFIG.profileImage;
      image.alt = "";
      avatar.appendChild(image);
    } else {
      avatar.textContent = "TJ";
    }

    const bubble = document.createElement("div");
    bubble.className = `tyler-ai-message ${type}`.trim();
    bubble.innerHTML = formatMessageHtml(text);

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();

    if (!panel.classList.contains("tyler-ai-open")) {
      notificationDot.classList.add("tyler-ai-dot-visible");
    }

    return row;
  }

  function addTypingIndicator() {
    const row = document.createElement("div");
    row.className = "tyler-ai-row assistant";

    const avatar = document.createElement("div");
    avatar.className = "tyler-ai-small-avatar";

    if (CONFIG.profileImage) {
      const image = document.createElement("img");
      image.src = CONFIG.profileImage;
      image.alt = "";
      avatar.appendChild(image);
    } else {
      avatar.textContent = "TJ";
    }

    const typing = document.createElement("div");
    typing.className = "tyler-ai-message tyler-ai-typing";
    typing.setAttribute("aria-label", "Tyler AI is responding");

    typing.innerHTML = `
      <svg viewBox="0 0 130 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          class="tyler-ai-ecg-line"
          pathLength="100"
          d="M0 20 L20 20 Q26 16 32 20 Q38 24 42 20 L54 20 L60 6 L66 34 L72 20 L84 20 Q90 12 96 20 Q102 28 108 20 L130 20"
        />
      </svg>
    `;

    row.appendChild(avatar);
    row.appendChild(typing);
    messages.appendChild(row);
    scrollToBottom();

    return row;
  }

  function addSearchingIndicator(questionText) {
    const row = document.createElement("div");
    row.className = "tyler-ai-row assistant";

    const avatar = document.createElement("div");
    avatar.className = "tyler-ai-small-avatar";

    if (CONFIG.profileImage) {
      const image = document.createElement("img");
      image.src = CONFIG.profileImage;
      image.alt = "";
      avatar.appendChild(image);
    } else {
      avatar.textContent = "TJ";
    }

    const MAX_TITLE_LENGTH = 48;
    const trimmedQuestion = (questionText || "").trim();
    const displayQuestion =
      trimmedQuestion.length > MAX_TITLE_LENGTH
        ? `${trimmedQuestion.slice(0, MAX_TITLE_LENGTH).trim()}…`
        : trimmedQuestion;

    const titleText = displayQuestion
      ? `Searching "${displayQuestion}"...`
      : "Searching Portfolio...";

    const bubble = document.createElement("div");
    bubble.className = "tyler-ai-message tyler-ai-searching";
    bubble.setAttribute("aria-label", `Searching for: ${displayQuestion || "Tyler's portfolio"}`);
    bubble.innerHTML = `
      <div class="tyler-ai-searching-title">
        <svg viewBox="0 0 130 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            class="tyler-ai-ecg-line"
            pathLength="100"
            d="M0 20 L20 20 Q26 16 32 20 Q38 24 42 20 L54 20 L60 6 L66 34 L72 20 L84 20 Q90 12 96 20 Q102 28 108 20 L130 20"
          />
        </svg>
        <span class="tyler-ai-searching-title-text">${escapeHtml(titleText)}</span>
      </div>
      <ul class="tyler-ai-searching-list">
        <li><span class="tyler-ai-check-icon"></span>Experience</li>
        <li><span class="tyler-ai-check-icon"></span>Skills &amp; Certifications</li>
        <li><span class="tyler-ai-check-icon"></span>Measurable Outcomes</li>
      </ul>
    `;

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();

    const items = bubble.querySelectorAll(".tyler-ai-searching-list li");
    const timers = [];

    items.forEach((item, index) => {
      const timer = window.setTimeout(() => {
        item.classList.add("tyler-ai-checked");
        scrollToBottom();
      }, 350 + index * 420);
      timers.push(timer);
    });

    return {
      remove() {
        timers.forEach((timer) => window.clearTimeout(timer));
        row.remove();
      }
    };
  }

  function scrollToBottom() {
    window.requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Makes debugging easier in the browser console.
  window.TylerAI = {
    open: openChat,
    close: closeChat,
    apiUrl: CONFIG.apiUrl,
    hasConversationStarted: () => conversationStarted
  };
})();

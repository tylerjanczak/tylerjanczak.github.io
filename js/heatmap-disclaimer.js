(() => {
  "use strict";
  const STORAGE_KEY = "heatmapDisclaimerAcknowledged";

  // Don't show it twice in the same browser once acknowledged.
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }
  } catch {
    // If storage is blocked, fall through and just show it every visit.
  }

  if (document.getElementById("hd-overlay")) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    #hd-overlay {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999996;
      display: flex;
      justify-content: center;
      padding: 20px;
      pointer-events: none;
    }

    #hd-card {
      pointer-events: auto;
      width: min(720px, 100%);
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      box-shadow: 0 20px 55px rgba(20, 15, 10, 0.28);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 260ms ease, transform 260ms ease;
    }

    #hd-card.hd-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .hd-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background: linear-gradient(180deg, #f6ad3c, #f2a428);
      color: #1a1400;
    }

    .hd-icon {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #1a1400;
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
      margin-top: 1px;
    }

    .hd-banner-text {
      font-size: 14.5px;
      line-height: 1.5;
    }

    .hd-banner-text strong {
      font-weight: 700;
    }

    .hd-banner-text a {
      color: #1a1400;
      font-weight: 600;
      text-decoration: underline;
    }

    .hd-actions {
      display: flex;
      justify-content: flex-end;
      gap: 22px;
      padding: 12px 20px;
      background: #f4f4f4;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .hd-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 6px 4px;
    }

    #hd-accept {
      color: #1b5fae;
    }

    #hd-accept:hover {
      text-decoration: underline;
    }

    #hd-dismiss {
      color: #b3261e;
    }

    #hd-dismiss:hover {
      text-decoration: underline;
    }

    @media (max-width: 520px) {
      #hd-overlay {
        padding: 12px;
      }

      .hd-banner {
        padding: 14px 16px;
      }

      .hd-banner-text {
        font-size: 13.5px;
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "hd-overlay";
  overlay.innerHTML = `
    <div id="hd-card" role="dialog" aria-label="Site tracking disclosure">
      <div class="hd-banner">
        <span class="hd-icon" aria-hidden="true">!</span>
        <div class="hd-banner-text">
          <strong>FOR SITE VISITORS:</strong> This site uses Microsoft Clarity
          to see how visitors use the page — heatmaps and session behavior,
          for quality and improvement purposes. No personal or identifying
          information is collected. By using this site, you agree that Tyler
          Janczak and Microsoft can collect and use this data.
          <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">
            Microsoft's Privacy Statement
          </a>
          has more details.
        </div>
      </div>
      <div class="hd-actions">
        <button id="hd-accept" class="hd-btn" type="button">
          &#10003; Accept
        </button>
        <button id="hd-dismiss" class="hd-btn" type="button">
          &times; Dismiss
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const card = document.getElementById("hd-card");
  window.setTimeout(() => card.classList.add("hd-visible"), 80);

  function acknowledge() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Fails silently — worst case it shows again next visit.
    }

    card.classList.remove("hd-visible");
    window.setTimeout(() => overlay.remove(), 220);
  }

  document.getElementById("hd-accept").addEventListener("click", acknowledge);
  document.getElementById("hd-dismiss").addEventListener("click", acknowledge);
})();

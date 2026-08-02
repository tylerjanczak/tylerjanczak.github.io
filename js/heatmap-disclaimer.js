
(() => {
  "use strict";
  const STORAGE_KEY = "heatmapDisclaimerAcknowledged";
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      return;
    }
  } catch {
  }

  if (document.getElementById("hd-overlay")) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    #hd-overlay {
      position: fixed;
      inset: 0;
      z-index: 999996;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(20, 15, 10, 0.45);
    }

    #hd-card {
      pointer-events: auto;
      width: min(720px, 100%);
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      box-shadow: 0 20px 55px rgba(20, 15, 10, 0.35);
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      opacity: 0;
      transform: scale(0.94);
      transition: opacity 220ms ease, transform 220ms ease;
    }

    #hd-card.hd-visible {
      opacity: 1;
      transform: scale(1);
    }

    .hd-title-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px;
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
    }

    .hd-title {
      font-size: 19px;
      font-weight: 600;
    }

    .hd-body {
      padding: 16px 20px;
      background: #ffffff;
    }

    .hd-subtitle {
      font-size: 13px;
      color: #8a8a8a;
      margin-bottom: 10px;
    }

    .hd-message {
      font-size: 14.5px;
      line-height: 1.55;
      color: #1a1a1a;
    }

    .hd-message a {
      color: #1a1a1a;
      font-weight: 600;
      text-decoration: underline;
    }

    .hd-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #f4f4f4;
      border-top: 1px solid rgba(0, 0, 0, 0.15);
    }

    .hd-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 15px 12px;
      border: 0;
      background: transparent;
      font-size: 15px;
      font-weight: 400;
      cursor: pointer;
    }

    .hd-btn-icon {
      font-size: 14px;
      line-height: 1;
    }

    #hd-accept {
      color: #262626;
      border-right: 1px solid rgba(0, 0, 0, 0.15);
    }

    #hd-accept .hd-btn-icon {
      color: #2e7d32;
      font-weight: 700;
    }

    #hd-accept:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    #hd-dismiss {
      color: #262626;
    }

    #hd-dismiss .hd-btn-icon {
      color: #c62828;
      font-weight: 700;
    }

    #hd-dismiss:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    @media (max-width: 520px) {
      #hd-overlay {
        padding: 12px;
      }

      .hd-title-bar {
        padding: 12px 16px;
      }

      .hd-title {
        font-size: 17px;
      }

      .hd-body {
        padding: 14px 16px;
      }

      .hd-message {
        font-size: 13.5px;
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "hd-overlay";
  overlay.innerHTML = `
    <div id="hd-card" role="dialog" aria-label="Site tracking disclosure">
      <div class="hd-title-bar">
        <span class="hd-icon" aria-hidden="true">!</span>
        <span class="hd-title">Important Message</span>
      </div>
      <div class="hd-body">
        <div class="hd-subtitle">Site Analytics &amp; Tracking Notice</div>
        <div class="hd-message">
          This site uses Microsoft Clarity to see how visitors use the page —
          heatmaps and session behavior, for quality and improvement purposes.
          No personal or identifying information is collected. By using this
          site, you agree that Tyler Janczak and Microsoft can collect and use
          this data.
          <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">
            Microsoft's Privacy Statement
          </a>
          has more details.
        </div>
      </div>
      <div class="hd-actions">
        <button id="hd-accept" class="hd-btn" type="button">
          <span class="hd-btn-icon">&#10003;</span> Accept
        </button>
        <button id="hd-dismiss" class="hd-btn" type="button">
          <span class="hd-btn-icon">&#10005;</span> Dismiss
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

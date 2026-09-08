<!DOCTYPE html>
<!--
  © 2026 Tyler Janczak. All rights reserved.
  bridges.tylerjanczak.com — full-screen Tyler AI

  This page intentionally has no chat logic of its own. It loads the
  exact same js/tyler-ai.js used everywhere else on the main site, then
  restyles the widget to fill the screen and auto-opens it, so this page
  always has 100% feature parity with the normal chat widget (resume
  delivery, scheduling, moderation, everything) with zero duplicated code.
-->
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ask Tyler AI</title>
  <meta name="robots" content="noindex, nofollow" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #F5F8FC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    }

    /* Restyle the floating widget to fill the entire viewport instead
       of sitting as a small panel in the corner. */
    #tyler-ai-widget {
      position: fixed !important;
      inset: 0 !important;
    }

    #tyler-ai-launcher {
      display: none !important;
    }

    #tyler-ai-panel {
      position: fixed !important;
      inset: 0 !important;
      right: auto !important;
      bottom: auto !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      border-radius: 0 !important;
      border: none !important;
    }

    /* A small loading state shown before the widget finishes initializing
       (its status check, ban check, etc.) — replaced automatically once
       the panel opens. */
    #bridges-loading {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #55697D;
      font-size: 14px;
      letter-spacing: 0.02em;
    }

    /* Replace the widget's own small "×" close button with our own
       "Back to Home" pill, since closing this page should mean leaving
       the subdomain entirely, not just collapsing a popup. */
    #tyler-ai-close {
      display: none !important;
    }

    #bridges-back-home {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000000;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 20px 8px 8px;
      background: #ffffff;
      border: 1.5px solid #c0392b;
      border-radius: 999px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #c0392b;
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      transition: box-shadow 140ms ease;
    }

    #bridges-back-home:hover {
      box-shadow: 0 8px 22px rgba(0,0,0,0.13);
    }

    #bridges-back-home-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #c0392b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    #bridges-back-home-icon svg {
      width: 15px;
      height: 15px;
    }

    #bridges-back-home-spinner {
      display: none;
      width: 15px;
      height: 15px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: bridgesSpin 0.7s linear infinite;
    }

    #bridges-back-home.loading #bridges-back-home-arrow {
      display: none;
    }

    #bridges-back-home.loading #bridges-back-home-spinner {
      display: block;
    }

    @keyframes bridgesSpin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>

  <button id="bridges-back-home" type="button" aria-label="Back to Home">
    <span id="bridges-back-home-icon">
      <svg id="bridges-back-home-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span id="bridges-back-home-spinner"></span>
    </span>
    Back to Home
  </button>

  <div id="bridges-loading">Loading Tyler AI…</div>

  <script src="js/tyler-ai.js" defer></script>

  <script>
    document.getElementById("bridges-back-home").addEventListener("click", function (event) {
      var btn = event.currentTarget;
      if (btn.classList.contains("loading")) return;
      btn.classList.add("loading");
      window.setTimeout(function () {
        window.location.href = "https://tylerjanczak.com";
      }, 500);
    });
  </script>

  <script>
    // Wait for the widget to finish initializing (it does its own async
    // status/ban check before building anything), then open it and
    // remove the loading state. If the site is blocked or under
    // maintenance, tyler-ai.js will have already replaced the page
    // content itself, so this simply won't find anything to open.
    (function waitForWidget() {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;

        if (window.TylerAI && typeof window.TylerAI.open === "function") {
          window.TylerAI.open();
          var loading = document.getElementById("bridges-loading");
          if (loading) loading.remove();
          clearInterval(interval);
          return;
        }

        // Give up after ~8 seconds so a broken load doesn't hang forever.
        if (attempts > 80) {
          clearInterval(interval);
          var loadingEl = document.getElementById("bridges-loading");
          if (loadingEl) {
            loadingEl.textContent = "Tyler AI couldn't load right now. Please refresh the page.";
          }
        }
      }, 100);
    })();
  </script>

</body>
</html>

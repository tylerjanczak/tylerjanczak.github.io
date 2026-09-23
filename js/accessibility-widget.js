/*
  © 2026 Tyler Janczak. All rights reserved.
*/
(function () {
  "use strict";

  if (document.getElementById("a11y-widget")) return;

  const STORAGE_KEY = "tylerSiteA11ySettings";

  const DEFAULTS = {
    biggerText: false,
    contrast: false,
    textSpacing: false,
    lineHeight: false,
    pauseAnimations: false,
    highlightLinks: false,
    textAlign: false
  };

  function loadSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Object.assign({}, DEFAULTS, stored);
    } catch {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage blocked — settings just won't persist across pages, non-critical.
    }
  }

  let settings = loadSettings();

  const style = document.createElement("style");
  style.textContent = `
    #a11y-widget * { box-sizing: border-box; }

    #a11y-launcher {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 999998;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #C84545;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transition: transform 140ms ease;
    }

    #a11y-launcher:hover { transform: scale(1.06); }
    #a11y-launcher svg { width: 26px; height: 26px; }

    #a11y-panel {
      position: fixed;
      bottom: 86px;
      left: 24px;
      z-index: 999999;
      width: 300px;
      max-width: calc(100vw - 48px);
      max-height: 70vh;
      overflow-y: auto;
      background: #FFFFFF;
      border: 1px solid #D9D2C4;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
      padding: 20px;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      display: none;
    }

    #a11y-panel.open { display: block; }

    #a11y-panel-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 18px;
      font-weight: 500;
      color: #1B1B1B;
      margin-bottom: 4px;
    }

    #a11y-panel-sub {
      font-size: 12px;
      color: #4A4A48;
      margin-bottom: 16px;
    }

    .a11y-toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-top: 1px solid #EFEAE0;
    }

    .a11y-toggle-row:first-of-type { border-top: none; }

    .a11y-toggle-label {
      font-size: 14px;
      color: #1B1B1B;
    }

    .a11y-switch {
      position: relative;
      width: 40px;
      height: 22px;
      border-radius: 999px;
      background: #D9D2C4;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      margin-left: 12px;
      transition: background 140ms ease;
    }

    .a11y-switch.on { background: #C84545; }

    .a11y-switch::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ffffff;
      transition: left 140ms ease;
    }

    .a11y-switch.on::after { left: 20px; }

    #a11y-reset {
      margin-top: 16px;
      width: 100%;
      padding: 9px 0;
      background: transparent;
      border: 1px solid #D9D2C4;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4A4A48;
      cursor: pointer;
    }

    #a11y-reset:hover { border-color: #C84545; color: #C84545; }

    /* Applied effects */
    html.a11y-bigger-text { font-size: 118% !important; }
    html.a11y-contrast body { background: #ffffff !important; color: #000000 !important; }
    html.a11y-contrast a { color: #00008B !important; }
    html.a11y-text-spacing body { letter-spacing: 0.04em !important; word-spacing: 0.12em !important; }
    html.a11y-line-height body, html.a11y-line-height p { line-height: 2 !important; }
    html.a11y-pause-animations *, html.a11y-pause-animations *::before, html.a11y-pause-animations *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }
    html.a11y-highlight-links a {
      background: #FFF3B0 !important;
      text-decoration: underline !important;
      text-decoration-thickness: 2px !important;
    }
    html.a11y-text-align-left body, html.a11y-text-align-left p { text-align: left !important; }
  `;
  document.head.appendChild(style);

  const CLASS_MAP = {
    biggerText: "a11y-bigger-text",
    contrast: "a11y-contrast",
    textSpacing: "a11y-text-spacing",
    lineHeight: "a11y-line-height",
    pauseAnimations: "a11y-pause-animations",
    highlightLinks: "a11y-highlight-links",
    textAlign: "a11y-text-align-left"
  };

  function applySettings() {
    Object.keys(CLASS_MAP).forEach((key) => {
      document.documentElement.classList.toggle(CLASS_MAP[key], !!settings[key]);
    });
  }

  applySettings();

  const TOGGLES = [
    { key: "biggerText", label: "Bigger Text" },
    { key: "contrast", label: "Contrast+" },
    { key: "textSpacing", label: "Text Spacing" },
    { key: "lineHeight", label: "Line Height" },
    { key: "pauseAnimations", label: "Pause Animations" },
    { key: "highlightLinks", label: "Highlight Links" },
    { key: "textAlign", label: "Left-Align Text" }
  ];

  const widget = document.createElement("div");
  widget.id = "a11y-widget";

  const launcher = document.createElement("button");
  launcher.id = "a11y-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Accessibility settings");
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="4.5" r="1.8" fill="#ffffff"/>
      <path d="M4 8.5c2.5 1 5.3 1.5 8 1.5s5.5-.5 8-1.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 10v10.5M12 14l-3.5 6.5M12 14l3.5 6.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const panel = document.createElement("div");
  panel.id = "a11y-panel";

  const title = document.createElement("div");
  title.id = "a11y-panel-title";
  title.textContent = "Accessibility";

  const sub = document.createElement("div");
  sub.id = "a11y-panel-sub";
  sub.textContent = "Adjust how this site displays for you. Settings apply across every page.";

  panel.appendChild(title);
  panel.appendChild(sub);

  TOGGLES.forEach(({ key, label }) => {
    const row = document.createElement("div");
    row.className = "a11y-toggle-row";

    const labelEl = document.createElement("span");
    labelEl.className = "a11y-toggle-label";
    labelEl.textContent = label;

    const switchEl = document.createElement("button");
    switchEl.type = "button";
    switchEl.className = "a11y-switch" + (settings[key] ? " on" : "");
    switchEl.setAttribute("role", "switch");
    switchEl.setAttribute("aria-checked", String(!!settings[key]));
    switchEl.setAttribute("aria-label", label);

    switchEl.addEventListener("click", () => {
      settings[key] = !settings[key];
      switchEl.classList.toggle("on", settings[key]);
      switchEl.setAttribute("aria-checked", String(settings[key]));
      applySettings();
      saveSettings(settings);
    });

    row.appendChild(labelEl);
    row.appendChild(switchEl);
    panel.appendChild(row);
  });

  const resetBtn = document.createElement("button");
  resetBtn.id = "a11y-reset";
  resetBtn.type = "button";
  resetBtn.textContent = "Reset to Default";
  resetBtn.addEventListener("click", () => {
    settings = Object.assign({}, DEFAULTS);
    applySettings();
    saveSettings(settings);
    panel.querySelectorAll(".a11y-switch").forEach((el) => {
      el.classList.remove("on");
      el.setAttribute("aria-checked", "false");
    });
  });

  panel.appendChild(resetBtn);

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      panel.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      panel.classList.remove("open");
    }
  });

  widget.appendChild(launcher);
  widget.appendChild(panel);
  document.body.appendChild(widget);
})();

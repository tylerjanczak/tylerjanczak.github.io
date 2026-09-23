/*
  © 2026 Tyler Janczak. All rights reserved.
  Site-wide accessibility toggle widget.

  Include on every page with:
    <script src="js/accessibility-widget.js" defer></script>

  Settings persist across the whole site via localStorage, so a choice
  made on one page carries over when navigating to another.
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
      width: 340px;
      max-width: calc(100vw - 48px);
      max-height: 78vh;
      overflow-y: auto;
      background: #F7F4EE;
      border: 1px solid #D9D2C4;
      border-radius: 14px;
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

    #a11y-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .a11y-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 18px 8px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 140ms ease, background 140ms ease;
      text-align: center;
    }

    .a11y-tile:hover { border-color: #C8454580; }

    .a11y-tile.on {
      border-color: #C84545;
      background: #FBEFEF;
    }

    .a11y-tile svg {
      width: 26px;
      height: 26px;
      stroke: #1B1B1B;
      fill: none;
    }

    .a11y-tile.on svg { stroke: #C84545; }

    .a11y-tile-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #1B1B1B;
      line-height: 1.2;
    }

    .a11y-tile.on .a11y-tile-label { color: #C84545; }

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
    {
      key: "biggerText",
      label: "Bigger Text",
      icon: `<path d="M4 6h7M7.5 6v12" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10h7M17.5 10v8" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "contrast",
      label: "Contrast+",
      icon: `<circle cx="12" cy="12" r="9" stroke-width="1.8"/><path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none"/>`
    },
    {
      key: "textSpacing",
      label: "Text Spacing",
      icon: `<path d="M5 12h2M17 12h2M9 12h1M14 12h1" stroke-width="1.8" stroke-linecap="round"/><path d="M4 8l-1.5 4L4 16M20 8l1.5 4L20 16" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    {
      key: "lineHeight",
      label: "Line Height",
      icon: `<path d="M6 5v14M6 5l-2 2M6 5l2 2M6 19l-2-2M6 19l2-2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7h9M12 12h9M12 17h9" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "highlightLinks",
      label: "Highlight Links",
      icon: `<path d="M9 15l6-6" stroke-width="1.8" stroke-linecap="round"/><path d="M10 6.5l1-1a3.5 3.5 0 015 5l-1 1M14 17.5l-1 1a3.5 3.5 0 01-5-5l1-1" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "textAlign",
      label: "Text Align",
      icon: `<path d="M4 6h16M4 11h11M4 16h16M4 21h11" stroke-width="1.8" stroke-linecap="round"/>`
    }
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

  const grid = document.createElement("div");
  grid.id = "a11y-grid";

  TOGGLES.forEach(({ key, label, icon }) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "a11y-tile" + (settings[key] ? " on" : "");
    tile.setAttribute("role", "switch");
    tile.setAttribute("aria-checked", String(!!settings[key]));
    tile.setAttribute("aria-label", label);

    tile.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon}</svg>
      <span class="a11y-tile-label">${label}</span>
    `;

    tile.addEventListener("click", () => {
      settings[key] = !settings[key];
      tile.classList.toggle("on", settings[key]);
      tile.setAttribute("aria-checked", String(settings[key]));
      applySettings();
      saveSettings(settings);
    });

    grid.appendChild(tile);
  });

  panel.appendChild(grid);

  const resetBtn = document.createElement("button");
  resetBtn.id = "a11y-reset";
  resetBtn.type = "button";
  resetBtn.textContent = "Reset to Default";
  resetBtn.addEventListener("click", () => {
    settings = Object.assign({}, DEFAULTS);
    applySettings();
    saveSettings(settings);
    grid.querySelectorAll(".a11y-tile").forEach((el) => {
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

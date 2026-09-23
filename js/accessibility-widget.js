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
    highlightLinks: false,
    textAlign: false,
    dyslexiaFriendly: false,
    reducedMotion: false, // no standalone tile — only set via the Seizure & Epileptic profile
    activeProfile: null
  };

  // localStorage is scoped per-origin, so a setting saved on tylerjanczak.com
  // is invisible to bridges.tylerjanczak.com (a different origin). A cookie
  // scoped to ".tylerjanczak.com" (leading dot) is shared by every subdomain,
  // so it's mirrored here to carry settings across to the bridges chat.
  const COOKIE_NAME = "tylerA11y";
  const COOKIE_DOMAIN = ".tylerjanczak.com";

  function readCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(name, value) {
    try {
      document.cookie =
        name + "=" + encodeURIComponent(value) +
        "; domain=" + COOKIE_DOMAIN +
        "; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // Cookie write blocked (e.g. local file testing) — non-critical.
    }
  }

  function loadSettings() {
    let fromCookie = {};
    let fromLocal = {};
    try {
      const cookieRaw = readCookie(COOKIE_NAME);
      if (cookieRaw) fromCookie = JSON.parse(cookieRaw);
    } catch {
      fromCookie = {};
    }
    try {
      fromLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      fromLocal = {};
    }
    // Same-origin localStorage is the more current source when both exist;
    // the cookie only fills in when this origin has never saved anything.
    return Object.assign({}, DEFAULTS, fromCookie, fromLocal);
  }

  function saveSettings(settings) {
    const serialized = JSON.stringify(settings);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage blocked — settings just won't persist across pages, non-critical.
    }
    writeCookie(COOKIE_NAME, serialized);
    try {
      window.dispatchEvent(new CustomEvent("tylerA11yChange", { detail: settings }));
    } catch {
      // CustomEvent unsupported in some very old browser — non-critical.
    }
  }

  let settings = loadSettings();

  // Load OpenDyslexic (open-license web font) on demand, only if the
  // dyslexia-friendly toggle is ever turned on — no cost to page weight otherwise.
  let dyslexiaFontLoaded = false;
  function ensureDyslexiaFont() {
    if (dyslexiaFontLoaded) return;
    dyslexiaFontLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css";
    document.head.appendChild(link);
  }

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

    #a11y-profile-wrap {
      position: relative;
      margin-bottom: 16px;
    }

    #a11y-profile-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 14px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 10px;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      color: #1B1B1B;
      text-align: left;
    }

    #a11y-profile-btn.has-profile {
      border-color: #C84545;
      color: #C84545;
    }

    #a11y-profile-btn .chev {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: currentColor;
      transition: transform 140ms ease;
    }

    #a11y-profile-btn.open .chev { transform: rotate(180deg); }

    #a11y-profile-list {
      display: none;
      margin-top: 6px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 10px;
      overflow: hidden;
    }

    #a11y-profile-list.open { display: block; }

    .a11y-profile-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      background: transparent;
      border: none;
      border-top: 1px solid #EFEAE0;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 13px;
      color: #1B1B1B;
      text-align: left;
    }

    .a11y-profile-option:first-child { border-top: none; }
    .a11y-profile-option:hover { background: #FBEFEF; }
    .a11y-profile-option.selected { color: #C84545; font-weight: 700; }

    .a11y-profile-option-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #EFEAE0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .a11y-profile-option-icon svg { width: 13px; height: 13px; stroke: #1B1B1B; fill: none; }
    .a11y-profile-option.selected .a11y-profile-option-icon { background: #C84545; }
    .a11y-profile-option.selected .a11y-profile-option-icon svg { stroke: #ffffff; }

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
    html.a11y-dyslexia-font body, html.a11y-dyslexia-font p, html.a11y-dyslexia-font li,
    html.a11y-dyslexia-font h1, html.a11y-dyslexia-font h2, html.a11y-dyslexia-font h3,
    html.a11y-dyslexia-font span, html.a11y-dyslexia-font a, html.a11y-dyslexia-font div {
      font-family: "OpenDyslexic", "Comic Sans MS", Verdana, Tahoma, sans-serif !important;
      letter-spacing: 0.03em !important;
    }
    html.a11y-reduced-motion *, html.a11y-reduced-motion *::before, html.a11y-reduced-motion *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }

    /* Tyler AI chat widget — it's injected as plain DOM (no shadow root),
       so it's reachable, but it sets its own fixed px sizes/colors that
       the generic rules above don't touch. Hook its specific classes here. */
    html.a11y-bigger-text .tyler-ai-title { font-size: 27px !important; }
    html.a11y-bigger-text .tyler-ai-message { font-size: 16.5px !important; }
    html.a11y-bigger-text .tyler-ai-message.notice { font-size: 15.5px !important; }
    html.a11y-bigger-text .tyler-ai-suggestion-chip { font-size: 14.5px !important; }
    html.a11y-bigger-text .tyler-ai-searching-list li,
    html.a11y-bigger-text .tyler-ai-searching-title { font-size: 13.5px !important; }
    html.a11y-bigger-text .tyler-ai-status { font-size: 11.5px !important; }

    html.a11y-contrast #tyler-ai-panel { background: #ffffff !important; }
    html.a11y-contrast #tyler-ai-messages { background: #ffffff !important; }
    html.a11y-contrast .tyler-ai-message {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }
    html.a11y-contrast .tyler-ai-row.user .tyler-ai-message {
      background: #000000 !important;
      color: #ffffff !important;
      border-color: #000000 !important;
    }
    html.a11y-contrast .tyler-ai-message a { color: #00008B !important; }
    html.a11y-contrast .tyler-ai-row.user .tyler-ai-message a { color: #9fd2ff !important; }
    html.a11y-contrast .tyler-ai-suggestion-chip {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }

    html.a11y-text-spacing .tyler-ai-message {
      letter-spacing: 0.04em !important;
      word-spacing: 0.12em !important;
    }

    html.a11y-line-height .tyler-ai-message { line-height: 1.9 !important; }

    html.a11y-text-align-left .tyler-ai-message,
    html.a11y-text-align-left .tyler-ai-suggestion-chip { text-align: left !important; }
  `;
  document.head.appendChild(style);

  const CLASS_MAP = {
    biggerText: "a11y-bigger-text",
    contrast: "a11y-contrast",
    textSpacing: "a11y-text-spacing",
    lineHeight: "a11y-line-height",
    highlightLinks: "a11y-highlight-links",
    textAlign: "a11y-text-align-left",
    dyslexiaFriendly: "a11y-dyslexia-font",
    reducedMotion: "a11y-reduced-motion"
  };

  function applySettings() {
    if (settings.dyslexiaFriendly) ensureDyslexiaFont();
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
    },
    {
      key: "dyslexiaFriendly",
      label: "Dyslexia Friendly",
      icon: `<text x="12" y="17" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" stroke="none" font-family="Georgia, serif">Df</text>`
    }
  ];

  // Each profile is a self-identified starting point, not a diagnosis — picking
  // one just applies the combination of the toggles above that best fits it.
  // Left out: "Blind" and "Motor Impaired" — none of these display toggles do
  // anything for either (screen readers work natively regardless, and nothing
  // here addresses pointer/click precision), so listing them would promise
  // something the widget doesn't deliver.
  const PROFILES = [
    {
      key: "lowVision",
      label: "Low Vision",
      icon: `<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" stroke-width="1.6"/>`,
      settings: { biggerText: true, contrast: true }
    },
    {
      key: "colorBlind",
      label: "Color Blind",
      icon: `<path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 01-10 0C7 9.5 9 7 12 3z" stroke-width="1.6" stroke-linejoin="round"/>`,
      settings: { contrast: true, highlightLinks: true }
    },
    {
      key: "dyslexia",
      label: "Dyslexia",
      icon: `<text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="Georgia, serif">Df</text>`,
      settings: { dyslexiaFriendly: true, lineHeight: true, textSpacing: true }
    },
    {
      key: "cognitive",
      label: "Cognitive & Learning",
      icon: `<circle cx="9" cy="9" r="2.2" stroke-width="1.6"/><circle cx="15" cy="9" r="2.2" stroke-width="1.6"/><circle cx="9" cy="15" r="2.2" stroke-width="1.6"/><circle cx="15" cy="15" r="2.2" stroke-width="1.6"/>`,
      settings: { lineHeight: true, textSpacing: true, highlightLinks: true }
    },
    {
      key: "seizure",
      label: "Seizure & Epileptic",
      icon: `<path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke-width="1.6"/><path d="M12 3a9 9 0 000 18" stroke-width="1.6"/>`,
      settings: { reducedMotion: true, contrast: true }
    },
    {
      key: "adhd",
      label: "ADHD",
      icon: `<circle cx="12" cy="12" r="8" stroke-width="1.6"/><circle cx="12" cy="12" r="3.5" stroke-width="1.6"/>`,
      settings: { highlightLinks: true, lineHeight: true }
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

  // --- Accessibility Profiles dropdown ---
  const profileWrap = document.createElement("div");
  profileWrap.id = "a11y-profile-wrap";

  const profileBtn = document.createElement("button");
  profileBtn.id = "a11y-profile-btn";
  profileBtn.type = "button";
  profileBtn.setAttribute("aria-haspopup", "listbox");
  profileBtn.setAttribute("aria-expanded", "false");

  const profileBtnLabel = document.createElement("span");
  profileBtnLabel.id = "a11y-profile-btn-label";

  const chevSvg = document.createElement("span");
  chevSvg.innerHTML = `<svg class="chev" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  profileBtn.appendChild(profileBtnLabel);
  profileBtn.appendChild(chevSvg.firstElementChild);

  const profileList = document.createElement("div");
  profileList.id = "a11y-profile-list";
  profileList.setAttribute("role", "listbox");

  function profileLabelFor(key) {
    if (!key) return "Accessibility Profiles";
    const match = PROFILES.find((p) => p.key === key);
    return match ? match.label : "Accessibility Profiles";
  }

  function refreshProfileButton() {
    profileBtnLabel.textContent = profileLabelFor(settings.activeProfile);
    profileBtn.classList.toggle("has-profile", !!settings.activeProfile);
  }

  function refreshTiles() {
    grid.querySelectorAll(".a11y-tile").forEach((el) => {
      const key = el.getAttribute("data-key");
      const on = !!settings[key];
      el.classList.toggle("on", on);
      el.setAttribute("aria-checked", String(on));
    });
  }

  function refreshProfileOptions() {
    profileList.querySelectorAll(".a11y-profile-option").forEach((el) => {
      el.classList.toggle("selected", el.getAttribute("data-key") === settings.activeProfile);
    });
  }

  PROFILES.forEach((profile) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "a11y-profile-option";
    option.setAttribute("role", "option");
    option.setAttribute("data-key", profile.key);
    option.innerHTML = `
      <span class="a11y-profile-option-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${profile.icon}</svg>
      </span>
      ${profile.label}
    `;
    option.addEventListener("click", () => {
      const alreadySelected = settings.activeProfile === profile.key;
      settings = Object.assign({}, DEFAULTS);
      if (!alreadySelected) {
        Object.assign(settings, profile.settings);
        settings.activeProfile = profile.key;
      }
      applySettings();
      saveSettings(settings);
      refreshProfileButton();
      refreshProfileOptions();
      refreshTiles();
      profileList.classList.remove("open");
      profileBtn.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    });
    profileList.appendChild(option);
  });

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = profileList.classList.toggle("open");
    profileBtn.classList.toggle("open", isOpen);
    profileBtn.setAttribute("aria-expanded", String(isOpen));
  });

  profileWrap.appendChild(profileBtn);
  profileWrap.appendChild(profileList);
  panel.appendChild(profileWrap);

  const grid = document.createElement("div");
  grid.id = "a11y-grid";

  TOGGLES.forEach(({ key, label, icon }) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "a11y-tile" + (settings[key] ? " on" : "");
    tile.setAttribute("data-key", key);
    tile.setAttribute("role", "switch");
    tile.setAttribute("aria-checked", String(!!settings[key]));
    tile.setAttribute("aria-label", label);

    tile.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon}</svg>
      <span class="a11y-tile-label">${label}</span>
    `;

    tile.addEventListener("click", () => {
      settings[key] = !settings[key];
      // A manual toggle makes the combination custom, so it no longer
      // matches whichever profile (if any) was selected.
      settings.activeProfile = null;
      applySettings();
      saveSettings(settings);
      refreshTiles();
      refreshProfileButton();
      refreshProfileOptions();
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
    refreshTiles();
    refreshProfileButton();
    refreshProfileOptions();
  });

  panel.appendChild(resetBtn);

  refreshProfileButton();
  refreshProfileOptions();

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      panel.classList.remove("open");
      profileList.classList.remove("open");
      profileBtn.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    } else if (!profileWrap.contains(event.target)) {
      profileList.classList.remove("open");
      profileBtn.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      panel.classList.remove("open");
      profileList.classList.remove("open");
      profileBtn.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    }
  });

  widget.appendChild(launcher);
  widget.appendChild(panel);
  document.body.appendChild(widget);
})();

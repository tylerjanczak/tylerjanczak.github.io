/*
  © 2026 Tyler Janczak. All rights reserved.
  Site-wide accessibility toggle widget.

  Include on every page with:
    <script src="js/accessibility-widget.js" defer></script>

  Settings persist across the whole site via localStorage, so a choice
  made on one page carries over when navigating to another.

  Fires a "tylerA11yChange" window event on any change (profile pick, tile
  toggle, or reset) so other scripts already loaded on the page (e.g. the
  Tyler AI chat widget) can react live without a page reload.
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
    activeProfile: null,
    language: "en"
  };

  // Translation data for this widget's own UI (js/accessibility-i18n.js).
  // If that file wasn't included on this page, fall back to English only —
  // never throw over a missing optional script.
  const I18N = window.TylerA11yI18n || { LANGUAGES: [], STRINGS: {} };
  function t(key) {
    const dict = I18N.STRINGS[settings.language] || I18N.STRINGS.en || {};
    return dict[key] || (I18N.STRINGS.en && I18N.STRINGS.en[key]) || key;
  }

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
      display: none;
      flex-direction: column;
      background: #F7F4EE;
      border: 1px solid #D9D2C4;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    }

    #a11y-panel.open { display: flex; }

    #a11y-panel-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 16px 16px 20px;
      background: #1B1B1B;
    }

    #a11y-panel-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
    }

    #a11y-panel-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #ffffff;
      cursor: pointer;
      transition: background 140ms ease;
    }

    #a11y-panel-close:hover { background: rgba(255,255,255,0.2); }
    #a11y-panel-close svg { width: 15px; height: 15px; }

    #a11y-panel-body {
      overflow-y: auto;
      padding: 18px 20px 20px;
    }

    #a11y-panel-sub {
      font-size: 12px;
      color: #4A4A48;
      margin-bottom: 16px;
    }

    #a11y-lang-wrap {
      position: relative;
      margin: -4px -4px 4px;
    }

    #a11y-lang-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1B1B1B;
      text-align: left;
      transition: background 120ms ease;
    }

    #a11y-lang-btn:hover { background: #EFEAE0; }

    #a11y-lang-btn-badge {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #C84545;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #a11y-lang-btn-label { flex: 1; }

    #a11y-lang-btn .chev {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #4A4A48;
      transition: transform 140ms ease;
    }

    #a11y-lang-btn.open .chev { transform: rotate(180deg); }

    #a11y-lang-panel {
      display: none;
      margin: 4px 0 14px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 12px;
      overflow: hidden;
    }

    #a11y-lang-panel.open { display: block; }

    #a11y-lang-search-wrap {
      position: relative;
      padding: 10px;
      border-bottom: 1px solid #EFEAE0;
    }

    #a11y-lang-search {
      width: 100%;
      padding: 8px 32px 8px 12px;
      border: 1px solid #D9D2C4;
      border-radius: 999px;
      font-family: "Inter", sans-serif;
      font-size: 12.5px;
      color: #1B1B1B;
      background: #F7F4EE;
    }

    #a11y-lang-search:focus { outline: 2px solid #C8454580; outline-offset: 1px; }

    #a11y-lang-search-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      stroke: #8b857e;
      pointer-events: none;
    }

    #a11y-lang-list {
      max-height: 220px;
      overflow-y: auto;
    }

    .a11y-lang-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 14px;
      background: transparent;
      border: none;
      border-top: 1px solid #EFEAE0;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 12.5px;
      color: #1B1B1B;
      text-align: left;
    }

    .a11y-lang-option:first-child { border-top: none; }
    .a11y-lang-option:hover { background: #FBEFEF; }
    .a11y-lang-option.selected { color: #C84545; font-weight: 700; background: #FBEFEF; }

    .a11y-lang-badge {
      flex-shrink: 0;
      min-width: 26px;
      padding: 2px 5px;
      border-radius: 999px;
      background: #EFEAE0;
      color: #4A4A48;
      font-size: 9.5px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.02em;
    }

    .a11y-lang-option.selected .a11y-lang-badge { background: #C84545; color: #ffffff; }

    .a11y-lang-native { flex: 1; }

    .a11y-lang-check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #C84545;
      visibility: hidden;
    }

    .a11y-lang-option.selected .a11y-lang-check { visibility: visible; }

    .a11y-lang-empty {
      padding: 14px;
      font-size: 12px;
      color: #8b857e;
      text-align: center;
    }

    #a11y-profile-wrap {
      position: relative;
      margin: 0 -4px 14px;
    }

    #a11y-profile-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      color: #1B1B1B;
      text-align: left;
      transition: background 120ms ease;
    }

    #a11y-profile-btn:hover { background: #EFEAE0; }

    #a11y-profile-btn.has-profile { color: #C84545; }

    #a11y-profile-btn-badge {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #1B1B1B;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #a11y-profile-btn-badge svg { width: 14px; height: 14px; stroke: #ffffff; fill: none; }
    #a11y-profile-btn.has-profile #a11y-profile-btn-badge { background: #C84545; }

    #a11y-profile-btn-label { flex: 1; }

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
      margin: 2px 0 4px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 12px;
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
    .a11y-profile-option.selected { color: #C84545; font-weight: 700; background: #FBEFEF; }

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

    .a11y-profile-option-label { flex: 1; }

    .a11y-profile-check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #C84545;
      visibility: hidden;
    }

    .a11y-profile-option.selected .a11y-profile-check { visibility: visible; }

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

    #a11y-insight {
      display: none;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #EFEAE0;
      font-size: 11.5px;
      color: #4A4A48;
    }

    #a11y-insight.visible { display: block; }

    #a11y-insight-summary {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
    }

    #a11y-insight-summary::-webkit-details-marker { display: none; }

    #a11y-insight-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3f9b64;
      flex-shrink: 0;
    }

    #a11y-insight-list {
      margin: 8px 0 0;
      padding-left: 16px;
      max-height: 140px;
      overflow-y: auto;
    }

    #a11y-insight-list li { margin-bottom: 5px; line-height: 1.4; }

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
      labelKey: "tileBiggerText",
      icon: `<path d="M4 6h7M7.5 6v12" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10h7M17.5 10v8" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "contrast",
      labelKey: "tileContrast",
      icon: `<circle cx="12" cy="12" r="9" stroke-width="1.8"/><path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none"/>`
    },
    {
      key: "textSpacing",
      labelKey: "tileTextSpacing",
      icon: `<path d="M5 12h2M17 12h2M9 12h1M14 12h1" stroke-width="1.8" stroke-linecap="round"/><path d="M4 8l-1.5 4L4 16M20 8l1.5 4L20 16" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    {
      key: "lineHeight",
      labelKey: "tileLineHeight",
      icon: `<path d="M6 5v14M6 5l-2 2M6 5l2 2M6 19l-2-2M6 19l2-2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7h9M12 12h9M12 17h9" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "highlightLinks",
      labelKey: "tileHighlightLinks",
      icon: `<path d="M9 15l6-6" stroke-width="1.8" stroke-linecap="round"/><path d="M10 6.5l1-1a3.5 3.5 0 015 5l-1 1M14 17.5l-1 1a3.5 3.5 0 01-5-5l1-1" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "textAlign",
      labelKey: "tileTextAlign",
      icon: `<path d="M4 6h16M4 11h11M4 16h16M4 21h11" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "dyslexiaFriendly",
      labelKey: "tileDyslexiaFriendly",
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
      labelKey: "profileLowVision",
      icon: `<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" stroke-width="1.6"/>`,
      settings: { biggerText: true, contrast: true }
    },
    {
      key: "colorBlind",
      labelKey: "profileColorBlind",
      icon: `<path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 01-10 0C7 9.5 9 7 12 3z" stroke-width="1.6" stroke-linejoin="round"/>`,
      settings: { contrast: true, highlightLinks: true }
    },
    {
      key: "dyslexia",
      labelKey: "profileDyslexia",
      icon: `<text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="Georgia, serif">Df</text>`,
      settings: { dyslexiaFriendly: true, lineHeight: true, textSpacing: true }
    },
    {
      key: "cognitive",
      labelKey: "profileCognitive",
      icon: `<circle cx="9" cy="9" r="2.2" stroke-width="1.6"/><circle cx="15" cy="9" r="2.2" stroke-width="1.6"/><circle cx="9" cy="15" r="2.2" stroke-width="1.6"/><circle cx="15" cy="15" r="2.2" stroke-width="1.6"/>`,
      settings: { lineHeight: true, textSpacing: true, highlightLinks: true }
    },
    {
      key: "seizure",
      labelKey: "profileSeizure",
      icon: `<path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke-width="1.6"/><path d="M12 3a9 9 0 000 18" stroke-width="1.6"/>`,
      settings: { reducedMotion: true, contrast: true }
    },
    {
      key: "adhd",
      labelKey: "profileAdhd",
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

  // --- Dark header bar with title + close button ---
  const panelHeader = document.createElement("div");
  panelHeader.id = "a11y-panel-header";

  const title = document.createElement("div");
  title.id = "a11y-panel-title";

  const panelClose = document.createElement("button");
  panelClose.id = "a11y-panel-close";
  panelClose.type = "button";
  panelClose.setAttribute("aria-label", "Close accessibility menu");
  panelClose.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  panelClose.addEventListener("click", () => {
    panel.classList.remove("open");
    closeDropdowns();
  });

  panelHeader.appendChild(title);
  panelHeader.appendChild(panelClose);
  panel.appendChild(panelHeader);

  // --- Scrollable body: everything below the header lives here ---
  const panelBody = document.createElement("div");
  panelBody.id = "a11y-panel-body";
  panel.appendChild(panelBody);

  const sub = document.createElement("div");
  sub.id = "a11y-panel-sub";
  panelBody.appendChild(sub);

  // --- Language menu row ---
  const langWrap = document.createElement("div");
  langWrap.id = "a11y-lang-wrap";

  const langBtn = document.createElement("button");
  langBtn.id = "a11y-lang-btn";
  langBtn.type = "button";
  langBtn.setAttribute("aria-haspopup", "listbox");
  langBtn.setAttribute("aria-expanded", "false");

  const langBtnBadge = document.createElement("span");
  langBtnBadge.id = "a11y-lang-btn-badge";

  const langBtnLabel = document.createElement("span");
  langBtnLabel.id = "a11y-lang-btn-label";

  const langChev = document.createElement("span");
  langChev.innerHTML = `<svg class="chev" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  langBtn.appendChild(langBtnBadge);
  langBtn.appendChild(langBtnLabel);
  langBtn.appendChild(langChev.firstElementChild);

  // Bordered panel that drops open below the button: search box + scroll list.
  const langPanel = document.createElement("div");
  langPanel.id = "a11y-lang-panel";

  const langSearchWrap = document.createElement("div");
  langSearchWrap.id = "a11y-lang-search-wrap";

  const langSearch = document.createElement("input");
  langSearch.id = "a11y-lang-search";
  langSearch.type = "text";
  langSearch.setAttribute("autocomplete", "off");
  langSearch.setAttribute("aria-label", "Search language");

  const langSearchIcon = document.createElement("span");
  langSearchIcon.innerHTML = `<svg id="a11y-lang-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  langSearchWrap.appendChild(langSearch);
  langSearchWrap.appendChild(langSearchIcon.firstElementChild);

  const langList = document.createElement("div");
  langList.id = "a11y-lang-list";
  langList.setAttribute("role", "listbox");

  const langEmpty = document.createElement("div");
  langEmpty.className = "a11y-lang-empty";
  langEmpty.style.display = "none";

  (I18N.LANGUAGES || []).forEach((lang) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "a11y-lang-option";
    option.setAttribute("role", "option");
    option.setAttribute("data-lang", lang.code);
    option.innerHTML = `
      <span class="a11y-lang-badge">${lang.badge}</span>
      <span class="a11y-lang-native">${lang.native}</span>
      <svg class="a11y-lang-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    option.addEventListener("click", () => {
      settings.language = lang.code;
      saveSettings(settings);
      applyTranslations();
      langSearch.value = "";
      filterLangList("");
      langPanel.classList.remove("open");
      langBtn.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    });
    langList.appendChild(option);
  });

  langList.appendChild(langEmpty);

  function filterLangList(query) {
    const normalized = query.trim().toLowerCase();
    let visibleCount = 0;
    langList.querySelectorAll(".a11y-lang-option").forEach((el) => {
      const native = el.querySelector(".a11y-lang-native");
      const matches = !normalized || (native && native.textContent.toLowerCase().includes(normalized));
      el.style.display = matches ? "" : "none";
      if (matches) visibleCount += 1;
    });
    langEmpty.textContent = "No languages found";
    langEmpty.style.display = visibleCount === 0 ? "block" : "none";
  }

  langSearch.addEventListener("input", () => filterLangList(langSearch.value));
  langSearch.addEventListener("click", (event) => event.stopPropagation());

  langPanel.appendChild(langSearchWrap);
  langPanel.appendChild(langList);

  langBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = langPanel.classList.toggle("open");
    langBtn.classList.toggle("open", isOpen);
    langBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      langSearch.value = "";
      filterLangList("");
      setTimeout(() => langSearch.focus(), 0);
    }
  });

  langWrap.appendChild(langBtn);
  langWrap.appendChild(langPanel);
  panelBody.appendChild(langWrap);

  // --- Accessibility Profiles menu row ---
  const profileWrap = document.createElement("div");
  profileWrap.id = "a11y-profile-wrap";

  const profileBtn = document.createElement("button");
  profileBtn.id = "a11y-profile-btn";
  profileBtn.type = "button";
  profileBtn.setAttribute("aria-haspopup", "listbox");
  profileBtn.setAttribute("aria-expanded", "false");

  const profileBtnBadge = document.createElement("span");
  profileBtnBadge.id = "a11y-profile-btn-badge";
  profileBtnBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="3.4" stroke-width="1.8"/><path d="M5 20c1.4-4 4-6 7-6s5.6 2 7 6" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  const profileBtnLabel = document.createElement("span");
  profileBtnLabel.id = "a11y-profile-btn-label";

  const chevSvg = document.createElement("span");
  chevSvg.innerHTML = `<svg class="chev" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  profileBtn.appendChild(profileBtnBadge);
  profileBtn.appendChild(profileBtnLabel);
  profileBtn.appendChild(chevSvg.firstElementChild);

  const profileList = document.createElement("div");
  profileList.id = "a11y-profile-list";
  profileList.setAttribute("role", "listbox");

  function profileLabelFor(key) {
    if (!key) return t("profilePlaceholder");
    const match = PROFILES.find((p) => p.key === key);
    return match ? t(match.labelKey) : t("profilePlaceholder");
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
      <span class="a11y-profile-option-label" data-label-key="${profile.labelKey}">${t(profile.labelKey)}</span>
      <svg class="a11y-profile-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    option.addEventListener("click", () => {
      const alreadySelected = settings.activeProfile === profile.key;
      settings = Object.assign({}, DEFAULTS, { language: settings.language });
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
  panelBody.appendChild(profileWrap);

  const grid = document.createElement("div");
  grid.id = "a11y-grid";

  TOGGLES.forEach(({ key, labelKey, icon }) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "a11y-tile" + (settings[key] ? " on" : "");
    tile.setAttribute("data-key", key);
    tile.setAttribute("role", "switch");
    tile.setAttribute("aria-checked", String(!!settings[key]));
    tile.setAttribute("aria-label", t(labelKey));

    tile.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon}</svg>
      <span class="a11y-tile-label" data-label-key="${labelKey}">${t(labelKey)}</span>
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

  panelBody.appendChild(grid);

  const resetBtn = document.createElement("button");
  resetBtn.id = "a11y-reset";
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    settings = Object.assign({}, DEFAULTS, { language: settings.language });
    applySettings();
    saveSettings(settings);
    refreshTiles();
    refreshProfileButton();
    refreshProfileOptions();
  });

  panelBody.appendChild(resetBtn);

  // --- Remediation insight (populated only if js/accessibility-remediation.js
  // is also included on this page — otherwise this section just stays hidden) ---
  const insight = document.createElement("details");
  insight.id = "a11y-insight";

  const insightSummary = document.createElement("summary");
  insightSummary.id = "a11y-insight-summary";
  insightSummary.innerHTML = `<span id="a11y-insight-dot"></span><span id="a11y-insight-text"></span>`;

  const insightList = document.createElement("ul");
  insightList.id = "a11y-insight-list";

  insight.appendChild(insightSummary);
  insight.appendChild(insightList);
  panelBody.appendChild(insight);

  let lastRemediationData = null;

  function refreshInsight(data) {
    lastRemediationData = data;
    const applied = (data && data.appliedFixes) || [];
    if (!applied.length) {
      insight.classList.remove("visible");
      return;
    }
    insight.classList.add("visible");
    document.getElementById("a11y-insight-text").textContent =
      `${applied.length} ${t("insightSuffix")}`;
    insightList.innerHTML = "";
    applied.slice(0, 20).forEach((fix) => {
      const li = document.createElement("li");
      li.textContent = fix.description;
      insightList.appendChild(li);
    });
  }

  if (window.__tylerA11yRemediation) refreshInsight(window.__tylerA11yRemediation);
  window.addEventListener("tylerA11yRemediationUpdate", (event) => refreshInsight(event.detail));

  // Re-renders every piece of the widget's own text in the currently
  // selected language — called on init and whenever the language changes.
  function applyTranslations() {
    title.textContent = t("panelTitle");
    sub.textContent = t("panelSub");
    resetBtn.textContent = t("resetBtn");

    const currentLang = (I18N.LANGUAGES || []).find((l) => l.code === settings.language);
    langBtnBadge.textContent = currentLang ? currentLang.badge : "";
    langBtnLabel.textContent = currentLang ? currentLang.native : t("languagePlaceholder");
    langList.querySelectorAll(".a11y-lang-option").forEach((el) => {
      el.classList.toggle("selected", el.getAttribute("data-lang") === settings.language);
    });

    panel.querySelectorAll("[data-label-key]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-label-key"));
    });

    TOGGLES.forEach(({ key, labelKey }) => {
      const tile = grid.querySelector(`.a11y-tile[data-key="${key}"]`);
      if (tile) tile.setAttribute("aria-label", t(labelKey));
    });

    refreshProfileButton();
    if (lastRemediationData) refreshInsight(lastRemediationData);

    // Lets the rest of the page (and screen readers) know the widget's own
    // content is now in a different language than the surrounding page.
    widget.setAttribute("lang", settings.language);
    const RTL_LANGS = ["ar", "he", "fa", "ps", "prs"];
    panel.setAttribute("dir", RTL_LANGS.includes(settings.language) ? "rtl" : "ltr");
  }

  applyTranslations();
  refreshProfileOptions();

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  function closeDropdowns() {
    profileList.classList.remove("open");
    profileBtn.classList.remove("open");
    profileBtn.setAttribute("aria-expanded", "false");
    langPanel.classList.remove("open");
    langBtn.classList.remove("open");
    langBtn.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      panel.classList.remove("open");
      closeDropdowns();
    } else if (!profileWrap.contains(event.target) && !langWrap.contains(event.target)) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      panel.classList.remove("open");
      closeDropdowns();
    }
  });

  widget.appendChild(launcher);
  widget.appendChild(panel);
  document.body.appendChild(widget);
})();

/*
  © 2026 Tyler Janczak. All rights reserved.
  Session Information — a visitor-facing panel that shows each visitor what
  this browser session looks like and the profile the site can compile from
  it. Everything here is computed IN THE BROWSER from sessionStorage /
  localStorage; this script makes no network requests and sends nothing.

    <script src="js/session-info.js" defer></script>

  Tracking (local only) runs on every page that includes this script. The
  panel itself only appears where the page has an empty
  <div id="session-info-inline"></div> (Privacy Policy page, homepage footer); on other
  pages there is no visible UI.
*/
(function () {
  "use strict";
  if (window.__tylerSessionInfoInit) return;
  window.__tylerSessionInfoInit = true;

  var SESSION_KEY = "tylerSessionInfo";
  var VISITOR_KEY = "tylerVisitorInfo";

  function readJson(store, key, fallback) {
    try { var v = JSON.parse(store.getItem(key) || "null"); return v || fallback; } catch (e) { return fallback; }
  }
  function writeJson(store, key, value) {
    try { store.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ---- tracking ----------------------------------------------------------
  var now = Date.now();
  var session = readJson(sessionStorage, SESSION_KEY, null);
  var visitor = readJson(localStorage, VISITOR_KEY, null);
  var isNewSession = !session;

  if (!session) session = { start: now, pages: [], activeMs: 0, maxScroll: 0, clicks: 0 };
  if (!visitor) visitor = { firstSeen: now, visits: 0, lastSeen: now };
  if (isNewSession) { visitor.visits += 1; }
  var returning = visitor.visits > 1;
  var previousSeen = visitor.lastSeen;
  visitor.lastSeen = now;

  var path = location.pathname || "/";
  if (!session.pages.length || session.pages[session.pages.length - 1].path !== path) {
    session.pages.push({ path: path, t: now });
    if (session.pages.length > 50) session.pages.shift();
  }

  var visibleSince = document.visibilityState === "visible" ? now : null;
  function flushActive() {
    if (visibleSince) { session.activeMs += Date.now() - visibleSince; visibleSince = Date.now(); }
  }
  function save() {
    flushActive();
    writeJson(sessionStorage, SESSION_KEY, session);
    writeJson(localStorage, VISITOR_KEY, visitor);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { flushActive(); visibleSince = null; save(); }
    else { visibleSince = Date.now(); }
  });
  window.addEventListener("pagehide", save);

  var scrollTimer = null;
  window.addEventListener("scroll", function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () {
      scrollTimer = null;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) session.maxScroll = Math.max(session.maxScroll, Math.min(100, Math.round((window.scrollY / h) * 100)));
    }, 200);
  }, { passive: true });
  document.addEventListener("click", function () { session.clicks += 1; }, true);
  setInterval(save, 15000);
  save();

  // ---- helpers -----------------------------------------------------------
  function fmtDuration(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return s + "s";
    var m = Math.floor(s / 60);
    return m < 60 ? m + "m " + (s % 60) + "s" : Math.floor(m / 60) + "h " + (m % 60) + "m";
  }
  function fmtTime(ts) { try { return new Date(ts).toLocaleString(); } catch (e) { return "—"; } }

  function browserInfo() {
    var ua = navigator.userAgent || "", b = "Unknown browser", os = "Unknown OS";
    if (/Edg\//.test(ua)) b = "Edge"; else if (/OPR\//.test(ua)) b = "Opera";
    else if (/Firefox\//.test(ua)) b = "Firefox"; else if (/Chrome\//.test(ua)) b = "Chrome";
    else if (/Safari\//.test(ua)) b = "Safari";
    if (/Windows/.test(ua)) os = "Windows"; else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (/Android/.test(ua)) os = "Android"; else if (/Mac OS X/.test(ua)) os = "macOS";
    else if (/Linux/.test(ua)) os = "Linux";
    return b + " on " + os;
  }

  function chatMessageCount() {
    try { return document.querySelectorAll(".tyler-ai-row.user").length; } catch (e) { return 0; }
  }

  function compile() {
    flushActive();
    var greeting = readJson(sessionStorage, "tylerPersonalGreeting", null);
    var recruiterRaw = null;
    try { recruiterRaw = sessionStorage.getItem("tylerAiIsRecruiter"); } catch (e) {}
    var a11y = readJson(localStorage, "tylerSiteA11ySettings", {});
    var chats = chatMessageCount();
    var uniquePages = {};
    session.pages.forEach(function (p) { uniquePages[p.path] = 1; });
    var pageCount = Object.keys(uniquePages).length;
    var activeMs = session.activeMs + (visibleSince ? 0 : 0);

    // Engagement score — a transparent, additive heuristic.
    var factors = [];
    function add(points, label) { factors.push({ points: points, label: label }); }
    if (pageCount >= 2) add(Math.min(3, pageCount - 1), pageCount + " different pages viewed");
    if (activeMs >= 60000) add(activeMs >= 180000 ? 3 : 2, "Active for " + fmtDuration(activeMs));
    if (session.maxScroll >= 50) add(session.maxScroll >= 90 ? 2 : 1, "Scrolled " + session.maxScroll + "% of a page");
    if (chats >= 1) add(chats >= 3 ? 3 : 2, chats + " chat message" + (chats === 1 ? "" : "s") + " sent");
    if (returning) add(1, "Returning visitor");
    if (greeting && greeting.name) add(1, "Arrived on a personal link");
    var score = factors.reduce(function (n, f) { return n + f.points; }, 0);
    var tier = score >= 8 ? "Highly engaged" : score >= 4 ? "Engaged" : "Browsing";

    var access = greeting && greeting.name ? "Personal-link guest" : "Visitor";

    return {
      greeting: greeting, recruiter: recruiterRaw === "true" ? "Yes" : recruiterRaw === "false" ? "No" : "Not shared",
      a11y: a11y, chats: chats, pageCount: pageCount, activeMs: activeMs,
      score: score, tier: tier, access: access, factors: factors
    };
  }

  // ---- UI ----------------------------------------------------------------
  // Laid out like a classic "session information" screen: a toolbar, then
  // collapsible cards (Compiled Profile Summary, Login Information, Profile
  // Compilation, Host Information, Template Linking) with label/value rows.
  var css = document.createElement("style");
  css.textContent =
            "#si-panel{position:fixed;left:0;top:0;bottom:0;width:min(440px,100vw);z-index:9991;background:#F2EEE6;color:#1B1B1B;border-right:1px solid #D9D2C4;box-shadow:6px 0 30px rgba(0,0,0,.2);font:13.5px/1.45 'Inter',sans-serif;display:flex;flex-direction:column;transform:translateX(-102%);transition:transform .3s ease;visibility:hidden}" +
    "#si-panel.open{transform:none;visibility:visible}" +
    "#si-title{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}" +
    "#si-title h2{margin:0;font:400 20px 'Fraunces',serif;color:#3a3a38}#si-close{background:none;border:0;font-size:24px;line-height:1;cursor:pointer;padding:2px 8px;color:#4A4A48}" +
    "#si-bar{display:flex;gap:2px;padding:6px 12px;border-top:1px solid #D9D2C4;border-bottom:1px solid #D9D2C4;background:#EAE5DA}" +
    "#si-bar button{background:none;border:0;border-radius:5px;padding:6px 10px;font:600 12px 'Inter',sans-serif;color:#4A4A48;cursor:pointer}#si-bar button:hover{background:#D9D2C4}" +
    "#si-scroll{flex:1;overflow:auto;padding:12px 12px 24px}" +
    ".si-card{background:#FBF9F4;border:1px solid #E0D9CA;border-left:4px solid #6B1F1F;border-radius:3px;margin-bottom:12px}" +
    ".si-card.alt{border-left-color:#3d5a80}.si-card>button{width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:0;padding:10px 12px;cursor:pointer;text-align:left}" +
    ".si-pill{display:inline-block;background:#E3DED2;border-radius:16px;padding:5px 14px;font:600 14px 'Inter',sans-serif;color:#1B1B1B}" +
    ".si-chev{width:9px;height:9px;border-right:2px solid #6B1F1F;border-bottom:2px solid #6B1F1F;transform:rotate(-135deg);transition:transform .2s;margin-right:4px}" +
    ".si-card.collapsed .si-chev{transform:rotate(45deg)}.si-card.collapsed .si-content{display:none}" +
    ".si-content{padding:0 14px 12px}.si-note{font-size:12px;color:#6a6a66;margin:2px 0 10px}" +
    ".si-row{display:flex;gap:12px;padding:5px 0}.si-row dt{flex:0 0 42%;color:#4A4A48}.si-row dd{margin:0;flex:1;font-weight:600;word-break:break-word}" +
    ".si-row.sep{border-top:1px solid #D9D2C4;margin-top:4px;padding-top:8px}" +
    ".si-sub{margin:10px 0 4px;font:600 13px 'Inter',sans-serif;border-bottom:1px solid #D9D2C4;padding-bottom:3px}" +
    ".si-table{width:100%;border-collapse:collapse;font-size:12.5px}.si-table th{text-align:left;color:#6a6a66;font-weight:400;padding:4px 6px 4px 0}.si-table td{padding:6px 6px 6px 0;border-top:1px solid #E0D9CA;vertical-align:top}" +
    ".si-mono{font-family:ui-monospace,Menlo,monospace;font-size:11.5px}" +
    "#si-foot{padding:10px 16px;font-size:11.5px;color:#6a6a66;border-top:1px solid #D9D2C4;background:#EAE5DA}#si-clear{margin-left:8px;background:none;border:1px solid #6B1F1F;color:#6B1F1F;border-radius:5px;padding:4px 9px;font:600 11.5px 'Inter',sans-serif;cursor:pointer}#si-clear:hover{background:#6B1F1F;color:#F7F4EE}" +
    "@media(prefers-reduced-motion:reduce){#si-panel{transition:none}.si-chev{transition:none}}" +
    "@media print{body>*:not(#si-panel){display:none!important}#si-panel{position:static;width:auto;transform:none;visibility:visible;box-shadow:none}#si-bar,#si-close,#si-foot{display:none}}";
  document.head.appendChild(css);

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }

  var inlineHost = document.getElementById("session-info-inline");
  css.textContent += "#si-panel.si-inline{position:static;width:auto;transform:none;visibility:visible;box-shadow:none;border:1px solid #D9D2C4;border-radius:6px;margin:8px 0 4px;overflow:hidden}#si-panel.si-inline #si-scroll{overflow:visible}#si-panel.si-inline #si-close{display:none}";
  var panel = el("div", { id: "si-panel", role: "dialog", "aria-label": "Session Information", "data-no-translate": "" });
  var title = el("div", { id: "si-title" });
  title.appendChild(el("h2", null, "Session Information"));
  var closeBtn = el("button", { id: "si-close", type: "button", "aria-label": "Close session information" }, "×");
  title.appendChild(closeBtn);
  var bar = el("div", { id: "si-bar" });
  var bRefresh = el("button", { type: "button", title: "Refresh" }, "↻ Refresh");
  var bCopy = el("button", { type: "button", title: "Copy summary" }, "Copy");
  var bPrint = el("button", { type: "button", title: "Print" }, "Print");
  bar.appendChild(bRefresh); bar.appendChild(bCopy); bar.appendChild(bPrint);
  var scroller = el("div", { id: "si-scroll" });
  var foot = el("div", { id: "si-foot" }, "Built in your browser from data stored in your browser. Nothing here is sent anywhere.");
  var clear = el("button", { id: "si-clear", type: "button" }, "Clear my session data");
  foot.appendChild(clear);
  panel.appendChild(title); panel.appendChild(bar); panel.appendChild(scroller); panel.appendChild(foot);
  // The panel only ever renders inline, inside #session-info-inline.
  // There is no floating side button.
  if (inlineHost) {
    panel.classList.add("si-inline");
    inlineHost.appendChild(panel);
  }

  var collapsed = {};
  var lastText = "";

  function card(id, heading, cls) {
    var c = el("section", { "class": "si-card " + (cls || "") + (collapsed[id] ? " collapsed" : "") });
    var b = el("button", { type: "button", "aria-expanded": String(!collapsed[id]) });
    b.appendChild(el("span", { "class": "si-pill" }, heading));
    b.appendChild(el("span", { "class": "si-chev", "aria-hidden": "true" }));
    var content = el("div", { "class": "si-content" });
    b.addEventListener("click", function () {
      collapsed[id] = !collapsed[id];
      c.classList.toggle("collapsed", !!collapsed[id]);
      b.setAttribute("aria-expanded", String(!collapsed[id]));
    });
    c.appendChild(b); c.appendChild(content);
    scroller.appendChild(c);
    return content;
  }
  function row(parent, k, v, sep) {
    var r = el("dl", { "class": "si-row" + (sep ? " sep" : ""), style: "margin:0" });
    r.appendChild(el("dt", null, k)); r.appendChild(el("dd", null, v));
    parent.appendChild(r);
    lastText += k + ": " + v + "\n";
  }

  function render() {
    var p = compile();
    scroller.textContent = "";
    lastText = "SESSION INFORMATION\n";
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var lang = (p.a11y.language && p.a11y.language !== "en") ? String(p.a11y.language) : "English";
    var a11yProfile = p.a11y.activeProfile ? String(p.a11y.activeProfile) : "None";
    var user = p.greeting && p.greeting.name ? p.greeting.name : "Anonymous visitor";
    var compiled = [p.access.toUpperCase().replace(/[^A-Z]+/g, "-"), p.tier.toUpperCase().replace(/[^A-Z]+/g, "-"),
      (p.a11y.language || "en").toUpperCase(), "A11Y-" + a11yProfile.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
      "V" + visitor.visits, "S" + p.score].join(":::");

    // 1. Compiled profile summary
    var c1 = card("summary", "Compiled Profile Summary", "alt");
    row(c1, "User level", p.access + " · " + p.tier);
    row(c1, "Engagement score", p.score + " / 12");
    var why = el("div", { "class": "si-note" }, p.factors.length
      ? "Based on: " + p.factors.map(function (f) { return f.label + " (+" + f.points + ")"; }).join("; ")
      : "Just arrived — nothing to score yet.");
    c1.appendChild(why);

    // 2. Login information
    var c2 = card("login", "Login Information");
    row(c2, "Workstation:", browserInfo());
    row(c2, "User:", user);
    row(c2, "Linked provider:", p.greeting && p.greeting.company ? p.greeting.company : "None");
    row(c2, "Entry page:", session.pages.length ? session.pages[0].path : path);
    row(c2, "Location:", tz || "Unknown");
    row(c2, "Service area:", lang);
    row(c2, "Recruiter:", p.recruiter);
    row(c2, "Workstation profile:", screen.width + " × " + screen.height + " (window " + window.innerWidth + " × " + window.innerHeight + ")");
    row(c2, "Timeout action:", "Session clears when this tab closes");
    var feat = el("div", { "class": "si-sub" }, "Featured application — Portfolio");
    c2.appendChild(feat);
    row(c2, "Started:", fmtTime(session.start));
    row(c2, "Time on site:", fmtDuration(Date.now() - session.start));
    row(c2, "Active time:", fmtDuration(p.activeMs));
    row(c2, "Pages viewed:", String(p.pageCount));
    row(c2, "Furthest scroll:", session.maxScroll + "%");
    row(c2, "Clicks:", String(session.clicks));

    // 3. Profile compilation
    var c3 = card("profile", "Profile Compilation");
    c3.appendChild(el("div", { "class": "si-note" }, "Note that settings changed during this visit (language, accessibility profile) are included here as they happen."));
    row(c3, "User level profile:", p.tier);
    row(c3, "Access class profile:", p.access);
    row(c3, "Visitor profile:", returning ? "Returning (visit #" + visitor.visits + ")" : "First visit");
    row(c3, "Location profile:", tz || "None");
    row(c3, "Service area profile:", lang);
    row(c3, "System defs profile:", a11yProfile);
    var cp = el("dl", { "class": "si-row sep", style: "margin:0" });
    cp.appendChild(el("dt", null, "Compiled profile:"));
    cp.appendChild(el("dd", { "class": "si-mono" }, compiled));
    c3.appendChild(cp);
    lastText += "Compiled profile: " + compiled + "\n";

    // 4. Server and host information
    var c4 = card("host", "Server and Host Information");
    row(c4, "Site version:", "2026.10");
    row(c4, "Domain name:", location.hostname);
    row(c4, "Protocol:", location.protocol.replace(":", "").toUpperCase());
    row(c4, "Website:", location.origin);
    row(c4, "API host:", "tylerjanczak-github-io.vercel.app");
    row(c4, "Chat service:", chatMessageCount() > 0 ? "Active (" + p.chats + " message" + (p.chats === 1 ? "" : "s") + " this page)" : "Idle");
    row(c4, "Storage available:", (function () { try { localStorage.setItem("__si", "1"); localStorage.removeItem("__si"); return "Yes"; } catch (e) { return "No"; } })());

    // 5. Template linking
    var c5 = card("templates", "Template Linking Information");
    c5.appendChild(el("div", { "class": "si-sub" }, "General"));
    row(c5, "Currently applied template:", p.greeting && p.greeting.name ? "Personal link — " + p.greeting.name : "Standard visitor");
    c5.appendChild(el("div", { "class": "si-sub" }, "Defined items"));
    var tbl = el("table", { "class": "si-table" });
    var thead = el("thead"); var hr = el("tr");
    ["Defined item", "Value", "Overridden by"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = el("tbody");
    var items = [
      ["LANGUAGE", lang, p.a11y.language && p.a11y.language !== "en" ? "Accessibility widget" : "—"],
      ["ACCESSIBILITY PROFILE", a11yProfile, p.a11y.activeProfile ? "Accessibility widget" : "—"],
      ["GREETING NAME", p.greeting && p.greeting.name ? p.greeting.name : "None", p.greeting && p.greeting.name ? "Personal link" : "—"],
      ["MAXIMUM LOGIN SESSIONS", String(visitor.visits) + " so far", "—"],
      ["TEXT & CONTRAST OPTIONS", ["biggerText", "contrast", "textSpacing", "lineHeight", "highlightLinks", "textAlign", "dyslexiaFriendly", "reducedMotion"].filter(function (k) { return p.a11y[k]; }).length + " active", "Accessibility widget"]
    ];
    items.forEach(function (it) {
      var tr = el("tr");
      it.forEach(function (c) { tr.appendChild(el("td", null, c)); });
      tb.appendChild(tr);
      lastText += it[0] + " = " + it[1] + " (" + it[2] + ")\n";
    });
    tbl.appendChild(tb); c5.appendChild(tbl);
  }

  var timer = null;
  function open() {
    panel.classList.add("open");
    render();
    timer = setInterval(function () {
      var top = scroller.scrollTop; render(); scroller.scrollTop = top;
    }, 5000);
    closeBtn.focus();
  }
  function close() {
    panel.classList.remove("open");
    clearInterval(timer);
  }
  closeBtn.addEventListener("click", close);
  bRefresh.addEventListener("click", function () { var t = scroller.scrollTop; render(); scroller.scrollTop = t; });
  bPrint.addEventListener("click", function () { window.print(); });
  bCopy.addEventListener("click", function () {
    var done = function () { bCopy.textContent = "Copied"; setTimeout(function () { bCopy.textContent = "Copy"; }, 1500); };
    try { navigator.clipboard.writeText(lastText).then(done, function () {}); } catch (e) {}
  });
  clear.addEventListener("click", function () {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(VISITOR_KEY); } catch (e) {}
    session = { start: Date.now(), pages: [{ path: path, t: Date.now() }], activeMs: 0, maxScroll: 0, clicks: 0 };
    visitor = { firstSeen: Date.now(), visits: 1, lastSeen: Date.now() };
    returning = false;
    save(); render();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) close(); });

  if (inlineHost) {
    render();
    setInterval(function () {
      if (document.visibilityState !== "visible") return;
      var top = scroller.scrollTop; render(); scroller.scrollTop = top;
    }, 5000);
  } else {
    // No inline host on this page: no UI at all (tracking keeps running).
  }

  window.TylerSessionInfo = {
    open: open, close: close,
    refresh: function () { if (inlineHost) { var t = scroller.scrollTop; render(); scroller.scrollTop = t; } }
  };
})();

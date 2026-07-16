(() => {
  "use strict";

  /*
   * Tyler AI — Portfolio Chat Widget
   * Frontend website: GitHub Pages / Vercel static hosting
   * Backend API: Vercel serverless function
   */

  const CONFIG = {
    apiUrl: "https://tylerjanczak-github-io.vercel.app/api/chat",
    resumeApiUrl: "https://tylerjanczak-github-io.vercel.app/api/send-resume",
    assistantName: "Tyler AI",
    profileImage: "tyler-ai-avatar.jpg",
    requestTimeoutMs: 45000
  };

  // Prevent the widget from being loaded more than once.
  if (document.getElementById("tyler-ai-widget")) {
    return;
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
      min-width: 138px;
      height: 46px;
      padding: 0 21px;
      border: 0;
      border-radius: 999px;
      background: var(--ta-red);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 10px 28px rgba(30, 22, 20, 0.2);
      transition:
        transform 160ms ease,
        background 160ms ease,
        box-shadow 160ms ease;
    }

    #tyler-ai-notification-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      background: #2f7de1;
      border: 2px solid #f7f5f0;
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

    #tyler-ai-launcher:hover {
      background: var(--ta-red-hover);
      transform: translateY(-2px);
      box-shadow: 0 14px 32px rgba(30, 22, 20, 0.24);
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
        height: 44px;
        min-width: 128px;
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
    >
      <span id="tyler-ai-launcher-label">Ask Tyler AI</span>
      <span
        id="tyler-ai-notification-dot"
        aria-hidden="true"
      ></span>
    </button>
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

  const resumeRequestPattern =
    /(resume|cv).*(send|email|copy|share|forward|get)|(send|email|copy|share|forward|get).*(resume|cv)/i;
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
      `${getTimeBasedGreeting()}, I'm Tyler's Automated Assistant. I can answer a variety of questions, recommend where to explore next, or connect you with the information you're looking for; including projects, recommendations, or a copy of his resume.`,
      "",
      500,
      1100
    );
  }

  /* ------------------------------------------------------------------
     Initial messages
  ------------------------------------------------------------------ */

  runInitialMessages();

  /* ------------------------------------------------------------------
     Open and close behavior
  ------------------------------------------------------------------ */

  launcher.addEventListener("click", () => {
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
    addUserMessage(question);

    input.value = "";
    input.style.height = "auto";

    // If we just asked for an email to send the resume to, treat this
    // reply as the email address instead of a normal chat question.
    if (awaitingResumeEmail) {
      awaitingResumeEmail = false;

      if (!emailPattern.test(question)) {
        addAssistantMessage(
          "That doesn't look like a valid email address — could you try typing it again?",
          "error"
        );
        awaitingResumeEmail = true;
        return;
      }

      await sendResumeToEmail(question);
      return;
    }

    // If the question is asking for the resume, start the email-collection
    // flow instead of sending this to the AI model.
    if (resumeRequestPattern.test(question)) {
      addAssistantMessage(
        "Happy to send that over — what email address should I send Tyler's resume to?"
      );
      awaitingResumeEmail = true;
      return;
    }

    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    const typingElement = addTypingIndicator();

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
          question: question
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
      addAssistantMessage(displayText);

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
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  /* ------------------------------------------------------------------
     Message helpers
  ------------------------------------------------------------------ */

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
        `Done — Tyler's resume is on its way to ${email}.`
      );
    } catch (error) {
      typingElement.remove();

      console.error("Resume send failed:", error);

      if (error.name === "AbortError") {
        addAssistantMessage(
          "That took too long — please try again in a moment.",
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

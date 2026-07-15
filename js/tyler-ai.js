(() => {
  "use strict";

  /*
   * Tyler AI — Portfolio Chat Widget
   * Frontend website: GitHub Pages
   * Backend API: Vercel
   */

  const CONFIG = {
    apiUrl: "https://tylerjanczak-github-io.vercel.app/api/chat",
    assistantName: "Tyler AI",
    profileImage: "", // Add an image path here later, such as "images/tyler-headshot.jpg"
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
      gap: 4px;
      min-width: 54px;
      min-height: 42px;
    }

    .tyler-ai-typing span {
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #888078;
      animation: tylerAiTyping 1.1s infinite ease-in-out;
    }

    .tyler-ai-typing span:nth-child(2) {
      animation-delay: 0.15s;
    }

    .tyler-ai-typing span:nth-child(3) {
      animation-delay: 0.3s;
    }

    @keyframes tylerAiTyping {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: 0.45;
      }

      30% {
        transform: translateY(-4px);
        opacity: 1;
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

    .tyler-ai-privacy {
      margin: 9px 4px 0;
      color: var(--ta-muted);
      font-size: 10px;
      line-height: 1.35;
      text-align: center;
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

        <p class="tyler-ai-privacy">
          Conversations may be recorded to improve Tyler AI,
          system quality, and personalization. Do not submit
          confidential or sensitive information.
        </p>
      </footer>
    </div>

    <button
      id="tyler-ai-launcher"
      type="button"
      aria-expanded="false"
      aria-controls="tyler-ai-panel"
    >
      Ask Tyler AI
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

  let requestInProgress = false;
  let conversationStarted = false;

  /* ------------------------------------------------------------------
     Initial messages
  ------------------------------------------------------------------ */

  addAssistantMessage(
    "Thanks for dropping by. Conversations may be recorded for quality, system improvement, and personalization.",
    "notice"
  );

  addAssistantMessage(
    "Hi, I'm Tyler AI. Ask me about Tyler's experience, projects, education, leadership, technical skills, or measurable outcomes."
  );

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
    launcher.textContent = "Close Tyler AI";

    window.setTimeout(() => {
      input.focus();
    }, 100);
  }

  function closeChat() {
    panel.classList.remove("tyler-ai-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    launcher.textContent = "Ask Tyler AI";
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
    requestInProgress = true;
    sendButton.disabled = true;
    input.disabled = true;

    addUserMessage(question);

    input.value = "";
    input.style.height = "auto";

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
      addAssistantMessage(answer);
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
    bubble.textContent = text;

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();

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
      <span></span>
      <span></span>
      <span></span>
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

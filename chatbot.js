// ============================================================
//  NAROTTAMA ACADEMY — AI Chatbot Widget
//  Floating chat bubble that integrates with the existing site.
//  Modes:
//    general   → AI answers from its own knowledge, scoped to subject/chapter
//    notes     → AI reads the current notes content and answers from it
//    video     → AI knows a video is playing on the current subject/chapter
// ============================================================

(function () {

  // ── Configuration ─────────────────────────────────────────
  const CHATBOT_API = 'http://localhost:3001/api/chat'; // your Node.js server

  // ── State ──────────────────────────────────────────────────
  const state = {
    open: false,
    sessionId: 'session-' + Date.now(),
    subject: null,       // e.g. "MBBS Pathology"
    chapter: null,       // e.g. "Immunopathology and Amyloidosis"
    mode: 'general',     // 'general' | 'notes' | 'video'
    notesContent: null,  // extracted text from notes
    loading: false,
  };

  // ── Inject styles ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #na-chat-bubble {
      position: fixed; bottom: 28px; right: 28px; z-index: 9000;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #D97706, #92400E);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(146,64,14,0.4);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      font-size: 24px;
    }
    #na-chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(146,64,14,0.5);
    }
    #na-chat-bubble .na-bubble-badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #dc2626; color: white;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white; display: none;
    }

    #na-chat-window {
      position: fixed; bottom: 96px; right: 28px; z-index: 9001;
      width: 370px; height: 560px;
      background: #fff; border-radius: 18px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18);
      display: flex; flex-direction: column; overflow: hidden;
      border: 1px solid rgba(146,64,14,0.12);
      transform: scale(0.92) translateY(12px);
      opacity: 0; pointer-events: none;
      transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
      font-family: 'DM Sans', sans-serif;
    }
    #na-chat-window.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }

    /* Header */
    #na-chat-header {
      background: linear-gradient(135deg, #92400E, #B45309);
      padding: 14px 16px 12px;
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #na-chat-header .na-chat-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #na-chat-header .na-chat-title {
      flex: 1;
    }
    #na-chat-header .na-chat-title strong {
      display: block; color: #fff;
      font-size: 14px; font-weight: 600; line-height: 1.2;
    }
    #na-chat-header .na-chat-title span {
      display: block; color: rgba(255,255,255,0.75);
      font-size: 11px; line-height: 1.3; margin-top: 2px;
    }
    #na-chat-close {
      background: rgba(255,255,255,0.15); border: none;
      color: #fff; width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s; flex-shrink: 0;
    }
    #na-chat-close:hover { background: rgba(255,255,255,0.28); }

    /* Mode badge */
    #na-chat-mode-bar {
      padding: 7px 14px;
      background: #FEF3C7;
      border-bottom: 1px solid rgba(146,64,14,0.1);
      font-size: 11px; color: #92400E; font-weight: 500;
      flex-shrink: 0; display: flex; align-items: center; gap: 6px;
    }

    /* Messages */
    #na-chat-messages {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    #na-chat-messages::-webkit-scrollbar { width: 4px; }
    #na-chat-messages::-webkit-scrollbar-thumb {
      background: #e5e7eb; border-radius: 2px;
    }

    .na-msg { display: flex; gap: 8px; }
    .na-msg.user { flex-direction: row-reverse; }

    .na-msg-avatar {
      width: 26px; height: 26px; border-radius: 50%;
      background: #FEF3C7; color: #92400E;
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1px solid rgba(146,64,14,0.2);
    }
    .na-msg.user .na-msg-avatar {
      background: #f3f4f6; color: #374151; border-color: #e5e7eb;
    }

    .na-msg-bubble {
      max-width: 82%; padding: 9px 13px;
      font-size: 13px; line-height: 1.65;
      border-radius: 14px; word-break: break-word;
    }
    .na-msg.ai .na-msg-bubble {
      background: #f9fafb; color: #1f2937;
      border: 1px solid #e5e7eb;
      border-radius: 4px 14px 14px 14px;
    }
    .na-msg.user .na-msg-bubble {
      background: linear-gradient(135deg, #D97706, #92400E);
      color: #fff; border-radius: 14px 14px 4px 14px;
    }

    /* Typing dots */
    .na-typing {
      display: flex; gap: 4px; padding: 10px 14px;
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 4px 14px 14px 14px;
      width: fit-content;
    }
    .na-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: #9ca3af; display: block;
      animation: na-bounce 1.2s infinite;
    }
    .na-typing span:nth-child(2) { animation-delay: 0.2s; }
    .na-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes na-bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Suggestions */
    #na-chat-suggestions {
      padding: 6px 14px 8px;
      display: flex; flex-wrap: wrap; gap: 6px;
      flex-shrink: 0;
    }
    .na-sug {
      padding: 4px 11px; border-radius: 20px; font-size: 11.5px;
      border: 1px solid rgba(146,64,14,0.25);
      background: #FEF3C7; color: #92400E;
      cursor: pointer; font-family: 'DM Sans', sans-serif;
      transition: all 0.15s; white-space: nowrap;
    }
    .na-sug:hover { background: #FDE68A; border-color: rgba(146,64,14,0.5); }

    /* Input */
    #na-chat-input-row {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid #f3f4f6;
      background: #fff; flex-shrink: 0;
    }
    #na-chat-input {
      flex: 1; padding: 8px 12px;
      border: 1px solid #e5e7eb; border-radius: 10px;
      font-size: 13px; font-family: 'DM Sans', sans-serif;
      color: #1f2937; resize: none; line-height: 1.4;
      outline: none; transition: border-color 0.15s;
    }
    #na-chat-input:focus { border-color: #D97706; }
    #na-chat-input::placeholder { color: #9ca3af; }

    #na-chat-send {
      padding: 0 14px; height: 36px;
      background: linear-gradient(135deg, #D97706, #92400E);
      border: none; border-radius: 10px;
      color: #fff; font-size: 13px; font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer; white-space: nowrap;
      transition: opacity 0.15s; align-self: flex-end;
    }
    #na-chat-send:hover:not(:disabled) { opacity: 0.88; }
    #na-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

    @media (max-width: 480px) {
      #na-chat-window { width: calc(100vw - 24px); right: 12px; bottom: 80px; }
      #na-chat-bubble { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── Build HTML ─────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <!-- Chat Bubble -->
    <button id="na-chat-bubble" aria-label="Open AI Tutor" title="Ask the AI Tutor">
      🔥
      <div class="na-bubble-badge" id="na-bubble-badge"></div>
    </button>

    <!-- Chat Window -->
    <div id="na-chat-window" role="dialog" aria-label="AI Tutor Chat">
      <div id="na-chat-header">
        <div class="na-chat-avatar">🎓</div>
        <div class="na-chat-title">
          <strong>Narottama AI Tutor</strong>
          <span id="na-chat-subtitle">Your personal learning assistant</span>
        </div>
        <button id="na-chat-close" aria-label="Close chat">✕</button>
      </div>

      <div id="na-chat-mode-bar">
        <span id="na-mode-icon">💬</span>
        <span id="na-mode-text">General Q&amp;A — select a subject to get started</span>
      </div>

      <div id="na-chat-messages"></div>
      <div id="na-chat-suggestions"></div>

      <div id="na-chat-input-row">
        <textarea id="na-chat-input" rows="2" placeholder="Ask me anything..."></textarea>
        <button id="na-chat-send">Send</button>
      </div>
    </div>
  `);

  // ── DOM refs ───────────────────────────────────────────────
  const bubble    = document.getElementById('na-chat-bubble');
  const chatWin   = document.getElementById('na-chat-window');
  const closeBtn  = document.getElementById('na-chat-close');
  const messages  = document.getElementById('na-chat-messages');
  const input     = document.getElementById('na-chat-input');
  const sendBtn   = document.getElementById('na-chat-send');
  const modeText  = document.getElementById('na-mode-text');
  const modeIcon  = document.getElementById('na-mode-icon');
  const subtitle  = document.getElementById('na-chat-subtitle');
  const sugsEl    = document.getElementById('na-chat-suggestions');

  // ── Toggle open/close ──────────────────────────────────────
  bubble.addEventListener('click', () => {
    state.open = !state.open;
    chatWin.classList.toggle('open', state.open);
    if (state.open && messages.children.length === 0) {
      showWelcome();
    }
    if (state.open) input.focus();
  });
  closeBtn.addEventListener('click', () => {
    state.open = false;
    chatWin.classList.remove('open');
  });

  // ── Welcome message ────────────────────────────────────────
  function showWelcome() {
    const text = state.subject
      ? `Hi! I'm your AI tutor for **${state.subject}**. Ask me anything about this subject or select a chapter to dive deeper!`
      : `Hi! I'm the Narottama Academy AI Tutor 🎓\n\nSelect a subject from the list and I'll help you learn it. You can ask me questions, get explanations, or quiz yourself!`;
    addMessage('ai', text);
    showSuggestions();
  }

  // ── Update mode bar ────────────────────────────────────────
  function updateModeBar() {
    if (state.mode === 'notes') {
      modeIcon.textContent = '📖';
      modeText.textContent = `Reading notes — ${state.chapter || state.subject}`;
    } else if (state.mode === 'video') {
      modeIcon.textContent = '🎥';
      modeText.textContent = `Video mode — ${state.chapter || state.subject}`;
    } else if (state.subject) {
      modeIcon.textContent = '🧠';
      modeText.textContent = state.chapter
        ? `${state.subject} › ${state.chapter}`
        : `Subject: ${state.subject}`;
    } else {
      modeIcon.textContent = '💬';
      modeText.textContent = 'General Q&A — select a subject to get started';
    }
    subtitle.textContent = state.subject || 'Your personal learning assistant';
  }

  // ── Suggestions based on mode ──────────────────────────────
  function showSuggestions() {
    let suggestions = [];
    if (state.mode === 'notes') {
      suggestions = ['Summarise these notes', 'What are the key points?', 'Explain the difficult parts', 'Give me examples'];
    } else if (state.mode === 'video') {
      suggestions = ['What was covered in this video?', 'Explain the main concept', 'Give me a summary', 'What should I remember?'];
    } else if (state.subject) {
      suggestions = ['Explain the basics', 'Give me an example', 'What are the key topics?', 'How do I remember this?'];
    } else {
      suggestions = ['What subjects do you cover?', 'How can you help me?', 'I have an exam coming up', 'Help me study'];
    }
    sugsEl.innerHTML = suggestions
      .map(s => `<button class="na-sug" onclick="window._naChatUseSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`)
      .join('');
  }

  window._naChatUseSuggestion = function(q) {
    input.value = q;
    sugsEl.innerHTML = '';
    sendMessage();
  };

  // ── Add message to UI ──────────────────────────────────────
  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `na-msg ${role}`;
    const label = role === 'ai' ? 'AI' : 'You';
    div.innerHTML = `
      <div class="na-msg-avatar">${label}</div>
      <div class="na-msg-bubble">${formatText(text)}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'na-msg ai';
    div.id = 'na-typing-indicator';
    div.innerHTML = `
      <div class="na-msg-avatar">AI</div>
      <div class="na-typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    document.getElementById('na-typing-indicator')?.remove();
  }

  // ── Send message ───────────────────────────────────────────
  async function sendMessage() {
    const question = input.value.trim();
    if (!question || state.loading) return;

    input.value = '';
    state.loading = true;
    sendBtn.disabled = true;
    sugsEl.innerHTML = '';

    addMessage('user', question);
    showTyping();

    // Build the subject/topic to pass to the server
    const subject = state.subject || 'General Knowledge';
    const topic   = state.chapter  || state.subject || 'General';

    // Build extra context based on mode
    let contextNote = '';
    if (state.mode === 'notes' && state.notesContent) {
      contextNote = `\n\nThe student is currently reading these notes:\n---\n${state.notesContent.slice(0, 3000)}\n---\nAnswer based on these notes where relevant.`;
    } else if (state.mode === 'video') {
      contextNote = `\n\nThe student is currently watching a class video on "${topic}" in "${subject}". Answer based on what would typically be covered in this topic.`;
    }

    try {
      const response = await fetch(CHATBOT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          question: question + contextNote,
          subject,
          topic,
          level: 'Intermediate',
        }),
      });

      const data = await response.json();
      removeTyping();

      if (!response.ok) {
        addMessage('ai', `⚠️ Error: ${data.error || 'Something went wrong. Please try again.'}`);
      } else {
        addMessage('ai', data.answer);
      }

    } catch (err) {
      removeTyping();
      addMessage('ai', `⚠️ Could not connect to the AI server. Make sure the chatbot server is running on port 3001.`);
    } finally {
      state.loading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ── Public API — called from script.js ────────────────────
  // Call this when a subject is selected
  window.naChat = {

    setSubject: function(subjectName, chapterName) {
      state.subject   = subjectName;
      state.chapter   = chapterName || null;
      state.mode      = 'general';
      state.notesContent = null;
      state.sessionId = 'session-' + Date.now(); // fresh session per subject
      updateModeBar();
      showSuggestions();

      // If chat is open, notify the student
      if (state.open && messages.children.length > 0) {
        addMessage('ai', `Switched to **${subjectName}**${chapterName ? ` › **${chapterName}**` : ''}. Ask me anything!`);
      }
    },

    setNotesMode: function(notesText) {
      state.mode = 'notes';
      state.notesContent = notesText;
      updateModeBar();
      showSuggestions();
      if (state.open) {
        addMessage('ai', `📖 I can see the notes for **${state.chapter || state.subject}**. Ask me to explain anything from them!`);
      }
    },

    setVideoMode: function() {
      state.mode = 'video';
      state.notesContent = null;
      updateModeBar();
      showSuggestions();
      if (state.open) {
        addMessage('ai', `🎥 You're watching the class video for **${state.chapter || state.subject}**. Ask me anything about the topic!`);
      }
    },

    setGeneralMode: function() {
      state.mode = 'general';
      state.notesContent = null;
      updateModeBar();
      showSuggestions();
    },
  };

})();

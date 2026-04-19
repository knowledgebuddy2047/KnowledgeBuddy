// ============================================================
//  NAROTTAMA ACADEMY — Script (Redesigned)
// ============================================================

// --- Smooth scroll helper (called from HTML) ---
function smoothScroll(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// --- Badge category mapper ---
function getBadge(name) {
  const n = name.toLowerCase();
  if (n.includes('class') || n.includes('9') || n.includes('10')) return { cls: 'badge-school', label: 'School' };
  if (n.includes('jee'))  return { cls: 'badge-jee',  label: 'JEE' };
  if (n.includes('neet')) return { cls: 'badge-neet', label: 'NEET' };
  if (n.includes('mbbs')) return { cls: 'badge-mbbs', label: 'MBBS' };
  return { cls: 'badge-default', label: 'Exam' };
}

// --- Load menu dynamically ---
fetch("data/menu.json")
  .then(response => response.json())
  .then(data => {
    const menuList = document.getElementById("menu-list");
    data.subjects.forEach((item, idx) => {
      const li = document.createElement("li");
      li.className = "exam-card";
      const badge = getBadge(item.name);
      li.innerHTML = `
        <span class="exam-badge ${badge.cls}">${badge.label}</span>
        <div class="exam-name">${item.name}</div>
        <div class="exam-desc">${item.description}</div>
        <svg class="exam-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;
      li.onclick = () => {
        document.querySelectorAll('.exam-card').forEach(c => c.classList.remove('active'));
        li.classList.add('active');
        loadContent(item);
        // Scroll to content panel on mobile
        setTimeout(() => {
          document.getElementById('content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      };
      menuList.appendChild(li);
    });
  });

// --- Load subject content ---
function loadContent(subject) {
  // Update header
  const titleEl = document.getElementById("content-title");
  if (titleEl) titleEl.textContent = subject.name;

  const bcEl = document.getElementById("breadcrumb-subject");
  if (bcEl) bcEl.textContent = subject.name;

  let html = `<p class="subject-desc">${subject.description}</p>`;

  // Chapter selector block
  html += `<div class="chapter-row">
    <div class="form-group">
      <label class="form-label" for="chapter-select">Select Chapter</label>`;

  if (subject.chapters && subject.chapters.length > 0) {
    html += `<select id="chapter-select">
               <option value="">— Choose a chapter —</option>`;
    subject.chapters.forEach((ch, i) => {
      html += `<option value="${i}">${ch.title}</option>`;
    });
    html += `</select>`;
  }
  html += `</div>
    <div class="num-q-group">
      <label class="form-label" for="num-questions">No. of Questions</label>
      <input type="number" id="num-questions" min="1" max="600" value="10">
    </div>
  </div>`;

  // Action tiles grid
  html += `<div class="action-grid">
    <button id="notes-btn"      class="action-tile tile-notes"  type="button">
      <div class="tile-icon">📖</div><span>View Notes</span>
    </button>
    <button id="quiz-btn"       class="action-tile tile-quiz"   type="button">
      <div class="tile-icon">✏️</div><span>Take Quiz</span>
    </button>
    <button id="flashcards-btn" class="action-tile tile-flash"  type="button">
      <div class="tile-icon">🃏</div><span>Flashcards</span>
    </button>
    <button id="Class Video-btn" class="action-tile tile-video" type="button">
      <div class="tile-icon">🎥</div><span>Class Video</span>
    </button>
    <button id="slide-btn" class="action-tile tile-slide" type="button">
      <div class="tile-icon">📊</div><span>View Slide</span>
    </button>
  </div>`;

  document.getElementById("content-body").innerHTML = html;

  // Attach event listeners
  document.getElementById("notes-btn").addEventListener("click",       () => loadSelected("notes",       subject));
  document.getElementById("quiz-btn").addEventListener("click",        () => loadSelected("quiz",        subject));
  document.getElementById("flashcards-btn").addEventListener("click",  () => loadSelected("flashcards",  subject));
  document.getElementById("Class Video-btn").addEventListener("click", () => loadSelected("Class Video", subject));
  document.getElementById("slide-btn").addEventListener("click", () => loadSelected("slides",  subject));
}

// --- Route to the right loader ---
function loadSelected(type, subject) {
  const select = document.getElementById("chapter-select");
  const index  = select ? select.value : null;

  if (!index) {
    const sel = document.getElementById("chapter-select");
    if (sel) {
      // Inject shake CSS once
      if (!document.getElementById("chapter-error-style")) {
        const style = document.createElement("style");
        style.id = "chapter-error-style";
        style.textContent = [
          "@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}",
          ".chapter-error{border:2px solid #dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.2)!important;animation:shake .35s ease;}"
        ].join("");
        document.head.appendChild(style);
      }
      sel.classList.add("chapter-error");
      sel.focus();
      // Remove any previous error hint
      const prev = document.getElementById("chapter-error-hint");
      if (prev) prev.remove();
      // Show inline error message right below the dropdown
      const hint = document.createElement("p");
      hint.id = "chapter-error-hint";
      hint.textContent = "Please select a chapter to continue.";
      hint.style.cssText = "color:#dc2626;font-size:.85rem;font-weight:600;margin:6px 0 0;";
      sel.parentNode.insertBefore(hint, sel.nextSibling);
      // Clear error state once user picks a chapter
      sel.addEventListener("change", function() {
        sel.classList.remove("chapter-error");
        var h = document.getElementById("chapter-error-hint");
        if (h) h.remove();
      }, { once: true });
    }
    return;
  }

  const chapter = subject.chapters[index];
  const file    = chapter[type];

  if (type === "notes") {
    loadNotes(file);
  } else if (type === "slides") {
    loadSlide(file);
  } else if (type === "quiz") {
    const numQuestions = parseInt(document.getElementById("num-questions").value, 10);
    if (!chapter.quiz) { showToast("No quiz file defined for this chapter."); return; }
    if (!isNaN(numQuestions) && numQuestions > 0) {
      startQuiz(chapter.quiz, numQuestions);
    } else {
      showToast("Please enter a valid number of questions.");
    }
  } else if (type === "flashcards") {
    showFlashcards(file);
  } else if (type === "Class Video") {
    showWorkflow(file);
  }
}

// --- Toast notification (replaces alert for non-critical messages) ---
function showToast(msg) {
  let t = document.getElementById('na-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'na-toast';
    t.style.cssText = `
      position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(12px);
      background:#1f2937; color:white; padding:12px 24px; border-radius:50px;
      font-family:'DM Sans',sans-serif; font-size:.9rem; font-weight:500;
      box-shadow:0 8px 30px rgba(0,0,0,.3); opacity:0; transition:all .3s ease;
      z-index:9999; white-space:nowrap;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(12px)';
  }, 2800);
}

// --- Notes Loader ---
function loadNotes(file) {
  fetch(`data/${file}`)
    .then(res => res.text())
    .then(html => { document.getElementById("content-body").innerHTML = html; })
    .catch(() => { document.getElementById("content-body").innerHTML = notFoundHTML('notes'); });
}

// --- Slide Loader ---
function loadSlide(file) {
  document.getElementById("content-body").innerHTML =
    `<iframe src="data/${file}" style="width:100%;height:90vh;border:none;"></iframe>`;
}


// --- Workflow / Video Loader ---
function showWorkflow(file) {
  fetch(`data/${file}`)
    .then(res => res.text())
    .then(html => { document.getElementById("content-body").innerHTML = html; })
    .catch(() => { document.getElementById("content-body").innerHTML = notFoundHTML('video'); });
}

function notFoundHTML(type) {
  return `<div class="message">
    <h1>Coming Soon</h1>
    <p>The ${type} content for this chapter is being prepared. Check back soon!</p>
  </div>`;
}

// ============================================================
//  QUIZ ENGINE
// ============================================================
let currentQuizQuestions = [];
let currentQuestionIndex  = 0;
let userAnswers = {};

function startQuiz(file, numQuestions) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      const shuffled = data.quiz
        .map(q => ({ q, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ q }) => q);

      currentQuizQuestions = shuffled.slice(0, numQuestions);
      userAnswers = {};

      const quizHTML = `
        <style>
          #quiz-header {
            display:flex; align-items:center; justify-content:space-between;
            flex-wrap:wrap; gap:10px; margin-bottom:12px;
          }
          #quiz-luck {
            font-size:1.05rem; font-weight:700;
            color:#16a34a;
            background:#dcfce7;
            border:1.5px solid #bbf7d0;
            border-radius:50px;
            padding:6px 16px;
          }
          #timer {
            font-size:1rem; font-weight:700;
            color:#b45309;
            background:#fef3c7;
            border:1.5px solid #fde68a;
            border-radius:50px;
            padding:6px 16px;
          }
          #submit-quiz-btn {
            background:#dc2626; color:#fff;
            border:none; border-radius:8px;
            padding:8px 20px; font-size:.9rem; font-weight:700;
            cursor:pointer; white-space:nowrap;
            box-shadow:0 2px 8px rgba(220,38,38,.3);
            transition:background .2s, transform .1s;
          }
          #submit-quiz-btn:hover { background:#b91c1c; transform:scale(1.03); }
          #submit-quiz-btn:active { transform:scale(.97); }
        </style>
        <div id="quiz-header">
          <span id="quiz-luck">🍀 Best of Luck!</span>
          <div id="timer">Loading…</div>
          <button id="submit-quiz-btn" type="button" onclick="submitQuiz()">Submit Quiz ✔</button>
        </div>
        <div id="quiz-body">
          <div id="quiz-nav" class="sidebar"></div>
          <div id="quiz-questions" class="main">
            <form id="quiz-form">
              <div id="question-container"></div>
              <div class="nav-buttons">
                <button type="button" onclick="prevQuestion()">← Previous</button>
                <button type="button" onclick="nextQuestion()">Next →</button>
              </div>
            </form>
          </div>
        </div>`;

      document.getElementById("content-body").innerHTML = quizHTML;
      buildNavigation();
      currentQuestionIndex = 0;
      showQuestion(0);
      startTimer(currentQuizQuestions.length); // use actual count, not requested
    })
    .catch(err => {
      console.error("Error loading quiz:", err);
      showToast("Failed to load quiz. Please check the file.");
    });
}

function nextQuestion() {
  if (currentQuestionIndex < currentQuizQuestions.length - 1) {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
}
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  }
}
function goToQuestion(i) {
  currentQuestionIndex = i;
  showQuestion(i);
}

function buildNavigation() {
  let navHTML = `
    <div class="legend">
      <p><span class="legend-box unanswered"></span> Unanswered</p>
      <p><span class="legend-box answered"></span> Answered</p>
      <p><span class="legend-box review"></span> For Review</p>
      <p><span class="legend-box current"></span> Current</p>
    </div>
    <div class="question-nav">`;
  currentQuizQuestions.forEach((q, i) => {
    navHTML += `<button id="nav-${i}" class="nav-btn unanswered" onclick="goToQuestion(${i})">${i+1}</button>`;
  });
  navHTML += `</div>`;
  document.getElementById("quiz-nav").innerHTML = navHTML;
}

function highlightCurrentNav(i) {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("current"));
  document.getElementById(`nav-${i}`)?.classList.add("current");
}

function updateNav(i) {
  const navBtn = document.getElementById(`nav-${i}`);
  if (!navBtn || navBtn.classList.contains("review")) return;
  navBtn.classList.remove("unanswered", "answered");

  let answered = false;
  const inputs  = document.querySelectorAll(`[name="q${i}"]`);
  const selectedInputs = [];
  inputs.forEach(inp => {
    if ((inp.type === "radio" || inp.type === "checkbox") && inp.checked) {
      answered = true;
      selectedInputs.push(inp.value);
    }
  });
  const selects = document.querySelectorAll(`[name^="q${i}-"]`);
  const selectedSelects = [];
  selects.forEach(sel => { if (sel.value !== "") answered = true; selectedSelects.push(sel.value); });

  if (selectedSelects.length) {
    userAnswers[i] = selectedSelects;
  } else if (selectedInputs.length) {
    userAnswers[i] = selectedInputs;
  } else if (!userAnswers[i] || userAnswers[i].length === 0) {
    userAnswers[i] = [];
  }
  navBtn.classList.add(answered ? "answered" : "unanswered");
}

function markForReview(i) {
  const navBtn = document.getElementById(`nav-${i}`);
  if (!navBtn) return;
  if (navBtn.classList.contains("review")) {
    navBtn.classList.remove("review");
    let answered = false;
    document.querySelectorAll(`[name="q${i}"]`).forEach(inp => { if (inp.checked) answered = true; });
    document.querySelectorAll(`[name^="q${i}-"]`).forEach(sel => { if (sel.value !== "") answered = true; });
    navBtn.classList.add(answered ? "answered" : "unanswered");
  } else {
    navBtn.classList.remove("unanswered", "answered");
    navBtn.classList.add("review");
  }
}

function resetAnswer(i) {
  document.querySelectorAll(`[name="q${i}"]`).forEach(inp => { if (inp.type === "radio" || inp.type === "checkbox") inp.checked = false; });
  document.querySelectorAll(`[name^="q${i}-"]`).forEach(sel => { sel.value = ""; });
  userAnswers[i] = [];
  const navBtn = document.getElementById(`nav-${i}`);
  if (navBtn) { navBtn.classList.remove("answered", "review"); navBtn.classList.add("unanswered"); }
}

function showQuestion(index) {
  highlightCurrentNav(index);
  const q = currentQuizQuestions[index];
  let html = `<div id="question-${index}" class="question-block">
    <p><strong>${index+1}. ${q.question || ""}</strong></p>`;

  if (!q.type || q.type === "mcq_single") {
    html += q.options.map(opt =>
      `<label>
         <input type="radio" name="q${index}" value="${opt}"
           ${userAnswers[index]?.includes(opt) ? "checked" : ""}
           onchange="updateNav(${index})">
         ${opt}
       </label>`
    ).join("");
  } else if (q.type === "mcq_multiple") {
    html += q.options.map(opt =>
      `<label>
         <input type="checkbox" name="q${index}" value="${opt}"
           ${userAnswers[index]?.includes(opt) ? "checked" : ""}
           onchange="updateNav(${index})">
         ${opt}
       </label>`
    ).join("");
  } else if (q.type === "assertion_reason") {
    html += `<p><em>Assertion:</em> ${q.assertion}</p><p><em>Reason:</em> ${q.reason}</p>`;
    html += q.options.map(opt =>
      `<label>
         <input type="radio" name="q${index}" value="${opt}"
           ${userAnswers[index]?.includes(opt) ? "checked" : ""}
           onchange="updateNav(${index})">
         ${opt}
       </label>`
    ).join("");
  } else if (q.type === "match_columns") {
    html += `<table class="match-table"><tr><th>Left</th><th>Right (select)</th></tr>`;
    q.left.forEach((leftItem, idx) => {
      const saved = userAnswers[index] ? userAnswers[index][idx] : "";
      html += `<tr>
        <td>${leftItem}</td>
        <td>
          <select name="q${index}-${idx}" onchange="updateNav(${index})">
            <option value="">— Select —</option>
            ${q.right.map(r => `<option value="${r}" ${saved === r ? "selected" : ""}>${r}</option>`).join("")}
          </select>
        </td></tr>`;
    });
    html += `</table>`;
  }

  html += `<button type="button" onclick="markForReview(${index})">🔖 Mark for Review</button>`;
  html += `<button type="button" onclick="resetAnswer(${index})">↺ Reset</button>`;
  html += `</div>`;
  document.getElementById("question-container").innerHTML = html;
}

// --- Timer ---
let quizTimerInterval = null;
function startTimer(numQuestions) {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  let timeLeft = Math.floor(numQuestions * 1.5 * 60);
  const el = document.getElementById("timer");
  quizTimerInterval = setInterval(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    if (el) el.textContent = `⏱ ${m}:${s < 10 ? "0" : ""}${s}`;
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(quizTimerInterval);
      alert("Time is up! Submitting quiz automatically.");
      submitQuiz();
    }
  }, 1000);
}

// --- Submit Quiz ---
function submitQuiz() {
  if (!confirm("Are you sure you want to submit the quiz?")) return;
  if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }

  // Save the currently visible question's answers before evaluating
  updateNav(currentQuestionIndex);

  let score = 0;
  let correct_count = 0, incorrect_count = 0, not_attempted = 0;
  let resultsHTML = ``;

  currentQuizQuestions.forEach((q, i) => {
    const correct = q.answer;
    const explanation = q.explanation || "";
    let answer = userAnswers[i] ?? [];
    let statusClass = "";
    let statusText = "";

    if (!q.type || q.type === "mcq_single" || q.type === "assertion_reason") {
      const selected = Array.isArray(answer) ? answer[0] : answer;
      if (!selected) {
        statusText = "⚠️ Not attempted"; statusClass = "result-skipped"; not_attempted++;
      } else if (evaluateSingle(selected, correct)) {
        statusText = "✅ Correct"; statusClass = "result-correct"; score++; correct_count++;
      } else {
        statusText = "❌ Incorrect"; statusClass = "result-incorrect"; incorrect_count++;
      }
      answer = selected || null;
    } else if (q.type === "mcq_multiple") {
      const selected = Array.isArray(answer) ? answer : [];
      if (selected.length === 0) {
        statusText = "⚠️ Not attempted"; statusClass = "result-skipped"; not_attempted++;
      } else if (arraysEqual(selected, correct)) {
        statusText = "✅ Correct"; statusClass = "result-correct"; score++; correct_count++;
      } else {
        statusText = "❌ Incorrect"; statusClass = "result-incorrect"; incorrect_count++;
      }
    } else if (q.type === "match_columns") {
      // userAnswers stores array of selected right-side values indexed by left position
      const savedArr = Array.isArray(answer) ? answer : [];
      let userMapping = {};
      q.left.forEach((l, idx) => { userMapping[l] = savedArr[idx] || ""; });
      const allCorrect = Object.keys(correct).every(k => userMapping[k] === correct[k]);
      const hasAny = savedArr.some(v => v);
      if (!hasAny) {
        statusText = "⚠️ Not attempted"; statusClass = "result-skipped"; not_attempted++;
      } else if (allCorrect) {
        statusText = "✅ Correct"; statusClass = "result-correct"; score++; correct_count++;
      } else {
        statusText = "❌ Incorrect"; statusClass = "result-incorrect"; incorrect_count++;
      }
      answer = userMapping;
    }

    resultsHTML += `
      <div class="result-item ${statusClass}">
        <div class="result-status-bar">${statusText}</div>
        <p class="result-question"><strong>Q${i+1}.</strong> ${q.question || ""}</p>
        <div class="result-answers">
          <span class="result-label">Your answer:</span>
          <span class="result-value ${statusClass === 'result-correct' ? 'ans-correct' : statusClass === 'result-incorrect' ? 'ans-wrong' : 'ans-skipped'}">${formatAnswer(answer) || "—"}</span>
        </div>
        ${statusClass !== "result-correct" ? `
        <div class="result-answers">
          <span class="result-label">Correct answer:</span>
          <span class="result-value ans-correct">${formatAnswer(correct)}</span>
        </div>` : ""}
        ${explanation ? `<div class="result-explanation">💡 ${explanation}</div>` : ""}
      </div>`;
  });

  const total = currentQuizQuestions.length;
  const pct = Math.round((score / total) * 100);
  const msg = pct >= 80 ? "🎉 Excellent! You're mastering this topic." :
              pct >= 50 ? "👍 Good effort! Keep practising to improve." :
                          "💡 Don't worry — review the notes and try again!";
  const scoreColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626";

  const summaryHTML = `
    <div class="result-summary-card">
      <h2 class="result-title">📋 Quiz Results</h2>
      <div class="result-score-ring" style="border-color:${scoreColor};">
        <span class="result-score-pct" style="color:${scoreColor};">${pct}%</span>
        <span class="result-score-label">${score} / ${total}</span>
      </div>
      <p class="result-msg">${msg}</p>
      <div class="result-stats">
        <div class="stat-box stat-correct">✅ Correct<br><strong>${correct_count}</strong></div>
        <div class="stat-box stat-wrong">❌ Wrong<br><strong>${incorrect_count}</strong></div>
        <div class="stat-box stat-skip">⚠️ Skipped<br><strong>${not_attempted}</strong></div>
      </div>
    </div>
    <div class="result-details-header">
      <h3>Question-wise Breakdown</h3>
    </div>
    <div class="result-list">
      ${resultsHTML}
    </div>
    <style>
      .result-summary-card { background:var(--surface,#fff); border-radius:16px; padding:28px 24px; text-align:center; box-shadow:0 2px 16px rgba(0,0,0,.08); margin-bottom:24px; }
      .result-title { font-size:1.3rem; margin-bottom:16px; }
      .result-score-ring { display:inline-flex; flex-direction:column; align-items:center; justify-content:center; width:110px; height:110px; border-radius:50%; border:6px solid; margin-bottom:12px; }
      .result-score-pct { font-size:1.8rem; font-weight:700; line-height:1; }
      .result-score-label { font-size:.85rem; color:#6b7280; }
      .result-msg { font-size:1rem; color:#374151; margin-bottom:16px; }
      .result-stats { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
      .stat-box { flex:1; min-width:80px; padding:10px 8px; border-radius:10px; font-size:.85rem; text-align:center; }
      .stat-correct { background:#dcfce7; color:#166534; }
      .stat-wrong   { background:#fee2e2; color:#991b1b; }
      .stat-skip    { background:#fef9c3; color:#854d0e; }
      .result-details-header { margin:0 0 12px; }
      .result-details-header h3 { font-size:1.05rem; font-weight:600; color:#374151; }
      .result-list { display:flex; flex-direction:column; gap:12px; }
      .result-item { background:var(--surface,#fff); border-radius:12px; border-left:4px solid #e5e7eb; padding:14px 16px; box-shadow:0 1px 6px rgba(0,0,0,.06); }
      .result-correct { border-left-color:#16a34a; }
      .result-incorrect { border-left-color:#dc2626; }
      .result-skipped { border-left-color:#d97706; }
      .result-status-bar { font-size:.8rem; font-weight:600; margin-bottom:6px; }
      .result-question { margin:0 0 8px; font-size:.95rem; line-height:1.4; }
      .result-answers { font-size:.88rem; margin-bottom:4px; }
      .result-label { color:#6b7280; margin-right:4px; }
      .result-value { font-weight:500; }
      .ans-correct { color:#16a34a; }
      .ans-wrong   { color:#dc2626; }
      .ans-skipped { color:#d97706; }
      .result-explanation { margin-top:8px; font-size:.85rem; color:#6b7280; background:#f9fafb; border-radius:6px; padding:6px 10px; }
    </style>`;

  document.getElementById("content-body").innerHTML = summaryHTML;
}

function evaluateSingle(a, c) { return a && a === c; }
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  return a.length === b.length && a.every(v => b.includes(v));
}
function formatAnswer(ans) {
  if (!ans) return "No answer";
  if (Array.isArray(ans)) return ans.join(", ");
  if (typeof ans === "object") return Object.entries(ans).map(([k,v]) => `${k} → ${v}`).join("; ");
  return ans;
}

// ============================================================
//  FLASHCARDS ENGINE
// ============================================================
let flashcardsData  = [];
let flashIndex      = 0;
let flashFlipped    = false;
let correctCount    = 0;
let incorrectCount  = 0;

function showFlashcards(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      flashcardsData = data.flashcards;
      flashIndex = 0; correctCount = 0; incorrectCount = 0; flashFlipped = false;
      renderFlashcard();
    })
    .catch(err => {
      document.getElementById("content-body").innerHTML = `<div class="message"><h1>⚠️ Error</h1><p>${err.message}</p></div>`;
    });
}

function renderFlashcard() {
  if (!flashcardsData.length) return;
  const cardHTML = `
    <div class="flashcard">
      <div class="card ${flashFlipped ? "flip" : ""}" id="card" onclick="flipFlashcard()">
        <div class="front">${flashcardsData[flashIndex].front}</div>
        <div class="back">${flashcardsData[flashIndex].back}</div>
      </div>
    </div>
    <div class="controls">
      <button onclick="prevFlashcard()" title="Previous"><img src="data/images/previous.jpg" class="icon" alt="Prev"></button>
      <button onclick="shuffleFlashcards()" title="Shuffle"><img src="data/images/shuffle.png" class="icon" alt="Shuffle"></button>
      <button onclick="nextFlashcard()" title="Next"><img src="data/images/next.png" class="icon" alt="Next"></button>
      <button onclick="markCorrect()" title="Got it!"><img src="data/images/Yesicon.png" class="icon" alt="Correct"></button>
      <button onclick="markIncorrect()" title="Missed"><img src="data/images/Noicon.png" class="icon" alt="Incorrect"></button>
    </div>
    <div class="progress">
      Card ${flashIndex + 1} of ${flashcardsData.length} &nbsp;|&nbsp;
      ✅ ${correctCount} &nbsp;|&nbsp; ❌ ${incorrectCount}
    </div>`;
  document.getElementById("content-body").innerHTML = cardHTML;
}

function flipFlashcard() {
  const card = document.getElementById("card");
  card.classList.toggle("flip");
  flashFlipped = card.classList.contains("flip");
}
function nextFlashcard()     { flashIndex = (flashIndex + 1) % flashcardsData.length; flashFlipped = false; renderFlashcard(); }
function prevFlashcard()     { flashIndex = (flashIndex - 1 + flashcardsData.length) % flashcardsData.length; flashFlipped = false; renderFlashcard(); }
function shuffleFlashcards() { flashcardsData.sort(() => Math.random() - .5); flashIndex = 0; flashFlipped = false; renderFlashcard(); }
function markCorrect()       { correctCount++;   nextFlashcard(); }
function markIncorrect()     { incorrectCount++; nextFlashcard(); }

function navigateTo(sectionId) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
}

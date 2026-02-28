// Load menu dynamically
fetch("data/menu.json")
  .then(response => response.json())
  .then(data => {
    const menuList = document.getElementById("menu-list");
    data.subjects.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.name;
      li.onclick = () => loadContent(item);
      menuList.appendChild(li);
    });
  });

function loadContent(subject) {
  document.getElementById("content-title").textContent = subject.name;

  let html = `<p>${subject.description}</p>`;

  if (subject.chapters && subject.chapters.length > 0) {
    html += `<label for="chapter-select">Select Chapter:</label>
             <select id="chapter-select">
               <option value="">--Choose a chapter--</option>`;
    subject.chapters.forEach((ch, i) => {
      html += `<option value="${i}">${ch.title}</option>`;
    });
    html += `</select>`;
  }

  // Render buttons with IDs (no inline onclick)
  html += `
    <div>
      <button id="notes-btn" class="action-button">View Notes</button>
      <button id="quiz-btn" class="action-button">Take Quiz</button>
      <button id="flashcards-btn" class="action-button">View Flashcards</button>
      <button id="workflow-btn" class="action-button">Study Plan</button>
    </div>
  `;

  document.getElementById("content-body").innerHTML = html;

  // Attach event listeners here, subject is still available
  document.getElementById("notes-btn").addEventListener("click", () => loadSelected("notes", subject));
  document.getElementById("quiz-btn").addEventListener("click", () => loadSelected("quiz", subject));
  document.getElementById("flashcards-btn").addEventListener("click", () => loadSelected("flashcards", subject));
  document.getElementById("workflow-btn").addEventListener("click", () => loadSelected("workflow", subject));
}



function loadSelected(type, subject) {
  const select = document.getElementById("chapter-select");
  const index = select ? select.value : null;

  if (!index) {
    alert("Please select a chapter first!");
    return;
  }

  const chapter = subject.chapters[index];
  const file = chapter[type];

  if (type === "notes") {
    loadNotes(file);
  } else if (type === "quiz") {
    startQuiz(file);
  } else if (type === "flashcards") {
    showFlashcards(file);
  } else if (type === "workflow") {
    showWorkflow(file);
  }
}

function loadChapter(file) {
  fetch(`data/${file}`)
    .then(res => res.text())
    .then(html => {
      document.getElementById("content-body").innerHTML = html;
    })
    .catch(err => {
      document.getElementById("content-body").innerHTML = `<p>⚠️ Error loading chapter: ${err.message}</p>`;
    });
}

// Notes Loader
function loadNotes(file) {
  fetch(`data/${file}`)
    .then(res => res.text())
    .then(html => {
      document.getElementById("content-body").innerHTML = html;
    });
}

// Quiz Loader
function startQuiz(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      let quizHTML = "<form id='quiz-form'>";
      data.quiz.forEach((q, i) => {
        quizHTML += `<div>
          <p>${i+1}. ${q.question}</p>
          ${q.options.map(opt => 
            `<label>
              <input type="radio" name="q${i}" value="${opt}"> ${opt}
            </label><br>`
          ).join("")}
        </div>`;
      });
      // Add a single submit button at the end
      quizHTML += `<button class="action-button" type="button" onclick="submitQuiz('${file}')">Submit Quiz</button></form>`;
      document.getElementById("content-body").innerHTML = quizHTML;
    });
}


function submitQuiz(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      let score = 0;
      let resultsHTML = "<h3>Results</h3><ul>";
      
      data.quiz.forEach((q, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const answer = selected ? selected.value : null;  // null if not attempted
        const correct = q.answer;
        const explanation = q.explanation || ""; // fallback to blank if missing

        let statusText;
        if (!answer) {
          statusText = "⚠️ Not attempted";
        } else if (answer === correct) {
          score++;
          statusText = "✅ Correct";
        } else {
          statusText = "❌ Incorrect";
        }

        resultsHTML += `<li>
          Q${i+1}: ${q.question}<br>
          Your answer: ${answer ? answer : "No answer"} <br>
          Correct answer: ${correct} <br>
          ${statusText}<br>
          ${explanation ? `<em>Explanation: ${explanation}</em>` : ""}
        </li><br>`;
      });

      resultsHTML += `</ul><p><strong>Final Score: ${score} / ${data.quiz.length}</strong></p>`;
      
      // Motivational feedback
      const percentage = (score / data.quiz.length) * 100;
      if (percentage >= 80) {
        resultsHTML += "<p>🎉 Great job! You’re mastering this topic.</p>";
      } else if (percentage >= 50) {
        resultsHTML += "<p>👍 Good effort! Keep practicing to improve.</p>";
      } else {
        resultsHTML += "<p>💡 Don’t worry — review the notes and try again!</p>";
      }

      document.getElementById("content-body").innerHTML = resultsHTML;
    });
}

function openQuiz(subject, chapter, quizFile) {
  // Save context in localStorage so quiz page knows what to load
  localStorage.setItem("selectedSubject", subject);
  localStorage.setItem("selectedChapter", chapter);
  localStorage.setItem("quizFile", quizFile);

  // Redirect to quiz login page
  window.location.href = "login-quiz.html";
}
const quizButton = document.createElement("button");
quizButton.textContent = "Take Quiz";
quizButton.onclick = () => openQuiz(subjectName, chapterTitle, quizFilePath);




// Flashcards Loader
function showFlashcards(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      let cardsHTML = "";
      data.flashcards.forEach(card => {
        cardsHTML += `
          <div class="flashcard">
            <div class="front">${card.front}</div>
            <div class="back">${card.back}</div>
          </div>`;
      });
      document.getElementById("content-body").innerHTML = cardsHTML;
    });
}

// Workflow Loader
function showWorkflow(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      let workflowHTML = "<h3>Study Plan</h3><ul>";
      data.workflow.forEach(step => {
        workflowHTML += `<li>${step.step} — <em>${step.duration}</em></li>`;
      });
      workflowHTML += "</ul>";
      document.getElementById("content-body").innerHTML = workflowHTML;
    });
}

function navigateTo(sectionId) {
  document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });

}

function login() {
  const user = document.getElementById("username").value.trim();
  if (!user) return alert("Please enter a name!");
  localStorage.setItem("currentUser", user);

  alert("Logged in as " + user);
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("quiz-section").classList.remove("hidden");

  // Load quiz after login
  const quizFile = localStorage.getItem("quizFile");
  const subject = localStorage.getItem("selectedSubject");
  const chapter = localStorage.getItem("selectedChapter");

  document.getElementById("quiz-title").textContent = subject + " - " + chapter;
  startQuiz(quizFile);
}











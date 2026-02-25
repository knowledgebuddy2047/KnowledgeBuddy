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

function loadContent(item) {
  document.getElementById("content-title").textContent = item.name;
  document.getElementById("content-body").innerHTML = `
    <p>${item.description}</p>
    <button onclick="loadNotes('${item.file}')">View Notes</button>
    <button onclick="startQuiz('${item.quiz}')">Take Quiz</button>
    <button onclick="showFlashcards('${item.flashcards}')">View Flashcards</button>
    <button onclick="showWorkflow('${item.workflow}')">Study Plan</button>
  `;
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
      quizHTML += `<button type="button" onclick="submitQuiz('${file}')">Submit Quiz</button></form>`;
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
        const answer = selected ? selected.value : "No answer";
        const correct = q.answer;
        const isCorrect = answer === correct;

        if (isCorrect) score++;

        resultsHTML += `<li>
          Q${i+1}: ${q.question}<br>
          Your answer: ${answer} <br>
          Correct answer: ${correct} <br>
          ${isCorrect ? "✅ Correct" : "❌ Incorrect"}<br>
          <em>Explanation: ${q.explanation}</em>
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

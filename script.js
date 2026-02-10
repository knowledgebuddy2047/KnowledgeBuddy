// Load menu and placeholders dynamically from JSON
fetch('menu.json')
  .then(response => response.json())
  .then(data => {
    // Populate menu
    const menuContainer = document.getElementById('menu');
    data.menu.forEach(item => {
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.name;
      menuContainer.appendChild(link);
    });

    // Populate classes
    const classList = document.getElementById('class-list');
    data.classes.forEach(cls => {
      const div = document.createElement('div');
      div.className = 'placeholder';
      div.textContent = cls;
      classList.appendChild(div);
    });

    // Populate subjects
    const subjectList = document.getElementById('subject-list');
    data.subjects.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'placeholder';
      div.textContent = sub;
      subjectList.appendChild(div);
    });

    // Populate exams
    const examList = document.getElementById('exam-list');
    data.exams.forEach(exam => {
      const div = document.createElement('div');
      div.className = 'placeholder';
      div.textContent = exam;
      examList.appendChild(div);
    });
  })
  .catch(err => console.error("Error loading menu.json:", err));
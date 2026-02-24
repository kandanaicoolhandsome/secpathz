// ===== App State =====
let incidentIndex = 0;
let certIndex = 0;
let vocabIndex = 0;
let certType = 'isc2cc';
let totalScore = 0;
let incidentScore = 0;
let certScore = 0;
let vocabScore = 0;

// ===== Shuffled Data State =====
let shuffledVocab = [];
let shuffledIncidents = [];
let shuffledCert = [];

// ===== Helpers (Utility) =====
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleQuestionOptions(question) {
  const opts = [...question.options];
  const indices = opts.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const newOpts = indices.map(i => opts[i]);
  const newCorrect = indices.indexOf(question.correct);
  return { ...question, options: newOpts, correct: newCorrect };
}

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  initPageNavigation();
  initVocabulary();
  initIncidents();
  initCertification();
  initGamification();
  initNav();
});

// ===== Page / Tab Navigation =====
function initPageNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const moduleCards = document.querySelectorAll('.module-card');

  function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const page = document.getElementById(`page-${pageId}`);
    const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
    if (page) page.classList.add('active');
    if (tab) tab.classList.add('active');
    document.querySelector('.nav-links')?.classList.remove('show');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => goToPage(tab.dataset.page));
  });

  moduleCards.forEach(card => {
    card.addEventListener('click', () => goToPage(card.dataset.page));
  });

  document.getElementById('navBrand')?.addEventListener('click', (e) => {
    e.preventDefault();
    goToPage('home');
  });
}

// ===== Vocabulary (Quiz) =====
function initVocabulary() {
  shuffledVocab = shuffleArray(VOCAB_QUESTIONS).map(q => shuffleQuestionOptions(q));
  showVocabQuestion(0);
  document.getElementById('submitVocabAnswer').addEventListener('click', submitVocabAnswer);
  document.getElementById('nextVocabQuestion').addEventListener('click', nextVocabQuestion);
}

function getVocabQuestions() {
  return shuffledVocab;
}

function showVocabQuestion(index) {
  const questions = getVocabQuestions();
  vocabIndex = index;
  const q = questions[index];
  document.getElementById('vocabQuestion').innerHTML = `<strong>ข้อ ${index + 1}:</strong> ${q.q}`;
  const optionsEl = document.getElementById('vocabOptions');
  optionsEl.innerHTML = q.options.map((opt, i) =>
    `<div class="cert-option vocab-option" data-index="${i}">${opt}</div>`
  ).join('');
  const feedback = document.getElementById('vocabFeedback');
  feedback.className = 'quiz-feedback';
  feedback.textContent = '';
  feedback.classList.remove('show', 'correct', 'wrong');
  optionsEl.querySelectorAll('.vocab-option').forEach((el) => {
    el.classList.remove('selected', 'correct', 'wrong');
    el.addEventListener('click', () => {
      if (feedback.classList.contains('show')) return;
      optionsEl.querySelectorAll('.vocab-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      submitVocabAnswer();
    });
  });
}

function submitVocabAnswer() {
  const selected = document.querySelector('#vocabOptions .vocab-option.selected');
  const feedback = document.getElementById('vocabFeedback');
  if (!selected) {
    alert('กรุณาเลือกคำตอบก่อน');
    return;
  }
  const questions = getVocabQuestions();
  const q = questions[vocabIndex];
  const idx = parseInt(selected.getAttribute('data-index'), 10);
  const isCorrect = idx === q.correct;
  feedback.classList.add('show', isCorrect ? 'correct' : 'wrong');
  const exp = q.explanation ? `<br>${q.explanation}` : '';
  feedback.innerHTML = `<strong>${isCorrect ? '✓ ถูกต้อง!' : '✗ ยังไม่ตรง'}</strong>${exp}`;
  document.querySelectorAll('#vocabOptions .vocab-option').forEach((o, i) => {
    o.classList.remove('selected');
    if (i === q.correct) o.classList.add('correct');
    else if (i === idx && !isCorrect) o.classList.add('wrong');
  });
  if (isCorrect) vocabScore += 10;
}

function nextVocabQuestion() {
  const questions = getVocabQuestions();
  const next = (vocabIndex + 1) % questions.length;
  showVocabQuestion(next);
}


// ===== Incidents =====
function initIncidents() {
  shuffledIncidents = shuffleArray(INCIDENTS);
  showIncident(0);
  document.getElementById('btnEscalate').addEventListener('click', () => handleDecision('escalate'));
  document.getElementById('btnIgnore').addEventListener('click', () => handleDecision('ignore'));
  document.getElementById('nextIncident').addEventListener('click', nextIncident);
}

function showIncident(index) {
  incidentIndex = index;
  const inc = shuffledIncidents[index];
  const body = document.getElementById('incidentBody');
  const feedback = document.getElementById('incidentFeedback');
  body.innerHTML = `<p>${inc.scenario}</p>`;
  feedback.className = 'incident-feedback';
  feedback.textContent = '';
  feedback.classList.remove('show', 'correct', 'wrong');
  document.querySelector('.incident-id').textContent = inc.id;
  document.querySelector('.incident-time').textContent = `🕐 ${inc.time} น.`;
  document.getElementById('btnEscalate').disabled = false;
  document.getElementById('btnIgnore').disabled = false;
}

function handleDecision(choice) {
  const inc = shuffledIncidents[incidentIndex];
  const feedback = document.getElementById('incidentFeedback');
  const isCorrect = choice === inc.correct;
  feedback.classList.add('show', isCorrect ? 'correct' : 'wrong');
  feedback.innerHTML = `<strong>${isCorrect ? '✓ ถูกต้อง!' : '✗ ยังไม่ตรง'}</strong><br>${inc.explanation}`;
  if (isCorrect) incidentScore += 10;
  document.getElementById('btnEscalate').disabled = true;
  document.getElementById('btnIgnore').disabled = true;
}

function nextIncident() {
  const next = (incidentIndex + 1) % shuffledIncidents.length;
  showIncident(next);
}

// ===== Certification =====
function initCertification() {
  document.querySelectorAll('.cert-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cert-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      certType = btn.dataset.certType;
      prepareCertQuestions();
      showQuestion(0);
    });
  });
  prepareCertQuestions();
  showQuestion(0);
  document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
  document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
}

function prepareCertQuestions() {
  const raw = certType === 'securityplus' ? CERT_QUESTIONS_SECURITY_PLUS : CERT_QUESTIONS_ISC2_CC;
  shuffledCert = shuffleArray(raw).map(q => shuffleQuestionOptions(q));
}

function getCertQuestions() {
  return shuffledCert;
}

function showQuestion(index) {
  const questions = getCertQuestions();
  certIndex = index;
  const q = questions[index];
  document.getElementById('certQuestion').innerHTML = `<strong>ข้อ ${index + 1}:</strong> ${q.q}`;
  const optionsEl = document.getElementById('certOptions');
  optionsEl.innerHTML = q.options.map((opt, i) =>
    `<div class="cert-option" data-index="${i}">${opt}</div>`
  ).join('');
  const feedback = document.getElementById('certFeedback');
  feedback.className = 'quiz-feedback';
  feedback.textContent = '';
  feedback.classList.remove('show', 'correct', 'wrong');
  optionsEl.querySelectorAll('.cert-option').forEach((el) => {
    el.classList.remove('selected', 'correct', 'wrong');
    el.addEventListener('click', () => {
      if (feedback.classList.contains('show')) return;
      optionsEl.querySelectorAll('.cert-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      submitAnswer();
    });
  });
}

function submitAnswer() {
  const selected = document.querySelector('#certOptions .cert-option.selected');
  const feedback = document.getElementById('certFeedback');
  if (!selected) {
    alert('กรุณาเลือกคำตอบก่อน');
    return;
  }
  const questions = getCertQuestions();
  const q = questions[certIndex];
  const idx = parseInt(selected.getAttribute('data-index'), 10);
  const isCorrect = idx === q.correct;
  feedback.classList.add('show', isCorrect ? 'correct' : 'wrong');
  const exp = q.explanation ? `<br>${q.explanation}` : '';
  feedback.innerHTML = `<strong>${isCorrect ? '✓ ถูกต้อง!' : '✗ ยังไม่ตรง'}</strong>${exp}`;
  document.querySelectorAll('#certOptions .cert-option').forEach((o, i) => {
    o.classList.remove('selected');
    if (i === q.correct) o.classList.add('correct');
    else if (i === idx && !isCorrect) o.classList.add('wrong');
  });
  if (isCorrect) certScore += 10;
}

function nextQuestion() {
  const questions = getCertQuestions();
  const next = (certIndex + 1) % questions.length;
  showQuestion(next);
}

// ===== Gamification =====
function initGamification() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Leaderboard — โหลดจาก Firebase อัตโนมัติ
  loadLeaderboard();
}

function loadLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '<div class="leaderboard-item">⏳ กำลังโหลด...</div>';

  // ตรวจว่า Firebase พร้อมหรือไม่
  if (typeof firebase === 'undefined' || !firebase.database) {
    list.innerHTML = '<div class="leaderboard-item">⚠️ Firebase ยังไม่ได้ตั้งค่า — จะเห็น Leaderboard เมื่อตั้งค่าแล้ว</div>';
    return;
  }

  const db = firebase.database();
  console.log('Leaderboard: Subscribing to updates...');

  db.ref('leaderboard').on('value', (snapshot) => {
    const raw = snapshot.val();
    console.log('Leaderboard snapshot received:', raw);

    if (!raw) {
      list.innerHTML = '<div class="leaderboard-item">ยังไม่มีข้อมูล — เล่น Battle Mode และชนะเพื่อขึ้น Leaderboard!</div>';
      return;
    }

    // แปลง object เป็น array และกรองตัวที่ไม่มีชื่อออก
    const entries = Object.values(raw)
      .filter(item => item && item.name)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);

    if (entries.length === 0) {
      list.innerHTML = '<div class="leaderboard-item">ยังไม่มีนักรบไซเบอร์ในทำเนียบ...</div>';
      return;
    }

    list.innerHTML = entries.map((item, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      const name = item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name;
      return `
        <div class="leaderboard-item">
          <span><span class="rank">${medal}</span> <strong>${name}</strong></span>
          <span class="lb-score">
            <span class="lb-pts">${item.points || 0} pts</span> 
            <span class="lb-wins">(${item.wins || 0} wins)</span>
          </span>
        </div>`;
    }).join('');
  }, (error) => {
    console.error('Leaderboard error:', error);
    list.innerHTML = `<div class="leaderboard-item">⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
  });
}

// saveScore ถูกแทนที่ด้วย saveMatchResult() ใน battle.js (อัตโนมัติเมื่อชนะ)
function saveScore() { /* ไม่ใช้แล้ว */ }

// ===== Nav =====
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle) {
    toggle.addEventListener('click', () => links.classList.toggle('show'));
  }
}

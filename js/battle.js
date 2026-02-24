/**
 * Battle Mode - Real-time Multiplayer Quiz
 * ใช้ Firebase Realtime Database สำหรับ sync ระหว่างผู้เล่น
 */

// ===== Constants =====
const BATTLE_CONFIG = {
  QUESTION_TIME: 15,
  MAX_HEALTH: 100,
  CORRECT_BASE_DAMAGE: 15,  // สูงสุดเมื่อตอบถูกทันที (จะไม่เกิน 15)
  CORRECT_MIN_DAMAGE: 5,
  WRONG_MAX_DAMAGE: 30,    // บทลงโทษสูงสุดสำหรับฝ่ายที่ตอบผิดเร็ว (ภายใน 3 วิ)
  WRONG_MIN_DAMAGE: 10,    // บทลงโทษขั้นต่ำสำหรับฝ่ายที่ตอบผิดช้า
  QUICK_ANSWER_THRESHOLD: 3000, // 3 วินาที (ms)
  QUESTIONS_PER_GAME: 20,
  WIN_BASE_POINTS: 30,
  WIN_HP_BONUS: 0.5
};

// ===== State =====
let battleState = {
  role: null,
  roomCode: null,
  roomRef: null,
  topic: 'isc2cc',
  playerName: '',
  timerInterval: null,
  hasAnswered: false,
  sessionId: null,
  nextQuestionTimeout: null
};

// ===== Helpers =====
function getQuestionsByTopic(topic) {
  const all = {
    isc2cc: [...CERT_QUESTIONS_ISC2_CC],
    securityplus: [...CERT_QUESTIONS_SECURITY_PLUS],
    vocabulary: [...VOCAB_QUESTIONS],
    incidents: INCIDENTS.map(inc => ({
      q: inc.scenario,
      options: ['เปิดเคส (Escalate)', 'เพิกเฉย (Ignore)'],
      correct: inc.correct === 'escalate' ? 0 : 1
    }))
  };
  const q = all[topic] || all.isc2cc || [];
  if (q.length === 0) return [];
  const shuffled = shuffleArray(q).slice(0, BATTLE_CONFIG.QUESTIONS_PER_GAME);
  return shuffled.map(qn => shuffleQuestionOptions(qn));
}

function shuffleQuestionOptions(question) {
  const opts = toArray(question.options);
  const indices = opts.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const newOpts = indices.map(i => opts[i]);
  const newCorrect = indices.indexOf(question.correct);
  return { q: question.q, options: newOpts, correct: newCorrect };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTopicLabel(topic) {
  const labels = { isc2cc: 'ISC2 CC', securityplus: 'Security+', vocabulary: 'Terminology', incidents: 'Incident Scenarios' };
  return labels[topic] || topic;
}

// Firebase เก็บ array เป็น object {0: {...}, 1: {...}} — ต้องแปลงเป็น array จริง
function toArray(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.keys(obj).sort((a, b) => Number(a) - Number(b)).map(k => obj[k]);
}

function getDb() {
  if (typeof firebase !== 'undefined' && firebase.database) return firebase.database();
  return null;
}

// ===== Damage Calculation =====
function calcCorrectDamage(replyTimeMs) {
  const total = BATTLE_CONFIG.QUESTION_TIME * 1000;
  const ratio = Math.max(0, 1 - replyTimeMs / total);
  const damage = BATTLE_CONFIG.CORRECT_MIN_DAMAGE +
    (BATTLE_CONFIG.CORRECT_BASE_DAMAGE - BATTLE_CONFIG.CORRECT_MIN_DAMAGE) * ratio;
  return Math.min(Math.round(damage), BATTLE_CONFIG.CORRECT_BASE_DAMAGE);
}

function calcWrongDamage(replyTimeMs, topic = '') {
  // กฎพิเศษสำหรับ Incident Scenarios: ตอบผิดเร็ว (< 3 วินาที) โดน -50 HP
  if (topic === 'incidents' && replyTimeMs <= BATTLE_CONFIG.QUICK_ANSWER_THRESHOLD) {
    return 50;
  }

  // ภายใน 3 วิ โดน 30 เต็มๆ (สำหรับหมวดอื่น)
  if (replyTimeMs <= BATTLE_CONFIG.QUICK_ANSWER_THRESHOLD) return BATTLE_CONFIG.WRONG_MAX_DAMAGE;

  // พ้น 3 วิไปแล้ว ให้สเกลจาก 30 ลงไปหา 10 ตามเวลาที่เหลือ
  const totalTime = BATTLE_CONFIG.QUESTION_TIME * 1000;
  const remainingTime = Math.max(0, totalTime - replyTimeMs);
  const scalingTimePool = totalTime - BATTLE_CONFIG.QUICK_ANSWER_THRESHOLD;
  const currentInPool = Math.max(0, replyTimeMs - BATTLE_CONFIG.QUICK_ANSWER_THRESHOLD);

  const ratio = 1 - (currentInPool / scalingTimePool);
  const damage = BATTLE_CONFIG.WRONG_MIN_DAMAGE + (BATTLE_CONFIG.WRONG_MAX_DAMAGE - BATTLE_CONFIG.WRONG_MIN_DAMAGE) * ratio;

  return Math.min(Math.round(damage), BATTLE_CONFIG.WRONG_MAX_DAMAGE);
}

// ===== UI =====
function showScreen(id) {
  ['battleLobby', 'battleWaiting', 'battleArena', 'battleGameOver'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? 'block' : 'none';
  });
}

function setBattleStatus(msg, isError = false) {
  const el = document.getElementById('battleStatus');
  if (el) {
    el.innerHTML = `<p class="${isError ? 'error' : ''}">${msg}</p>`;
  }
}

// ===== Create Room =====
async function createRoom() {
  const db = getDb();
  // แก้จาก document.getElementById('playerName') เป็น:
  const name = document.getElementById('battlePlayerNameInput')?.value?.trim();
  if (!name) {
    setBattleStatus('กรุณาใส่ชื่อก่อนสร้างห้อง', true);
    return;
  }
  if (!db) {
    setBattleStatus('Firebase ยังไม่ได้ตั้งค่า — ดูคำแนะนำใน js/firebase-config.js', true);
    return;
  }
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const topic = document.querySelector('.topic-btn.active')?.dataset?.topic || 'isc2cc';
  const questions = getQuestionsByTopic(topic);
  const sessionId = Date.now();
  const roomData = {
    topic,
    hostName: name,
    guestName: null,
    hostReady: false,
    guestReady: false,
    status: 'waiting',
    hostHealth: BATTLE_CONFIG.MAX_HEALTH,
    guestHealth: BATTLE_CONFIG.MAX_HEALTH,
    currentQuestion: 0,
    questionStartTime: null,
    hostAnswer: null,
    guestAnswer: null,
    questions: questions.map(q => ({ q: q.q, options: q.options, correct: q.correct })),
    winner: null,
    createdAt: Date.now(),
    sessionId
  };
  try {
    cleanupBattle();
    await db.ref(`rooms/${code}`).set(roomData);
    battleState = { role: 'host', roomCode: code, roomRef: db.ref(`rooms/${code}`), topic, playerName: name, timerInterval: null, hasAnswered: false, sessionId: sessionId };

    // บันทึกลง localStorage เพื่อกันหลุด
    saveGameToLocal(code, 'host', name, topic);

    document.getElementById('roomCode').textContent = code;
    listenToRoom();
    showWaitingScreen(roomData);
  } catch (e) {
    setBattleStatus('เกิดข้อผิดพลาด: ' + e.message, true);
  }
}

function saveGameToLocal(code, role, name, topic) {
  localStorage.setItem('secpathz_battle_room', JSON.stringify({ code, role, name, topic, timestamp: Date.now() }));
}

function clearGameLocal() {
  localStorage.removeItem('secpathz_battle_room');
}

function cleanupBattle() {
  if (battleState.roomRef) {
    battleState.roomRef.off('value');
    battleState.roomRef = null;
  }
  if (battleState.timerInterval) {
    clearInterval(battleState.timerInterval);
    battleState.timerInterval = null;
  }
  battleState.hasAnswered = false;
}

// ===== Join Room =====
async function joinRoom() {
  const db = getDb();
  // แก้จาก document.getElementById('playerName') เป็น:
  const name = document.getElementById('battlePlayerNameInput')?.value?.trim();
  const code = document.getElementById('joinRoomCode')?.value?.trim().toUpperCase();
  if (!name || !code) {
    setBattleStatus('กรุณาใส่ชื่อและ Room Code', true);
    return;
  }
  if (!db) {
    setBattleStatus('Firebase ยังไม่ได้ตั้งค่า', true);
    return;
  }
  const roomRef = db.ref(`rooms/${code}`);
  const snap = await roomRef.once('value');
  const room = snap.val();
  if (!room) {
    setBattleStatus('ไม่พบห้องนี้', true);
    return;
  }
  if (room.guestName) {
    setBattleStatus('ห้องเต็มแล้ว', true);
    return;
  }
  try {
    cleanupBattle();
    await roomRef.update({ guestName: name, status: 'waiting' });
    battleState = { role: 'guest', roomCode: code, roomRef, topic: room.topic, playerName: name, timerInterval: null, hasAnswered: false, sessionId: room.sessionId || room.createdAt };

    saveGameToLocal(code, 'guest', name, room.topic);

    listenToRoom();
    showWaitingScreen({ ...room, guestName: name });
  } catch (e) {
    setBattleStatus('เกิดข้อผิดพลาด: ' + e.message, true);
  }
}

// ===== Listen to Room =====
function listenToRoom() {
  const { roomRef, role } = battleState;
  if (!roomRef) return;
  roomRef.on('value', snapshot => {
    const room = snapshot.val();
    if (!room) return;
    handleRoomUpdate(room);
  });
}

function handleRoomUpdate(room) {
  const { role, roomCode } = battleState;
  if (!roomCode) return;
  if (room.sessionId && battleState.sessionId && room.sessionId !== battleState.sessionId) {
    // ถ้าเป็นแมตช์ใหม่ (Rematch) ให้ยอมรับ sessionId ใหม่
    if (room.status === 'playing' || room.status === 'waiting') {
      battleState.sessionId = room.sessionId;
    } else {
      return;
    }
  }
  if (room.status === 'ended') {
    showGameOver(room);
    // ตรวจสอบเงื่อนไขเริ่ม Rematch (ต้องขอทั้งคู่และได้รับการตอบรับ)
    if (room.rematchHostRequested && room.rematchGuestRequested && role === 'host') {
      performActualRematch(room);
    }
    return;
  }
  if (room.status === 'playing') {
    showBattleScreen(room);
    return;
  }
  if (room.status === 'ready' || room.guestName) {
    showWaitingScreen(room);
    return;
  }
  if (role === 'host') {
    showWaitingScreen({ ...room, guestName: null });
  }
}

function showWaitingScreen(room) {
  showScreen('battleWaiting');
  document.getElementById('waitingRoomCode').textContent = battleState.roomCode;
  document.getElementById('waitingTopic').textContent = getTopicLabel(room.topic);
  const players = [room.hostName, room.guestName || 'รอผู้เล่น...'].join(' vs ');
  document.getElementById('waitingPlayers').textContent = players;
  let statusText = (room.hostReady && room.guestReady) ? '✓ ทั้งคู่พร้อม — Host กดเริ่มเกมได้' : 'รออีกฝ่ายกดพร้อม';

  // แจ้งเตือนถ้าอีกฝ่ายพร้อมแล้วแต่เรายังไม่พร้อม
  const myRole = battleState.role;
  const opRole = myRole === 'host' ? 'guest' : 'host';
  if (room[`${opRole}Ready`] && !room[`${myRole}Ready`]) {
    statusText = `⚠️ โปรดกด Ready ด้วย อีกฝ่ายพร้อมแล้ว!`;
  }

  document.getElementById('waitingStatus').textContent = statusText;
  const readyBtn = document.getElementById('btnReady');
  const startBtn = document.getElementById('btnStartGame');
  if (room[`${battleState.role}Ready`]) {
    readyBtn.textContent = 'ยกเลิกพร้อม';
    readyBtn.classList.add('active');
  } else {
    readyBtn.textContent = 'พร้อม';
    readyBtn.classList.remove('active');
  }
  startBtn.style.display = (battleState.role === 'host' && room.hostReady && room.guestReady) ? 'inline-block' : 'none';
  document.getElementById('totalQuestions').textContent = BATTLE_CONFIG.QUESTIONS_PER_GAME;
}

function showBattleScreen(room) {
  showScreen('battleArena');
  document.getElementById('arenaTopic').textContent = getTopicLabel(room.topic);
  document.getElementById('hostDisplayName').textContent = room.hostName || 'Host';
  document.getElementById('guestDisplayName').textContent = room.guestName || 'Guest';
  updateHealthBars(room.hostHealth, room.guestHealth);

  // Ensure total questions count is always correct
  const totalQ = room.questions ? toArray(room.questions).length : BATTLE_CONFIG.QUESTIONS_PER_GAME;
  const totalEl = document.getElementById('totalQuestions');
  if (totalEl) totalEl.textContent = totalQ;
  if (room.roundResolved) {
    document.getElementById('arenaQuestion').textContent = '⏳ กำลังโหลดข้อถัดไป...';
    document.getElementById('arenaOptions').innerHTML = '';
    document.getElementById('arenaTimer').textContent = '';
    document.getElementById('arenaResult').style.display = 'none';
    return;
  }
  const qIndex = room.currentQuestion || 0;
  const questions = toArray(room.questions);
  if (qIndex < questions.length) {
    battleState.hasAnswered = false;
    const q = questions[qIndex];
    const opts = toArray(q.options);
    document.getElementById('questionNum').textContent = qIndex + 1;
    document.getElementById('arenaQuestion').textContent = q.q;
    document.getElementById('arenaResult').style.display = 'none';
    renderOptions(opts, qIndex);
    if (room.questionStartTime) {
      startTimer(room.questionStartTime, qIndex);
    } else {
      document.getElementById('arenaTimer').textContent = BATTLE_CONFIG.QUESTION_TIME;
    }
  } else if (room.winner || room.status === 'ended') {
    showGameOver(room);
  }
}

function updateHealthBars(hostHp, guestHp) {
  const h = Math.max(0, hostHp);
  const g = Math.max(0, guestHp);
  document.getElementById('hostHealth').textContent = h;
  document.getElementById('hostHealthBar').style.width = h + '%';
  document.getElementById('guestHealth').textContent = g;
  document.getElementById('guestHealthBar').style.width = g + '%';
}

// ป้องกัน ghost click บน mobile — เก็บเวลาที่ render options ล่าสุด
let _optionsRenderTime = 0;

function renderOptions(options, qIndex) {
  const opts = toArray(options);
  const el = document.getElementById('arenaOptions');
  el.innerHTML = opts.map((opt, i) =>
    `<button class="arena-option" type="button" data-index="${i}" data-q="${qIndex}">${opt}</button>`
  ).join('');
  _optionsRenderTime = Date.now();

  let _handling = false; // ป้องกันการเบิ้ล

  const onAnswer = (idx, qIdx) => {
    if (_handling) return;
    // ลดเวลา block ลงเหลือ 200ms เพื่อให้กดได้ไวขึ้นแต่ยังกัน ghost click ได้
    if (Date.now() - _optionsRenderTime < 200) return;
    _handling = true;
    submitBattleAnswer(idx, qIdx);
  };

  el.querySelectorAll('.arena-option').forEach(btn => {
    // ใช้ pointerdown เพื่อความไว และกัน ghost click ด้วย _handling
    btn.onpointerdown = (e) => {
      onAnswer(parseInt(btn.dataset.index), parseInt(btn.dataset.q));
    };
  });
}

function startTimer(startTime, qIndex) {
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);
  const elapsed = (Date.now() - startTime) / 1000;
  let remaining = Math.max(0, BATTLE_CONFIG.QUESTION_TIME - elapsed);
  const timerEl = document.getElementById('arenaTimer');
  const update = () => {
    remaining -= 0.1;
    timerEl.textContent = Math.ceil(remaining);
    if (remaining <= 0) {
      clearInterval(battleState.timerInterval);
      battleState.timerInterval = null;
      if (!battleState.hasAnswered) {
        // ต้องส่ง qIndex จริงๆ ไป เพื่อให้ transaction ใน Firebase ยอมรับ
        submitBattleAnswer(-1, qIndex);
      }
    }
  };
  timerEl.textContent = Math.ceil(remaining);
  battleState.timerInterval = setInterval(update, 100);
}

async function submitBattleAnswer(answerIndex, qIndex) {
  if (battleState.hasAnswered) return;
  const { roomRef, role } = battleState;
  if (!roomRef) return;
  battleState.hasAnswered = true;
  if (battleState.timerInterval) {
    clearInterval(battleState.timerInterval);
    battleState.timerInterval = null;
  }
  const replyTime = Date.now();
  const key = role === 'host' ? 'hostAnswer' : 'guestAnswer';
  document.querySelectorAll('.arena-option').forEach(btn => { btn.disabled = true; });

  // ใช้ transaction เพื่อป้องกัน race condition:
  const txResult = await roomRef.transaction((currentRoom) => {
    if (!currentRoom) return currentRoom;
    // ตรวจสอบความถูกต้องของข้อ: ป้องกันการตอบข้อเก่าทับข้อใหม่
    if (currentRoom.currentQuestion !== qIndex) return; // ignore if mismatch
    if (currentRoom.roundResolved) return; // abort (return undefined)

    currentRoom[key] = { index: answerIndex, time: replyTime };
    currentRoom.roundResolved = true;
    return currentRoom;
  });

  // committed = true หมายความว่า transaction ของเราชนะ (คนแรกที่ตอบ)
  if (txResult.committed) {
    const room = txResult.snapshot.val();
    if (room) await resolveRound(room);
  }
}

async function resolveRound(room) {
  const { roomRef } = battleState;
  if (!roomRef) return;
  const questions = toArray(room.questions);
  const qIndex = room.currentQuestion || 0;
  const q = questions[qIndex];
  if (!q) return;

  // ตรวจสอบว่าเป็นการยอมแพ้หรือไม่ (Surrender)
  if (room.surrenderedBy) {
    const isHostSurrender = room.surrenderedBy === 'host';
    const updates = {
      hostHealth: isHostSurrender ? 0 : room.hostHealth,
      guestHealth: isHostSurrender ? room.guestHealth : 0,
      status: 'ended',
      winner: isHostSurrender ? 'guest' : 'host',
      roundResolved: true
    };
    await roomRef.update(updates);
    return;
  }

  const startTime = room.questionStartTime || Date.now();
  let hostHp = room.hostHealth || 0;
  let guestHp = room.guestHealth || 0;

  // ใครเป็นคนกดตอบ (คนแรกที่ผ่าน transaction)
  const hostAns = room.hostAnswer;
  const guestAns = room.guestAnswer;

  if (hostAns) {
    const isCorrect = hostAns.index === q.correct && hostAns.index >= 0;
    const isTimeout = hostAns.index === -1;

    if (isCorrect) {
      const dmg = calcCorrectDamage(hostAns.time - startTime);
      guestHp = Math.max(0, guestHp - dmg);
    } else if (isTimeout) {
      // เวลาหมดทั้งคู่ (เพราะใครคนนึงส่ง -1 มาก่อน)
      hostHp = Math.max(0, hostHp - 60);
      guestHp = Math.max(0, guestHp - 60);
    } else {
      const dmg = calcWrongDamage(hostAns.time - startTime, room.topic);
      hostHp = Math.max(0, hostHp - dmg);
    }
  } else if (guestAns) {
    const isCorrect = guestAns.index === q.correct && guestAns.index >= 0;
    const isTimeout = guestAns.index === -1;

    if (isCorrect) {
      const dmg = calcCorrectDamage(guestAns.time - startTime);
      hostHp = Math.max(0, hostHp - dmg);
    } else if (isTimeout) {
      // เวลาหมดทั้งคู่
      hostHp = Math.max(0, hostHp - 60);
      guestHp = Math.max(0, guestHp - 60);
    } else {
      const dmg = calcWrongDamage(guestAns.time - startTime, room.topic);
      guestHp = Math.max(0, guestHp - dmg);
    }
  }

  // Force actual 0 if negative, though Math.max already handles it
  hostHp = Math.floor(hostHp);
  guestHp = Math.floor(guestHp);

  let winner = null;
  // เช็คเงื่อนไขตายทันที
  if (hostHp <= 0 && guestHp <= 0) winner = 'draw';
  else if (hostHp <= 0) winner = 'guest';
  else if (guestHp <= 0) winner = 'host';
  const nextQ = qIndex + 1;
  const isGameOver = winner || nextQ >= questions.length;
  const finalWinner = winner || (nextQ >= questions.length ? (hostHp > guestHp ? 'host' : hostHp < guestHp ? 'guest' : 'draw') : null);
  const updates = {
    roundResolved: true,
    hostHealth: hostHp,
    guestHealth: guestHp,
    hostAnswer: null,
    guestAnswer: null,
    currentQuestion: nextQ,
    questionStartTime: null,
    status: isGameOver ? 'ended' : 'playing',
    winner: finalWinner
  };
  await roomRef.update(updates);
  if (!isGameOver) {
    if (battleState.nextQuestionTimeout) clearTimeout(battleState.nextQuestionTimeout);
    battleState.nextQuestionTimeout = setTimeout(async () => {
      await roomRef.update({ questionStartTime: Date.now(), roundResolved: null });
    }, 1000); // ลดเหลือ 1 วินาทีกดดันๆ
  }
}

function showRoundResult(room) {
  const resultEl = document.getElementById('arenaResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = 'กำลังประมวลผล...';
  document.getElementById('arenaOptions').innerHTML = '';
  document.getElementById('btnNextQuestion').style.display = 'none';
}

function showGameOver(room) {
  showScreen('battleGameOver');
  const title = document.getElementById('gameOverTitle');
  const msg = document.getElementById('gameOverMessage');
  const winner = room.winner;
  const myName = battleState.playerName;
  const opponentName = battleState.role === 'host' ? room.guestName : room.hostName;

  title.classList.remove('win', 'lose');

  if (winner === 'draw') {
    title.textContent = '🤝 เสมอ!';
    msg.innerHTML = `<span style="opacity:.8">คุณและ <strong>${opponentName}</strong> เสมอกัน — พลังชีวิตเท่ากัน</span>`;
  } else {
    const isYou = (winner === 'host' && battleState.role === 'host') || (winner === 'guest' && battleState.role === 'guest');
    if (isYou) {
      const myHp = battleState.role === 'host' ? room.hostHealth : room.guestHealth;
      title.textContent = '🎉 คุณชนะ!';
      title.classList.add('win');
      msg.innerHTML = `<strong>${myName}</strong> เอาชนะ <strong>${opponentName}</strong> ได้!<br><span style="opacity:.7">HP เหลือ ${Math.max(0, myHp)} — เยี่ยมมาก!</span>`;
      saveMatchResult(myName, myHp);
    } else {
      const winnerName = winner === 'host' ? room.hostName : room.guestName;
      title.textContent = '💀 คุณแพ้!';
      title.classList.add('lose');
      msg.innerHTML = `<strong>${winnerName}</strong> ชนะในครั้งนี้<br><span style="opacity:.7">สู้ต่อไป ${myName}!</span>`;
    }
  }

  // แสดงปุ่ม Rematch และสถานะ
  const rematchBtn = document.getElementById('btnRematch');
  const myReq = battleState.role === 'host' ? room.rematchHostRequested : room.rematchGuestRequested;
  const opReq = battleState.role === 'host' ? room.rematchGuestRequested : room.rematchHostRequested;

  if (rematchBtn) {
    // ถ้ามีการปฏิเสธแล้ว
    if (room.rematchDeclined) {
      rematchBtn.style.display = 'none';
      // ถ้าเราเป็นคนท้า แต่โดนปฏิเสธ ให้ขึ้นข้อความเยาะเย้ย
      if (myReq) {
        msg.innerHTML += `<div style="margin-top:15px; padding:10px; background:rgba(255,94,94,0.1); border-radius:10px; color:var(--danger); font-weight:bold; border:1px solid var(--danger);">เสียดายจังเต่าน้อย แต่นายน่ะไม่ได้รับโอกาส 💀</div>`;
      }
      return;
    }

    rematchBtn.style.display = 'inline-block';
    if (myReq) {
      rematchBtn.disabled = true;
      rematchBtn.textContent = opReq ? 'กำลังเริ่ม...' : 'รออีกฝ่าย...';
    } else {
      rematchBtn.disabled = false;
      rematchBtn.textContent = 'เล่นอีกครั้ง';
      // ถ้าอีกฝ่ายขอ rematch ก่อน เราจะขึ้นแจ้งเตือนให้เราเลือกว่าจะสู้ไหม
      if (opReq) {
        msg.innerHTML += `
          <div style="margin-top:15px; padding:15px; background:rgba(0,242,195,0.05); border-radius:12px; border:1px solid var(--accent); animation: pulse 2s infinite;">
            <div style="color:var(--accent); font-weight:bold; margin-bottom:10px;">🔥 อีกฝั่งต้องการจะแก้มือ ให้โอกาสเต่าน้อยผู้น่าสงสารไหม ?</div>
            <div style="display:flex; gap:10px; justify-content:center;">
              <button class="btn btn-primary btn-sm" onclick="requestRematch()" style="background:var(--accent); color:var(--bg-primary); padding:5px 15px;">โอเค!</button>
              <button class="btn btn-danger btn-sm" onclick="declineRematch()" style="padding:5px 15px;">ไม่ล่ะไออ่อน</button>
            </div>
          </div>`;
        rematchBtn.style.display = 'none';
      }
    }
  }
}

// ===== Rematch Consent Logic =====
async function requestRematch() {
  const { roomRef, role } = battleState;
  if (!roomRef) return;
  const key = role === 'host' ? 'rematchHostRequested' : 'rematchGuestRequested';
  try {
    // เมื่อกดตกลง ให้เคลียร์ค่า declined ด้วยเผื่อมีการกดผิดมาก่อน
    await roomRef.update({ [key]: true, rematchDeclined: null });
  } catch (e) {
    alert('ไม่สามารถส่งคำขอได้: ' + e.message);
  }
}

async function declineRematch() {
  const { roomRef } = battleState;
  if (!roomRef) return;
  try {
    await roomRef.update({ rematchDeclined: true });
  } catch (e) {
    console.error('Decline rematch failed:', e);
  }
}

async function performActualRematch(room) {
  const { roomRef, topic } = battleState;
  if (!roomRef) return;
  if (battleState.nextQuestionTimeout) clearTimeout(battleState.nextQuestionTimeout);

  // รีเซ็ตสถานะหน้าเครื่องตัวเองด้วย
  battleState.hasAnswered = false;
  if (battleState.timerInterval) clearInterval(battleState.timerInterval);
  battleState.timerInterval = null;

  try {
    const questions = getQuestionsByTopic(topic);
    await roomRef.set({
      topic,
      hostName: room.hostName,
      guestName: room.guestName,
      hostReady: true,
      guestReady: true,
      rematchHostRequested: null,
      rematchGuestRequested: null,
      status: 'playing',
      currentQuestion: 0,
      hostHealth: BATTLE_CONFIG.MAX_HEALTH,
      guestHealth: BATTLE_CONFIG.MAX_HEALTH,
      hostAnswer: null,
      guestAnswer: null,
      roundResolved: null,
      winner: null,
      questionStartTime: Date.now(),
      questions: questions,
      sessionId: Date.now()
    });
  } catch (e) {
    console.error('Actual Rematch failed:', e);
  }
}

// ===== บันทึกคะแนนลง Firebase Leaderboard =====
async function saveMatchResult(playerName, remainingHp) {
  const db = getDb();
  if (!db || !playerName) return;
  const pts = BATTLE_CONFIG.WIN_BASE_POINTS + Math.round(Math.max(0, remainingHp) * BATTLE_CONFIG.WIN_HP_BONUS);
  try {
    const ref = db.ref(`leaderboard/${playerName.replace(/[.#$/\[\]]/g, '_')}`);
    await ref.transaction((current) => {
      // ตรวจสอบว่ามีข้อมูลเดิมไหม ถ้าไม่มีให้สร้างใหม่
      const data = current || { name: playerName, wins: 0, points: 0 };
      return {
        name: playerName,
        wins: (data.wins || 0) + 1,
        points: (data.points || 0) + pts,
        updatedAt: Date.now()
      };
    });
    console.log(`Saved matched result for ${playerName}: +${pts} pts`);
  } catch (e) {
    console.error('saveMatchResult failed:', e);
  }
}

function backToLobby() {
  if (battleState.nextQuestionTimeout) clearTimeout(battleState.nextQuestionTimeout);
  const db = getDb();
  if (db && battleState.roomCode) {
    const { roomCode, role } = battleState;
    if (role === 'host') {
      db.ref(`rooms/${roomCode}`).remove().catch(() => { });
    } else {
      db.ref(`rooms/${roomCode}`).update({ guestName: null, guestReady: false, status: 'waiting' }).catch(() => { });
    }
  }
  clearGameLocal();
  cleanupBattle();
  battleState = { role: null, roomCode: null, roomRef: null, topic: 'isc2cc', playerName: battleState.playerName || '', timerInterval: null, hasAnswered: false, sessionId: null, nextQuestionTimeout: null };
  showScreen('battleLobby');
  setBattleStatus('');
  document.getElementById('roomCode').textContent = '------';
  document.getElementById('joinRoomCode').value = '';
}

// ===== Surrender =====
async function surrender() {
  const { roomRef, role } = battleState;
  if (!roomRef) return;
  if (!confirm('คุณแน่ใจหรือไม่ว่าจะยอมแพ้?')) return;

  try {
    await roomRef.update({
      surrenderedBy: role,
      status: 'ended'
    });
    // การ resolve จะไปเกิดขึ้นใน handleRoomUpdate -> resolveRound ถ้ามี surrenderedBy
    // แต่เพื่อความเร็ว เราสั่ง resolveRound ตรงๆ ด้วย data ปัจจุบัน
    const snap = await roomRef.once('value');
    const room = snap.val();
    if (room) await resolveRound(room);
  } catch (e) {
    console.error('Surrender failed:', e);
  }
}

// ===== Rejoin Logic =====
function checkRejoin() {
  const saved = localStorage.getItem('secpathz_battle_room');
  if (!saved) return;
  const { code, role, name, topic, timestamp } = JSON.parse(saved);
  // ถ้าเกิน 1 ชม. ไม่ต้องถาม (กันเก่าค้าง)
  if (Date.now() - timestamp > 3600000) {
    clearGameLocal();
    return;
  }

  const db = getDb();
  if (!db) return;
  db.ref(`rooms/${code}`).once('value', snapshot => {
    const room = snapshot.val();
    if (room && (room.status === 'playing' || room.status === 'waiting' || room.status === 'ready')) {
      const banner = document.getElementById('rejoinBanner');
      if (banner) banner.style.display = 'block';

      document.getElementById('btnRejoin').onclick = () => {
        battleState = { role, roomCode: code, roomRef: db.ref(`rooms/${code}`), topic, playerName: name, timerInterval: null, hasAnswered: false, sessionId: room.sessionId || room.createdAt };
        listenToRoom();
        banner.style.display = 'none';
        // เด้งไปหน้า gamification ก่อน
        const gameTab = document.querySelector('.nav-tab[data-page="gamification"]');
        if (gameTab) gameTab.click();
      };
      document.getElementById('btnDismissRejoin').onclick = () => {
        banner.style.display = 'none';
        clearGameLocal();
      };
    } else {
      clearGameLocal();
    }
  });
}

// ===== Ready / Start =====
async function toggleReady() {
  const { roomRef, role } = battleState;
  if (!roomRef) return;
  const snap = await roomRef.once('value');
  const room = snap.val();
  const key = role === 'host' ? 'hostReady' : 'guestReady';
  const newVal = !room[key];
  const hostReadyNow = role === 'host' ? newVal : room.hostReady;
  const guestReadyNow = role === 'guest' ? newVal : room.guestReady;
  const isBothReady = hostReadyNow && guestReadyNow;
  await roomRef.update({
    [key]: newVal,
    status: isBothReady ? 'ready' : 'waiting'
  });
}

async function startGame() {
  const { roomRef } = battleState;
  if (!roomRef) return;
  try {
    const snap = await roomRef.once('value');
    const room = snap.val();
    if (!room) return;
    const isReady = room.status === 'ready' || (room.hostReady && room.guestReady);
    if (!isReady || battleState.role !== 'host') {
      alert('กรุณารอให้ทั้งคู่กดพร้อมก่อน');
      return;
    }
    const questions = toArray(room.questions).length > 0 ? toArray(room.questions) : getQuestionsByTopic(room.topic);
    if (questions.length === 0) {
      alert('ไม่พบคำถาม — กรุณาสร้างห้องใหม่');
      return;
    }
    await roomRef.update({
      status: 'playing',
      currentQuestion: 0,
      hostHealth: BATTLE_CONFIG.MAX_HEALTH,
      guestHealth: BATTLE_CONFIG.MAX_HEALTH,
      hostAnswer: null,
      guestAnswer: null,
      questionStartTime: Date.now(),
      questions: questions
    });
  } catch (e) {
    alert('เกิดข้อผิดพลาด: ' + (e.message || e));
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelector('.topic-btn')?.classList.add('active');
  document.getElementById('createRoom')?.addEventListener('click', createRoom);
  document.getElementById('joinRoom')?.addEventListener('click', joinRoom);
  document.getElementById('btnReady')?.addEventListener('click', toggleReady);
  document.getElementById('btnStartGame')?.addEventListener('click', startGame);
  document.getElementById('btnBackToLobby')?.addEventListener('click', backToLobby);
  document.getElementById('btnRematch')?.addEventListener('click', requestRematch);
  document.getElementById('btnExitWaiting')?.addEventListener('click', backToLobby);
  document.getElementById('btnSurrender')?.addEventListener('click', surrender);

  // ตรวจสอบ Rejoin
  setTimeout(checkRejoin, 1000);
});

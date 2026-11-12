/**
 * Interactive Crash-Test Simulations for Course Presentation:
 * 1. SimRAM: In-memory application storage (Data loss on crash, 10s reboot timeout)
 * 2. SimDB: Database persistent storage (Data retained on crash, 10s reboot timeout)
 */

// Helper to generate initials avatar
function getInitials(name) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Names are typed by students during the demo and inserted via innerHTML — escape them
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

/* ==========================================================================
   Simulation 1: In-Memory (RAM)
   ========================================================================== */
const SimRAM = {
  initialData: [
    { id: 1, name: 'Олена Коваль', department: 'Механік', votes: 3 },
    { id: 2, name: 'Максим Шевченко', department: 'Будівельник', votes: 2 },
    { id: 3, name: 'Софія Мельник', department: 'Механік', votes: 1 }
  ],
  students: [],
  isCrashed: false,
  isRebooting: false,
  countdownTimer: null,
  rebootTimeouts: [],

  init() {
    this.reset();
    this.bindFormEvents();
  },

  bindFormEvents() {
    const input = document.getElementById('ram-student-name');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitStudent();
        }
      });
    }
  },

  clearTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.rebootTimeouts.forEach(t => clearTimeout(t));
    this.rebootTimeouts = [];
  },

  reset() {
    this.clearTimers();
    this.students = JSON.parse(JSON.stringify(this.initialData));
    this.isCrashed = false;
    this.isRebooting = false;
    this.hideAddForm();
    this.toggleButtons(true);
    this.render();
    this.log('info', '[RAM] Сервер запущено. Дані ініціалізовано у пам’яті (RAM: 3 студенти).');
  },

  toggleButtons(enabled) {
    const crashBtn = document.getElementById('ram-crash-btn');
    if (crashBtn) crashBtn.disabled = !enabled;
  },

  vote(id) {
    if (this.isCrashed || this.isRebooting) return;
    const student = this.students.find(s => s.id === id);
    if (student) {
      student.votes += 1;
      this.students.sort((a, b) => b.votes - a.votes);
      this.renderList();
      this.log('warn', `[RAM UPDATE] memory_dict['${student.name}'].votes = ${student.votes}`);
    }
  },

  showAddForm() {
    if (this.isCrashed || this.isRebooting) return;
    const form = document.getElementById('ram-add-form');
    const input = document.getElementById('ram-student-name');
    if (form) {
      form.hidden = false;
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  hideAddForm() {
    const form = document.getElementById('ram-add-form');
    if (form) form.hidden = true;
  },

  submitStudent() {
    if (this.isCrashed || this.isRebooting) return;
    const nameInput = document.getElementById('ram-student-name');
    const deptSelect = document.getElementById('ram-student-dept');
    const name = nameInput ? nameInput.value.trim() : '';
    const dept = deptSelect ? deptSelect.value : 'Механік';

    if (!name) {
      if (nameInput) {
        nameInput.focus();
      }
      return;
    }

    const newStudent = {
      id: Date.now(),
      name: name,
      department: dept,
      votes: 1
    };

    this.students.push(newStudent);
    this.students.sort((a, b) => b.votes - a.votes);
    this.renderList();
    this.hideAddForm();
    this.log('info', `[RAM INSERT] Додано в масив: "${newStudent.name}" (${newStudent.department})`);
  },

  renderLoader(seconds) {
    const listEl = document.getElementById('ram-student-list');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="sim-loader-box">
        <div class="m3-spinner danger"></div>
        <div>
          <div class="sim-loader-title text-error">
            ⚡️ Сервер вимкнувся і перезавантажується...
          </div>
          <div class="sim-loader-text">
            Очікування рестарту системи: <strong id="ram-countdown" class="sim-countdown">${seconds}</strong> с
          </div>
          <div class="sim-loader-note text-outline">
            ОЗУ знеструмлено • Дані скинуто
          </div>
        </div>
      </div>
    `;
  },

  crash() {
    if (this.isCrashed || this.isRebooting) return;
    this.isCrashed = true;
    this.isRebooting = true;
    this.hideAddForm();
    this.clearTimers();
    this.toggleButtons(false);

    const totalVotes = this.students.reduce((sum, s) => sum + s.votes, 0);

    // Visual flicker
    const visual = document.getElementById('ram-visual-box');
    if (visual) visual.classList.add('screen-flicker');

    this.log('error', '⚡️ [КРИТИЧНА ПОМИЛКА] Збій живлення! Сервер раптово вимкнувся!');
    this.log('error', '❌ [KERNEL] Живлення ОЗУ відключено. Всі 0x7ffd комірки пам’яті очищено до 0.');

    this.updateStatus('СЕРВЕР ВПАВ (ПЕРЕЗАПУСК)', true);

    // Show loader with 10s countdown
    let remaining = 10;
    this.renderLoader(remaining);

    this.countdownTimer = setInterval(() => {
      remaining -= 1;
      const countEl = document.getElementById('ram-countdown');
      if (countEl && remaining >= 0) {
        countEl.textContent = remaining;
      }
      if (remaining <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }, 1000);

    // Stop visual flicker after 0.8s
    this.rebootTimeouts.push(setTimeout(() => {
      if (visual) visual.classList.remove('screen-flicker');
    }, 800));

    // Timeline checkpoints over 10 seconds
    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '🔌 [HARDWARE] Подано напругу. Проходження самотестування BIOS/UEFI...');
      this.updateStatus('БІОС / ІНІЦІАЛІЗАЦІЯ', true);
    }, 2500));

    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '⚙️ [KERNEL] Завантаження операційної системи Linux...');
      this.updateStatus('ЗАВАНТАЖЕННЯ ОС', true);
    }, 5000));

    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '🚀 [SYSTEMD] Запуск веб-додатку (PID: 51902)...');
      this.updateStatus('СТАРТ ДОДАТКУ', true);
    }, 7500));

    // Finish 10-second reboot
    this.rebootTimeouts.push(setTimeout(() => {
      // RAM completely wiped!
      this.students = [];
      this.isRebooting = false;
      this.toggleButtons(true);
      this.updateStatus('ONLINE (RAM ПУСТА)', false);
      this.renderList();
      this.log('error', `⚠️ [RAM] Змінна \`students = []\`. УСІ ДАНІ ТА ${totalVotes} ГОЛОСІВ ВТРАЧЕНО!`);

      const alertText = document.getElementById('ram-alert-text');
      if (alertText) {
        alertText.textContent = `Катастрофа! Сервер перезавантажився і його оперативна пам'ять порожня. Усі ${totalVotes} голосів та  профілі студентів зникли назавжди. Конкурс зірвано!`;
      }

      const alertBox = document.getElementById('ram-alert-box');
      if (alertBox) alertBox.hidden = false;
    }, 10000));
  },

  updateStatus(text, isDanger) {
    const el = document.getElementById('ram-status');
    if (el) {
      el.textContent = text;
      el.className = isDanger ? 'sim-status-indicator status-crashed' : 'sim-status-indicator status-online';
    }
  },

  log(type, msg) {
    const consoleEl = document.getElementById('ram-console');
    if (consoleEl) {
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = `entry ${type}`;
      div.textContent = `[${time}] ${msg}`;
      consoleEl.appendChild(div);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  },

  renderList() {
    const listEl = document.getElementById('ram-student-list');
    if (!listEl) return;

    if (this.students.length === 0) {
      listEl.innerHTML = `
        <div class="sim-empty">
          <div class="sim-empty-icon">🗑️</div>
          Пам'ять сервера порожня.<br>Жодного профілю, жодного голосу не залишилось!
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.students.map((s, idx) => `
      <div class="sim-student-item">
        <div class="student-info">
          <div class="student-avatar">${escapeHtml(getInitials(s.name))}</div>
          <div>
            <div class="student-name">#${idx + 1} ${escapeHtml(s.name)}</div>
            <div class="student-faculty">${escapeHtml(s.department)}</div>
          </div>
        </div>
        <div class="student-votes">
          <span class="vote-counter">${s.votes}</span>
          <button class="m3-btn m3-btn-small m3-btn-vote" onclick="SimRAM.vote(${s.id})">+1 Голос</button>
        </div>
      </div>
    `).join('');
  },

  // Called by app.js each time the slide becomes active (see data-module in the HTML)
  render() {
    if (this.isRebooting) return; // keep the reboot animation intact when revisiting the slide
    this.renderList();
    this.updateStatus('ONLINE (ОЗУ / RAM)', false);
    const alertBox = document.getElementById('ram-alert-box');
    if (alertBox) alertBox.hidden = true;
    const consoleEl = document.getElementById('ram-console');
    if (consoleEl) consoleEl.innerHTML = '';
  }
};

/* ==========================================================================
   Simulation 2: Database Persistent Storage (DB / СУБД)
   ========================================================================== */
const SimDB = {
  // DB persistent storage (simulated on disk)
  diskDatabase: [
    { id: 1, name: 'Олена Коваль', department: 'Механік', votes: 3 },
    { id: 2, name: 'Максим Шевченко', department: 'Будівельник', votes: 2 },
    { id: 3, name: 'Софія Мельник', department: 'Механік', votes: 1 }
  ],
  serverCache: [],
  isCrashed: false,
  isRebooting: false,
  countdownTimer: null,
  rebootTimeouts: [],

  init() {
    this.reset();
    this.bindFormEvents();
  },

  bindFormEvents() {
    const input = document.getElementById('db-student-name');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitStudent();
        }
      });
    }
  },

  clearTimers() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.rebootTimeouts.forEach(t => clearTimeout(t));
    this.rebootTimeouts = [];
  },

  reset() {
    this.clearTimers();
    this.diskDatabase = [
      { id: 1, name: 'Олена Коваль', department: 'Механік', votes: 3 },
      { id: 2, name: 'Максим Шевченко', department: 'Будівельник', votes: 2 },
      { id: 3, name: 'Софія Мельник', department: 'Механік', votes: 1 }
    ];
    this.serverCache = JSON.parse(JSON.stringify(this.diskDatabase));
    this.isCrashed = false;
    this.isRebooting = false;
    this.hideAddForm();
    this.toggleButtons(true);
    this.render();
    this.log('success', '[СУБД] З’єднання з базою даних встановлено. Таблиця `students` готова.');
  },

  toggleButtons(enabled) {
    const crashBtn = document.getElementById('db-crash-btn');
    if (crashBtn) crashBtn.disabled = !enabled;
  },

  vote(id) {
    if (this.isCrashed || this.isRebooting) return;
    const student = this.diskDatabase.find(s => s.id === id);
    if (student) {
      student.votes += 1;
      this.diskDatabase.sort((a, b) => b.votes - a.votes);
      this.serverCache = JSON.parse(JSON.stringify(this.diskDatabase));
      this.renderList();
      this.log('warn', `[SQL] UPDATE students SET votes = ${student.votes} WHERE id = ${student.id};`);
      this.log('success', `[ACID] COMMIT TRANSACTION; -- Записано на диск (WAL sync OK)`);
    }
  },

  showAddForm() {
    if (this.isCrashed || this.isRebooting) return;
    const form = document.getElementById('db-add-form');
    const input = document.getElementById('db-student-name');
    if (form) {
      form.hidden = false;
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  hideAddForm() {
    const form = document.getElementById('db-add-form');
    if (form) form.hidden = true;
  },

  submitStudent() {
    if (this.isCrashed || this.isRebooting) return;
    const nameInput = document.getElementById('db-student-name');
    const deptSelect = document.getElementById('db-student-dept');
    const name = nameInput ? nameInput.value.trim() : '';
    const dept = deptSelect ? deptSelect.value : 'Механік';

    if (!name) {
      if (nameInput) {
        nameInput.focus();
      }
      return;
    }

    const newStudent = {
      id: Date.now(),
      name: name,
      department: dept,
      votes: 1
    };

    this.diskDatabase.push(newStudent);
    this.diskDatabase.sort((a, b) => b.votes - a.votes);
    this.serverCache = JSON.parse(JSON.stringify(this.diskDatabase));
    this.renderList();
    this.hideAddForm();
    this.log('info', `[SQL] INSERT INTO students (name, department, votes) VALUES ('${newStudent.name}', '${newStudent.department}', 1);`);
    this.log('success', `[ACID] COMMIT TRANSACTION; -- Запис успішно збережено в базі на диску`);
  },

  renderLoader(seconds) {
    const listEl = document.getElementById('db-student-list');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="sim-loader-box">
        <div class="m3-spinner secondary"></div>
        <div>
          <div class="sim-loader-title text-secondary">
            🔄 Сервер перезавантажується...
          </div>
          <div class="sim-loader-text">
            Очікування рестарту системи: <strong id="db-countdown" class="sim-countdown">${seconds}</strong> с
          </div>
          <div class="sim-loader-note text-success">
            💾 Дані надійно збережені в СУБД на диску SSD
          </div>
        </div>
      </div>
    `;
  },

  crash() {
    if (this.isCrashed || this.isRebooting) return;
    this.isCrashed = true;
    this.isRebooting = true;
    this.hideAddForm();
    this.clearTimers();
    this.toggleButtons(false);

    const visual = document.getElementById('db-visual-box');
    if (visual) visual.classList.add('screen-flicker');

    this.log('error', '⚡️ [CRASH] Сервер веб-додатку раптово вимкнувся (ОЗУ сервера очищено)!');
    this.log('info', '💾 [СУБД СТАТУС] Файли бази даних на диску SSD недоторкані (WAL безпечний).');

    this.updateStatus('СЕРВЕР ВПАВ (ПЕРЕЗАПУСК)', true);

    // Show loader with 10s countdown
    let remaining = 10;
    this.renderLoader(remaining);

    this.countdownTimer = setInterval(() => {
      remaining -= 1;
      const countEl = document.getElementById('db-countdown');
      if (countEl && remaining >= 0) {
        countEl.textContent = remaining;
      }
      if (remaining <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }, 1000);

    // Stop visual flicker after 0.8s
    this.rebootTimeouts.push(setTimeout(() => {
      if (visual) visual.classList.remove('screen-flicker');
    }, 800));

    // Timeline checkpoints over 10 seconds
    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '🔌 [HARDWARE] Відновлення живлення сервера. Проходження POST...');
      this.updateStatus('БІОС / ІНІЦІАЛІЗАЦІЯ', true);
    }, 2500));

    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '⚙️ [OS] Запуск мережевих служб операційної системи...');
      this.updateStatus('ЗАВАНТАЖЕННЯ ОС', true);
    }, 5000));

    this.rebootTimeouts.push(setTimeout(() => {
      this.log('warn', '🔄 [SYSTEMD] Запуск веб-сервера додатку (PID: 53108)...');
      this.updateStatus('ЗАПУСК ДОДАТКУ', true);
    }, 7500));

    this.rebootTimeouts.push(setTimeout(() => {
      this.log('info', '🔌 [SERVER] Підключення до СУБД: postgresql://localhost:5432/students_db...');
      this.log('warn', '🔎 [SQL] SELECT id, name, department, votes FROM students ORDER BY votes DESC;');
    }, 9000));

    // Finish 10-second reboot
    this.rebootTimeouts.push(setTimeout(() => {
      // Restore from disk database
      this.serverCache = JSON.parse(JSON.stringify(this.diskDatabase));
      this.isCrashed = false;
      this.isRebooting = false;
      this.toggleButtons(true);
      
      this.updateStatus('ONLINE (СУБД АКТИВНА)', false);
      this.renderList();
      this.log('success', `✅ [RESTORE] Успішно отримано ${this.serverCache.length} записів з диска! Жоден голос не втрачено!`);

      const alertBox = document.getElementById('db-alert-box');
      if (alertBox) alertBox.hidden = false;
    }, 10000));
  },

  updateStatus(text, isDanger) {
    const el = document.getElementById('db-status');
    if (el) {
      el.textContent = text;
      el.className = isDanger ? 'sim-status-indicator status-crashed' : 'sim-status-indicator status-online';
    }
  },

  log(type, msg) {
    const consoleEl = document.getElementById('db-console');
    if (consoleEl) {
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = `entry ${type}`;
      div.textContent = `[${time}] ${msg}`;
      consoleEl.appendChild(div);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  },

  renderList() {
    const listEl = document.getElementById('db-student-list');
    if (!listEl) return;

    listEl.innerHTML = this.serverCache.map((s, idx) => `
      <div class="sim-student-item">
        <div class="student-info">
          <div class="student-avatar secondary">${escapeHtml(getInitials(s.name))}</div>
          <div>
            <div class="student-name">#${idx + 1} ${escapeHtml(s.name)}</div>
            <div class="student-faculty">${escapeHtml(s.department)}</div>
          </div>
        </div>
        <div class="student-votes">
          <span class="vote-counter secondary">${s.votes}</span>
          <button class="m3-btn m3-btn-small m3-btn-vote" onclick="SimDB.vote(${s.id})">+1 Голос</button>
        </div>
      </div>
    `).join('');
  },

  // Called by app.js each time the slide becomes active (see data-module in the HTML)
  render() {
    if (this.isRebooting) return; // keep the reboot animation intact when revisiting the slide
    this.renderList();
    this.updateStatus('ONLINE (СУБД АКТИВНА)', false);
    const alertBox = document.getElementById('db-alert-box');
    if (alertBox) alertBox.hidden = true;
    const consoleEl = document.getElementById('db-console');
    if (consoleEl) consoleEl.innerHTML = '';
  }
};

// Global expose
window.SimRAM = SimRAM;
window.SimDB = SimDB;

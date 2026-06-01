/* ═══════════════════════════════════════════════
   TASKFLOW — app.js
   Task Manager · Local Storage · Reminders
═══════════════════════════════════════════════ */

'use strict';

/* ── State ───────────────────────────────────── */
let tasks = [];
let currentFilter = 'all';
let editingId = null;

const STORAGE_KEY = 'taskflow_tasks';

/* ── DOM References ──────────────────────────── */
const taskList       = document.getElementById('task-list');
const filterLabel    = document.getElementById('filter-label');
const taskCountLabel = document.getElementById('task-count-label');
const reminderBanner = document.getElementById('reminder-banner');
const editModal      = document.getElementById('edit-modal');

const statTotal = document.getElementById('stat-total');
const statDone  = document.getElementById('stat-done');
const statDue   = document.getElementById('stat-due');

// Add form
const inputTitle    = document.getElementById('task-title');
const inputDesc     = document.getElementById('task-desc');
const inputDue      = document.getElementById('task-due');
const inputPriority = document.getElementById('task-priority');
const addBtn        = document.getElementById('add-btn');

// Edit modal
const editTitle    = document.getElementById('edit-title');
const editDesc     = document.getElementById('edit-desc');
const editDue      = document.getElementById('edit-due');
const editPriority = document.getElementById('edit-priority');

/* ── Helpers ─────────────────────────────────── */

/** Returns today's date string in YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Returns days until a due date (negative = overdue) */
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T00:00:00') - new Date(todayStr() + 'T00:00:00');
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Returns a task's derived status */
function getStatus(task) {
  if (task.done) return 'done';
  const d = daysUntil(task.due);
  if (d === null)  return 'pending';
  if (d < 0)       return 'overdue';
  if (d <= 2)      return 'due-soon';
  return 'pending';
}

/** Formats a YYYY-MM-DD string to readable date */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Escapes HTML special characters */
function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Generates a unique ID */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ── Storage ─────────────────────────────────── */

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

/* ── CRUD Operations ─────────────────────────── */

function addTask() {
  const title = inputTitle.value.trim();
  if (!title) {
    inputTitle.focus();
    inputTitle.style.borderColor = 'var(--red)';
    setTimeout(() => { inputTitle.style.borderColor = ''; }, 1200);
    return;
  }

  const task = {
    id:       genId(),
    title,
    desc:     inputDesc.value.trim(),
    due:      inputDue.value,
    priority: inputPriority.value,
    done:     false,
    created:  new Date().toISOString(),
  };

  tasks.unshift(task);
  saveTasks();

  // Reset form
  inputTitle.value       = '';
  inputDesc.value        = '';
  inputDue.value         = todayStr();
  inputPriority.value    = 'normal';

  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingId = id;
  editTitle.value    = task.title;
  editDesc.value     = task.desc || '';
  editDue.value      = task.due || '';
  editPriority.value = task.priority || 'normal';

  editModal.classList.add('open');
  editTitle.focus();
}

function closeEditModal() {
  editModal.classList.remove('open');
  editingId = null;
}

function saveEdit() {
  const task  = tasks.find(t => t.id === editingId);
  const title = editTitle.value.trim();
  if (!task || !title) return;

  task.title    = title;
  task.desc     = editDesc.value.trim();
  task.due      = editDue.value;
  task.priority = editPriority.value;

  saveTasks();
  closeEditModal();
  render();
}

/* ── Filter ──────────────────────────────────── */

const FILTER_LABELS = {
  'all':      'All Tasks',
  'pending':  'Pending',
  'done':     'Completed',
  'overdue':  'Overdue',
  'due-soon': 'Due Soon',
};

function setFilter(filter) {
  currentFilter = filter;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  filterLabel.textContent = FILTER_LABELS[filter] || 'All Tasks';
  render();
}

function applyFilter(taskArr) {
  return taskArr.filter(task => {
    const s = getStatus(task);
    switch (currentFilter) {
      case 'all':      return true;
      case 'pending':  return s === 'pending' || s === 'due-soon';
      case 'done':     return s === 'done';
      case 'overdue':  return s === 'overdue';
      case 'due-soon': return s === 'due-soon';
      default:         return true;
    }
  });
}

/* ── Reminders ───────────────────────────────── */

function checkReminders() {
  const overdue = tasks.filter(t => !t.done && getStatus(t) === 'overdue');
  const soon    = tasks.filter(t => !t.done && getStatus(t) === 'due-soon');
  const parts   = [];

  if (overdue.length)
    parts.push(`⚠ ${overdue.length} task${overdue.length > 1 ? 's' : ''} overdue`);
  if (soon.length)
    parts.push(`⏰ ${soon.length} task${soon.length > 1 ? 's' : ''} due within 2 days`);

  if (parts.length) {
    reminderBanner.textContent = parts.join(' · ');
    reminderBanner.style.display = 'block';
  } else {
    reminderBanner.style.display = 'none';
  }
}

/* ── Stats ───────────────────────────────────── */

function updateStats() {
  statTotal.textContent = tasks.length;
  statDone.textContent  = tasks.filter(t => t.done).length;
  statDue.textContent   = tasks.filter(
    t => !t.done && (getStatus(t) === 'due-soon' || getStatus(t) === 'overdue')
  ).length;
}

/* ── Build Task Card HTML ────────────────────── */

function buildDateTag(task, status) {
  if (!task.due) return '';
  const d = daysUntil(task.due);

  if (status === 'overdue')
    return `<span class="tag tag-overdue">● ${Math.abs(d)}d overdue</span>`;
  if (status === 'due-soon')
    return `<span class="tag tag-soon">⏰ ${d === 0 ? 'Today' : d + 'd left'}</span>`;
  if (status === 'done')
    return `<span class="tag tag-done">✓ ${formatDate(task.due)}</span>`;
  return `<span class="tag tag-date">📅 ${formatDate(task.due)}</span>`;
}

function buildPriorityTag(priority) {
  if (priority === 'high') return `<span class="tag tag-high">High</span>`;
  if (priority === 'low')  return `<span class="tag tag-low">Low</span>`;
  return '';
}

function buildTaskCard(task) {
  const status      = getStatus(task);
  const dateTag     = buildDateTag(task, status);
  const priorityTag = buildPriorityTag(task.priority);

  return `
    <div class="task-card ${status}" data-id="${task.id}">
      <div class="task-check ${task.done ? 'checked' : ''}"
           data-action="toggle" data-id="${task.id}"></div>

      <div class="task-body">
        <div class="task-title">${esc(task.title)}</div>
        ${task.desc ? `<div class="task-desc">${esc(task.desc)}</div>` : ''}
        <div class="task-meta">${dateTag}${priorityTag}</div>
      </div>

      <div class="task-actions">
        <button class="icon-btn"     data-action="edit"   data-id="${task.id}" title="Edit">✎</button>
        <button class="icon-btn del" data-action="delete" data-id="${task.id}" title="Delete">✕</button>
      </div>
    </div>`;
}

/* ── Render ──────────────────────────────────── */

function render() {
  updateStats();
  checkReminders();

  const filtered = applyFilter(tasks);
  taskCountLabel.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

  if (!filtered.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">◈</span>
        <p>No tasks here yet.<br>Start by adding one above.</p>
      </div>`;
    return;
  }

  taskList.innerHTML = filtered.map(buildTaskCard).join('');
}

/* ── Event Delegation (Task List) ────────────── */

taskList.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;

  const { action, id } = el.dataset;

  if (action === 'toggle') toggleTask(id);
  if (action === 'edit')   openEditModal(id);
  if (action === 'delete') deleteTask(id);
});

/* ── Filter Buttons ──────────────────────────── */

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

/* ── Add Task Button & Enter Key ─────────────── */

addBtn.addEventListener('click', addTask);

inputTitle.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

/* ── Edit Modal Buttons ──────────────────────── */

document.getElementById('modal-save-btn').addEventListener('click', saveEdit);
document.getElementById('modal-cancel-btn').addEventListener('click', closeEditModal);
document.getElementById('modal-close-btn').addEventListener('click', closeEditModal);

// Close on backdrop click
editModal.addEventListener('click', e => {
  if (e.target === editModal) closeEditModal();
});

// Save on Ctrl+Enter inside modal
editModal.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

/* ── Init ────────────────────────────────────── */

(function init() {
  loadTasks();
  inputDue.value = todayStr(); // default due date to today
  render();
})();

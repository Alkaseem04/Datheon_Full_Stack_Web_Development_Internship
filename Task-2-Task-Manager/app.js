'use strict';

const STORAGE_KEY = 'datheon-focusflow-tasks-v1';
const allowedCategories = ['Work', 'Study', 'Personal'];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string')
      .map((t) => ({
        id: t.id,
        title: t.title.trim(),
        description: String(t.description || '').trim(),
        category: allowedCategories.includes(t.category) ? t.category : 'Work',
        due: typeof t.due === 'string' ? t.due : '',
        completed: Boolean(t.completed),
        created: Number(t.created) || Date.now()
      }));
  } catch (error) {
    console.warn('Unable to read saved tasks from localStorage:', error);
    return [];
  }
}

let tasks = loadTasks();
let statusFilter = 'all';
let editingId = null;
let lastActiveTrigger = null;

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Failed to save tasks:', error);
    alert('Could not save tasks. Check browser storage permissions or available space.');
    return false;
  }
}

function persist(nextTasks) {
  const previous = tasks;
  tasks = nextTasks;
  if (!saveTasks()) {
    tasks = previous;
  }
  render();
}

function textNode(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined && content !== null && content !== '') {
    el.textContent = content;
  }
  return el;
}

function setStatus(filter) {
  statusFilter = filter;
  $$('[data-filter]').forEach((btn) => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    if (btn.getAttribute('role') === 'tab') {
      btn.setAttribute('aria-selected', String(isActive));
    }
  });
  render();
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clearFilters() {
  $('#search').value = '';
  $('#categoryFilter').value = 'all';
  setStatus('all');
}

function render() {
  const done = tasks.filter((t) => t.completed).length;
  const active = tasks.length - done;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  // Stat Counters
  $('#totalStat').textContent = String(tasks.length);
  $('#activeStat').textContent = String(active);
  $('#doneStat').textContent = String(done);
  $('#rateStat').textContent = `${percent}%`;

  const progressBar = $('#progressBar');
  progressBar.style.width = `${percent}%`;
  const progressWrapper = progressBar.closest('.progress');
  if (progressWrapper) {
    progressWrapper.setAttribute('aria-valuenow', String(percent));
  }

  // Sidebar Counts
  $('#allCount').textContent = String(tasks.length);
  $('#activeCount').textContent = String(active);
  $('#completedCount').textContent = String(done);

  // Filter & Search
  const query = $('#search').value.trim().toLowerCase();
  const category = $('#categoryFilter').value;

  const visible = tasks.filter((t) => {
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'completed' ? t.completed : !t.completed);
    const matchesCategory = category === 'all' || t.category === category;
    const matchesQuery =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query);
    return matchesStatus && matchesCategory && matchesQuery;
  });

  // Sort
  const sort = $('#sort').value;
  visible.sort((a, b) => {
    if (sort === 'due') {
      return (a.due || '9999').localeCompare(b.due || '9999') || b.created - a.created;
    }
    if (sort === 'oldest') {
      return a.created - b.created;
    }
    return b.created - a.created;
  });

  $('#headingCount').textContent = String(visible.length);

  const list = $('#taskList');
  list.replaceChildren();

  // Empty States
  if (!visible.length) {
    const empty = textNode('div', 'empty', '');
    const isFiltered = tasks.length > 0;

    const emoji = textNode('div', 'emoji', isFiltered ? '⌕' : '☑');
    const title = textNode(
      'strong',
      '',
      isFiltered ? 'No matching tasks' : 'Your task list is ready'
    );
    const desc = textNode(
      'p',
      '',
      isFiltered
        ? 'Try a different search query or change your filters.'
        : 'Create your first task to get started.'
    );

    empty.append(emoji, title, desc);

    if (isFiltered) {
      const clearBtn = textNode('button', 'secondary empty-btn', 'Clear filters');
      clearBtn.type = 'button';
      clearBtn.addEventListener('click', clearFilters);
      empty.append(clearBtn);
    } else {
      const createBtn = textNode('button', 'primary empty-btn', '＋ Create your first task');
      createBtn.type = 'button';
      createBtn.addEventListener('click', (e) => openDialog(null, e.currentTarget));
      empty.append(createBtn);
    }

    list.append(empty);
    return;
  }

  const today = todayLocal();

  for (const task of visible) {
    const item = textNode('article', `task${task.completed ? ' completed' : ''}`, '');
    item.dataset.taskId = task.id;

    // Checkbox with accessible label
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.completed;
    check.setAttribute(
      'aria-label',
      `Mark "${task.title}" as ${task.completed ? 'active' : 'completed'}`
    );

    check.addEventListener('change', () => {
      const isCompleted = check.checked;
      item.classList.add('completing');

      if (isCompleted && statusFilter === 'active') {
        item.classList.add('leaving');
        setTimeout(() => {
          persist(tasks.map((t) => (t.id === task.id ? { ...t, completed: true } : t)));
        }, 220);
        return;
      }

      persist(tasks.map((t) => (t.id === task.id ? { ...t, completed: isCompleted } : t)));
    });

    // Content
    const content = textNode('div', 'task-content', '');
    content.append(textNode('div', 'task-name', task.title));

    if (task.description) {
      content.append(textNode('p', 'task-desc', task.description));
    }

    // Metadata: Category & Due Date
    const meta = textNode('div', 'meta', '');
    meta.append(textNode('span', `pill ${task.category}`, task.category));

    if (task.due) {
      const isOverdue = !task.completed && task.due < today;
      const dueSpan = textNode(
        'span',
        isOverdue ? 'overdue' : '',
        `${isOverdue ? '⚠ Overdue · ' : '◷ '}${formatDate(task.due)}`
      );
      meta.append(dueSpan);
    }

    content.append(meta);

    // Actions
    const actions = textNode('div', 'actions', '');

    const edit = textNode('button', 'icon-btn', '✎');
    edit.type = 'button';
    edit.title = 'Edit task';
    edit.setAttribute('aria-label', `Edit "${task.title}"`);
    edit.addEventListener('click', (e) => openDialog(task, e.currentTarget));

    const del = textNode('button', 'icon-btn', '×');
    del.type = 'button';
    del.title = 'Delete task';
    del.setAttribute('aria-label', `Delete "${task.title}"`);
    del.addEventListener('click', () => {
      if (confirm(`Delete "${task.title}"?`)) {
        persist(tasks.filter((t) => t.id !== task.id));
      }
    });

    actions.append(edit, del);
    item.append(check, content, actions);
    list.append(item);
  }
}

function openDialog(task = null, triggerEl = null) {
  lastActiveTrigger = triggerEl || document.activeElement;
  editingId = task?.id || null;

  $('#taskForm').reset();
  $('#taskTitle').setCustomValidity('');
  $('#dialogTitle').textContent = task ? 'Edit task' : 'Create a task';
  $('#saveButton').textContent = task ? 'Save changes' : 'Create task';

  if (task) {
    $('#taskTitle').value = task.title;
    $('#taskDescription').value = task.description;
    $('#taskCategory').value = task.category;
    $('#taskDue').value = task.due;
  }

  $('#taskDialog').showModal();
  $('#taskTitle').focus();
}

function closeDialog() {
  $('#taskDialog').close();
  editingId = null;
  if (lastActiveTrigger && typeof lastActiveTrigger.focus === 'function') {
    try {
      lastActiveTrigger.focus();
    } catch (_) {}
  }
}

// Event Listeners
$('#newTask').addEventListener('click', (e) => openDialog(null, e.currentTarget));
$('#closeDialog').addEventListener('click', closeDialog);
$('#cancelDialog').addEventListener('click', closeDialog);

$('#taskDialog').addEventListener('close', () => {
  editingId = null;
});

// Close dialog when clicking on backdrop
$('#taskDialog').addEventListener('click', (event) => {
  if (event.target === $('#taskDialog')) {
    closeDialog();
  }
});

// Clear title validity on typing
$('#taskTitle').addEventListener('input', () => {
  $('#taskTitle').setCustomValidity('');
});

// Form Submit
$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const title = $('#taskTitle').value.trim();
  const description = $('#taskDescription').value.trim();
  const category = $('#taskCategory').value;
  const due = $('#taskDue').value;

  if (!title) {
    $('#taskTitle').setCustomValidity('Please enter a task title.');
    $('#taskTitle').reportValidity();
    $('#taskTitle').focus();
    return;
  }

  if (!allowedCategories.includes(category)) return;

  const data = { title, description, category, due };

  const next = editingId
    ? tasks.map((t) => (t.id === editingId ? { ...t, ...data } : t))
    : [
        {
          id: generateId(),
          ...data,
          completed: false,
          created: Date.now()
        },
        ...tasks
      ];

  const previous = tasks;
  tasks = next;

  if (saveTasks()) {
    closeDialog();
    render();
  } else {
    tasks = previous;
  }
});

$$('[data-filter]').forEach((b) =>
  b.addEventListener('click', () => setStatus(b.dataset.filter))
);

$('#search').addEventListener('input', render);
$('#categoryFilter').addEventListener('change', render);
$('#sort').addEventListener('change', render);

// Initial Render
render();

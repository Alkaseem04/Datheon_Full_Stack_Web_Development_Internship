# Task 2 — Dynamic Task Manager & Productivity Tracker (FocusFlow)

A responsive, zero-backend, accessibility-focused CRUD task manager and productivity tracker designed for the **Datheon Full Stack Web Development Internship**.

---

## 🚀 Key Features

### 1. Full CRUD Operations
- **Create**: Add new tasks with title, optional description, category, and optional due date.
- **Read**: View structured task cards with category pills, due dates, overdue badges, and live summary statistics.
- **Update**: Edit existing tasks via modal dialog with pre-filled fields; changes persist immediately.
- **Delete**: Remove tasks with safety confirmation prompt.

### 2. Categories & Status Organization
- **Allowed Categories**: `Work` (purple), `Study` (blue), and `Personal` (orange) with distinct visual tags.
- **Status Filters**: Switch between `All tasks`, `Active`, and `Completed` in the sidebar and main tablist.
- **Search & Quick Filters**: Search in real time across task titles and descriptions; filter by specific category.
- **Sorting**: Sort dynamically by **Newest first**, **Due date** (imminent first, undated tasks at end), or **Oldest first**.

### 3. Productivity Metrics
- Real-time counters for **Total tasks**, **In progress**, **Completed**, and **Completion rate (%)**.
- Smooth animated progress bar that updates as tasks are checked off.

### 4. Interactive & Visual Polish
- **Subtle Completion Animations**: Checkbox pop and task card pulse animations upon completion; smooth exit transition when marking tasks completed under the `Active` filter.
- **Reduced Motion Support**: Respects user `prefers-reduced-motion` settings.
- **Enhanced Empty States**: Contextual empty states with one-click actions ("＋ Create your first task" or "Clear filters").

### 5. Robust Persistence & Offline-First
- Persisted locally in browser `localStorage` under `datheon-focusflow-tasks-v1`.
- Built-in data schema validation, fallback category defaulting, and corrupted storage recovery.
- Resilient ID generation with secure `crypto.randomUUID()` and legacy/insecure context fallback.
- Rollback protection if `localStorage` quota or permission fails.

### 6. Accessibility & Responsiveness
- Semantic HTML5 structure (`<main>`, `<header>`, `<section>`, `<aside>`, `<nav>`, `<dialog>`).
- Explicit label associations, ARIA live region (`aria-live="polite"`), and ARIA tab roles (`role="tablist"`, `role="tab"`, `aria-selected`).
- Modal focus restoration and backdrop click dismissal.
- Full WCAG AA color contrast compliance.
- Responsive breakpoints tested across mobile (320px–700px), tablet (701px–1000px), and desktop (1000px+).

---

## 💻 How to Run Locally

### Option A: Direct Browser (No Tools Needed)
Open `index.html` directly in any modern web browser (Double click `index.html` or drag it into Chrome/Edge/Firefox/Safari).

### Option B: Local HTTP Server (Python)
```bash
# In the Task-2-Task-Manager directory:
python -m http.server 5500
```
Open `http://localhost:5500` in your web browser.

### Option C: VS Code Live Server
Open the `Task-2-Task-Manager` folder in VS Code and click **Go Live** on the status bar.

---

## 🧪 Manual QA Testing Checklist

| Step | Action | Expected Result |
|---|---|---|
| **1. Create Task** | Click "＋ New task", enter title, select "Work", pick due date, submit | Modal closes, task appears in list, "Total" & "In progress" increment |
| **2. Validation** | Open dialog, submit with blank/whitespace title | Form blocks submission with tooltip: "Please enter a task title." |
| **3. Edit Task** | Click `✎` on a task, update title and category to "Study", save | Changes update in DOM, pill colors update to Study |
| **4. Complete Task** | Click checkbox on active task | Subtle check pop and pulse animation, line-through applied, completion rate updates |
| **5. Status Filters** | Toggle "Active" and "Completed" tabs | Only corresponding tasks show; counters stay synced |
| **6. Overdue Indicator** | Create task with past due date and leave incomplete | Red `⚠ Overdue · <Date>` badge renders |
| **7. Search** | Type keyword in search box | Matching tasks filter instantly; empty state with "Clear filters" appears if no match |
| **8. Sort** | Change sort dropdown to "Due date" | Tasks with earlier due dates appear first; undated tasks appear last |
| **9. Delete Task** | Click `×` button, confirm prompt | Task removed from DOM, stats decrement |
| **10. Persistence** | Refresh browser (F5) | All tasks, edits, and completed states persist identically |
| **11. Mobile View** | Shrink browser to 375px viewport | Header wraps, "+ New task" button is accessible, stats and actions remain fully visible |

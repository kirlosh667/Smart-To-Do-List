/**
 * TaskFlow Pro - Main Application Logic
 * Fast, reactive, accessible, and persistent task management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // State Management
  // ----------------------------------------------------
  const STORAGE_KEY = 'taskflow_tasks_data';
  const THEME_KEY = 'taskflow_theme_mode';
  const VIEW_KEY = 'taskflow_view_mode';

  let state = {
    tasks: loadTasks(),
    theme: localStorage.getItem(THEME_KEY) || 'light',
    viewMode: localStorage.getItem(VIEW_KEY) || 'grid', // 'grid' or 'list'
    activeStatusFilter: 'all', // 'all', 'pending', 'completed', 'high'
    activePriorityFilter: 'all', // 'all', 'high', 'medium', 'low'
    activeCategoryFilter: 'all', // 'all', 'Work', etc.
    searchQuery: '',
    sortBy: 'date-desc',
    taskToDeleteId: null
  };

  // ----------------------------------------------------
  // App Boot & Initialization
  // ----------------------------------------------------
  function init() {
    initTheme();
    initDateAndGreeting();
    initViewMode();
    initEventListeners();
    render();
  }

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not load saved tasks from localStorage:', err);
    }
    // Fallback to default demo tasks
    return typeof defaultTasks !== 'undefined' ? JSON.parse(JSON.stringify(defaultTasks)) : [];
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
      showToast('Error saving data to local storage', 'error', 'Storage Error');
    }
  }

  // ----------------------------------------------------
  // Theme Toggle
  // ----------------------------------------------------
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem(THEME_KEY, state.theme);
    showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info', 'Theme Updated');
  }

  // ----------------------------------------------------
  // Date & Greeting
  // ----------------------------------------------------
  function initDateAndGreeting() {
    const dateText = document.getElementById('currentDateText');
    const greetingText = document.getElementById('greetingText');
    const quoteText = document.getElementById('productivityQuote');

    const now = new Date();
    
    // Format: "Monday, Oct 5, 2026"
    if (dateText) {
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      dateText.textContent = now.toLocaleDateString('en-US', options);
    }

    // Dynamic greeting based on hour
    if (greetingText) {
      const hour = now.getHours();
      let greeting = 'Welcome back! 👋';
      if (hour >= 5 && hour < 12) greeting = 'Good morning! ☀️';
      else if (hour >= 12 && hour < 17) greeting = 'Good afternoon! 🌤️';
      else if (hour >= 17 && hour < 22) greeting = 'Good evening! 🌙';
      else greeting = 'Burning the midnight oil! 🚀';
      greetingText.textContent = greeting;
    }

    // Random quote
    if (quoteText && typeof motivationalQuotes !== 'undefined' && motivationalQuotes.length > 0) {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      quoteText.textContent = randomQuote;
    }
  }

  // ----------------------------------------------------
  // View Mode (Grid vs List)
  // ----------------------------------------------------
  function initViewMode() {
    const container = document.getElementById('tasksContainer');
    const gridBtn = document.getElementById('viewGridBtn');
    const listBtn = document.getElementById('viewListBtn');

    if (!container) return;

    if (state.viewMode === 'list') {
      container.classList.remove('grid-view');
      container.classList.add('list-view');
      if (listBtn) listBtn.classList.add('active');
      if (gridBtn) gridBtn.classList.remove('active');
    } else {
      container.classList.remove('list-view');
      container.classList.add('grid-view');
      if (gridBtn) gridBtn.classList.add('active');
      if (listBtn) listBtn.classList.remove('active');
    }
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    localStorage.setItem(VIEW_KEY, mode);
    initViewMode();
  }

  // ----------------------------------------------------
  // Stats & Metrics Calculation
  // ----------------------------------------------------
  function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = state.tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update Progress Bar
    const rateText = document.getElementById('completionRateText');
    const progressBar = document.getElementById('statsProgressBar');
    const progressSub = document.getElementById('progressSubtext');

    if (rateText) rateText.textContent = `${rate}%`;
    if (progressBar) progressBar.style.width = `${rate}%`;
    if (progressSub) progressSub.textContent = `${completed} of ${total} tasks completed`;

    // Update Metric Cards Numbers
    const elTotal = document.getElementById('statTotalTasks');
    const elPending = document.getElementById('statPendingTasks');
    const elCompleted = document.getElementById('statCompletedTasks');
    const elHigh = document.getElementById('statHighPriority');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elCompleted) elCompleted.textContent = completed;
    if (elHigh) elHigh.textContent = highPriority;

    // Update Filter Tab Badges
    const countAll = document.getElementById('countAll');
    const countPending = document.getElementById('countPending');
    const countCompleted = document.getElementById('countCompleted');

    if (countAll) countAll.textContent = total;
    if (countPending) countPending.textContent = pending;
    if (countCompleted) countCompleted.textContent = completed;
  }

  // ----------------------------------------------------
  // Filtering & Sorting Pipeline
  // ----------------------------------------------------
  function getFilteredAndSortedTasks() {
    let result = [...state.tasks];

    // Status Filter
    if (state.activeStatusFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (state.activeStatusFilter === 'completed') {
      result = result.filter(t => t.completed);
    } else if (state.activeStatusFilter === 'high') {
      result = result.filter(t => t.priority === 'high' && !t.completed);
    }

    // Secondary Priority Filter
    if (state.activePriorityFilter !== 'all') {
      result = result.filter(t => t.priority === state.activePriorityFilter);
    }

    // Secondary Category Filter
    if (state.activeCategoryFilter !== 'all') {
      result = result.filter(t => t.category === state.activeCategoryFilter);
    }

    // Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      // Pin incomplete tasks before completed tasks if sorting by general dates
      if (state.sortBy === 'date-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (state.sortBy === 'date-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (state.sortBy === 'due-soon') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (state.sortBy === 'priority-desc') {
        const pMap = { high: 3, medium: 2, low: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      if (state.sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }

  // ----------------------------------------------------
  // Render Tasks & UI Elements
  // ----------------------------------------------------
  function render() {
    updateStats();

    const tasks = getFilteredAndSortedTasks();
    const container = document.getElementById('tasksContainer');
    const emptyState = document.getElementById('emptyState');
    const countBadge = document.getElementById('tasksShowingCountBadge');
    const filterDesc = document.getElementById('tasksActiveFilterDesc');

    if (countBadge) {
      countBadge.textContent = `Showing ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
    }

    if (filterDesc) {
      let desc = 'Showing all items';
      if (state.activeStatusFilter === 'pending') desc = 'Showing pending tasks';
      if (state.activeStatusFilter === 'completed') desc = 'Showing completed tasks';
      if (state.activeStatusFilter === 'high') desc = 'Showing high priority items';
      if (state.searchQuery) desc += ` matching "${state.searchQuery}"`;
      filterDesc.textContent = desc;
    }

    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'flex';
        const emptyTitle = document.getElementById('emptyStateTitle');
        const emptyDesc = document.getElementById('emptyStateDesc');

        if (state.searchQuery) {
          if (emptyTitle) emptyTitle.textContent = 'No matching tasks found';
          if (emptyDesc) emptyDesc.textContent = `No results found for "${escapeHTML(state.searchQuery)}". Try another keyword or clear search.`;
        } else if (state.activeStatusFilter === 'completed') {
          if (emptyTitle) emptyTitle.textContent = 'No completed tasks yet';
          if (emptyDesc) emptyDesc.textContent = 'Finish some tasks from your pending list to see them here!';
        } else if (state.activeStatusFilter === 'pending') {
          if (emptyTitle) emptyTitle.textContent = 'No pending tasks!';
          if (emptyDesc) emptyDesc.textContent = "You're all done with your current queue. Great job!";
        } else {
          if (emptyTitle) emptyTitle.textContent = 'Your task list is empty';
          if (emptyDesc) emptyDesc.textContent = 'Click "New Task" above or use the quick bar to get started!';
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = tasks.map(task => renderTaskCard(task)).join('');
    attachTaskCardListeners();
  }

  function renderTaskCard(task) {
    const isDone = task.completed;
    const cat = (typeof categoryConfig !== 'undefined' && categoryConfig[task.category]) 
      ? categoryConfig[task.category] 
      : { icon: 'fa-solid fa-folder', label: task.category || 'General', color: '#6366f1' };

    const dueInfo = getDueDateBadgeInfo(task.dueDate, isDone);

    let priorityBadge = '';
    if (task.priority === 'high') {
      priorityBadge = `<span class="task-badge priority-high"><i class="fa-solid fa-fire"></i> High</span>`;
    } else if (task.priority === 'medium') {
      priorityBadge = `<span class="task-badge priority-med"><i class="fa-solid fa-bolt"></i> Med</span>`;
    } else {
      priorityBadge = `<span class="task-badge priority-low"><i class="fa-solid fa-seedling"></i> Low</span>`;
    }

    return `
      <article class="task-card ${isDone ? 'completed' : ''} priority-${task.priority}" data-id="${task.id}" tabindex="0">
        
        <!-- Checkbox Area -->
        <button class="task-check-btn ${isDone ? 'checked' : ''}" data-action="toggle" title="${isDone ? 'Mark as incomplete' : 'Mark as completed'}" aria-label="Toggle task status">
          <i class="fa-solid fa-check"></i>
        </button>

        <!-- Main Task Content -->
        <div class="task-content">
          
          <div class="task-header-row">
            <h4 class="task-title ${isDone ? 'text-done' : ''}">${escapeHTML(task.title)}</h4>
          </div>

          ${task.description ? `
            <p class="task-desc ${isDone ? 'text-done' : ''}">${escapeHTML(task.description)}</p>
          ` : ''}

          <!-- Metadata Badges -->
          <div class="task-meta-row">
            
            <!-- Category -->
            <span class="task-badge category-badge" style="color: ${cat.color}; background: ${cat.color}15; border-color: ${cat.color}30;">
              <i class="${cat.icon}"></i> ${escapeHTML(cat.label)}
            </span>

            <!-- Priority -->
            ${priorityBadge}

            <!-- Due Date Badge -->
            ${dueInfo ? `
              <span class="task-badge due-badge ${dueInfo.className}" title="Due Date">
                <i class="fa-regular fa-calendar"></i> ${escapeHTML(dueInfo.text)}
              </span>
            ` : ''}

          </div>

        </div>

        <!-- Task Actions Toolbar -->
        <div class="task-actions">
          <button class="task-action-btn edit-btn" data-action="edit" title="Edit Task" aria-label="Edit task">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="task-action-btn duplicate-btn" data-action="duplicate" title="Duplicate Task" aria-label="Duplicate task">
            <i class="fa-regular fa-copy"></i>
          </button>
          <button class="task-action-btn delete-btn" data-action="delete" title="Delete Task" aria-label="Delete task">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>

      </article>
    `;
  }

  function getDueDateBadgeInfo(dueDateStr, isDone) {
    if (!dueDateStr) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr + 'T00:00:00');
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (isDone) {
      return {
        text: `Due ${formatDateString(dueDateStr)}`,
        className: 'due-completed'
      };
    }

    if (diffDays < 0) {
      return {
        text: `Overdue (${Math.abs(diffDays)}d ago)`,
        className: 'due-overdue'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due Today',
        className: 'due-today'
      };
    } else if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        className: 'due-soon'
      };
    } else {
      return {
        text: formatDateString(dueDateStr),
        className: 'due-normal'
      };
    }
  }

  function formatDateString(dateStr) {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {}
    return dateStr;
  }

  // ----------------------------------------------------
  // Task Actions (Toggle, Edit, Duplicate, Delete)
  // ----------------------------------------------------
  function attachTaskCardListeners() {
    document.querySelectorAll('.task-card').forEach(card => {
      const id = card.getAttribute('data-id');

      // Click on Toggle Checkbox
      const checkBtn = card.querySelector('[data-action="toggle"]');
      if (checkBtn) {
        checkBtn.addEventListener('click', e => {
          e.stopPropagation();
          toggleTaskStatus(id);
        });
      }

      // Click on Edit
      const editBtn = card.querySelector('[data-action="edit"]');
      if (editBtn) {
        editBtn.addEventListener('click', e => {
          e.stopPropagation();
          openEditTaskModal(id);
        });
      }

      // Click on Duplicate
      const dupBtn = card.querySelector('[data-action="duplicate"]');
      if (dupBtn) {
        dupBtn.addEventListener('click', e => {
          e.stopPropagation();
          duplicateTask(id);
        });
      }

      // Click on Delete
      const delBtn = card.querySelector('[data-action="delete"]');
      if (delBtn) {
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          openDeleteConfirmModal(id);
        });
      }
    });
  }

  function toggleTaskStatus(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    saveTasks();
    render();

    if (task.completed) {
      triggerConfetti();
      showToast(`Task marked as completed!`, 'success', 'Completed 🎉');
    } else {
      showToast(`Task returned to in-progress`, 'info', 'In Progress');
    }
  }

  function duplicateTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const newTask = {
      ...task,
      id: 'task-' + Date.now(),
      title: `${task.title} (Copy)`,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    saveTasks();
    render();
    showToast('Task duplicated successfully', 'success', 'Duplicated');
  }

  function openDeleteConfirmModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    state.taskToDeleteId = id;
    const targetText = document.getElementById('deleteTaskTargetText');
    if (targetText) {
      targetText.innerHTML = `Are you sure you want to permanently remove "<strong>${escapeHTML(task.title)}</strong>"?`;
    }

    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function confirmDeleteTask() {
    if (!state.taskToDeleteId) return;

    state.tasks = state.tasks.filter(t => t.id !== state.taskToDeleteId);
    state.taskToDeleteId = null;

    saveTasks();
    closeDeleteModal();
    render();
    showToast('Task removed permanently', 'warning', 'Deleted');
  }

  function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
    state.taskToDeleteId = null;
  }

  function clearAllCompleted() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear', 'info', 'Empty');
      return;
    }

    if (confirm(`Are you sure you want to remove all ${completedCount} completed tasks?`)) {
      state.tasks = state.tasks.filter(t => !t.completed);
      saveTasks();
      render();
      showToast(`Cleared ${completedCount} completed tasks`, 'warning', 'Batch Cleared');
    }
  }

  // ----------------------------------------------------
  // Quick Add Form
  // ----------------------------------------------------
  function handleQuickAdd(e) {
    e.preventDefault();
    const input = document.getElementById('quickAddInput');
    const prioritySelect = document.getElementById('quickAddPriority');
    const catSelect = document.getElementById('quickAddCategory');
    const dateInput = document.getElementById('quickAddDueDate');

    if (!input || !input.value.trim()) return;

    const title = input.value.trim();
    const priority = prioritySelect ? prioritySelect.value : 'medium';
    const category = catSelect ? catSelect.value : 'Personal';
    const dueDate = dateInput && dateInput.value ? dateInput.value : '';

    const newTask = {
      id: 'task-' + Date.now(),
      title: title,
      description: '',
      category: category,
      priority: priority,
      dueDate: dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    state.tasks.unshift(newTask);
    saveTasks();

    input.value = '';
    if (dateInput) dateInput.value = '';
    input.focus();

    render();
    showToast(`Added: "${title}"`, 'success', 'Task Created');
  }

  // ----------------------------------------------------
  // Create / Edit Modal
  // ----------------------------------------------------
  function openCreateTaskModal() {
    const modal = document.getElementById('taskModalBackdrop');
    const titleEl = document.getElementById('modalTitle');
    const subEl = document.getElementById('modalSubtitle');
    const form = document.getElementById('taskModalForm');
    const idInput = document.getElementById('modalTaskId');
    const saveBtnText = document.getElementById('saveModalBtnText');

    if (form) form.reset();
    if (idInput) idInput.value = '';
    if (titleEl) titleEl.textContent = 'Create New Task';
    if (subEl) subEl.textContent = 'Fill in the task details, priority, and schedule';
    if (saveBtnText) saveBtnText.textContent = 'Save Task';

    // Default today's date for quick picker
    const dueInput = document.getElementById('modalTaskDueDate');
    if (dueInput) dueInput.value = '';

    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const titleInput = document.getElementById('modalTaskTitle');
        if (titleInput) titleInput.focus();
      }, 100);
    }
  }

  function openEditTaskModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const modal = document.getElementById('taskModalBackdrop');
    const titleEl = document.getElementById('modalTitle');
    const subEl = document.getElementById('modalSubtitle');
    const idInput = document.getElementById('modalTaskId');
    const titleInput = document.getElementById('modalTaskTitle');
    const descInput = document.getElementById('modalTaskDesc');
    const catInput = document.getElementById('modalTaskCategory');
    const priInput = document.getElementById('modalTaskPriority');
    const dueInput = document.getElementById('modalTaskDueDate');
    const saveBtnText = document.getElementById('saveModalBtnText');

    if (idInput) idInput.value = task.id;
    if (titleInput) titleInput.value = task.title;
    if (descInput) descInput.value = task.description || '';
    if (catInput) catInput.value = task.category || 'General';
    if (priInput) priInput.value = task.priority || 'medium';
    if (dueInput) dueInput.value = task.dueDate || '';

    if (titleEl) titleEl.textContent = 'Edit Task Details';
    if (subEl) subEl.textContent = 'Update priority, category, or notes';
    if (saveBtnText) saveBtnText.textContent = 'Update Task';

    if (modal) {
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        if (titleInput) titleInput.focus();
      }, 100);
    }
  }

  function handleModalFormSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('modalTaskId');
    const titleInput = document.getElementById('modalTaskTitle');
    const descInput = document.getElementById('modalTaskDesc');
    const catInput = document.getElementById('modalTaskCategory');
    const priInput = document.getElementById('modalTaskPriority');
    const dueInput = document.getElementById('modalTaskDueDate');

    if (!titleInput || !titleInput.value.trim()) return;

    const taskId = idInput ? idInput.value : '';
    const title = titleInput.value.trim();
    const desc = descInput ? descInput.value.trim() : '';
    const category = catInput ? catInput.value : 'General';
    const priority = priInput ? priInput.value : 'medium';
    const dueDate = dueInput ? dueInput.value : '';

    if (taskId) {
      // Update existing
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        task.title = title;
        task.description = desc;
        task.category = category;
        task.priority = priority;
        task.dueDate = dueDate;
        task.updatedAt = new Date().toISOString();
        showToast(`Task "${title}" updated!`, 'success', 'Task Saved');
      }
    } else {
      // Create new
      const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        description: desc,
        category: category,
        priority: priority,
        dueDate: dueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      state.tasks.unshift(newTask);
      showToast(`Task "${title}" created!`, 'success', 'Task Created');
    }

    saveTasks();
    closeTaskModal();
    render();
  }

  function closeTaskModal() {
    const modal = document.getElementById('taskModalBackdrop');
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // ----------------------------------------------------
  // Confetti Celebration
  // ----------------------------------------------------
  function triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899']
      });
    }
  }

  // ----------------------------------------------------
  // Export & Import Data JSON
  // ----------------------------------------------------
  function exportDataJSON() {
    const dataStr = JSON.stringify(state.tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Exported tasks to JSON file', 'success', 'Export Complete');
  }

  function importDataJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported) && imported.length > 0) {
          state.tasks = imported;
          saveTasks();
          render();
          showToast(`Successfully imported ${imported.length} tasks!`, 'success', 'Import Success');
        } else {
          showToast('Invalid JSON file format', 'error', 'Import Error');
        }
      } catch (err) {
        showToast('Could not parse JSON file', 'error', 'Import Error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function resetDemoData() {
    if (confirm('Reset all tasks to sample starter data? Your custom changes will be overwritten.')) {
      state.tasks = typeof defaultTasks !== 'undefined' ? JSON.parse(JSON.stringify(defaultTasks)) : [];
      saveTasks();
      render();
      showToast('Demo data restored successfully', 'success', 'Reset Complete');
    }
  }

  // ----------------------------------------------------
  // Toast Notification System
  // ----------------------------------------------------
  function showToast(message, type = 'success', title = 'Notice') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-solid fa-circle-check';
    if (type === 'warning') icon = 'fa-solid fa-triangle-exclamation';
    if (type === 'error') icon = 'fa-solid fa-circle-xmark';
    if (type === 'info') icon = 'fa-solid fa-circle-info';

    toast.innerHTML = `
      <div class="toast-icon-wrap">
        <i class="${icon}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${escapeHTML(title)}</div>
        <div class="toast-message">${escapeHTML(message)}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3800);
  }

  // ----------------------------------------------------
  // Event Listeners Binding
  // ----------------------------------------------------
  function initEventListeners() {
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Create New Task Modal triggers
    const openCreateBtn = document.getElementById('openCreateModalBtn');
    const emptyAddBtn = document.getElementById('emptyStateAddBtn');
    if (openCreateBtn) openCreateBtn.addEventListener('click', openCreateTaskModal);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openCreateTaskModal);

    // Modal Close triggers
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const modalBackdrop = document.getElementById('taskModalBackdrop');

    if (closeBtn) closeBtn.addEventListener('click', closeTaskModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTaskModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', e => {
        if (e.target === modalBackdrop) closeTaskModal();
      });
    }

    // Modal Form Submit
    const modalForm = document.getElementById('taskModalForm');
    if (modalForm) modalForm.addEventListener('submit', handleModalFormSubmit);

    // Delete Modal triggers
    const cancelDelBtn = document.getElementById('cancelDeleteBtn');
    const confirmDelBtn = document.getElementById('confirmDeleteBtn');
    const delModal = document.getElementById('deleteConfirmModal');

    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDeleteModal);
    if (confirmDelBtn) confirmDelBtn.addEventListener('click', confirmDeleteTask);
    if (delModal) {
      delModal.addEventListener('click', e => {
        if (e.target === delModal) closeDeleteModal();
      });
    }

    // Escape key closes modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeTaskModal();
        closeDeleteModal();
      }
      // Shortcut Ctrl+N or Alt+N to open task modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const search = document.getElementById('searchInput');
        if (search) search.focus();
      }
    });

    // Quick Add Form
    const quickForm = document.getElementById('quickAddForm');
    if (quickForm) quickForm.addEventListener('submit', handleQuickAdd);

    // Metric Cards Filter Click
    document.querySelectorAll('.metric-card').forEach(card => {
      card.addEventListener('click', () => {
        const filter = card.getAttribute('data-filter');
        if (filter) {
          state.activeStatusFilter = filter;
          // Sync status tab buttons
          document.querySelectorAll('.status-tabs .filter-tab').forEach(tab => {
            if (tab.getAttribute('data-filter') === filter) {
              tab.classList.add('active');
            } else {
              tab.classList.remove('active');
            }
          });
          render();
        }
      });
    });

    // Status Tabs
    document.querySelectorAll('.status-tabs .filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.status-tabs .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeStatusFilter = tab.getAttribute('data-filter') || 'all';
        render();
      });
    });

    // Secondary Priority Filter
    const priFilter = document.getElementById('priorityFilterSelect');
    if (priFilter) {
      priFilter.addEventListener('change', e => {
        state.activePriorityFilter = e.target.value;
        render();
      });
    }

    // Secondary Category Filter
    const catFilter = document.getElementById('categoryFilterSelect');
    if (catFilter) {
      catFilter.addEventListener('change', e => {
        state.activeCategoryFilter = e.target.value;
        render();
      });
    }

    // Search Input & Clear
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
      searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value.trim();
        if (clearSearchBtn) {
          clearSearchBtn.style.display = state.searchQuery ? 'flex' : 'none';
        }
        render();
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        render();
      });
    }

    // Sort By Selector
    const sortSelect = document.getElementById('sortBySelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        render();
      });
    }

    // View Toggle Buttons (Grid vs List)
    const gridBtn = document.getElementById('viewGridBtn');
    const listBtn = document.getElementById('viewListBtn');

    if (gridBtn) gridBtn.addEventListener('click', () => setViewMode('grid'));
    if (listBtn) listBtn.addEventListener('click', () => setViewMode('list'));

    // Clear Completed Button
    const clearDoneBtn = document.getElementById('clearCompletedBtn');
    if (clearDoneBtn) clearDoneBtn.addEventListener('click', clearAllCompleted);

    // Footer Actions (Export, Import, Reset)
    const exportBtn = document.getElementById('btnExportData');
    const importBtn = document.getElementById('btnImportData');
    const importFile = document.getElementById('importFileInput');
    const resetBtn = document.getElementById('btnResetDemo');

    if (exportBtn) exportBtn.addEventListener('click', exportDataJSON);
    if (importBtn && importFile) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importDataJSON);
    if (resetBtn) resetBtn.addEventListener('click', resetDemoData);
  }

  // ----------------------------------------------------
  // Utility Helper
  // ----------------------------------------------------
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Boot Application
  init();
});

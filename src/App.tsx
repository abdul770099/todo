import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  ClipboardList,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditTaskModal } from './components/EditTaskModal';
import { Sidebar } from './components/Sidebar';
import { SignInView } from './components/SignInView';
import { StatsGrid } from './components/StatsGrid';
import { TaskForm } from './components/TaskForm';
import { TaskItem } from './components/TaskItem';
import { useAuth } from './context/AuthContext';
import {
  Priority,
  SidebarView,
  Task,
  TaskFormValues,
  TaskSortOption,
  TaskStatusFilter,
} from './types/task';
import {
  clearCompletedTasksApi,
  createTaskApi,
  deleteTaskApi,
  fetchTasksApi,
  updateTaskApi,
} from './utils/api';
import {
  applyAndSaveTheme,
  loadThemeFromStorage,
  ThemeMode,
} from './utils/storage';
import { isDueSoonOrOverdue, sortTasks } from './utils/taskHelpers';

const VIEW_HEADINGS: Record<SidebarView, string> = {
  [SidebarView.ALL]: 'All Tasks',
  [SidebarView.PENDING]: 'Pending Tasks',
  [SidebarView.COMPLETED]: 'Completed Tasks',
  [SidebarView.HIGH_PRIORITY]: 'High Priority Tasks',
  [SidebarView.DUE_SOON]: 'Due Today & Overdue',
};

export default function App() {
  const {
    user,
    authError,
    submitting,
    login,
    register,
    signOutUser,
    clearAuthError,
    getIdToken,
  } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemeFromStorage());

  const [sidebarView, setSidebarView] = useState<SidebarView>(SidebarView.ALL);
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>(TaskStatusFilter.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortOption>(TaskSortOption.PRIORITY_DESC);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const createTitleInputRef = useRef<HTMLInputElement | null>(null);
  const createSectionRef = useRef<HTMLElement | null>(null);

  // Apply and persist theme whenever theme changes
  useEffect(() => {
    applyAndSaveTheme(theme);
  }, [theme]);

  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    setApiError(null);
    try {
      const token = getIdToken();
      const loaded = await fetchTasksApi(token);
      setTasks(loaded);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load your tasks.';
      setApiError(message);
    } finally {
      setTasksLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectSidebarView = (view: SidebarView) => {
    setSidebarView(view);
    if (view === SidebarView.ALL) {
      setStatusFilter(TaskStatusFilter.ALL);
    } else if (view === SidebarView.PENDING) {
      setStatusFilter(TaskStatusFilter.PENDING);
    } else if (view === SidebarView.COMPLETED) {
      setStatusFilter(TaskStatusFilter.COMPLETED);
    } else {
      setStatusFilter(TaskStatusFilter.ALL);
    }
  };

  const handleSelectStatusFilter = (filter: TaskStatusFilter) => {
    setStatusFilter(filter);
    if (
      sidebarView === SidebarView.ALL ||
      sidebarView === SidebarView.PENDING ||
      sidebarView === SidebarView.COMPLETED
    ) {
      if (filter === TaskStatusFilter.ALL) setSidebarView(SidebarView.ALL);
      if (filter === TaskStatusFilter.PENDING) setSidebarView(SidebarView.PENDING);
      if (filter === TaskStatusFilter.COMPLETED) setSidebarView(SidebarView.COMPLETED);
    }
  };

  // CRUD: Create
  const handleCreateTask = async (values: TaskFormValues) => {
    setApiError(null);
    try {
      const token = getIdToken();
      const created = await createTaskApi(token, values);
      setTasks((prev) => [created, ...prev]);

      if (
        statusFilter === TaskStatusFilter.COMPLETED ||
        sidebarView === SidebarView.COMPLETED
      ) {
        setStatusFilter(TaskStatusFilter.ALL);
        setSidebarView(SidebarView.ALL);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save task.';
      setApiError(message);
    }
  };

  // CRUD: Update (Edit fields)
  const handleUpdateTask = async (taskId: string, values: TaskFormValues) => {
    setApiError(null);
    try {
      const token = getIdToken();
      const updated = await updateTaskApi(token, taskId, values);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
      setEditingTask(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update task.';
      setApiError(message);
    }
  };

  // CRUD: Update (Toggle completion status)
  const handleToggleComplete = async (taskId: string) => {
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) return;

    const nextCompleted = !existing.completed;
    setApiError(null);
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: nextCompleted } : task
      )
    );

    try {
      const token = getIdToken();
      const updated = await updateTaskApi(token, taskId, {
        completed: nextCompleted,
      });
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    } catch (error) {
      // Revert optimistic update on failure
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: existing.completed } : task
        )
      );
      const message =
        error instanceof Error ? error.message : 'Unable to update task status.';
      setApiError(message);
    }
  };

  // CRUD: Delete (Confirmed)
  const handleConfirmDelete = async (taskId: string) => {
    setApiError(null);
    try {
      const token = getIdToken();
      await deleteTaskApi(token, taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      setDeletingTask(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete task.';
      setApiError(message);
    }
  };

  const handleClearCompleted = async () => {
    setApiError(null);
    try {
      const token = getIdToken();
      const deletedIds = await clearCompletedTasksApi(token);
      const deletedSet = new Set(deletedIds);
      setTasks((prev) => prev.filter((task) => !deletedSet.has(task.id)));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to clear completed tasks.';
      setApiError(message);
    }
  };

  const handleFocusCreateForm = () => {
    createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      createTitleInputRef.current?.focus();
    }, 120);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter(TaskStatusFilter.ALL);
    setSidebarView(SidebarView.ALL);
  };

  // Compute dashboard & sidebar counts
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter((t) => t.priority === Priority.HIGH).length;
    const highPriorityPending = tasks.filter(
      (t) => t.priority === Priority.HIGH && !t.completed
    ).length;
    const dueSoon = tasks.filter(isDueSoonOrOverdue).length;

    return {
      total,
      completed,
      pending,
      highPriority,
      highPriorityPending,
      dueSoon,
    };
  }, [tasks]);

  // Apply sidebar view, status filter, search query, and sorting
  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (sidebarView === SidebarView.HIGH_PRIORITY && task.priority !== Priority.HIGH) {
        return false;
      }
      if (sidebarView === SidebarView.DUE_SOON && !isDueSoonOrOverdue(task)) {
        return false;
      }

      if (statusFilter === TaskStatusFilter.PENDING && task.completed) {
        return false;
      }
      if (statusFilter === TaskStatusFilter.COMPLETED && !task.completed) {
        return false;
      }

      if (query) {
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });

    return sortTasks(filtered, sortBy);
  }, [tasks, sidebarView, statusFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== TaskStatusFilter.ALL ||
    sidebarView !== SidebarView.ALL;

  // Unauthenticated gate
  if (!user) {
    return (
      <SignInView
        onLogin={login}
        onRegister={register}
        error={authError}
        submitting={submitting}
        onClearError={clearAuthError}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={sidebarView}
        onSelectView={handleSelectSidebarView}
        counts={{
          all: stats.total,
          pending: stats.pending,
          completed: stats.completed,
          highPriority: stats.highPriority,
          dueSoon: stats.dueSoon,
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onClearCompleted={handleClearCompleted}
        username={user.username}
        onSignOut={signOutUser}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
                  Workspace
                </span>
                <span aria-hidden="true" className="hidden text-slate-300 sm:inline dark:text-slate-700">
                  /
                </span>
                <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100">
                  {VIEW_HEADINGS[sidebarView]}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={handleFocusCreateForm}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Localized Error Banner */}
          {apiError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{apiError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadTasks()}
                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  aria-label="Dismiss error"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-950"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* 4-Column Dashboard KPI Strip */}
          <StatsGrid
            total={stats.total}
            completed={stats.completed}
            pending={stats.pending}
            highPriority={stats.highPriority}
            highPriorityPending={stats.highPriorityPending}
          />

          {/* Create Form + Task List Split */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_1fr]">
            {/* Create Task Panel */}
            <section
              ref={createSectionRef}
              aria-labelledby="create-task-heading"
              className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 border-b border-slate-200 pb-3.5 dark:border-slate-800">
                <h2
                  id="create-task-heading"
                  className="text-base font-semibold text-slate-900 dark:text-slate-100"
                >
                  Create New Task
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Tasks are saved to your account automatically.
                </p>
              </div>

              <TaskForm
                mode="create"
                onSubmit={handleCreateTask}
                titleInputRef={createTitleInputRef}
              />
            </section>

            {/* Task List & Controls */}
            <section aria-label="Task list" className="space-y-4">
              {/* Search, Filter & Sort Toolbar */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks by title or description..."
                      aria-label="Search tasks"
                      className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-950"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Sort Selector */}
                  <div className="relative shrink-0">
                    <ArrowUpDown
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                      aria-hidden="true"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as TaskSortOption)}
                      aria-label="Sort tasks"
                      className="min-h-[40px] w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-sm font-medium text-slate-700 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 md:w-56 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-indigo-400"
                    >
                      <option value={TaskSortOption.PRIORITY_DESC}>Priority: High to Low</option>
                      <option value={TaskSortOption.PRIORITY_ASC}>Priority: Low to High</option>
                      <option value={TaskSortOption.DUE_DATE_ASC}>Due Date: Earliest</option>
                      <option value={TaskSortOption.DUE_DATE_DESC}>Due Date: Latest</option>
                      <option value={TaskSortOption.CREATED_DESC}>Newest Added</option>
                    </select>
                  </div>
                </div>

                {/* Status Filter Segmented Controls + Result Count */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800/80">
                  <div
                    role="group"
                    aria-label="Filter tasks by status"
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
                  >
                    {[
                      { value: TaskStatusFilter.ALL, label: 'All' },
                      { value: TaskStatusFilter.PENDING, label: 'Pending' },
                      { value: TaskStatusFilter.COMPLETED, label: 'Completed' },
                    ].map((tab) => {
                      const active = statusFilter === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => handleSelectStatusFilter(tab.value)}
                          aria-pressed={active}
                          className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    Showing {visibleTasks.length} of {tasks.length}{' '}
                    {tasks.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>

              {/* Tasks Loading Skeleton, Empty States, or Task List */}
              {tasksLoading ? (
                <div className="space-y-3" aria-label="Loading tasks">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3.5 w-4/5 rounded bg-slate-100 dark:bg-slate-800/70" />
                          <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <ClipboardList className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                    No tasks yet
                  </h3>
                  <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Your workspace is empty. Add your first task with a priority and due date to start tracking progress.
                  </p>
                  <button
                    type="button"
                    onClick={handleFocusCreateForm}
                    className="mt-5 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Create First Task</span>
                  </button>
                </div>
              ) : visibleTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    No matching tasks found
                  </h3>
                  <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Try adjusting your search term or switching filters to view other tasks.
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-4 inline-flex min-h-[40px] items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {visibleTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={setEditingTask}
                        onRequestDelete={setDeletingTask}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        task={deletingTask}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

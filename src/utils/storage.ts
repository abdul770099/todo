import { Priority, Task } from '../types/task';

const TASKS_STORAGE_KEY = 'taskledger_tasks_v1';
const THEME_STORAGE_KEY = 'taskledger_theme_v1';

export type ThemeMode = 'light' | 'dark';

/**
 * Generates an ISO date string (YYYY-MM-DD) offset by the specified number of days from today.
 */
function offsetDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Default starter tasks used only when localStorage has never been initialized.
 */
function createInitialTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'task-seed-1',
      title: 'Finalize Q4 product roadmap presentation',
      description:
        'Consolidate engineering milestones, design deliverables, and launch timeline slides before the leadership review.',
      priority: Priority.HIGH,
      dueDate: offsetDate(0),
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-seed-2',
      title: 'Audit accessibility contrast across dashboard views',
      description:
        'Verify WCAG AA contrast ratios in both light and dark modes and confirm keyboard focus rings on interactive controls.',
      priority: Priority.MEDIUM,
      dueDate: offsetDate(2),
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-seed-3',
      title: 'Review monthly cloud infrastructure invoices',
      description:
        'Compare compute utilization against budget forecast and archive the approved PDF summary.',
      priority: Priority.LOW,
      dueDate: offsetDate(5),
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-seed-4',
      title: 'Prepare customer onboarding checklist update',
      description:
        'Update step-by-step workspace setup documentation with screenshots and account security recommendations.',
      priority: Priority.HIGH,
      dueDate: offsetDate(1),
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Loads persisted tasks from localStorage. Initializes starter tasks on first run only.
 */
export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw === null) {
      const seeded = createInitialTasks();
      saveTasksToStorage(seeded);
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidTaskRecord);
  } catch {
    return [];
  }
}

/**
 * Saves the full task array to localStorage immediately.
 */
export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota or private-mode exceptions gracefully
  }
}

function isValidTaskRecord(item: unknown): item is Task {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.description === 'string' &&
    (record.priority === Priority.HIGH ||
      record.priority === Priority.MEDIUM ||
      record.priority === Priority.LOW) &&
    typeof record.dueDate === 'string' &&
    typeof record.completed === 'boolean'
  );
}

/**
 * Reads initial theme mode from document class or localStorage.
 */
export function loadThemeFromStorage(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
  } catch {
    // Fallback to light
  }
  return 'light';
}

/**
 * Persists theme preference and toggles the `.dark` class on <html>.
 */
export function applyAndSaveTheme(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

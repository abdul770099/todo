import { Priority, Task, TaskFormErrors, TaskFormValues, TaskSortOption } from '../types/task';

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.HIGH]: 3,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 1,
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.HIGH]: 'High Priority',
  [Priority.MEDIUM]: 'Medium Priority',
  [Priority.LOW]: 'Low Priority',
};

/**
 * Returns today's date as YYYY-MM-DD in local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD date string into a readable label (e.g., "Nov 24, 2026").
 */
export function formatDueDate(dateStr: string): string {
  if (!dateStr) return 'No due date';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Determines whether a task's due date is overdue, due today, or upcoming.
 */
export function getDueDateState(dateStr: string, completed: boolean): 'overdue' | 'today' | 'upcoming' {
  if (completed || !dateStr) return 'upcoming';
  const today = getTodayDateString();
  if (dateStr < today) return 'overdue';
  if (dateStr === today) return 'today';
  return 'upcoming';
}

/**
 * Checks if a task is due today or overdue (and still pending).
 */
export function isDueSoonOrOverdue(task: Task): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate <= getTodayDateString();
}

/**
 * Validates task form inputs and returns field-level error messages.
 */
export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const trimmedTitle = values.title.trim();
  const trimmedDescription = values.description.trim();

  if (!trimmedTitle) {
    errors.title = 'Task title is required.';
  } else if (trimmedTitle.length < 2) {
    errors.title = 'Task title must be at least 2 characters.';
  } else if (trimmedTitle.length > 120) {
    errors.title = 'Task title cannot exceed 120 characters.';
  }

  if (trimmedDescription.length > 500) {
    errors.description = 'Description cannot exceed 500 characters.';
  }

  if (!values.dueDate) {
    errors.dueDate = 'Please choose a due date.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    errors.dueDate = 'Please enter a valid date.';
  }

  return errors;
}

/**
 * Sorts tasks cleanly without mutating the source array.
 */
export function sortTasks(tasks: Task[], sortBy: TaskSortOption): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    switch (sortBy) {
      case TaskSortOption.PRIORITY_DESC: {
        const diff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (diff !== 0) return diff;
        return a.dueDate.localeCompare(b.dueDate);
      }
      case TaskSortOption.PRIORITY_ASC: {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (diff !== 0) return diff;
        return a.dueDate.localeCompare(b.dueDate);
      }
      case TaskSortOption.DUE_DATE_ASC: {
        const diff = a.dueDate.localeCompare(b.dueDate);
        if (diff !== 0) return diff;
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      }
      case TaskSortOption.DUE_DATE_DESC: {
        const diff = b.dueDate.localeCompare(a.dueDate);
        if (diff !== 0) return diff;
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      }
      case TaskSortOption.CREATED_DESC:
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
  return copy;
}

/**
 * Creates a unique task ID using crypto.randomUUID when available, with a safe fallback.
 */
export function generateTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

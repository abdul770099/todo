export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum TaskStatusFilter {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum TaskSortOption {
  PRIORITY_DESC = 'priority-desc',
  PRIORITY_ASC = 'priority-asc',
  DUE_DATE_ASC = 'due-date-asc',
  DUE_DATE_DESC = 'due-date-desc',
  CREATED_DESC = 'created-desc',
}

export enum SidebarView {
  ALL = 'all',
  PENDING = 'pending',
  COMPLETED = 'completed',
  HIGH_PRIORITY = 'high-priority',
  DUE_SOON = 'due-soon',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
}

export interface TaskFormErrors {
  title?: string;
  description?: string;
  dueDate?: string;
}

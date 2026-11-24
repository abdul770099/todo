import { Task, TaskFormValues } from '../types/task';

export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function apiRequest<T>(
  url: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof data.error === 'string' ? data.error : 'Request failed. Please try again.';
    throw new Error(message);
  }

  return data as T;
}

export async function loginApi(
  username: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function registerApi(
  username: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', null, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchTasksApi(token: string): Promise<Task[]> {
  const data = await apiRequest<{ tasks: Task[] }>('/api/tasks', token, {
    method: 'GET',
  });
  return data.tasks;
}

export async function createTaskApi(
  token: string,
  values: TaskFormValues
): Promise<Task> {
  const data = await apiRequest<{ task: Task }>('/api/tasks', token, {
    method: 'POST',
    body: JSON.stringify(values),
  });
  return data.task;
}

export async function updateTaskApi(
  token: string,
  taskId: string,
  patch: Partial<TaskFormValues & { completed: boolean }>
): Promise<Task> {
  const data = await apiRequest<{ task: Task }>(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }
  );
  return data.task;
}

export async function deleteTaskApi(token: string, taskId: string): Promise<string> {
  const data = await apiRequest<{ deletedId: string }>(
    `/api/tasks/${encodeURIComponent(taskId)}`,
    token,
    {
      method: 'DELETE',
    }
  );
  return data.deletedId;
}

export async function clearCompletedTasksApi(token: string): Promise<string[]> {
  const data = await apiRequest<{ deletedIds: string[] }>(
    '/api/tasks/completed',
    token,
    {
      method: 'DELETE',
    }
  );
  return data.deletedIds;
}

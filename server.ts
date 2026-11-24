import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  clearCompletedTasksForUser,
  createTaskForUser,
  deleteTaskForUser,
  getTasksForUser,
  updateTaskForUser,
} from './src/db/tasks.ts';
import { createUser, findUserByUsername } from './src/db/users.ts';
import { createSessionToken, hashPassword, verifyPassword } from './src/lib/auth.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';

const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const USERNAME_REGEX = /^[a-z0-9._-]{3,32}$/;

function normalizeUsername(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function serializeTask(row: {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.dueDate,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Register a new username + password account
  app.post('/api/auth/register', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const username = normalizeUsername(body.username);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error:
          'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.',
      });
    }
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        error: 'Password must be between 6 and 128 characters.',
      });
    }

    try {
      const existing = await findUserByUsername(username);
      if (existing) {
        return res.status(409).json({
          error: 'That username is already taken. Please choose another or sign in.',
        });
      }

      const passwordHash = await hashPassword(password);
      const created = await createUser(username, passwordHash);
      const token = createSessionToken(created.id, created.username);

      return res.status(201).json({
        token,
        user: {
          id: created.id,
          username: created.username,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to create account.';
      return res.status(500).json({ error: message });
    }
  });

  // Sign in with existing username + password
  app.post('/api/auth/login', async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const username = normalizeUsername(body.username);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required.',
      });
    }

    try {
      const account = await findUserByUsername(username);
      if (!account) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const valid = await verifyPassword(password, account.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const token = createSessionToken(account.id, account.username);

      return res.json({
        token,
        user: {
          id: account.id,
          username: account.username,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in.';
      return res.status(500).json({ error: message });
    }
  });

  // Verify current session
  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.account });
  });

  // Read all tasks for authenticated user
  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const accountId = req.account!.id;
      const rows = await getTasksForUser(accountId);
      res.json({ tasks: rows.map(serializeTask) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks.';
      res.status(500).json({ error: message });
    }
  });

  // Create a new task
  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const priority = typeof body.priority === 'string' ? body.priority : '';
    const dueDate = typeof body.dueDate === 'string' ? body.dueDate.trim() : '';

    if (!title || title.length < 2 || title.length > 120) {
      return res.status(400).json({ error: 'Task title must be between 2 and 120 characters.' });
    }
    if (description.length > 500) {
      return res.status(400).json({ error: 'Description cannot exceed 500 characters.' });
    }
    if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Priority must be high, medium, or low.' });
    }
    if (!DATE_REGEX.test(dueDate)) {
      return res.status(400).json({ error: 'Due date must be in YYYY-MM-DD format.' });
    }

    try {
      const accountId = req.account!.id;
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const created = await createTaskForUser(accountId, {
        id,
        title,
        description,
        priority,
        dueDate,
      });

      res.status(201).json({ task: serializeTask(created) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task.';
      res.status(500).json({ error: message });
    }
  });

  // Clear all completed tasks for authenticated user (registered before :id route)
  app.delete('/api/tasks/completed', requireAuth, async (req: AuthRequest, res) => {
    try {
      const accountId = req.account!.id;
      const deletedIds = await clearCompletedTasksForUser(accountId);
      res.json({ deletedIds });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to clear completed tasks.';
      res.status(500).json({ error: message });
    }
  });

  // Update a task (fields or completion status)
  app.patch('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    const taskId = String(req.params.id ?? '').trim();
    if (!taskId) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    const body = req.body as Record<string, unknown>;
    const patch: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      completed?: boolean;
    } = {};

    if (body.title !== undefined) {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title || title.length < 2 || title.length > 120) {
        return res.status(400).json({ error: 'Task title must be between 2 and 120 characters.' });
      }
      patch.title = title;
    }

    if (body.description !== undefined) {
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      if (description.length > 500) {
        return res.status(400).json({ error: 'Description cannot exceed 500 characters.' });
      }
      patch.description = description;
    }

    if (body.priority !== undefined) {
      if (typeof body.priority !== 'string' || !VALID_PRIORITIES.has(body.priority)) {
        return res.status(400).json({ error: 'Priority must be high, medium, or low.' });
      }
      patch.priority = body.priority;
    }

    if (body.dueDate !== undefined) {
      const dueDate = typeof body.dueDate === 'string' ? body.dueDate.trim() : '';
      if (!DATE_REGEX.test(dueDate)) {
        return res.status(400).json({ error: 'Due date must be in YYYY-MM-DD format.' });
      }
      patch.dueDate = dueDate;
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') {
        return res.status(400).json({ error: 'Completed flag must be a boolean.' });
      }
      patch.completed = body.completed;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    try {
      const accountId = req.account!.id;
      const updated = await updateTaskForUser(accountId, taskId, patch);
      if (!updated) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      res.json({ task: serializeTask(updated) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task.';
      res.status(500).json({ error: message });
    }
  });

  // Delete a single task
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    const taskId = String(req.params.id ?? '').trim();
    if (!taskId) {
      return res.status(400).json({ error: 'Invalid task ID.' });
    }

    try {
      const accountId = req.account!.id;
      const deleted = await deleteTaskForUser(accountId, taskId);
      if (!deleted) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      res.json({ deletedId: deleted.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task.';
      res.status(500).json({ error: message });
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

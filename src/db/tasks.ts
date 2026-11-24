import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { todoTasks } from './schema.ts';

export interface CreateTaskInput {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  completed?: boolean;
}

export async function getTasksForUser(accountId: number) {
  try {
    return await db
      .select()
      .from(todoTasks)
      .where(eq(todoTasks.accountId, accountId))
      .orderBy(desc(todoTasks.createdAt));
  } catch (error) {
    console.error('Database query failed in getTasksForUser:', error);
    throw new Error('Unable to load tasks. Please try again.', { cause: error });
  }
}

export async function createTaskForUser(accountId: number, input: CreateTaskInput) {
  try {
    const now = new Date();
    const [created] = await db
      .insert(todoTasks)
      .values({
        id: input.id,
        accountId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        completed: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Database insert failed in createTaskForUser:', error);
    throw new Error('Unable to create task. Please try again.', { cause: error });
  }
}

export async function updateTaskForUser(
  accountId: number,
  taskId: string,
  input: UpdateTaskInput
) {
  try {
    const updates: {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      completed?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
    if (input.completed !== undefined) updates.completed = input.completed;

    const [updated] = await db
      .update(todoTasks)
      .set(updates)
      .where(and(eq(todoTasks.id, taskId), eq(todoTasks.accountId, accountId)))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Database update failed in updateTaskForUser:', error);
    throw new Error('Unable to update task. Please try again.', { cause: error });
  }
}

export async function deleteTaskForUser(accountId: number, taskId: string) {
  try {
    const [deleted] = await db
      .delete(todoTasks)
      .where(and(eq(todoTasks.id, taskId), eq(todoTasks.accountId, accountId)))
      .returning();

    return deleted ?? null;
  } catch (error) {
    console.error('Database delete failed in deleteTaskForUser:', error);
    throw new Error('Unable to delete task. Please try again.', { cause: error });
  }
}

export async function clearCompletedTasksForUser(accountId: number) {
  try {
    const deleted = await db
      .delete(todoTasks)
      .where(and(eq(todoTasks.accountId, accountId), eq(todoTasks.completed, true)))
      .returning({ id: todoTasks.id });

    return deleted.map((row) => row.id);
  } catch (error) {
    console.error('Database delete failed in clearCompletedTasksForUser:', error);
    throw new Error('Unable to clear completed tasks. Please try again.', { cause: error });
  }
}

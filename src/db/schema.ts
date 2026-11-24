import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priority: text('priority').notNull().default('medium'),
  dueDate: text('due_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const todoTasks = pgTable('todo_tasks', {
  id: text('id').primaryKey(),
  accountId: integer('account_id')
    .references(() => accounts.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  priority: text('priority').notNull().default('medium'),
  dueDate: text('due_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountsRelations = relations(accounts, ({ many }) => ({
  tasks: many(todoTasks),
}));

export const todoTasksRelations = relations(todoTasks, ({ one }) => ({
  owner: one(accounts, {
    fields: [todoTasks.accountId],
    references: [accounts.id],
  }),
}));

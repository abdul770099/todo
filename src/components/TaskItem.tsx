import { Calendar, Check, Flag, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Priority, Task } from '../types/task';
import { formatDueDate, getDueDateState, PRIORITY_LABEL } from '../utils/taskHelpers';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

const PRIORITY_TEXT_CLASS: Record<Priority, string> = {
  [Priority.HIGH]: 'text-red-600 dark:text-red-400',
  [Priority.MEDIUM]: 'text-amber-700 dark:text-amber-400',
  [Priority.LOW]: 'text-slate-500 dark:text-slate-400',
};

export function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onRequestDelete,
}: TaskItemProps) {
  const dueDateState = getDueDateState(task.dueDate, task.completed);

  const dueDateLabelClass =
    dueDateState === 'overdue'
      ? 'text-red-600 font-medium dark:text-red-400'
      : dueDateState === 'today'
      ? 'text-amber-700 font-medium dark:text-amber-400'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border bg-white p-4 transition-colors duration-150 sm:p-5 dark:bg-slate-900 ${
        task.completed
          ? 'border-slate-200/80 bg-slate-50/60 dark:border-slate-800/80 dark:bg-slate-900/60'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {/* 40px Accessible Checkbox Toggle */}
          <button
            type="button"
            onClick={() => onToggleComplete(task.id)}
            aria-label={
              task.completed
                ? `Mark "${task.title}" as pending`
                : `Mark "${task.title}" as completed`
            }
            aria-pressed={task.completed}
            className="flex h-10 w-10 shrink-0 -ml-2 -mt-1.5 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-150 ${
                task.completed
                  ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                  : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950'
              }`}
            >
              {task.completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />}
            </span>
          </button>

          {/* Task Body */}
          <div className="min-w-0 flex-1">
            <h3
              className={`text-base font-semibold leading-snug break-words ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`mt-1.5 text-sm leading-relaxed break-words ${
                  task.completed
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Clean Unboxed Metadata Row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 font-medium ${PRIORITY_TEXT_CLASS[task.priority]}`}
              >
                <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{PRIORITY_LABEL[task.priority]}</span>
              </span>

              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>

              <span className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${dueDateLabelClass}`}>
                <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {formatDueDate(task.dueDate)}
                  {dueDateState === 'overdue' && ' (Overdue)'}
                  {dueDateState === 'today' && ' (Due Today)'}
                </span>
              </span>

              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>

              <span
                className={`font-medium ${
                  task.completed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {task.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Row Actions */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:pt-0">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onRequestDelete(task)}
            aria-label={`Delete "${task.title}"`}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

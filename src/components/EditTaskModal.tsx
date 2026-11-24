import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { Task, TaskFormValues } from '../types/task';
import { TaskForm } from './TaskForm';

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (taskId: string, values: TaskFormValues) => void;
}

export function EditTaskModal({ task, onClose, onSave }: EditTaskModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-heading"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <h2
            id="edit-modal-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit dialog"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <TaskForm
          mode="edit"
          initialValues={{
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
          }}
          onCancel={onClose}
          onSubmit={(values) => onSave(task.id, values)}
        />
      </motion.div>
    </div>
  );
}

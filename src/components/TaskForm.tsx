import { FormEvent, RefObject, useEffect, useState } from 'react';
import { AlertCircle, Calendar, Plus, Save } from 'lucide-react';
import { Priority, TaskFormErrors, TaskFormValues } from '../types/task';
import { getTodayDateString, validateTaskForm } from '../utils/taskHelpers';

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialValues?: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
  onCancel?: () => void;
  titleInputRef?: RefObject<HTMLInputElement | null>;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; activeClass: string }[] = [
  {
    value: Priority.HIGH,
    label: 'High',
    activeClass:
      'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
  },
  {
    value: Priority.MEDIUM,
    label: 'Medium',
    activeClass:
      'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  {
    value: Priority.LOW,
    label: 'Low',
    activeClass:
      'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
  },
];

export function TaskForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  titleInputRef,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? Priority.MEDIUM);
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? getTodayDateString());
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // Sync form state when editing a different task
  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setTitle(initialValues.title);
      setDescription(initialValues.description);
      setPriority(initialValues.priority);
      setDueDate(initialValues.dueDate);
      setErrors({});
      setSubmittedOnce(false);
    }
  }, [mode, initialValues]);

  const currentValues = (
    overrides?: Partial<TaskFormValues>
  ): TaskFormValues => ({
    title,
    description,
    priority,
    dueDate,
    ...overrides,
  });

  const handleFieldValidation = (nextValues: TaskFormValues) => {
    if (submittedOnce) {
      setErrors(validateTaskForm(nextValues));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedOnce(true);

    const payload: TaskFormValues = {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
    };

    const validationErrors = validateTaskForm(payload);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSubmit(payload);

    if (mode === 'create') {
      setTitle('');
      setDescription('');
      setPriority(Priority.MEDIUM);
      setDueDate(getTodayDateString());
      setErrors({});
      setSubmittedOnce(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    setDueDate(getTodayDateString());
    setErrors({});
    setSubmittedOnce(false);
  };

  const titleId = mode === 'create' ? 'create-task-title' : 'edit-task-title';
  const descId = mode === 'create' ? 'create-task-desc' : 'edit-task-desc';
  const dateId = mode === 'create' ? 'create-task-date' : 'edit-task-date';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Task Title */}
      <div>
        <label
          htmlFor={titleId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Task Title <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          ref={titleInputRef}
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            handleFieldValidation(currentValues({ title: val }));
          }}
          placeholder="e.g., Prepare sprint review notes"
          maxLength={125}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${titleId}-error` : undefined}
          className={`min-h-[42px] w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            errors.title
              ? 'border-red-500 focus:ring-red-500/30 dark:border-red-500'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/25 dark:border-slate-700 dark:focus:border-indigo-400'
          }`}
        />
        {errors.title && (
          <p
            id={`${titleId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.title}</span>
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor={descId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Description
          </label>
          <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
            {description.trim().length}/500
          </span>
        </div>
        <textarea
          id={descId}
          rows={3}
          value={description}
          onChange={(e) => {
            const val = e.target.value;
            setDescription(val);
            handleFieldValidation(currentValues({ description: val }));
          }}
          placeholder="Add context, acceptance criteria, or subtasks..."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? `${descId}-error` : undefined}
          className={`w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            errors.description
              ? 'border-red-500 focus:ring-red-500/30 dark:border-red-500'
              : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/25 dark:border-slate-700 dark:focus:border-indigo-400'
          }`}
        />
        {errors.description && (
          <p
            id={`${descId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.description}</span>
          </p>
        )}
      </div>

      {/* Priority Selector */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Priority
        </span>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Task priority">
          {PRIORITY_OPTIONS.map((opt) => {
            const isSelected = priority === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                aria-pressed={isSelected}
                className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
                  isSelected
                    ? opt.activeClass
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label
          htmlFor={dateId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Due Date <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            id={dateId}
            type="date"
            value={dueDate}
            onChange={(e) => {
              const val = e.target.value;
              setDueDate(val);
              handleFieldValidation(currentValues({ dueDate: val }));
            }}
            aria-invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? `${dateId}-error` : undefined}
            className={`min-h-[42px] w-full rounded-lg border bg-white pl-10 pr-3.5 py-2 font-mono text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
              errors.dueDate
                ? 'border-red-500 focus:ring-red-500/30 dark:border-red-500'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/25 dark:border-slate-700 dark:focus:border-indigo-400'
            }`}
          />
        </div>
        {errors.dueDate && (
          <p
            id={`${dateId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.dueDate}</span>
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        {mode === 'create' && (title || description) && (
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[42px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Reset
          </button>
        )}

        {mode === 'edit' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-900 ${
            mode === 'create' ? 'w-full' : ''
          }`}
        >
          {mode === 'create' ? (
            <>
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Add Task</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

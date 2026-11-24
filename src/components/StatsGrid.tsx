interface StatsGridProps {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  highPriorityPending: number;
}

export function StatsGrid({
  total,
  completed,
  pending,
  highPriority,
  highPriorityPending,
}: StatsGridProps) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      label: 'Total Tasks',
      value: total,
      detail: total === 0 ? 'No tasks logged' : `${total} ${total === 1 ? 'task' : 'tasks'} in workspace`,
      valueClass: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Completed Tasks',
      value: completed,
      detail: `${completionRate}% completion rate`,
      valueClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending Tasks',
      value: pending,
      detail: pending === 0 ? 'All caught up' : `${pending} remaining`,
      valueClass: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'High Priority Tasks',
      value: highPriority,
      detail:
        highPriority === 0
          ? 'No urgent tasks'
          : `${highPriorityPending} pending action`,
      valueClass: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <section aria-label="Dashboard statistics" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {card.label}
          </p>
          <p
            className={`mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums ${card.valueClass}`}
          >
            {card.value}
          </p>
          <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {card.detail}
          </p>
        </div>
      ))}
    </section>
  );
}

import {
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Clock,
  Flame,
  ListTodo,
  LogOut,
  Moon,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { SidebarView } from '../types/task';
import { ThemeMode } from '../utils/storage';

interface SidebarProps {
  activeView: SidebarView;
  onSelectView: (view: SidebarView) => void;
  counts: {
    all: number;
    pending: number;
    completed: number;
    highPriority: number;
    dueSoon: number;
  };
  theme: ThemeMode;
  onToggleTheme: () => void;
  onClearCompleted: () => void;
  username?: string | null;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onSelectView,
  counts,
  theme,
  onToggleTheme,
  onClearCompleted,
  username,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: SidebarView.ALL,
      label: 'All Tasks',
      count: counts.all,
      icon: ListTodo,
    },
    {
      id: SidebarView.PENDING,
      label: 'Pending',
      count: counts.pending,
      icon: Clock,
    },
    {
      id: SidebarView.COMPLETED,
      label: 'Completed',
      count: counts.completed,
      icon: CheckCircle2,
    },
    {
      id: SidebarView.HIGH_PRIORITY,
      label: 'High Priority',
      count: counts.highPriority,
      icon: Flame,
    },
    {
      id: SidebarView.DUE_SOON,
      label: 'Due Today & Overdue',
      count: counts.dueSoon,
      icon: CalendarClock,
    },
  ];

  const handleSelect = (view: SidebarView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-5 dark:bg-slate-900">
      <div>
        {/* Brand Wordmark */}
        <div className="mb-7 flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-slate-100">
              TaskLedger
            </span>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Views */}
        <nav aria-label="Task views" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span
                  className={`font-mono text-xs tabular-nums shrink-0 ${
                    isActive
                      ? 'font-semibold text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-500 dark:text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Utilities */}
      <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        {counts.completed > 0 && (
          <button
            type="button"
            onClick={onClearCompleted}
            className="flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 whitespace-nowrap dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Clear Completed ({counts.completed})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          className="flex min-h-[40px] w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-400">
            {username ? `@${username}` : 'Signed in'}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 lg:block dark:border-slate-800">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile / Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-slate-200 shadow-xl dark:border-slate-800">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

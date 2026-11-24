import { FormEvent, useState } from 'react';
import { AlertCircle, CheckSquare, Eye, EyeOff, Lock, Moon, Sun, User } from 'lucide-react';
import { ThemeMode } from '../utils/storage';

interface SignInViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
  error: string | null;
  submitting: boolean;
  onClearError: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type AuthMode = 'login' | 'register';

export function SignInView({
  onLogin,
  onRegister,
  error,
  submitting,
  onClearError,
  theme,
  onToggleTheme,
}: SignInViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError(null);
    onClearError();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    onClearError();

    const trimmedUser = username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(trimmedUser)) {
      setLocalError(
        'Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens.'
      );
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (mode === 'login') {
      await onLogin(trimmedUser, password);
    } else {
      await onRegister(trimmedUser, password);
    }
  };

  const displayedError = localError || error;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            TaskLedger
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
          )}
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          {/* Segmented Mode Switch */}
          <div
            role="group"
            aria-label="Account mode"
            className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
          >
            <button
              type="button"
              onClick={() => switchMode('login')}
              aria-pressed={mode === 'login'}
              className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              aria-pressed={mode === 'register'}
              className={`min-h-[38px] rounded-md px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance dark:text-slate-100">
            {mode === 'login' ? 'Sign in to TaskLedger' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {mode === 'login'
              ? 'Enter your username and password to access your tasks.'
              : 'Pick a username and password to save your tasks.'}
          </p>

          {displayedError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{displayedError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="auth-username"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="e.g., alex_morgan"
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  placeholder="Minimum 6 characters"
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-10 pr-11 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Registration only) */}
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (localError) setLocalError(null);
                    }}
                    placeholder="Re-enter your password"
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-900"
            >
              {submitting
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
